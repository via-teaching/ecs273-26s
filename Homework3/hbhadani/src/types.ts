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

export interface StockPrice {
    readonly date: Date;
    readonly open: number;
    readonly high: number;
    readonly low: number;
    readonly close: number;
}

export interface TSNEPoint {
    readonly TSNE1: number;
    readonly TSNE2: number;
    readonly Ticker: string;
    readonly Sector: string;
}

export interface NewsItem {
    readonly id: string;
    readonly title: string;
    readonly date: string;
    readonly content: string;
}