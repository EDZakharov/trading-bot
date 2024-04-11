import { RestClientV5 } from 'bybit-api';
import { EventEmitter } from 'events';
import { Exchange, OrderId, exchanges } from '../@types/types';
import { roundToPrecision } from '../utils/roundToPrecision';
import { OrderType } from './events';

/**
 * Class for tracking orders execution.
 */
export class OrderExecutionTracker extends EventEmitter {
    private readonly exchangeClient: RestClientV5 | any;
    private readonly exchange: exchanges;
    private coin: string;
    private feeMaker: any;
    private feeTaker: any;
    private usdtPrecision: any;
    private coinPrecision: any;
    private pricePrecision: any;
    private walletBalance: any;
    private coinInfo: any;
    private coinPricesCache: Map<string, number> = new Map<string, number>();
    /**
     * Constructs a new instance of OrderExecutionTracker.
     */
    constructor(
        initialExchangeClient: RestClientV5 | any,
        initialExchange: exchanges,
        initialCoin: string
    ) {
        super();
        this.exchangeClient = initialExchangeClient;
        this.exchange = initialExchange;
        this.coin = initialCoin;

        this.on(OrderType.PLACE_INSURANCE_ORDER, () => {});

        this.on(OrderType.DELETE_TAKE_PROFIT_ORDER, () => {});
    }

    public async getCoinBalance(symbol: string) {
        const exchangeCli = await this.exchangeClient;
        switch (this.exchange) {
            case 'bybit':
                if (exchangeCli instanceof RestClientV5) {
                    try {
                        const coin = symbol.replace(/USDT$/m, '');
                        const balance = await exchangeCli.getCoinBalance({
                            coin,
                            accountType: 'UNIFIED',
                        });
                        if (balance.result.balance?.walletBalance) {
                            this.walletBalance =
                                balance.result.balance.walletBalance;
                            return this.walletBalance;
                        }
                        break;
                    } catch (error) {
                        console.log(error);
                    }
                }
                break;
            case Exchange.Binance:
                // Logic for executing the order on Binance
                break;
            case Exchange.Okex:
                // Logic for executing the order on Okex
                break;
            case Exchange.Bitmart:
                // Logic for executing the order on Bitmart
                break;
            case Exchange.Bitget:
                // Logic for executing the order on Bitget
                break;
            case Exchange.None:
                // Handling the case when no exchange is specified
                break;
            default:
                // Handling other possible values or error scenarios
                break;
        }
        return;
    }

    public async getUSDTBalance() {
        const exchangeCli = await this.exchangeClient;
        switch (this.exchange) {
            case 'bybit':
                if (exchangeCli instanceof RestClientV5) {
                    try {
                        const balance = await exchangeCli.getCoinBalance({
                            coin: 'USDT',
                            accountType: 'UNIFIED',
                        });
                        if (balance.result.balance?.walletBalance) {
                            this.walletBalance =
                                balance.result.balance.walletBalance;
                            return this.walletBalance;
                        }
                        break;
                    } catch (error) {
                        console.log(error);
                    }
                }
                break;
            case Exchange.Binance:
                // Logic for executing the order on Binance
                break;
            case Exchange.Okex:
                // Logic for executing the order on Okex
                break;
            case Exchange.Bitmart:
                // Logic for executing the order on Bitmart
                break;
            case Exchange.Bitget:
                // Logic for executing the order on Bitget
                break;
            case Exchange.None:
                // Handling the case when no exchange is specified
                break;
            default:
                // Handling other possible values or error scenarios
                break;
        }
        return;
    }

