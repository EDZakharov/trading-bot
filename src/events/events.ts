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
    END_OF_LOOP = 'endOfLoop',
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

export enum OrderType {
    PLACE_TP_ORDER = 'placeTakeProfitOrder',
    PLACE_INSURANCE_ORDER = 'placeInsuranceOrder',
    DELETE_TAKE_PROFIT_ORDER = 'deleteTakeProfitOrder',
    TP_ORDER_SUCCESSFULLY_PLACED = 'tpOrderSuccessfullyPlaced',
    TP_ORDER_PLACING_FAILED = 'tpOrderPlacingFailed',
    BASE_ORDER_SUCCESSFULLY_PLACED = 'baseOrderSuccessfullyPlaced',
    BASE_ORDER_PLACING_FAILED = 'baseOrderPlacingFailed',
    INSURANCE_ORDER_SUCCESSFULLY_PLACED = 'insuranceOrderSuccessfullyPlaced',
    INSURANCE_ORDER_PLACING_FAILED = 'insuranceOrderPlacingFailed',
}
