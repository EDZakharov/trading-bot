export const roundToPrecision = function (number: number, precision: number) {
    const presNum = number.toFixed(Math.abs(Math.log10(precision)));
    return parseFloat(presNum);
};
