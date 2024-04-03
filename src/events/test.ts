import { startBot } from '..';

describe('startBot', () => {
    test('should handle missing symbols', async () => {
        console.error = jest.fn();

        await startBot();

        expect(console.error).toHaveBeenCalledWith(
            'Error: Symbols must be an array and not empty'
        );
    });

    test('should handle missing botConfig', async () => {
        console.error = jest.fn();

        await startBot(['BTCUSDT']);

        expect(console.error).toHaveBeenCalledWith(
            'Error: Bot configuration is missing'
        );
    });

    test('should start the bot with given symbols and botConfig', async () => {
        const symbols = ['BTCUSDT', 'XRPUSDT'];
        const botConfig = {
            targetProfitPercent: 0.1,
            startOrderVolumeUSDT: 0.1,
            insuranceOrderSteps: 10,
            insuranceOrderPriceDeviationPercent: 0.1,
            insuranceOrderStepsMultiplier: 0.1,
            insuranceOrderVolumeUSDT: 0.1,
            insuranceOrderVolumeMultiplier: 0.1,
        };

        console.log = jest.fn();
        console.table = jest.fn();

        await startBot(symbols, botConfig);

        const expectedStepStructure = {
            step: expect.any(Number),
            orderDeviation: expect.any(Number),
            orderSecondaryPairVolume: expect.any(Number),
            orderBasePairVolume: expect.any(Number),
            orderPriceToStep: expect.any(Number),
            orderAveragePrice: expect.any(Number),
            orderTargetPrice: expect.any(Number),
            orderTargetDeviation: expect.any(Number),
            summarizedOrderSecondaryPairVolume: expect.any(Number),
            summarizedOrderBasePairVolume: expect.any(Number),
        };

        expect(console.log).toHaveBeenCalledWith('Bot online for coins:');
        expect(console.log).toHaveBeenCalledWith('Bot settings:');
        expect(console.table).toHaveBeenCalledWith(symbols);
        expect(console.table).toHaveBeenCalledWith(botConfig);
        expect(console.table).toHaveBeenCalledWith(
            expect.arrayContaining([expectedStepStructure])
        );
    });
});