    async placeTakeProfitOrder(qty: string | number, price: string | number) {
        const exchangeCli = await this.exchangeClient;
        switch (this.exchange) {
            case 'bybit':
                if (exchangeCli instanceof RestClientV5) {
                    try {
                        await this.getCoinBalance(this.coin);
                        if (+this.walletBalance < +qty) {
                            console.log(this.walletBalance);
                            console.log(qty);

                            this.emit(
                                OrderType.TP_ORDER_PLACING_FAILED,
                                'Insufficient balance'
                            );
                            break;
                        }

                        await this.getExchangeFee();

                        const qtyToPrecision = roundToPrecision(
                            +qty,
                            this.usdtPrecision
                        );

                        const priceWithFee = (await this.calculateOrderFees(
                            +price
                        )) as number;

                        console.log(priceWithFee);

                        const order = await exchangeCli.submitOrder({
                            category: 'spot',
                            orderType: 'Limit',
                            side: 'Sell',
                            symbol: this.coin,
                            qty: qtyToPrecision.toString(),
                            price: roundToPrecision(
                                priceWithFee,
                                this.pricePrecision
                            ).toString(),
                        });
                        console.log(order);

                        if (order.result.orderId) {
                            this.emit(
                                OrderType.TP_ORDER_SUCCESSFULLY_PLACED,
                                order.result.orderId as unknown as OrderId
                            );
                        } else {
                            this.emit(OrderType.TP_ORDER_PLACING_FAILED);
                        }
                    } catch (error) {
                        console.log(error);
                        this.emit(OrderType.TP_ORDER_PLACING_FAILED);
                    }
                }
                break;
            case Exchange.Binance:
                // Logic for executing the order on Binance
                break;
            case Exchange.Okex:
                // Logic for executing the order on Okex
                break;
            case Exchange.Bitmart:
                // Logic for executing the order on Bitmart
                break;
            case Exchange.Bitget:
                // Logic for executing the order on Bitget
                break;
            case Exchange.None:
                // Handling the case when no exchange is specified
                break;
            default:
                // Handling other possible values or error scenarios
                break;
        }
        return;
    }

    async placeBaseOrder(qty: string | number) {
        const exchangeCli = await this.exchangeClient;
        switch (this.exchange) {
            case 'bybit':
                if (exchangeCli instanceof RestClientV5) {
                    await this.getExchangeFee();

                    const qtyWithFee = (await this.calculateOrderFees(
                        +qty
                    )) as number;

                    try {
                        const order = await exchangeCli.submitOrder({
                            category: 'spot',
                            orderType: 'Market',
                            side: 'Buy',
                            symbol: this.coin,
                            qty: qtyWithFee.toString(),
                        });

                        if (order.result.orderId) {
                            this.emit(
                                OrderType.BASE_ORDER_SUCCESSFULLY_PLACED,
                                order.result.orderId as unknown as OrderId
                            );
                        } else {
                            this.emit(OrderType.BASE_ORDER_PLACING_FAILED);
                        }
                    } catch (error) {
                        console.log(error);
                        this.emit(OrderType.BASE_ORDER_PLACING_FAILED);
                    }
                }
                break;
            case Exchange.Binance:
                // Logic for executing the order on Binance
                break;
            case Exchange.Okex:
                // Logic for executing the order on Okex
                break;
            case Exchange.Bitmart:
                // Logic for executing the order on Bitmart
                break;
            case Exchange.Bitget:
                // Logic for executing the order on Bitget
                break;
            case Exchange.None:
                // Handling the case when no exchange is specified
                break;
            default:
                // Handling other possible values or error scenarios
                break;
        }
        return;
    }
    async placeInsuranceOrder(qty: string | number, price: string | number) {
        const exchangeCli = await this.exchangeClient;

        switch (this.exchange) {
            case 'bybit':
                if (exchangeCli instanceof RestClientV5) {
                    try {
                        await this.getCoinBalance(this.coin);
                        if (+this.walletBalance < +qty) {
                            console.log(this.walletBalance);
                            console.log(qty);

                            this.emit(
                                OrderType.INSURANCE_ORDER_PLACING_FAILED,
                                'Insufficient balance'
                            );
                            break;
                        }

                        await this.getExchangeFee();

                        const qtyToPrecision = roundToPrecision(
                            +qty,
                            this.usdtPrecision
                        );

                        const priceWithFee = (await this.calculateOrderFees(
                            +price
                        )) as number;

                        console.log(priceWithFee);

                        const order = await exchangeCli.submitOrder({
                            category: 'spot',
                            orderType: 'Limit',
                            side: 'Buy',
                            symbol: this.coin,
                            qty: qtyToPrecision.toString(),
                            price: roundToPrecision(
                                priceWithFee,
                                this.pricePrecision
                            ).toString(),
                        });
                        console.log(order);
                        if (order.result.orderId) {
                            this.emit(
                                OrderType.INSURANCE_ORDER_SUCCESSFULLY_PLACED,
                                order.result.orderId as unknown as OrderId
                            );
                        } else {
                            this.emit(OrderType.INSURANCE_ORDER_PLACING_FAILED);
                        }
                    } catch (error) {
                        console.log(error);
                        this.emit(OrderType.INSURANCE_ORDER_PLACING_FAILED);
                    }
                }
                break;
            case Exchange.Binance:
                // Logic for executing the order on Binance
                break;
            case Exchange.Okex:
                // Logic for executing the order on Okex
                break;
            case Exchange.Bitmart:
                // Logic for executing the order on Bitmart
                break;
            case Exchange.Bitget:
                // Logic for executing the order on Bitget
                break;
            case Exchange.None:
                // Handling the case when no exchange is specified
                break;
            default:
                // Handling other possible values or error scenarios
                break;
        }
        return;
    }

