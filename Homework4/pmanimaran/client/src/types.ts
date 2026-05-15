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

// API response types
export interface StockSeriesUnit {
    date: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
}

export interface StockAPIResponse {
    name: string;
    stock_series: StockSeriesUnit[];
}

export interface StockNewsAPIItem {
    Stock: string;
    Title: string;
    Date: string;
    content: string;
}

export interface TSNEAPIPoint {
    Stock: string;
    x: number;
    y: number;
    sector: string;
}