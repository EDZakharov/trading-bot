import { RsiDealTracker, TradeTracker } from './eventEmitters';
import { TradeType } from './events';

describe('RsiDealTracker', () => {
    let rsiDealTracker: RsiDealTracker;

    beforeEach(() => {
        rsiDealTracker = new RsiDealTracker('BTCUSDT');
    });

    it('should be initialized with the correct initial coin', () => {
        expect(rsiDealTracker['coin']).toBe('BTCUSDT');
    });

    it('should update deal status and emit event when starting RSI tracking', async () => {
        const symbol = 'BTCUSDT';
        const timeInterval = '1';
        const candlesCount = 14;

        const emitSpy = jest.spyOn(rsiDealTracker, 'emit');

        await rsiDealTracker.startRsiTracking({
            symbol,
            timeInterval,
            candlesCount,
        });

        expect(emitSpy).toHaveBeenCalledWith('rsiStartDeal', {
            coin: 'BTCUSDT',
            status: true,
            relativeStrengthIndex: expect.any(Number),
            rsiConclusion: expect.any(String),
            trendConclusion: expect.any(String),
        });
    });
});

describe('TradeTracker', () => {
    let tradeTracker: TradeTracker;

    beforeEach(() => {
        tradeTracker = new TradeTracker('BTCUSDT');
    });

    it('should emit START_TRADE event when startTrade() is called', () => {
        const onStartTrade = jest.fn();
        tradeTracker.on(TradeType.START_TRADE, onStartTrade);
        tradeTracker.startTrade();
        expect(onStartTrade).toHaveBeenCalled();
    });

    it('should emit STOP_TRADE event when stopTrade() is called', async () => {
        const onStopTrade = jest.fn();
        tradeTracker.on(TradeType.STOP_TRADE, onStopTrade);
        await tradeTracker.stopTrade();
        expect(onStopTrade).toHaveBeenCalled();
    }, 6000);
});
