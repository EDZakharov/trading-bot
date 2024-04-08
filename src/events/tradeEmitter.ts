import { RestClientV5 } from 'bybit-api';
import { EventEmitter } from 'events';

import type {
    IBotConfig,
    IBuyOrdersStepsToGrid,
    OrderResponse,
    exchanges,
} from '../@types/types';
import { myBot } from '../router/routes';
import { generateBotStrategy } from '../strategy/generateDCA';
import { StrategyType, TradeType } from './events';
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
    private takeProfitOrderID?: OrderResponse;
    private onInsurance: boolean;
    private insuranceOrderID?: OrderResponse;
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
        this.Order = new OrderExecutionTracker(this.client, initialExchange);
    }

    private async setState() {
        this.state = {
            strategy: this.strategy,
            lastStep: this.step,
            onTakeProfit: this.onTakeProfit,
            takeProfitOrderID: this.takeProfitOrderID,
            onInsurance: this.onInsurance,
            insuranceOrderID: this.insuranceOrderID,
        };
        await this.stateManager.saveState(this.state);
    }

    private setupListeners() {
        this.on(TradeType.UPDATE_PRICE, async () => {
            try {
                const baseStep = this.strategy[0];
                const insuranceStep = this.strategy[1];

                // console.log(orders);

                if (baseStep) {
                    this.step = baseStep.step;
                    if (!this.onTakeProfit) {
                        const submittedOrder =
                            await this.Order.placeTakeProfitOrder(
                                this.coin,
                                baseStep.summarizedOrderBasePairVolume,
                                baseStep.orderTargetPrice
                            );

                        if (submittedOrder) {
                            this.takeProfitOrderID = submittedOrder;
                            this.onTakeProfit = true;
                        }
                        console.log(submittedOrder);
                    }

                    if (this.onTakeProfit && !this.onInsurance && baseStep) {
                        const submittedInsurance =
                            await this.Order.placeInsuranceOrder(
                                this.coin,
                                baseStep.summarizedOrderSecondaryPairVolume,
                                baseStep.orderPriceToStep
                            );

                        if (submittedInsurance) {
                            this.insuranceOrderID = submittedInsurance;
                            this.onInsurance = true;
                        }
                        console.log(submittedInsurance);
                    }
                    await this.setState();
                    const orders = await this.Order.getActiveOrders(this.coin);
                }

                //NEXT STEP
                if (
                    insuranceStep &&
                    +this.coinPricesCache.get(this.coin)! <=
                        insuranceStep.orderPriceToStep
                ) {
                    this.step = +insuranceStep.step;
                    this.strategy.shift();
                    //Add order emitter
                    await this.setState();
                    console.table(this.strategy);
                }

                //EXIT
                if (
                    baseStep &&
                    +this.coinPricesCache.get(this.coin)! >=
                        baseStep.orderTargetPrice
                ) {
                    console.log('stop trade');
                    //Add order emitter
                    //Checking order execution by ID
                    //If execute -> stop trade
                    //if not -> wait execution
                    this.emit(TradeType.STOP_TRADE);
                }

                //LOGGING
                if (+this.coinPricesCache.get(this.coin)! !== this.prevPrice) {
                    // process.stdout.write('\x1b[1A\x1b[2K');
                    // console.log(
                    //     `Checking prices - \x1b[32m\u2B24\x1b[0m` +
                    //         ' ' +
                    //         +this.coinPricesCache.get(this.coin)!
                    // );

                    console.log(+this.coinPricesCache.get(this.coin)!);
                }

                this.prevPrice = +this.coinPricesCache.get(this.coin)!;
            } catch (error) {}
        });
    }

    private async generateStrategy() {
        await this.getCoinInfo();
        // console.log(this.coinInfo);
        const initialPrice = await this.getCoinPrice(this.coin);

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

    private async getCoinPrice(symbol: string) {
        let price: any;

        try {
            const connectedExchangeClient = await this.client;
            switch (this.exchange) {
                case 'bybit':
                    if (connectedExchangeClient instanceof RestClientV5) {
                        const tickers =
                            await connectedExchangeClient.getTickers({
                                category: 'spot',
                                symbol,
                            });

                        price = tickers?.result.list[0]?.lastPrice;
                        if (price) {
                            this.coinPricesCache.set(symbol, price);
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('Error getting coin price:', error);
        }
        return price;
    }

    private async getCoinInfo() {
        try {
            const connectedExchangeClient = await this.client;
            switch (this.exchange) {
                case 'bybit':
                    if (connectedExchangeClient instanceof RestClientV5) {
                        const instrumentsInfo =
                            await connectedExchangeClient.getInstrumentsInfo({
                                category: 'spot',
                                symbol: this.coin,
                            });

                        this.coinInfo = instrumentsInfo.result.list[0];
                        this.minQty = +this.coinInfo.lotSizeFilter.minOrderQty;
                    }
                    break;
            }
        } catch (error) {
            console.error('Error getting coin info:', error);
        }
    }

    private async startPongPrice() {
        console.log();
        this.ping = setInterval(async () => {
            const newPrice = await this.getCoinPrice(this.coin);
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
        this.startPongPrice();
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
        this.setupListeners();
    }
}
