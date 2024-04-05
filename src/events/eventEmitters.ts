import { RestClientV5 } from 'bybit-api';
import { EventEmitter } from 'events';
import { currentConnectedExchange } from '..';
import { IBuyOrdersStepsToGrid, exchanges } from '../@types/types';
import { BybitRestClientV5Options } from '../exchanges/bybit';
import { RSI, timeInterval } from '../strategy/RSI';
import { generateBotStrategy } from '../strategy/generateDCA';
import { sleep } from '../utils/sleep';
import {
    ExchangeConnectionType,
    PriceType,
    RsiDealType,
    StrategyType,
    TradeType,
} from './events';

export class PriceTracker extends EventEmitter {
    private currentPrice: number;

    constructor(initialPrice: number) {
        super();
        this.currentPrice = initialPrice;
    }

    updatePrice(newPrice: number) {
        if (newPrice !== this.currentPrice) {
            this.currentPrice = newPrice;
            this.emit(PriceType.PRICE_CHANGED, newPrice);
        }
    }
}

/**
 * Class representing a tracker for RSI (Relative Strength Index) deals.
 * Inherits from EventEmitter.
 */
export class RsiDealTracker extends EventEmitter {
    // private coin: string; // Name of the coin being tracked

    /**
     * Creates an instance of RsiDealTracker.
     * @param initialCoin The initial coin to be tracked
     */
    constructor() {
        super();
        // this.coin = initialCoin;
    }

    /**
     * Method to start tracking RSI for a specific symbol.
     * @param symbol The symbol of the coin to track RSI for
     * @param timeInterval The time interval for RSI calculation
     * @param candlesCount The number of candles for RSI calculation
     */
    public async startRsiTracking({
        symbol,
        timeInterval,
        candlesCount,
    }: {
        symbol: string;
        timeInterval: timeInterval;
        candlesCount: number;
    }) {
        try {
            let rsiData = await RSI(symbol, timeInterval, candlesCount);
            console.log('RSI monitoring... ', symbol);

            while (true && rsiData) {
                // console.table(rsiData);
                if (rsiData && rsiData.relativeStrengthIndex < 30) {
                    console.log('RSI waiting... ', symbol);

                    while (rsiData && rsiData.rsiConclusion !== 'normal') {
                        rsiData = await RSI(symbol, timeInterval, candlesCount);
                        await sleep(2000);
                    }
                    console.log('RSI starting... ', symbol);
                    this.emit(RsiDealType.RSI_START_DEAL, {
                        coin: symbol,
                        rsi: { ...rsiData },
                    });
                    break;
                } else {
                    await sleep(2000);
                    continue;
                }
            }
        } catch (error) {
            console.error('Error while tracking RSI:', error);
        }
    }
}

/**
 * Class for tracking trades and handling trading logic.
 */
export class TradeTracker extends EventEmitter {
    private coin: string; // Name of the initial coin being tracked
    private currentPrice = null; // Current price of the tracked coin
    private currentStep: number | null = null; // Current step in the trading process
    private strategy: IBuyOrdersStepsToGrid[] = [];
    private ping: NodeJS.Timeout | undefined; // Interval timer for updating prices

    /**
     * Constructor for creating a new TradeTracker instance.
     * @param initialCoin The initial coin to track
     */
    constructor(initialCoin: string) {
        super();
        this.coin = initialCoin;

        // Event listeners for trade-related events
        this.on(TradeType.START_TRADE, (strategy: IBuyOrdersStepsToGrid[]) => {
            console.log(this.coin);
            console.table(strategy);
            this.strategy = strategy;
            this.startPongPrice();
        });

        this.on(TradeType.UPDATE_PRICE, () => {
            console.log(this.currentPrice);
        });

        // this.on(TradeType.UPDATE_STEP, () => {
        //     console.log(this.currentPrice);
        // });

        this.on(TradeType.STOP_TRADE, () => {
            console.log('stop trade', this.coin);
            this.stopPongPrice();
        });
    }

    /**
     * Method to start updating prices periodically.
     */
    private startPongPrice() {
        console.log('starting pong price...');
        this.ping = setInterval(async () => {
            const price = await currentConnectedExchange.getCoinPrice(
                this.coin
            );
            this.currentPrice = price.lastPrice;
            this.emit(TradeType.UPDATE_PRICE);
        }, 1000);
    }

