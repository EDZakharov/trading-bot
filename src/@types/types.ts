import { Method } from 'axios';

export interface IRestClientOptions {
    key?: string;
    secret?: string;
    testnet?: boolean;
    recv_window?: number;
    enable_time_sync?: boolean;
    baseUrl?: string;
}

export interface IBotConfig {
    targetProfitPercent: number;
    startOrderVolumeUSDT: number;
    insuranceOrderSteps: number;
    insuranceOrderPriceDeviationPercent: number;
    insuranceOrderStepsMultiplier: number;
    insuranceOrderVolumeUSDT: number;
    insuranceOrderVolumeMultiplier: number;
}

export interface IBotSetupConfig {
    setTargetProfitPercent(props: number): void;
    setStartOrderVolumeUSDT(props: number): void;
    setInsuranceOrderSteps(props: number): void;
    setInsuranceOrderPriceDeviationPercent(props: number): void;
    setInsuranceOrderStepsMultiplier(props: number): void;
    setInsuranceOrderVolumeUSDT(props: number): void;
    setInsuranceOrderVolumeMultiplier(props: number): void;
    getInsuranceOrderSteps(): number;
}

export interface IBuyOrdersStepsToGrid {
    symbol?: string;
    step: number;
    orderDeviation: number;
    orderBasePairVolume: number;
    orderSecondaryPairVolume: number;
    orderPriceToStep: number;
    orderAveragePrice: number;
    orderTargetPrice: number;
    orderTargetDeviation: number;
    summarizedOrderBasePairVolume: number;
    summarizedOrderSecondaryPairVolume: number;
}

export type ISetOrdersStepsToMongo = IBuyOrdersStepsToGrid[];

export interface IWeightedSum {
    orderPriceToStep: number;
    orderSecondaryPairVolume: number;
    summarizedOrderSecondaryPairVolume: number;
}

export interface IGetBalance {
    coin: string;
    walletBalance: string;
    transferBalance: string;
    bonus: string;
}

export interface IPlaceOrder {
    symbol: string;
    qty: number;
    price: number;
    marketUnit?: string;
    orderId: string;
    side: 'Buy' | 'Sell';
    userCredentials: any;
}

export interface IGetBalanceResult {
    rateLimitApi: undefined;
    retCode: number;
    retMsg: string;
    result: {
        accountType: string;
        bizType: number;
        accountId: string;
        memberId: string;
        balance: {
            coin: string;
            walletBalance: string;
            transferBalance: string;
            bonus: string;
            transferSafeAmount: string;
            ltvTransferSafeAmount: string;
        };
    };
    retExtInfo: {};
    time: number;
}

export interface IGetTickerPrice {
    category: string;
    list: [
        {
            symbol: string;
            bid1Price: string;
            bid1Size: string;
            ask1Price: string;
            ask1Size: string;
            lastPrice: string;
            prevPrice24h: string;
            price24hPcnt: string;
            highPrice24h: string;
            lowPrice24h: string;
            turnover24h: string;
            volume24h: string;
        }
    ];
}

export type verifiedSymbols =
    | 'BTCUSDT'
    | 'ADAUSDT'
    | 'DOGEUSDT'
    | 'DOTUSDT'
    | 'LINKUSDT'
    | 'LTCUSDT'
    | 'MATICUSDT'
    | 'RVNUSDT'
    | 'SOLUSDT'
    | 'SUSHIUSDT'
    | 'TRXUSDT'
    | 'TWTUSDT'
    | 'UNIUSDT'
    | 'XRPUSDT'
    | 'KASUSDT';

export interface AxiosRequestConfig<T = any> {
    url?: string;
    method?: Method;
    baseURL?: string;
    data?: T;
    headers?: Record<string, string>;
    params?: any;
}

export interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: AxiosRequestConfig<T>;
    request?: any;
}

export interface IStep {
    data: {
        message: string;
        success: boolean;
        id: string;
        step: number;
        coin: string;
    };
}

export interface IStrategyMongoResult {
    strategy: IBuyOrdersStepsToGrid[];
    coin: verifiedSymbols;
}

export interface IUserCredentials {
    username: string;
    password: string;
}
