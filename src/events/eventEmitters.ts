import { EventEmitter } from 'events';

import { IBuyOrdersStepsToGrid } from '../@types/types';
import { RSI, timeInterval } from '../strategy/RSI';
import { generateBotStrategy } from '../strategy/generateDCA';
import { sleep } from '../utils/sleep';
import { PriceType, RsiDealType, StrategyType, TradeType } from './events';

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
    private coin: string; // Name of the coin being tracked

    /**
     * Creates an instance of RsiDealTracker.
     * @param initialCoin The initial coin to be tracked
     */
    constructor(initialCoin: string) {
        super();
        this.coin = initialCoin;
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

            while (true) {
                if (rsiData.relativeStrengthIndex < 30) {
                    console.log('RSI waiting... ', symbol);
                    while (rsiData.rsiConclusion !== 'normal') {
                        rsiData = await RSI(symbol, timeInterval, candlesCount);
                        await sleep(2000);
                    }
                    console.log('RSI starting... ', symbol);
                    this.emit(RsiDealType.RSI_START_DEAL, {
                        coin: this.coin,
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

export class TradeTracker extends EventEmitter {
    private coin: string;
    constructor(initialCoin: string) {
        super();
        this.coin = initialCoin;

        this.on(TradeType.START_TRADE, (strategy: IBuyOrdersStepsToGrid[]) => {
            console.log(this.coin);
            console.table(strategy);
        });

        this.on(TradeType.STOP_TRADE, () => {
            console.log('stop trade', this.coin);
        });
    }

    public async startTrade(strategy: IBuyOrdersStepsToGrid[] | []) {
        if (strategy.length === 0) {
            this.emit(TradeType.STOP_TRADE, 'stop');
        }
        this.emit(TradeType.START_TRADE, strategy);
    }

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
