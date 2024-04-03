import { IBotConfig, IBuyOrdersStepsToGrid } from './@types/types';
import {
    RsiDealTracker,
    StrategyTracker,
    TradeTracker,
} from './events/eventEmitters';
import { RsiDealType, StrategyType } from './events/events';
import { timeInterval } from './strategy/RSI';

type rsiOptions = { timeInterval: timeInterval; candlesCount: number };

/**
 * Starts the bot for specified symbols.
 * @param rsiOptions - Parameters for starting the bot.
 * @param symbols - Symbols for which the bot is started.
 * @param botConfig - Bot configuration.
 */
export async function startBot(
    symbols?: string[],
    botConfig?: IBotConfig,
    rsiOptions?: rsiOptions
) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
        console.error('Error: Symbols must be an array and not empty');
        return;
    }

    if (!botConfig) {
        console.error('Error: Bot configuration is missing');
        return;
    }

    if (rsiOptions && (!rsiOptions.timeInterval || !rsiOptions.candlesCount)) {
        console.error('Error: Incomplete RSI options');
        return;
    }

    if (
        rsiOptions &&
        (typeof rsiOptions.timeInterval !== 'string' ||
            isNaN(Number(rsiOptions.candlesCount)))
    ) {
        console.error('Error: Invalid RSI options');
        return;
    }

    console.log(`Bot online for coins:`);
    console.table(symbols);
    rsiOptions && console.log(`RSI options:`);
    rsiOptions && console.table(rsiOptions);
    console.log(`Bot settings:`);
    console.table(botConfig);

    const rsiPromises = symbols.map(async (symbol) => {
        const trade = new TradeTracker(symbol);
        const rsi = new RsiDealTracker(symbol);
        const strategy = new StrategyTracker(symbol, botConfig);

        //Event handlers
        // ______________________________________________________________
        rsi.on('error', (error: Error) => {
            console.error('Error in RsiDealTracker:', error);
        });

        rsi.on(RsiDealType.RSI_START_DEAL, (result: any) => {
            strategy.generateStrategy();
        });

        strategy.on(
            StrategyType.GENERATE_STRATEGY,
            (strategy: IBuyOrdersStepsToGrid[] | []) => {
                trade.startTrade(strategy);
            }
        );
        // ______________________________________________________________

        if (
            !rsiOptions ||
            !rsiOptions.timeInterval ||
            !rsiOptions.candlesCount
        ) {
            strategy.generateStrategy();
        } else {
            return rsi.startRsiTracking({
                symbol,
                timeInterval: rsiOptions.timeInterval,
                candlesCount: rsiOptions.candlesCount,
            });
        }
    });

    await Promise.all(rsiPromises);
}

const botConfig = {
    targetProfitPercent: 0.1,
    startOrderVolumeUSDT: 0.1,
    insuranceOrderSteps: 10,
    insuranceOrderPriceDeviationPercent: 0.1,
    insuranceOrderStepsMultiplier: 0.1,
    insuranceOrderVolumeUSDT: 0.1,
    insuranceOrderVolumeMultiplier: 0.1,
};

startBot(
    [
        'BTCUSDT',
        // 'XRPUSDT', 'KASUSDT', 'UNIUSDT', 'TRXUSDT', 'DOTUSDT'
    ],
    botConfig
    // {
    //     timeInterval: '3',
    //     candlesCount: 14,
    // }
);
