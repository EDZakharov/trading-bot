import { RestClientV5 } from 'bybit-api';
import { EventEmitter } from 'events';
import { exchanges } from '../@types/types';
import BybitRestClientV5Options from '../exchanges/bybit';
import { ExchangeConnectionType } from './events';

/**
 * Class for tracking connections to cryptocurrency exchanges.
 */
export class ExchangeConnectionTracker extends EventEmitter {
    private exchange: exchanges;
    private client: RestClientV5 | any;

    /**
     * Constructs a new instance of ExchangeConnectionTracker.
     */
    constructor() {
        super();
        this.exchange = 'none';
    }

    /**
     * Connects to the specified cryptocurrency exchange.
     * @param targetExchange The exchange to connect to.
     * @returns The exchange client upon successful connection, otherwise undefined.
     */
    public async connectToExchange(targetExchange?: exchanges) {
        if (!targetExchange) {
            this.emit(
                ExchangeConnectionType.CONNECTION_ERROR,
                'Target exchange not selected'
            );
            return;
        }
        this.exchange = targetExchange;

        switch (this.exchange) {
            case 'bybit': {
                const bybit = new RestClientV5(BybitRestClientV5Options);
                this.client = bybit;
                const isError = await this.checkConnectionHealth();
                if (isError && isError.code === 401) {
                    throw new Error('API key is invalid.');
                }

                this.emit(
                    ExchangeConnectionType.EXCHANGE_CONNECTED,
                    this.client
                );
                return this.client;
            }
            case 'binance': {
                break;
            }
            case 'okex': {
                break;
            }
            case 'bitmart': {
                break;
            }
            case 'bitget': {
                break;
            }
            case 'none': {
                break;
            }
        }
    }

    private async checkConnectionHealth() {
        try {
            switch (this.exchange) {
                case 'bybit': {
                    if (this.client instanceof RestClientV5) {
                        await this.client.getWalletBalance({
                            accountType: 'UNIFIED',
                            coin: 'USDT',
                        });
                    }
                    break;
                }
                case 'binance': {
                    break;
                }
                case 'okex': {
                    break;
                }
                case 'bitmart': {
                    break;
                }
                case 'bitget': {
                    break;
                }
                case 'none': {
                    break;
                }
            }
        } catch (error: any) {
            return error;
        }
    }
}
