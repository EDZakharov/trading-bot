//  '1703616420000', Start time of the candle (ms)
//  '42057.99', Open price
//  '42105', Highest price
//  '42043.82', Lowest price
//  '42101.01', Close price. Is the last traded price when the candle is not closed
//  '49.488567', Trade volume. Unit of contract: pieces of contract. Unit of spot: quantity of coins
//  '2081893.39321404' Turnover. Unit of figure: quantity of quota coin

import { verifiedSymbols } from '../@types/types';
import restClient from '../exchanges/restClient';
import { sleep } from '../utils/sleep';

export const RSI = async function (
    symbol: string = 'BTCUSDT',
    interval: timeInterval = '1',
    limit: number = 14
): Promise<{
    rsiConclusion: string;
    trendConclusion: string;
    relativeStrengthIndex: number;
}> {
    let candles = undefined;
    GET_KLINE: while (!candles) {
        try {
            candles = await restClient.getKline({
                category: 'spot',
                symbol,
                interval,
                limit,
            });

            if (!candles || !candles.result.list) {
                candles = undefined;
                await sleep(5000);
                continue GET_KLINE;
            }
        } catch (error) {
            console.error(error);
            candles = undefined;
            await sleep(5000);
            continue GET_KLINE;
        }
    }

    const allCandles = [...candles.result.list];
    const greenCandles = getCandlesColor(allCandles, 'green');
    const redCandles = getCandlesColor(allCandles, 'red');
    const summarizedGreenCandlesLength = summarizingCandlesLength(
        greenCandles,
        'green'
    );
    const summarizedRedCandlesLength = summarizingCandlesLength(
        redCandles,
        'red'
    );
    const relativeStrength =
        summarizedGreenCandlesLength / summarizedRedCandlesLength;
    const relativeStrengthIndex = 100 - 100 / (1 + relativeStrength);
    let precision = '0.01';
    let rsiConclusion =
        relativeStrengthIndex > 70
            ? 'oversold'
            : relativeStrengthIndex < 30
            ? 'overbought'
            : 'normal';
    let trendConclusion =
        relativeStrengthIndex > 50
            ? 'bullish'
            : relativeStrengthIndex < 50
            ? 'bearish'
            : '50/50';
    return {
        rsiConclusion,
        trendConclusion,
        relativeStrengthIndex:
            Math.floor(
                relativeStrengthIndex * Math.pow(10, +precision.length - 2)
            ) / Math.pow(10, +precision.length - 2),
    };
};

function getCandlesColor(
    candles: Array<candles>,
    color: 'red' | 'green'
): Array<candles> {
    return candles.reduce(
        (acc: Array<candles>, currentValue: candles): Array<candles> => {
            if (color === 'green' && +currentValue[1] < +currentValue[4]) {
                acc.push(currentValue);
            } else if (color === 'red' && +currentValue[1] > +currentValue[4]) {
                acc.push(currentValue);
            }

            return acc;
        },
        []
    );
}

function summarizingCandlesLength(
    candles: Array<candles>,
    color: 'red' | 'green'
) {
    return candles.reduce((acc: number, currentValue): number => {
        if (color === 'green') {
            acc += parseFloat(currentValue[4]) - parseFloat(currentValue[1]);
        } else if (color === 'red') {
            acc += parseFloat(currentValue[1]) - parseFloat(currentValue[4]);
        }
        return acc;
    }, 0);
}

export interface IRsiOptions {
    symbol: verifiedSymbols;
    timeInterval: timeInterval;
    limit: number;
}

export type timeInterval =
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

type candles = [string, string, string, string, string, string, string];
