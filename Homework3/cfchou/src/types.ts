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

export interface PricePoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSeries {
  symbol: string;
  data: PricePoint[];
}
