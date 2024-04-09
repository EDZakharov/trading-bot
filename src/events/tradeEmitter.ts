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
        this.init();
        this.Order = new OrderExecutionTracker(
            this.client,
            this.exchange,
            this.coin
        );

        this.on(TradeType.UPDATE_PRICE, async () => {
            try {
                const baseStep = this.strategy[0];
                const insuranceStep = this.strategy[1];
                if (baseStep) {
                    this.step = baseStep.step;
                    if (!this.onTakeProfit) {
                        this.onTakeProfit = true;
                        //CHECK PLACING BASE ORDER
                        this.Order.emit(OrderType.PLACE_TP_ORDER, {
                            qty: baseStep.summarizedOrderBasePairVolume,
                            price: baseStep.orderTargetPrice,
                        });
                    }

                    // if (this.onTakeProfit && !this.onInsurance && baseStep) {
                    //     const submittedInsurance =
                    //         await this.Order.placeInsuranceOrder(
                    //             this.coin,
                    //             baseStep.summarizedOrderSecondaryPairVolume,
                    //             baseStep.orderPriceToStep
                    //         );

                    //     if (submittedInsurance) {
                    //         this.insuranceOrderID = submittedInsurance;
                    //         this.onInsurance = true;
                    //     }
                    //     console.log(submittedInsurance);
                    // }
                    // await this.setState();
                    // const orders = await this.Order.getActiveOrders(this.coin);
                }

                //NEXT STEP
                if (
                    insuranceStep &&
                    +this.coinPricesCache.get(this.coin)! <=
                        insuranceStep.orderPriceToStep
                ) {
                    this.step = +insuranceStep.step;
                    this.strategy.shift();
                    // await this.setState();
                    console.table(this.strategy);
                }

                //EXIT
                if (
                    baseStep &&
                    +this.coinPricesCache.get(this.coin)! >=
                        baseStep.orderTargetPrice
                ) {
                    console.log('stop trade');
                    this.emit(TradeType.STOP_TRADE);
                }
            } catch (error) {}
        });

        this.Order.on(
            OrderType.TP_ORDER_SUCCESSFULLY_PLACED,
            async (orderId) => {
                this.takeProfitOrderID = orderId;
                await this.setState();
            }
        );

        this.Order.on(
            OrderType.BASE_ORDER_SUCCESSFULLY_PLACED,
            async (orderId) => {
                this.baseOrderID = orderId;
                await this.setState();
            }
        );
    }

    private async setState() {
        this.state = {
            strategy: this.strategy,
            lastStep: this.step,
            onBaseOrderID: this.baseOrderID,
            // onTakeProfit: this.onTakeProfit,
            // takeProfitOrderID: this.takeProfitOrderID,
            // onInsurance: this.onInsurance,
            // insuranceOrderID: this.insuranceOrderID,
        };
        await this.stateManager.saveState(this.state);
    }

    private async generateStrategy() {
        this.coinInfo = await this.Order.getCoinInfo();
        this.minQty = +this.coinInfo.lotSizeFilter.minOrderQty;
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
        console.log();
        this.ping = setInterval(async () => {
            const newPrice = await this.Order.getCoinPrice(this.coin);
            if (newPrice !== this.currentPrice) {
                this.currentPrice = newPrice;
                this.coinPricesCache.set(this.coin, newPrice);
                this.emit(TradeType.UPDATE_PRICE);
            }
        }, 200);
    }

    public async startTrade() {
        await this.generateStrategy();
        console.log(this.coin);
        console.table(this.strategy);
        const baseStep = this.strategy[0];
        if (baseStep) {
            //CHECK WALLET BALANCE
            await this.Order.placeBaseOrder(baseStep.orderBasePairVolume);
            await this.startPongPrice();
        }
    }

    public async stopTrade() {
        await this.stateManager.clearStateFile();
        if (this.ping) {
            clearInterval(this.ping);
        }
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
