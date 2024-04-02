import { EventEmitter } from 'events';

import { RSI, timeInterval } from '../strategy/RSI';
import { PriceType, RsiDealType, TradeType } from './events';

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
    private dealStatus = false; // Flag indicating the status of the deal
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
     * Private method to update the deal status and emit events.
     * @param newDealStatus The new status of the deal
     * @param emit The event type to emit
     * @param rest Additional data to include in the emitted event
     */
    private updateDealStatus(
        newDealStatus: boolean,
        emit: RsiDealType,
        rest?: any
    ) {
        if (newDealStatus !== this.dealStatus) {
            this.dealStatus = newDealStatus;
            // Emitting an event with updated deal status and additional data

            this.emit(emit, {
                coin: this.coin,
                status: this.dealStatus,
                ...rest,
            });
        }
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
            // Getting RSI data for the specified symbol
            const rsiData = await RSI(symbol, timeInterval, candlesCount);
            // Updating deal status and emitting RSI_START_DEAL event

            setTimeout(() => {
                this.updateDealStatus(
                    true,
                    RsiDealType.RSI_START_DEAL,
                    rsiData
                );
            }, 5000);

            // Handling RSI data (example: logging RSI value)
            // console.log(`RSI for ${symbol}: ${data.relativeStrengthIndex}`);
            // Other actions, including trading and updating deal status
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

        this.on(TradeType.START_TRADE, () => {
            console.log('start trade', this.coin);
        });

        this.on(TradeType.STOP_TRADE, () => {
            console.log('stop trade', this.coin);
        });
    }

    public startTrade() {
        this.emit(TradeType.START_TRADE);
    }

    public async stopTrade() {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                this.emit(TradeType.STOP_TRADE);
                resolve();
            }, 5000); // Задержка в 5 секунд
        });
    }
}
