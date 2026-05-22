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

export type StockMetricKey = "open" | "high" | "low" | "close";

export interface StockPriceRow {
    readonly ticker: string;
    readonly date: Date;
    readonly dateLabel: string;
    readonly open: number;
    readonly high: number;
    readonly low: number;
    readonly close: number;
    readonly volume: number;
}

export interface TSNEPoint {
    readonly ticker: string;
    readonly x: number;
    readonly y: number;
    readonly sector: string;
}

export interface NewsItem {
    readonly id: string;
    readonly ticker: string;
    readonly title: string;
    readonly date: Date;
    readonly dateLabel: string;
    readonly url: string;
    readonly content: string;
}