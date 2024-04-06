import { RestClientV5 } from 'bybit-api';
import { EventEmitter } from 'events';
import fs from 'fs';

import type {
    IBotConfig,
    IBuyOrdersStepsToGrid,
    exchanges,
} from '../@types/types';
import { myBot } from '../router/routes';
import { generateBotStrategy } from '../strategy/generateDCA';
import { StrategyType, TradeType } from './events';

/**
 * Class representing a tracker for trades.
 * Inherits from EventEmitter.
 */
export class TradeTracker extends EventEmitter {
    private coin: string; // Name of the coin being tracked
    private settings: IBotConfig; // Configuration settings for the bot
    private currentPrice = 0; // Current price of the coin
    private strategy: IBuyOrdersStepsToGrid[] = []; // Trading strategy for the coin
    private ping: NodeJS.Timeout | undefined; // Timer for updating the price
    private client: RestClientV5 | any; // Exchange client
    private exchange; // Selected exchange
    private coinPricesCache: Map<string, number> = new Map<string, number>(); // Cache for coin prices
    private coinInfo: any;
    private minQty: any;
    private readonly stateFilePath: string =
        __dirname + 'trade_tracker_state.json';

    /**
     * Creates an instance of TradeTracker.
     * @param initialCoin The initial coin to be tracked
     * @param initialExchange The initial exchange to connect to
     * @param initialSettings The initial bot configuration settings
     */
    constructor(
        initialCoin: string,
        initialExchange: exchanges,
        initialSettings: IBotConfig
    ) {
        super();
        this.coin = initialCoin;
        this.settings = initialSettings;

        // Set up event listeners
        this.on(TradeType.START_TRADE, (strategy: IBuyOrdersStepsToGrid[]) => {
            console.log(this.coin);
            console.table(strategy);
            this.strategy = strategy;
            this.startPongPrice();
        });

        this.on(TradeType.STOP_TRADE, () => {
            if (this.ping) {
                clearInterval(this.ping);
            }
        });

        this.on(TradeType.UPDATE_PRICE, () => {
            console.log(this.coinPricesCache.get(this.coin));
        });

        try {
            if (myBot) {
                this.client = myBot.getExchangeClient();
            }
        } catch (error) {
            console.error(error);
        }

        this.exchange = initialExchange;

        if (!fs.existsSync(this.stateFilePath)) {
            fs.writeFileSync(this.stateFilePath, '{}');
        }

        this.loadState();
    }

    /**
     * Generates a trading strategy based on the current price and bot configuration.
     */
    public async generateStrategy() {
        await this.getCoinInfo();
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
        }

        this.emit(StrategyType.GENERATE_STRATEGY, this.strategy);
    }

    /**
     * Retrieves the current price of the coin from the exchange.
     * @param symbol The symbol of the coin
     * @returns The current price of the coin
     */
    public async getCoinPrice(symbol: string) {
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
                // case 'binance':
                // case 'okex':
                // case 'bitmart':
                // case 'bitget':
                // case 'none':
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
                // case 'binance':
                // case 'okex':
                // case 'bitmart':
                // case 'bitget':
                // case 'none':
            }
        } catch (error) {
            console.error('Error getting coin info:', error);
        }
    }

    /**
     * Starts updating the coin price periodically.
     */
    private async startPongPrice() {
        console.log('starting pong price...');
        this.ping = setInterval(async () => {
            const newPrice = await this.getCoinPrice(this.coin);
            if (newPrice !== this.currentPrice) {
                this.currentPrice = newPrice;
                this.coinPricesCache.set(this.coin, newPrice);
                this.emit(TradeType.UPDATE_PRICE);
            }
        }, 300);
    }

    /**
     * Starts a trade with the provided strategy.
     * @param strategy The trading strategy to be applied
     */
    public async startTrade(strategy: IBuyOrdersStepsToGrid[] | []) {
        this.emit(TradeType.START_TRADE, strategy);
    }

    /**
     * Stops the trade.
     */
    public async stopTrade() {
        await this.saveState();
        this.emit(TradeType.STOP_TRADE);
    }

    private async saveState() {
        try {
            const state = {
                strategy: this.strategy,
                // Другие данные, которые вы хотите сохранить
            };
            await fs.promises.writeFile(
                this.stateFilePath,
                JSON.stringify(state)
            );
        } catch (error) {
            console.error('Error saving trade tracker state:', error);
        }
    }

    private async loadState() {
        try {
            const data = await fs.promises.readFile(this.stateFilePath, 'utf8');
            const state = JSON.parse(data);
            if (state.strategy) {
                this.strategy = state.strategy;
            }
        } catch (error) {
            console.error('Error loading trade tracker state:', error);
        }
    }
}
