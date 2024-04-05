//  '1703616420000', Start time of the candle (ms)
//  '42057.99', Open price
//  '42105', Highest price
//  '42043.82', Lowest price
//  '42101.01', Close price. Is the last traded price when the candle is not closed
//  '49.488567', Trade volume. Unit of contract: pieces of contract. Unit of spot: quantity of coins
//  '2081893.39321404' Turnover. Unit of figure: quantity of quota coin

import { currentConnectedExchange } from '..';
import { verifiedSymbols } from '../@types/types';

export const RSI = async function (
    symbol: string,
    interval: timeInterval,
    limit: number
): Promise<
    | {
          rsiConclusion: string;
          trendConclusion: string;
          relativeStrengthIndex: number;
      }
    | undefined
> {
    let klines: Array<candles> | undefined =
        await currentConnectedExchange.getklines(symbol, interval, limit);

    if (!klines) {
        await RSI(symbol, interval, limit);
        return;
    } else {
        const greenCandles = getCandlesColor(klines, 'green');

        const redCandles = getCandlesColor(klines, 'red');
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
    }
};

function getCandlesColor(
    candles: Array<candles>,
    color: 'red' | 'green'
): Array<candles> {
    return candles.filter((currentValue: candles) => {
        const openPrice = parseFloat(currentValue[1]);
        const closePrice = parseFloat(currentValue[4]);

        if (color === 'green') {
            return openPrice < closePrice;
        } else if (color === 'red') {
            return openPrice > closePrice;
        }

        return false;
    });
}

function summarizingCandlesLength(
    candles: Array<candles>,
    color: 'red' | 'green'
): number {
    return candles.reduce((acc: number, currentValue): number => {
        const openPrice = parseFloat(currentValue[1]);
        const closePrice = parseFloat(currentValue[4]);

        if (color === 'green') {
            acc += closePrice - openPrice;
        } else if (color === 'red') {
            acc += openPrice - closePrice;
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
