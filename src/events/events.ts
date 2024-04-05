export enum RsiDealType {
    RSI_START_DEAL = 'rsiStartDeal',
    RSI_WAIT_DEAL = 'rsiWaitDeal',
    RSI_CALCULATED = 'rsiCalculated',
}

export enum PriceType {
    PRICE_CHANGED = 'priceChanged',
}

export enum TradeType {
    START_TRADE = 'startTrade',
    STOP_TRADE = 'stopTrade',
    UPDATE_PRICE = 'updatePrice',
    UPDATE_STEP = 'updateStep',
}
export enum StrategyType {
    GENERATE_STRATEGY = 'generateStrategy',
    CHANGE_INSURANCE_STEP = 'changeInsuranceStep',
}

export enum ExchangeConnectionType {
    EXCHANGE_CONNECTED = 'exchangeConnected',
    EXCHANGE_SELECTED = 'exchangeSelected',
    CONNECTION_ERROR = 'connectionError',
    GET_EXCHANGE_CLIENT = 'getExchangeClient',
}
