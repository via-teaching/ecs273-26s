export type StockOption = {
  ticker: string;
  name: string;
};

export type StockPriceRow = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type TsneRow = {
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
