import {
    IBotConfig,
    IBuyOrdersStepsToGrid,
    IWeightedSum,
} from '../@types/types';

export function generateBotStrategy(
    symbol: string,
    botSettings: any,
    coinPrice: number,
    minQuantity: number
): IBuyOrdersStepsToGrid[] | undefined {
    try {
        let buyOrdersStepsToGrid: IBuyOrdersStepsToGrid[] = [];
        let currentSymbol: string = '';
        const { botId, ...rest } = convertStringsToNumbers(botSettings);

        if (rest) {
            const {
                targetProfitPercent,
                insuranceOrderSteps,
                insuranceOrderStepsMultiplier,
                insuranceOrderPriceDeviationPercent,
                startOrderVolumeUSDT,
                insuranceOrderVolumeUSDT,
                insuranceOrderVolumeMultiplier,
            } = rest as IBotConfig;

            let tickerPrice = checkingSymbolInfo(
                symbol,
                startOrderVolumeUSDT,
                coinPrice,
                minQuantity
            );

            if (!tickerPrice) {
                return;
            }

            if (
                buyOrdersStepsToGrid.length >= insuranceOrderSteps ||
                currentSymbol !== symbol
            ) {
                currentSymbol = symbol;
                buyOrdersStepsToGrid = [];
            }

            let orderBasePairVolume = startOrderVolumeUSDT;
            let orderSecondaryPairVolume = parseFloat(
                (orderBasePairVolume / +tickerPrice).toFixed(8)
            );
            let orderDeviation = 0;
            let orderPriceToStep = +tickerPrice;
            let summarizedOrderBasePairVolume =
                calculateSummarizedPairVolumeToStep();
            let calculatedSummarizedPairVolumeToStep =
                calculateSummarizedPairVolumeToStep();
            const orderAveragePriceToStep = calculateAveragePriceToStep(0, 0);
            let orderAveragePrice = orderAveragePriceToStep({
                orderPriceToStep,
                orderSecondaryPairVolume,
                summarizedOrderSecondaryPairVolume: orderSecondaryPairVolume,
            });
            let orderTargetPrice = calculateOrderTargetPriceToStep(
                orderAveragePrice,
                targetProfitPercent
            );
            let orderTargetDeviation = calculateOrderTargetDeviationToStep(
                orderPriceToStep,
                orderTargetPrice
            );
            let summarizedOrderSecondaryPairVolume =
                calculatedSummarizedPairVolumeToStep(orderSecondaryPairVolume);

            /** PLACE STEP = 0 */
            buyOrdersStepsToGrid.push({
                step: 0,
                orderDeviation,
                orderSecondaryPairVolume,
                orderBasePairVolume,
                orderPriceToStep,
                orderAveragePrice,
                orderTargetPrice,
                orderTargetDeviation,
                summarizedOrderSecondaryPairVolume,
                summarizedOrderBasePairVolume:
                    summarizedOrderBasePairVolume(orderBasePairVolume),
            });

            /** PLACE STEPS > 0*/
            for (let step = 1; step <= insuranceOrderSteps; step++) {
                orderDeviation = calculateOrderDeviationToStep(
                    orderDeviation,
                    insuranceOrderPriceDeviationPercent,
                    insuranceOrderStepsMultiplier
                );

                if (orderDeviation > 100) {
                    console.error('order deviation > 100 %');
                    return buyOrdersStepsToGrid;
                }

                orderBasePairVolume = calculateOrderVolumeToStep(
                    step,
                    orderBasePairVolume,
                    insuranceOrderVolumeUSDT,
                    insuranceOrderVolumeMultiplier
                );

                orderPriceToStep = calculateOrderPriceToStep(
                    +tickerPrice,
                    orderDeviation
                );

                orderSecondaryPairVolume = parseFloat(
                    (orderBasePairVolume / orderPriceToStep).toFixed(8)
                );

                summarizedOrderSecondaryPairVolume =
                    calculatedSummarizedPairVolumeToStep(
                        orderSecondaryPairVolume
                    );

                orderAveragePrice = orderAveragePriceToStep({
                    orderPriceToStep,
                    orderSecondaryPairVolume,
                    summarizedOrderSecondaryPairVolume,
                });

                orderTargetPrice = calculateOrderTargetPriceToStep(
                    orderAveragePrice,
                    targetProfitPercent
                );

                orderTargetDeviation = calculateOrderTargetDeviationToStep(
                    orderPriceToStep,
                    orderTargetPrice
                );

                buyOrdersStepsToGrid.push({
                    step,
                    orderDeviation: +orderDeviation.toFixed(8),
                    orderSecondaryPairVolume,
                    orderBasePairVolume: +orderBasePairVolume.toFixed(8),
                    orderPriceToStep,
                    orderAveragePrice,
                    orderTargetPrice,
                    orderTargetDeviation,
                    summarizedOrderSecondaryPairVolume,
                    summarizedOrderBasePairVolume:
                        summarizedOrderBasePairVolume(orderBasePairVolume),
                });
            }
            return buyOrdersStepsToGrid;
        } else {
            return;
        }
    } catch (error) {
        console.log(error);
        return;
    }
}

