import { RestClientV5 } from 'bybit-api';
import { EventEmitter } from 'events';
import { Exchange, OrderResponse, exchanges } from '../@types/types';

/**
 * Class for tracking orders execution.
 */
export class OrderExecutionTracker extends EventEmitter {
    private readonly exchangeClient: RestClientV5 | any;
    private readonly exchange: exchanges;
    /**
     * Constructs a new instance of OrderExecutionTracker.
     */
    constructor(
        initialExchangeClient: RestClientV5 | any,
        initialExchange: exchanges
    ) {
        super();
        this.exchangeClient = initialExchangeClient;
        this.exchange = initialExchange;
    }

    public async placeTakeProfitOrder(
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
                            side: 'Sell',
                            symbol,
                            qty: qty.toString(),
                            price: price.toString(),
                        });
                        console.log(order);

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

    public async placeBaseOrder(symbol: string, qty: string | number) {
        const exchangeCli = await this.exchangeClient;
        switch (this.exchange) {
            case 'bybit':
                if (exchangeCli instanceof RestClientV5) {
                    try {
                        const order = await exchangeCli.submitOrder({
                            category: 'spot',
                            orderType: 'Market',
                            side: 'Buy',
                            symbol,
                            qty: qty.toString(),
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
}
