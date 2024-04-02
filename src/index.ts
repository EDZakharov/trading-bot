import { IBotConfig } from './@types/types';
import { RsiDealTracker, TradeTracker } from './events/eventEmitters';
import { RsiDealType } from './events/events';
import { timeInterval } from './strategy/RSI';

type rsiOptions = { timeInterval: timeInterval; candlesCount: number };

/**
 * Starts the bot for tracking RSI deals for specified symbols.
 * @param rsiOptions - Parameters for starting the bot.
 * @param symbols - Symbols for which the bot is started.
 * @param botConfig - Bot configuration.
 */
async function startBot(
    symbols?: string[],
    botConfig?: IBotConfig,
    rsiOptions?: rsiOptions
) {
    if (!symbols || symbols.length === 0 || !botConfig) {
        return;
    }

    for (const symbol of symbols) {
        const trade = new TradeTracker(symbol);
        if (
            !rsiOptions ||
            !rsiOptions.timeInterval ||
            !rsiOptions.candlesCount
        ) {
            // trade.emit(TradeType.START_TRADE);
            trade.startTrade();
        } else {
            const rsi = new RsiDealTracker(symbol);
            await rsi.startRsiTracking({
                symbol,
                timeInterval: rsiOptions.timeInterval,
                candlesCount: rsiOptions.candlesCount,
            });
            rsi.on(RsiDealType.RSI_START_DEAL, (data: any) => {
                console.log(data);
                trade.startTrade();
            });
        }
    }
}

const botConfig = {
    targetProfitPercent: 0.1,
    startOrderVolumeUSDT: 0.1,
    insuranceOrderSteps: 0.1,
    insuranceOrderPriceDeviationPercent: 0.1,
    insuranceOrderStepsMultiplier: 0.1,
    insuranceOrderVolumeUSDT: 0.1,
    insuranceOrderVolumeMultiplier: 0.1,
};

startBot(['BTCUSDT', 'XRPUSDT', 'KASUSDT'], botConfig, {
    timeInterval: '3',
    candlesCount: 14,
});
