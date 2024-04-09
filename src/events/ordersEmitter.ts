import { RestClientV5 } from 'bybit-api';
import { EventEmitter } from 'events';
import { Exchange, OrderId, OrderResponse, exchanges } from '../@types/types';
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

        // if (+this.coinPricesCache.get(this.coin)! !== this.prevPrice) {
        // process.stdout.write('\x1b[1A\x1b[2K');
        // console.log(
        //     `Checking prices - \x1b[32m\u2B24\x1b[0m` +
        //         ' ' +
        //         +this.coinPricesCache.get(this.coin)!
        // );
        // console.log(+this.coinPricesCache.get(this.coin)!);
        // this.prevPrice = +this.coinPricesCache.get(this.coin)!;
        // }

        this.on(
            OrderType.PLACE_TP_ORDER,
            async (data: { qty: string; price: string }) => {
                await this.placeTakeProfitOrder(data.qty, data.price);
            }
        );

        this.on(OrderType.PLACE_INSURANCE_ORDER, () => {});

        this.on(OrderType.DELETE_TAKE_PROFIT_ORDER, () => {});
    }

    private async getWalletBalance(symbol: string) {
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
                        }
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

    public async placeTakeProfitOrder(
        qty: string | number,
        price: string | number
    ) {
        const exchangeCli = await this.exchangeClient;

        switch (this.exchange) {
            case 'bybit':
                if (exchangeCli instanceof RestClientV5) {
                    await this.getWalletBalance(this.coin);
                    console.log(this.walletBalance);
                    console.log(this.coinInfo);
                    try {
                        const order = await exchangeCli.submitOrder({
                            category: 'spot',
                            orderType: 'Limit',
                            side: 'Sell',
                            symbol: this.coin,
                            qty: qty.toString(),
                            price: price.toString(),
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

    public async placeBaseOrder(qty: string | number) {
        const exchangeCli = await this.exchangeClient;
        switch (this.exchange) {
            case 'bybit':
                if (exchangeCli instanceof RestClientV5) {
                    await this.getWalletBalance(this.coin);
                    console.log(this.walletBalance);

                    try {
                        const order = await exchangeCli.submitOrder({
                            category: 'spot',
                            orderType: 'Market',
                            side: 'Buy',
                            symbol: this.coin,
                            qty: qty.toString(),
                        });
                        console.log(order);

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

    public async deleteOrderById() {
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

    public async placeInsuranceOrder(
        symbol: string,
        qty: string | number,
        price: string | number
    ) {
        const exchangeCli = await this.exchangeClient;
        switch (this.exchange) {
            case 'bybit':
                if (exchangeCli instanceof RestClientV5) {
                    try {
                        const order = await exchangeCli.submitOrder({
                            category: 'spot',
                            orderType: 'Limit',
                            side: 'Buy',
                            symbol,
                            qty: qty.toString(),
                            price: price.toString(),
                        });
                        return order.result as unknown as OrderResponse;
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

    public async getActiveOrders(symbol: string) {
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

    public async getCoinPrice(symbol: string) {
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

    public async getCoinInfo() {
        try {
            const connectedExchangeClient = await this.exchangeClient;
            switch (this.exchange) {
                case 'bybit':
                    if (connectedExchangeClient instanceof RestClientV5) {
                        const instrumentsInfo =
                            await connectedExchangeClient.getInstrumentsInfo({
                                category: 'spot',
                                symbol: this.coin,
                            });

                        this.coinInfo = instrumentsInfo.result.list[0];
                        return this.coinInfo;
                        // this.minQty = +this.coinInfo.lotSizeFilter.minOrderQty;
                    }
                    break;
            }
        } catch (error) {
            console.error('Error getting coin info:', error);
        }
    }
}
