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

export type StockRow = {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume?: number;
};

export type TSNERow = {
  ticker: string;
  x: number;
  y: number;
  sector: string;
};

export type NewsItem = {
  title: string;
  date: string;
  content: string;
};