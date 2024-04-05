import { RestClientV5 } from 'bybit-api';
import { IBotConfig, IBuyOrdersStepsToGrid, exchanges } from './@types/types';
import {
    ExchangeConnectionTracker,
    RsiDealTracker,
    StrategyTracker,
    TradeTracker,
} from './events/eventEmitters';
import {
    ExchangeConnectionType,
    RsiDealType,
    StrategyType,
} from './events/events';
import { timeInterval } from './strategy/RSI';

type rsiOptions = { timeInterval: timeInterval; candlesCount: number };
export const currentConnectedExchange = new ExchangeConnectionTracker();

/**
 * Starts the bot for specified symbols.
 * @param rsiOptions - Parameters for starting the bot.
 * @param symbols - Symbols for which the bot is started.
 * @param botConfig - Bot configuration.
 */
export async function startBot(
    exchange: exchanges,
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

    const promises = symbols.map(async (symbol) => {
        const trade = new TradeTracker(symbol);
        const rsi = new RsiDealTracker();
        const strategy = new StrategyTracker(symbol, botConfig);

        //Event handlers
        // ______________________________________________________________
        rsi.on('error', (error: Error) => {
            console.error('Error in RsiDealTracker:', error);
        });

        rsi.on(RsiDealType.RSI_START_DEAL, (result: any) => {
            console.table(result);
            strategy.generateStrategy();
        });

        strategy.on(
            StrategyType.GENERATE_STRATEGY,
            (strategy: IBuyOrdersStepsToGrid[] | []) => {
                if (strategy.length !== 0) {
                    trade.startTrade(strategy);
                    setTimeout(() => {
                        trade.stopTrade();
                    }, 10000);
                } else {
                    console.error('Strategy length = 0');
                }
            }
        );

        currentConnectedExchange.on(
            ExchangeConnectionType.EXCHANGE_CONNECTED,
            async (exchange: RestClientV5) => {
                try {
                    const balance = await exchange.getWalletBalance({
                        accountType: 'UNIFIED',
                    });
                } catch (error) {}
            }
        );

        // ______________________________________________________________
        currentConnectedExchange.connectToExchange(exchange);
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

    await Promise.all(promises);
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
    'bybit',
    [
        'BTCUSDT',
        // 'XRPUSDT', 'KASUSDT', 'UNIUSDT', 'TRXUSDT', 'DOTUSDT'
    ],
    botConfig
    // {
    //     timeInterval: '1',
    //     candlesCount: 5,
    // }
);
