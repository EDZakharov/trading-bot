export function calculateQty(qty: number, precision: string) {
    return (
        Math.floor(qty * Math.pow(10, +precision.length - 2)) /
        Math.pow(10, +precision.length - 2)
    );
}