/** CALCULATE FUNCTIONS */

function calculateOrderDeviationToStep(
    orderDeviation: number,
    insuranceOrderPriceDeviation: number,
    insuranceOrderStepsMultiplier: number
): number {
    return orderDeviation !== 0
        ? (orderDeviation =
              insuranceOrderPriceDeviation +
              orderDeviation * insuranceOrderStepsMultiplier)
        : (orderDeviation = insuranceOrderPriceDeviation);
}

function calculateOrderVolumeToStep(
    step: number,
    orderVolume: number,
    insuranceOrderVolumeUSDT: number,
    insuranceOrderVolumeMultiplier: number
): number {
    return orderVolume === insuranceOrderVolumeUSDT
        ? step === 1
            ? (orderVolume = insuranceOrderVolumeUSDT)
            : (orderVolume = orderVolume * insuranceOrderVolumeMultiplier)
        : step !== 1
        ? (orderVolume = orderVolume * insuranceOrderVolumeMultiplier)
        : (orderVolume = insuranceOrderVolumeUSDT);
}

function calculateOrderPriceToStep(
    tickerPrice: number,
    orderDeviation: number
): number {
    return parseFloat(
        (tickerPrice - (+tickerPrice / 100) * orderDeviation).toFixed(8)
    );
}

function calculateAveragePriceToStep(
    prevPrice: number,
    prevVolume: number
): Function {
    let orderPricesToStep: Array<number> = [];
    let orderSecondaryPairVolumesToStep: Array<number> = [];
    prevPrice && orderPricesToStep.push(prevPrice);
    prevVolume && orderSecondaryPairVolumesToStep.push(prevVolume);
    let weightedSum;
    return function ({
        orderPriceToStep,
        orderSecondaryPairVolume,
        summarizedOrderSecondaryPairVolume,
    }: IWeightedSum): number {
        orderPricesToStep.push(orderPriceToStep);
        orderSecondaryPairVolumesToStep.push(orderSecondaryPairVolume);
        weightedSum = orderSecondaryPairVolumesToStep.reduce(
            (prev: number, curr: number, index: number): number => {
                // @ts-ignore
                return prev + curr * orderPricesToStep[index];
            },
            0
        );

        const averagePrice = weightedSum / summarizedOrderSecondaryPairVolume;
        return parseFloat(averagePrice.toFixed(8));
    };
}

function calculateOrderTargetPriceToStep(
    orderAveragePrice: number,
    targetProfit: number
): number {
    //TEST
    const calculate = orderAveragePrice + (targetProfit * 0.01) / 100;
    // const calculate =
    //     orderAveragePrice + (orderAveragePrice + targetProfit * 0.01) / 100;
    return parseFloat(calculate.toFixed(8));
}

function calculateOrderTargetDeviationToStep(
    orderPriceToStep: number,
    orderTargetPrice: number
): number {
    // Ordinary Least Squares regression ???????????????
    const calculate =
        ((orderTargetPrice - orderPriceToStep) / orderPriceToStep) * 100;
    return parseFloat(calculate.toFixed(8));
}

function calculateSummarizedPairVolumeToStep(): Function {
    let summ = 0;

    return (pairVolume: number): number => {
        summ = summ + pairVolume;
        return parseFloat(summ.toFixed(8));
    };
}

/** CHECKING SYMBOL INFO */

function checkingSymbolInfo(
    symbol: string,
    startOrderVolume: number,
    coinPrice: number,
    minQty: number
): undefined | number {
    try {
        if (!coinPrice) {
            console.error(`request failed: bad coinPrice`);
            return;
        }

        if (!minQty) {
            console.error(`request failed: bad minQty of ${symbol}`);
            return;
        }

        if (startOrderVolume && startOrderVolume / coinPrice <= minQty) {
            console.error(
                `request failed: starting order qty = ${parseFloat(
                    (startOrderVolume / coinPrice).toFixed(8)
                )}, min qty = ${minQty}`
            );
            return;
        }
        return coinPrice;
    } catch (error) {
        console.error(error);
        return;
    }
}

/** CHECKING ERRORS */

// function checkingBotConfigErrors(props: IBotConfig) {
//     return Object.values(props).some(
//         (element) =>
//             typeof element === 'object' ||
//             typeof element === 'boolean' ||
//             element === undefined ||
//             element === null ||
//             element.length !== undefined
//     );
// }

function convertStringsToNumbers(botSettings: any) {
    for (let key in botSettings) {
        if (isNaN(parseFloat(botSettings[key]))) {
            botSettings[key] = 0;
        } else {
            botSettings[key] = parseFloat(botSettings[key]);
        }
    }
    return botSettings;
}
