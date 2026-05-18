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

export interface StockCandle {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TSNEPoint {
    ticker: string;
    x: number;
    y: number;
    sector: string;
}

export interface NewsItem {
    ticker: string;
    title: string;
    date: string;
    url?: string;
    content: string;
}