    /**
     * Method to stop updating prices.
     */
    private stopPongPrice() {
        console.log('Stop pong price');
        clearInterval(this.ping);
    }

    private updateStep(step: number) {
        if (!this.currentStep && this.currentStep !== 0) {
            this.currentStep = 0;
        } else {
            this.currentStep = step;
        }
    }

    private getOrder() {}
    private setOrder() {}
    private deleteOrder() {}
    private getSymbolInfo() {}
    private checkEnd() {}
    private checkAvailableBalance() {}

    /**
     * Method to start a trade with a given strategy.
     * @param strategy The trading strategy to be applied
     */
    public async startTrade(strategy: IBuyOrdersStepsToGrid[] | []) {
        this.emit(TradeType.START_TRADE, strategy);
    }

    /**
     * Method to stop a trade.
     */
    public async stopTrade() {
        this.emit(TradeType.STOP_TRADE);
    }
}

export class StrategyTracker extends EventEmitter {
    botSettings: null;
    coin: string;
    strategy: IBuyOrdersStepsToGrid[] | undefined;

    constructor(initialCoin: string, botSettings: any) {
        super();
        this.coin = initialCoin;
        this.botSettings = botSettings;

        // this.on(StrategyType.CHANGE_INSURANCE_STEP, (data: any) => {
        //     // console.log('start trade', this.coin);
        //     return data;
        // });

        // this.on(
        //     StrategyType.GENERATE_STRATEGY,
        //     (strategy: IBuyOrdersStepsToGrid[]) => {
        //         console.log('stop trade', strategy);
        //     }
        // );
    }

    public generateStrategy() {
        const strategy = generateBotStrategy(
            this.coin,
            this.botSettings,
            16660,
            0.000000001
        );

        if (!strategy) {
            this.strategy = [];
        } else {
            this.strategy = strategy;
        }

        this.emit(StrategyType.GENERATE_STRATEGY, this.strategy);
    }

    public async stopTrade() {
        this.emit(TradeType.STOP_TRADE);
    }
}

export class ExchangeConnectionTracker extends EventEmitter {
    private exchange: exchanges;
    private client: RestClientV5 | any;

    constructor() {
        super();
        this.exchange = 'none';
    }

    public async getklines(
        symbol: string = 'BTCUSDT',
        interval: timeInterval = '1',
        limit: number = 14
    ) {
        let klines: any;
        switch (this.exchange) {
            case 'bybit': {
                if (this.client instanceof RestClientV5) {
                    try {
                        klines = await this.client.getKline({
                            category: 'spot',
                            symbol,
                            interval,
                            limit,
                        });
                        if (klines.result.list) {
                            return [...klines.result.list];
                        }
                    } catch (error) {
                        return;
                    }
                }
                break;
            }
            case 'binance':
                break;
            case 'okex':
                break;
            case 'bitmart':
                break;
            case 'bitget':
                break;
            case 'none':
                break;
        }
        return;
    }

    public async getCoinPrice(symbol: string) {
        let price: any;
        switch (this.exchange) {
            case 'bybit': {
                if (this.client instanceof RestClientV5) {
                    try {
                        price = await this.client.getTickers({
                            category: 'spot',
                            symbol,
                        });
                        if (price.result.list[0]) {
                            return price.result.list[0];
                        }
                    } catch (error) {
                        return;
                    }
                }
                break;
            }
            case 'binance':
                break;
            case 'okex':
                break;
            case 'bitmart':
                break;
            case 'bitget':
                break;
            case 'none':
                break;
        }
        return;
    }

    public async connectToExchange(targetExchange?: exchanges) {
        if (!targetExchange) {
            this.emit(
                ExchangeConnectionType.CONNECTION_ERROR,
                'Target exchange not selected'
            );
            return;
        }
        this.exchange = targetExchange;

        let connection: any;
        switch (this.exchange) {
            case 'bybit': {
                const bybit = new RestClientV5(BybitRestClientV5Options);
                this.client = bybit;
                this.emit(
                    ExchangeConnectionType.EXCHANGE_CONNECTED,
                    this.client
                );
                break;
            }
            case 'binance': {
                return connection;
            }
            case 'okex': {
                return connection;
            }
            case 'bitmart': {
                return connection;
            }
            case 'bitget': {
                return connection;
            }
            case 'none': {
                break;
            }
        }
    }
}
