import { RestClientV5 } from 'bybit-api';
import { EventEmitter } from 'events';

import type {
    IBotConfig,
    IBuyOrdersStepsToGrid,
    OrderId,
    exchanges,
} from '../@types/types';
import { myBot } from '../router/routes';
import { generateBotStrategy } from '../strategy/generateDCA';
import { OrderType, StrategyType, TradeType } from './events';
import { LoggerTracker } from './logEmitter';
import { OrderExecutionTracker } from './ordersEmitter';
import { StateFileManager } from './states/stateManager';

export class TradeTracker extends EventEmitter {
    private coin: string;
    private settings: IBotConfig;
    private currentPrice = 0;
    private prevPrice = 0;
    private strategy: IBuyOrdersStepsToGrid[] = [];
    private step: number;
    private ping: NodeJS.Timeout | undefined;
    private client: RestClientV5 | any;
    private exchange;
    private coinPricesCache: Map<string, number> = new Map<string, number>();
    private coinInfo: any;
    private minQty: any;
    private readonly Order: OrderExecutionTracker;
    private onTakeProfit: boolean;
    private takeProfitOrderID?: OrderId;
    private baseOrderID?: OrderId;
    private onInsurance: boolean;
    private insuranceOrderID?: OrderId;
    private stateManager;
    private state: any;
    private logger: LoggerTracker;

    constructor(
        initialCoin: string,
        initialExchange: exchanges,
        initialSettings: IBotConfig
    ) {
        super();
        this.coin = initialCoin;
        this.settings = initialSettings;
        this.exchange = initialExchange;
        this.step = 0;
        this.onTakeProfit = false;
        this.onInsurance = false;
        this.stateManager = new StateFileManager(this.coin);
        this.logger = new LoggerTracker();
        this.init();
        this.Order = new OrderExecutionTracker(
            this.client,
            this.exchange,
            this.coin
        );

        this.on(TradeType.UPDATE_PRICE, async () => {
            this.logger.cleared(this.coinPricesCache.get(this.coin)!);
            try {
                const baseStep = this.strategy[0];
                const insuranceStep = this.strategy[1];

                //NEXT STEP
                if (
                    insuranceStep &&
                    !this.onInsurance &&
                    +this.coinPricesCache.get(this.coin)! <=
                        insuranceStep.orderPriceToStep
                ) {
                    console.log(2);
                    this.onInsurance = true;
                    this.step = +insuranceStep.step;
                    this.strategy.shift();
                    await this.Order.placeInsuranceOrder(
                        insuranceStep.summarizedOrderSecondaryPairVolume,
                        insuranceStep.orderTargetPrice
                    );
                    await this.setState();
                }

                //TAKE PROFIT
                if (baseStep && this.baseOrderID && !this.onTakeProfit) {
                    console.log(1);
                    this.onTakeProfit = true;
                    await this.Order.placeTakeProfitOrder(
                        baseStep.summarizedOrderSecondaryPairVolume,
                        baseStep.orderTargetPrice
                    );
                    await this.setState();
                }

                //EXIT
                if (
                    baseStep &&
                    +this.coinPricesCache.get(this.coin)! >=
                        baseStep.orderTargetPrice
                ) {
                    this.logger.base('stop trade');
                    await this.stopTrade();
                    await this.setState();
                }
            } catch (error) {}
        });

        this.Order.on(
            OrderType.TP_ORDER_SUCCESSFULLY_PLACED,
            async (orderId) => {
                this.logger.base(`TP_ORDER_SUCCESSFULLY_PLACED - ${orderId}`);
                this.takeProfitOrderID = orderId;
                await this.setState();
            }
        );

        this.Order.on(
            OrderType.TP_ORDER_PLACING_FAILED,
            async (message: string) => {
                this.onTakeProfit = false;
                // this.logger.cleared(message);
                await this.setState();
            }
        );

        this.Order.on(
            OrderType.INSURANCE_ORDER_SUCCESSFULLY_PLACED,
            async (orderId) => {
                this.logger.base(
                    `INSURANCE_ORDER_SUCCESSFULLY_PLACED - ${orderId}`
                );
                this.insuranceOrderID = orderId;
                await this.setState();
            }
        );

        this.Order.on(
            OrderType.INSURANCE_ORDER_PLACING_FAILED,
            async (message: string) => {
                this.onInsurance = false;
                // this.logger.cleared(message);
                await this.setState();
            }
        );

        this.Order.on(
            OrderType.BASE_ORDER_SUCCESSFULLY_PLACED,
            async (orderId) => {
                this.logger.base(`BASE_ORDER_SUCCESSFULLY_PLACED - ${orderId}`);
                this.baseOrderID = orderId;
                await this.setState();
            }
        );

        this.Order.on(OrderType.BASE_ORDER_PLACING_FAILED, async () => {
            this.baseOrderID = undefined;
            await this.setState();
        });
    }

    private async setState() {
        this.state = {
            strategy: this.strategy,
            currentPrice: this.currentPrice,
            currentStep: this.step,
            baseOrderID: this.baseOrderID,
            onTakeProfit: this.onTakeProfit,
            takeProfitOrderID: this.takeProfitOrderID,
            onInsurance: this.onInsurance,
            insuranceOrderID: this.insuranceOrderID,
            // takeProfitOrderID: this.takeProfitOrderID,
            // onInsurance: this.onInsurance,
            // insuranceOrderID: this.insuranceOrderID,
        };
        await this.stateManager.saveState(this.state);
    }

    private async generateStrategy() {
        this.coinInfo = await this.Order.getCoinInfo();
        this.minQty = +this.coinInfo?.lotSizeFilter?.minOrderQty;
        const initialPrice = await this.Order.getCoinPrice(this.coin);
        const strategy = generateBotStrategy(
            this.coin,
            this.settings,
            initialPrice,
            this.minQty
        );

        if (!strategy) {
            this.strategy = [];
        } else {
            this.strategy = strategy;
            await this.stateManager.saveState(this.state);
        }

        this.emit(StrategyType.GENERATE_STRATEGY, this.strategy);
    }

    private async startPongPrice() {
        this.logger.base('');
        this.ping = setInterval(async () => {
            const newPrice = await this.Order.getCoinPrice(this.coin);
            if (newPrice !== this.currentPrice) {
                this.currentPrice = newPrice;
                this.coinPricesCache.set(this.coin, newPrice);

                this.emit(TradeType.UPDATE_PRICE);
            }
        }, 400);
    }

    async startTrade() {
        await this.generateStrategy();
        this.logger.base(this.coin);
        this.logger.inTable(this.strategy);
        const baseStep = this.strategy[0];
        if (baseStep) {
            //CHECK WALLET BALANCE
            const balance = await this.Order.getUSDTBalance();
            if (balance >= baseStep.orderBasePairVolume) {
                if (!this.baseOrderID) {
                    await this.Order.placeBaseOrder(
                        baseStep.orderBasePairVolume
                    );
                }
            } else {
                throw new Error(`Insufficient balance`);
            }
            if (!this.step) {
                this.step = baseStep.step;
            }
            await this.startPongPrice();
        }
    }

    async stopTrade() {
        await this.stateManager.clearStateFile();
        if (this.ping) {
            clearInterval(this.ping);
        }
        this.onTakeProfit = false;
        this.baseOrderID = undefined;
        this.emit(TradeType.STOP_TRADE);
    }

    private async init() {
        try {
            if (myBot) {
                this.client = myBot.getExchangeClient();
            }
        } catch (error) {
            console.error(error);
        }
        this.state = await this.stateManager.loadStateFile();
    }
}
