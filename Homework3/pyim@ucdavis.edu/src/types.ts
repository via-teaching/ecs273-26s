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

export interface Bar{
    readonly value: number;
}

export interface StockRow {
    date: Date;
    close: number;
    open: number;
    high: number;
    low: number;
}

export interface StockNewsRow {
    title: string;
    date: Date;
    content: string;
}

export interface TSNEDataPoint {
    x: number;
    y: number;
    sector: string;
    ticker: string;
}