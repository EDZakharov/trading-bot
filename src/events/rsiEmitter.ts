import { RestClientV5 } from 'bybit-api';
import { EventEmitter } from 'events';
import { candles, exchanges } from '../@types/types';
import { RSI } from '../strategy/RSI';
import { sleep } from '../utils/sleep';
import { RsiDealType } from './events';

type timeInterval =
    | '1'
    | '3'
    | '5'
    | '15'
    | '30'
    | '60'
    | '120'
    | '240'
    | '360'
    | '720'
    | 'D'
    | 'M'
    | 'W';

/**
 * Class representing a tracker for RSI (Relative Strength Index) deals.
 * Inherits from EventEmitter.
 */
export class RsiDealTracker extends EventEmitter {
    private client: RestClientV5 | any;
    private exchange;
    private isBotRunning: boolean = true; // State variable indicating whether the bot is running or not

    /**
     * Creates an instance of RsiDealTracker.
     * @param initialExchange The initial exchange to track
     * @param initialClient The initial client for API requests
     */
    constructor(initialExchange: exchanges, initialClient: RestClientV5 | any) {
        super();
        this.exchange = initialExchange;
        this.client = initialClient;
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
            console.log(`Start RSI monitoring ${symbol}...`);

            while (this.isBotRunning) {
                let klines = await this.getklines(
                    symbol,
                    timeInterval,
                    candlesCount
                );
                if (!klines) {
                    return;
                }
                let rsiData = await RSI(
                    symbol,
                    timeInterval,
                    candlesCount,
                    klines
                );
                console.log(rsiData);

                if (rsiData && rsiData.relativeStrengthIndex < 30) {
                    console.log(`RSI waiting ${symbol}... `);

                    while (
                        this.isBotRunning &&
                        rsiData &&
                        rsiData.rsiConclusion !== 'normal'
                    ) {
                        klines = await this.getklines(
                            symbol,
                            timeInterval,
                            candlesCount
                        );
                        if (!klines) {
                            return;
                        }

                        rsiData = await RSI(
                            symbol,
                            timeInterval,
                            candlesCount,
                            klines
                        );
                        await sleep(2000);
                    }

                    if (this.isBotRunning) {
                        console.log(`RSI starting ${symbol}... `);
                        this.emit(RsiDealType.RSI_START_DEAL, {
                            coin: symbol,
                            rsi: { ...rsiData },
                        });
                    }
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

    /**
     * Method to fetch candlestick data (klines) for the specified symbol.
     * @param symbol The symbol of the coin
     * @param interval The time interval for klines
     * @param limit The maximum number of klines to fetch
     * @returns Candlestick data (klines)
     */
    public async getklines(
        symbol: string,
        interval: timeInterval,
        limit: number
    ) {
        let klines: any;
        const connectedExchangeClient = await this.client;
        switch (this.exchange) {
            case 'bybit': {
                if (connectedExchangeClient instanceof RestClientV5) {
                    try {
                        klines = await connectedExchangeClient.getKline({
                            category: 'spot',
                            symbol,
                            interval,
                            limit,
                        });
                        if (klines.result.list) {
                            return [...klines.result.list] as candles[];
                        }
                    } catch (error) {
                        return;
                    }
                }
                break;
            }
            // case 'binance':
            //     break;
            // case 'okex':
            //     break;
            // case 'bitmart':
            //     break;
            // case 'bitget':
            //     break;
            // case 'none':
            //     break;
        }
        return;
    }

    /**
     * Method to stop the bot.
     * This method stops the internal loop for tracking RSI.
     */
    public stopMonitoring() {
        this.isBotRunning = false;
    }
}
