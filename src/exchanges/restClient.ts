import { RestClientV5 } from 'bybit-api';
import 'dotenv/config';
import { IRestClientOptions } from '../@types/types';

/** key?: string;
 * Your API key. Optional, if you plan on making private api calls */

/** secret?: string;
 * Your API secret. Optional, if you plan on making private api calls */

/** testnet?: boolean;
 * Set to `true` to connect to testnet. Uses the live environment by default. */

/** recv_window?: number;
 * Override the max size of the request window (in ms) */

/** enable_time_sync?: boolean;
 * Disabled by default. This can help on machines with consistent latency problems. */

/** sync_interval_ms?: number | string;
 * How often to sync time drift with bybit servers */

/** strict_param_validation?: boolean;
 * Default: false. If true, we'll throw errors if any params are undefined */

/** baseUrl?: string;
 * Optionally override API protocol + domain
 * e.g baseUrl: 'https://api.bytick.com'
 **/

/** parse_exceptions?: boolean;
 * Default: true. whether to try and post-process request exceptions. */

/** parseAPIRateLimits?: boolean;
 * Default: false. Enable to parse/include per-API/endpoint rate limits in responses. */

/** throwOnFailedRateLimitParse?: boolean;
 * Default: false. Enable to throw error if rate limit parser fails */

const restClientOptions: IRestClientOptions = {
    testnet: false,
    key: process.env['API_KEY'],
    secret: process.env['API_SECRET_KEY'],
    enable_time_sync: true,
    recv_window: 5000,
    baseUrl: 'https://api.bybit.com/',
};

const restClient = new RestClientV5(restClientOptions);

export default restClient;
