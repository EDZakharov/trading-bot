/**
 * Test suite for the Bot class.
 */
import { Bot, BotInitializationError } from './bot';

describe('Bot class', () => {
    let consoleErrorSpy: jest.SpyInstance;

    /**
     * Sets up spies before each test.
     */
    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    /**
     * Cleans up spies after each test.
     */
    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    /**
     * Tests successful initialization of Bot with valid parameters.
     */
    test('should initialize Bot successfully with valid parameters', async () => {
        const initialExchange = 'bybit';
        const initialSymbols = ['BTCUSDT', 'ETHUSDT'];
        const initialBotConfig = {
            targetProfitPercent: 1,
            startOrderVolumeUSDT: 100,
            insuranceOrderVolumeUSDT: 50,
            insuranceOrderSteps: 3,
            insuranceOrderPriceDeviationPercent: 0.5,
            insuranceOrderVolumeMultiplier: 2,
            insuranceOrderStepsMultiplier: 1.5,
        };

        const bot = new Bot(initialExchange, initialSymbols, initialBotConfig, {
            timeInterval: '1',
            candlesCount: 14,
        });
        await bot.start();
        const exchangeClient = await bot.getExchangeClient();

        expect(exchangeClient).toBeTruthy();
    });

    /**
     * Tests BotInitializationError is thrown with an invalid exchange.
     */
    test('should throw BotInitializationError with invalid exchange', () => {
        const initialExchange = 'invalidExchange';
        const initialSymbols: string[] = [];
        const initialBotConfig = null;
        const initialRsiOptions = null;

        expect(() => {
            new Bot(
                //@ts-ignore
                initialExchange,
                initialSymbols,
                initialBotConfig,
                initialRsiOptions
            );
        }).toThrow(BotInitializationError);
    });

    /**
     * Tests BotInitializationError is thrown with an empty symbols array.
     */
    test('should throw BotInitializationError with empty symbols array', () => {
        const initialExchange = 'bybit';
        const initialSymbols: string[] = [];
        const initialBotConfig = null;
        const initialRsiOptions = null;

        expect(() => {
            new Bot(
                initialExchange,
                initialSymbols,
                //@ts-ignore
                initialBotConfig,
                initialRsiOptions
            );
        }).toThrow(BotInitializationError);
    });

    /**
     * Tests BotInitializationError is thrown with null bot config.
     */
    test('should throw BotInitializationError with null bot config', () => {
        const initialExchange = 'bybit';
        const initialSymbols: string[] = ['BTCUSD'];
        const initialBotConfig = null;
        const initialRsiOptions = null;

        expect(() => {
            new Bot(
                initialExchange,
                initialSymbols,
                //@ts-ignore
                initialBotConfig,
                initialRsiOptions
            );
        }).toThrow(BotInitializationError);
    });

    /**
     * Tests BotInitializationError is thrown with null RSI options.
     */
    test('should throw BotInitializationError with null RSI options', () => {
        const initialExchange = 'bybit';
        const initialSymbols: string[] = ['BTCUSD'];
        const initialBotConfig = {
            targetProfitPercent: 1,
            startOrderVolumeUSDT: 100,
            insuranceOrderVolumeUSDT: 50,
            insuranceOrderSteps: 3,
            insuranceOrderPriceDeviationPercent: 0.5,
            insuranceOrderVolumeMultiplier: 2,
            insuranceOrderStepsMultiplier: 1.5,
        };
        const initialRsiOptions = null;

        expect(() => {
            new Bot(
                initialExchange,
                initialSymbols,
                initialBotConfig,
                //@ts-ignore
                initialRsiOptions
            );
        }).toThrow(BotInitializationError);
    });

    /**
     * Tests BotInitializationError is thrown with 0 RSI options.
     */
    test('should throw BotInitializationError with 0 RSI options', () => {
        const initialExchange = 'bybit';
        const initialSymbols: string[] = ['BTCUSD'];
        const initialBotConfig = {
            targetProfitPercent: 1,
            startOrderVolumeUSDT: 100,
            insuranceOrderVolumeUSDT: 50,
            insuranceOrderSteps: 3,
            insuranceOrderPriceDeviationPercent: 0.5,
            insuranceOrderVolumeMultiplier: 2,
            insuranceOrderStepsMultiplier: 1.5,
        };
        const initialRsiOptions = 0;

        expect(() => {
            new Bot(
                initialExchange,
                initialSymbols,
                initialBotConfig,
                //@ts-ignore
                initialRsiOptions
            );
        }).toThrow(BotInitializationError);
    });

    /**
     * Tests successful start and stop of Bot.
     */
    test('should start and stop Bot successfully', async () => {
        const initialExchange = 'bybit';
        const initialSymbols = ['BTCUSD'];
        const initialBotConfig = {
            targetProfitPercent: 1,
            startOrderVolumeUSDT: 100,
            insuranceOrderVolumeUSDT: 50,
            insuranceOrderSteps: 3,
            insuranceOrderPriceDeviationPercent: 0.5,
            insuranceOrderVolumeMultiplier: 2,
            insuranceOrderStepsMultiplier: 1.5,
        };

        const bot = new Bot(initialExchange, initialSymbols, initialBotConfig);
        const consoleSpy = jest.spyOn(console, 'log');

        await bot.start();
        expect(consoleSpy).toHaveBeenCalledWith(
            'Bot initialized successfully.'
        );
        bot.stop();
        expect(consoleSpy).toHaveBeenCalledWith('Bot was stopped');
        consoleSpy.mockRestore();
    });

    /**
     * Tests console.error is not called.
     */
    test('should not call console.error', () => {
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
});
