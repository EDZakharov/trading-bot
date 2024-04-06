/**
 * Represents a trading bot configured to operate with specific settings and strategies.
 */
import {
    Exchange,
    IBotConfig,
    IBuyOrdersStepsToGrid,
    exchanges,
} from '../@types/types';
import { RsiDealType, StrategyType, TradeType } from '../events/events';
import { ExchangeConnectionTracker } from '../events/exchangeEmitter';
import { RsiDealTracker } from '../events/rsiEmitter';
import { TradeTracker } from '../events/tradeEmitter';
import { timeInterval } from '../strategy/RSI';

/**
 * Represents options for configuring the RSI (Relative Strength Index) indicator.
 */
type RsiOptions = {
    /**
     * The time interval for RSI calculation.
     */
    timeInterval: timeInterval;
    /**
     * The number of candles to consider for RSI calculation.
     */
    candlesCount: number;
};

/**
 * Error class for bot initialization errors.
 */
export class BotInitializationError extends Error {
    public error;
    constructor(message: string) {
        super(message);
        this.error = message;
    }
}

/**
 * Validates the bot configuration.
 * @param config The bot configuration to validate.
 * @returns True if the bot configuration is valid, otherwise false.
 */
function validateBotConfig(config: IBotConfig): boolean {
    const expectedKeys: (keyof IBotConfig)[] = [
        'targetProfitPercent',
        'startOrderVolumeUSDT',
        'insuranceOrderVolumeUSDT',
        'insuranceOrderSteps',
        'insuranceOrderPriceDeviationPercent',
        'insuranceOrderVolumeMultiplier',
        'insuranceOrderStepsMultiplier',
    ];

    for (const key of expectedKeys) {
        if (!(key in config)) {
            return false;
        }
    }

    for (const key of expectedKeys) {
        if (typeof config[key] !== 'number') {
            return false;
        }
    }

    return true;
}

/**
 * Represents a trading bot.
 */
export class Bot {
    private readonly exchange: exchanges;
    private readonly symbols: string[];
    private readonly botConfig: IBotConfig;
    private readonly rsiOptions?: RsiOptions;
    private readonly exchangeTracker: ExchangeConnectionTracker;
    private exchangeClient: any;
    private isRunning: boolean = false;
    private intervalId: NodeJS.Timeout | null = null;
    private readonly tradeTrackers: Map<string, TradeTracker> = new Map();
    private readonly rsiTrackers: Map<string, RsiDealTracker> = new Map();

    /**
     * Creates an instance of Bot.
     * @param initialExchange The initial exchange to connect to.
     * @param initialSymbols The initial symbols to trade.
     * @param initialBotConfig The initial bot configuration.
     * @param initialRsiOptions Optional initial RSI options.
     * @throws BotInitializationError if initialization fails.
     */
    constructor(
        initialExchange: exchanges,
        initialSymbols: string[],
        initialBotConfig: IBotConfig,
        initialRsiOptions?: RsiOptions
    ) {
        if (
            !Object.values(Exchange).includes(initialExchange as Exchange) ||
            !Array.isArray(initialSymbols) ||
            initialSymbols.length === 0 ||
            !initialBotConfig ||
            !validateBotConfig(initialBotConfig) ||
            (initialRsiOptions &&
                (!initialRsiOptions.timeInterval ||
                    !initialRsiOptions.candlesCount)) ||
            initialRsiOptions === null ||
            typeof initialRsiOptions === 'number' ||
            (initialRsiOptions &&
                (typeof initialRsiOptions.timeInterval !== 'string' ||
                    isNaN(Number(initialRsiOptions.candlesCount))))
        ) {
            throw new BotInitializationError(
                'Invalid bot initialization parameters'
            );
        }
        this.exchangeTracker = new ExchangeConnectionTracker();
        this.exchange = initialExchange;
        this.symbols = initialSymbols;
        this.botConfig = initialBotConfig;
        this.rsiOptions = initialRsiOptions;
    }

    /**
     * Creates trade and RSI trackers for each symbol.
     * @param symbol The symbol to create trackers for.
     */
    private createTrackers(symbol: string) {
        const trade = new TradeTracker(symbol, this.exchange, this.botConfig);
        const rsi = new RsiDealTracker(this.exchange, this.exchangeClient);
        this.tradeTrackers.set(symbol, trade);
        this.rsiTrackers.set(symbol, rsi);
        this.addListeners(trade, rsi, symbol);
    }

    /**
     * Adds event listeners to trade and RSI trackers.
     * @param trade The trade tracker.
     * @param rsi The RSI tracker.
     * @param symbol The symbol to add listeners for.
     */
    private addListeners(
        trade: TradeTracker,
        rsi: RsiDealTracker,
        symbol: string
    ) {
        rsi.on('error', (error: Error) => {
            console.error(`Error in RsiDealTracker for ${symbol}:`, error);
        });

        rsi.on(RsiDealType.RSI_START_DEAL, (result: any) => {
            console.table(result);
            trade.generateStrategy();
        });

        trade.on(
            StrategyType.GENERATE_STRATEGY,
            (strategy: IBuyOrdersStepsToGrid[] | []) => {
                if (strategy.length !== 0) {
                    trade.startTrade(strategy);
                } else {
                    console.error(`Strategy length for ${symbol} = 0`);
                }
            }
        );

        const rsiOpt = this.rsiOptions;

        if (rsiOpt) {
            trade.on(TradeType.STOP_TRADE, () => {
                rsi.startRsiTracking({
                    symbol,
                    timeInterval: rsiOpt.timeInterval,
                    candlesCount: rsiOpt.candlesCount,
                });
            });

            rsi.startRsiTracking({
                symbol,
                timeInterval: rsiOpt.timeInterval,
                candlesCount: rsiOpt.candlesCount,
            });
        } else {
            trade.on(TradeType.STOP_TRADE, () => {
                trade.generateStrategy();
            });

            trade.generateStrategy();
        }
    }

    /**
     * Removes all event listeners from trade and RSI trackers.
     */
    private removeListeners() {
        this.tradeTrackers.forEach((trade) => {
            trade.removeAllListeners();
        });

        this.rsiTrackers.forEach((rsi) => {
            rsi.stopMonitoring();
            rsi.removeAllListeners();
        });
    }

    /**
     * Retrieves the exchange client.
     * @returns The exchange client.
     */
    public async getExchangeClient() {
        return this.exchangeClient;
    }

    /**
     * Starts the bot.
     */
    public async start() {
        if (this.isRunning) {
            console.log('Bot is already running.');
            return;
        }

        this.isRunning = true;
        try {
            await this.init();
            console.log('Bot initialized successfully.');
        } catch (error: any) {
            throw new BotInitializationError(error.message);
        }
    }

    /**
     * Stops the bot.
     */
    public stop() {
        if (!this.isRunning) {
            console.log('Bot is not running.');
            return;
        }
        this.isRunning = false;
        this.removeListeners();

        console.log('Bot was stopped');

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Initializes the bot by creating trackers for each symbol.
     */
    public async init() {
        this.exchangeClient = await this.exchangeTracker.connectToExchange(
            this.exchange
        );
        await Promise.all(
            this.symbols.map((symbol) => this.createTrackers(symbol))
        );
    }
}
