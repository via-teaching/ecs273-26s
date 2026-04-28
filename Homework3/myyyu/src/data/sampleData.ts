import { stockOptions } from '../component/options';
import type { NewsItem, StockPriceRow, TsneRow } from '../types';

export const sampleSectorsByTicker: Record<string, string> = {
  XOM: 'Energy',
  CVX: 'Energy',
  HAL: 'Energy',
  MMM: 'Industrial/Transport',
  CAT: 'Industrial/Transport',
  DAL: 'Industrial/Transport',
  MCD: 'Consumer',
  NKE: 'Consumer',
  KO: 'Consumer',
  JNJ: 'Healthcare',
  PFE: 'Healthcare',
  UNH: 'Healthcare',
  JPM: 'Finance',
  GS: 'Finance',
  BAC: 'Finance',
  AAPL: 'Tech',
  MSFT: 'Tech',
  NVDA: 'Tech',
  GOOGL: 'Tech',
  META: 'Tech',
};

const sampleCoordinates: Record<string, [number, number]> = {
  XOM: [-34, -9],
  CVX: [-30, -15],
  HAL: [-26, -11],
  MMM: [0, -2],
  CAT: [3, -4],
  DAL: [6, -1],
  MCD: [14, 9],
  NKE: [18, 6],
  KO: [-14, -29],
  JNJ: [4, -27],
  PFE: [8, -31],
  UNH: [6, -24],
  JPM: [25, -12],
  GS: [29, -8],
  BAC: [31, -15],
  AAPL: [-28, 18],
  MSFT: [-24, 23],
  NVDA: [-20, 15],
  GOOGL: [-6, 17],
  META: [-2, 12],
};

export const sampleTsneRows: TsneRow[] = stockOptions.map((stock) => {
  const [x, y] = sampleCoordinates[stock.ticker] ?? [0, 0];
  return {
    ticker: stock.ticker,
    x,
    y,
    sector: sampleSectorsByTicker[stock.ticker] ?? 'Unknown',
  };
});

export function getSampleStockPrices(ticker: string): StockPriceRow[] {
  const seed = ticker.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  const base = 55 + (seed % 180);
  const trend = 0.45 + (seed % 9) / 18;

  return Array.from({ length: 24 }, (_, index) => {
    const wave = Math.sin((index + (seed % 7)) * 0.72) * (4 + (seed % 8));
    const close = Math.max(8, base + index * trend + wave);
    const open = close + Math.cos(index * 0.5 + seed) * 2.4;
    const high = Math.max(open, close) + 2.5 + ((seed + index) % 5);
    const low = Math.min(open, close) - 2.5 - ((seed + index) % 4);

    return {
      date: new Date(Date.UTC(2024, 4 + index, 1)),
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
    };
  });
}

export function getSampleNewsItems(ticker: string): NewsItem[] {
  const stock = stockOptions.find((option) => option.ticker === ticker);
  const name = stock?.name ?? ticker;
  const sector = sampleSectorsByTicker[ticker] ?? 'its sector';

  return [
    {
      title: `${name} updates investors on quarterly operating priorities`,
      date: '2026-04-08',
      content: `${name} reported that management remains focused on margin discipline, product execution, and capital allocation. This sample item is a placeholder for the full text collected in Homework 1.`,
    },
    {
      title: `${ticker} moves with broader ${sector} peer group`,
      date: '2026-03-21',
      content: `Analysts connected the latest movement in ${ticker} to sector-level expectations and recent macroeconomic data. Replace this sample text with the original article content from your Homework 1 news data.`,
    },
    {
      title: `${name} draws attention from long-term shareholders`,
      date: '2026-02-14',
      content: `Market commentary highlighted revenue durability, valuation, and investor sentiment for ${ticker}. This generated entry exists only so the expandable news interaction can be tested locally.`,
    },
  ];
}

function round(value: number) {
  return Number(value.toFixed(2));
}
