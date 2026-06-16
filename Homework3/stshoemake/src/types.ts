export interface Margin {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
}

export interface ComponentSize {
    width: number;
    height: number;
}

export interface Point {
    readonly posX: number;
    readonly posY: number;
}

export interface Bar {
    readonly value: number;
}

// Added by Steven
export interface TickerPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const tickerList = ["XOM","CVX","HAL","MMM","CAT","DAL","MCD","NKE","KO",
    "JNJ","PFE","UNH","JPM","GS","BAC","AAPL","MSFT","NVDA","GOOGL","META"] as const;
export type Ticker = typeof tickerList[number];

export const labelList = ["Information_Technology", "Financials", "Industrials",
  "Energy", "Healthcare", "Consumer_Staples", "Consumer_Discretionary"] as const;
export type Label = typeof labelList[number]

export const tickerFieldList = ["open", "high", "low", "close"] as const;
export type TickerField = typeof tickerFieldList[number];