    async deleteOrderById() {
        switch (this.exchange) {
            case Exchange.Bybit:
                if (this.exchangeClient instanceof RestClientV5) {
                }
                break;
            case Exchange.Binance:
                // Logic for executing the order on Binance
                break;
            case Exchange.Okex:
                // Logic for executing the order on Okex
                break;
            case Exchange.Bitmart:
                // Logic for executing the order on Bitmart
                break;
            case Exchange.Bitget:
                // Logic for executing the order on Bitget
                break;
            case Exchange.None:
                // Handling the case when no exchange is specified
                break;
            default:
                // Handling other possible values or error scenarios
                break;
        }
    }

    async getActiveOrders(symbol: string) {
        const exchangeCli = await this.exchangeClient;
        switch (this.exchange) {
            case 'bybit':
                if (exchangeCli instanceof RestClientV5) {
                    try {
                        const orders = await exchangeCli.getActiveOrders({
                            category: 'spot',
                            symbol,
                        });
                        return orders.result as unknown as any;
                    } catch (error) {
                        console.log(error);
                    }
                }
                break;
            case Exchange.Binance:
                // Logic for executing the order on Binance
                break;
            case Exchange.Okex:
                // Logic for executing the order on Okex
                break;
            case Exchange.Bitmart:
                // Logic for executing the order on Bitmart
                break;
            case Exchange.Bitget:
                // Logic for executing the order on Bitget
                break;
            case Exchange.None:
                // Handling the case when no exchange is specified
                break;
            default:
                // Handling other possible values or error scenarios
                break;
        }
        return;
    }

    async getCoinPrice(symbol: string) {
        let price: any;

        try {
            const connectedExchangeClient = await this.exchangeClient;
            switch (this.exchange) {
                case 'bybit':
                    if (connectedExchangeClient instanceof RestClientV5) {
                        const tickers =
                            await connectedExchangeClient.getTickers({
                                category: 'spot',
                                symbol,
                            });

                        price = tickers?.result.list[0]?.lastPrice;
                        if (price) {
                            this.coinPricesCache.set(symbol, price);
                        }
                        return this.coinPricesCache.get(this.coin);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error getting coin price:', error);
        }
        return price;
    }

    async getCoinInfo() {
        try {
            const connectedExchangeClient = await this.exchangeClient;
            switch (this.exchange) {
                case 'bybit':
                    if (connectedExchangeClient instanceof RestClientV5) {
                        try {
                            const instrumentsInfo =
                                await connectedExchangeClient.getInstrumentsInfo(
                                    {
                                        category: 'spot',
                                        symbol: this.coin,
                                    }
                                );

                            this.usdtPrecision =
                                instrumentsInfo.result.list[0]?.lotSizeFilter.basePrecision;
                            this.coinPrecision =
                                instrumentsInfo.result.list[0]?.lotSizeFilter.quotePrecision;
                            this.pricePrecision =
                                instrumentsInfo.result.list[0]?.priceFilter.tickSize;
                            this.coinInfo = instrumentsInfo.result.list[0];

                            return this.coinInfo;
                        } catch (error) {
                            console.log(error);
                        }

                        // this.minQty = +this.coinInfo.lotSizeFilter.minOrderQty;
                    }
                    break;
            }
        } catch (error) {
            console.error('Error getting coin info:', error);
        }
    }

    private async getExchangeFee() {
        try {
            const connectedExchangeClient = await this.exchangeClient;
            switch (this.exchange) {
                case 'bybit':
                    if (connectedExchangeClient instanceof RestClientV5) {
                        try {
                            const fee =
                                await connectedExchangeClient.getFeeRate({
                                    category: 'spot',
                                    symbol: this.coin,
                                });
                            this.feeTaker = fee.result.list[0]?.takerFeeRate;
                            this.feeMaker = fee.result.list[0]?.makerFeeRate;
                        } catch (error) {
                            console.log(error);
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('Error getting fee: ', error);
        }
    }

    private async calculateOrderFees(
        qty?: number,
        price?: number
    ): Promise<{ qty: number; price: number } | number | undefined> {
        await this.getExchangeFee();

        if (price && !qty) {
            return price - price * parseFloat(this.feeMaker);
        }

        if (qty && !price) {
            return qty + qty * parseFloat(this.feeTaker);
        }

        if (qty && price) {
            return {
                qty: qty + qty * parseFloat(this.feeTaker),
                price: price - price * parseFloat(this.feeMaker),
            };
        }
        return;
    }
}
