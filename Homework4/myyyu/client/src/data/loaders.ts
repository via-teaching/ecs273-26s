import type { NewsItem, StockOption, StockPriceRow, TsneRow } from '../types';
import { stockOptions } from '../component/options';
import { getSampleNewsItems, getSampleStockPrices, sampleTsneRows } from './sampleData';

const API_BASE = (import.meta.env.VITE_API_BASE ?? 'http://localhost:8000').replace(/\/+$/, '');

type ApiPriceRow = {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
};

type ApiTsneRow = {
  ticker: string;
  x: number;
  y: number;
  sector: string;
};

type ApiNewsRow = {
  ticker: string;
  title: string;
  date: string;
  url?: string | null;
  content: string;
};

export async function loadStockPrices(ticker: string): Promise<StockPriceRow[]> {
  try {
    const data = await fetchJson<ApiPriceRow[]>(`/stock/${encodeURIComponent(ticker)}/prices`);
    const rows = data
      .map(toStockPriceRow)
      .filter((row): row is StockPriceRow => row !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    if (rows.length > 0) {
      return rows;
    }
  } catch (error) {
    console.warn(`loadStockPrices(${ticker}) falling back to sample data:`, error);
  }
  return getSampleStockPrices(ticker);
}

export async function loadTsneRows(): Promise<TsneRow[]> {
  try {
    const data = await fetchJson<ApiTsneRow[]>('/tsne');
    const rows = data.map(toTsneRow).filter((row): row is TsneRow => row !== null);
    if (rows.length > 0) {
      return rows;
    }
  } catch (error) {
    console.warn('loadTsneRows() falling back to sample data:', error);
  }
  return sampleTsneRows;
}

export async function loadNewsItems(ticker: string): Promise<NewsItem[]> {
  try {
    const data = await fetchJson<ApiNewsRow[]>(`/stock/${encodeURIComponent(ticker)}/news`);
    const rows = data.map(toNewsItem).filter((row): row is NewsItem => row !== null);
    if (rows.length > 0) {
      return rows;
    }
  } catch (error) {
    console.warn(`loadNewsItems(${ticker}) falling back to sample data:`, error);
  }
  return getSampleNewsItems(ticker);
}

export async function loadStockOptions(): Promise<StockOption[]> {
  try {
    const tickers = await fetchJson<string[]>('/tickers');
    if (Array.isArray(tickers) && tickers.length > 0) {
      const nameByTicker = new Map(stockOptions.map((s) => [s.ticker, s.name]));
      return tickers.map((ticker) => ({
        ticker,
        name: nameByTicker.get(ticker) ?? ticker,
      }));
    }
  } catch (error) {
    console.warn('loadStockOptions() falling back to static list:', error);
  }
  return stockOptions;
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GET ${url} -> ${response.status}`);
  }
  return (await response.json()) as T;
}

function toStockPriceRow(raw: ApiPriceRow): StockPriceRow | null {
  const date = new Date(raw.date);
  if (
    !Number.isFinite(date.getTime()) ||
    !Number.isFinite(raw.open) ||
    !Number.isFinite(raw.high) ||
    !Number.isFinite(raw.low) ||
    !Number.isFinite(raw.close)
  ) {
    return null;
  }
  return { date, open: raw.open, high: raw.high, low: raw.low, close: raw.close };
}

function toTsneRow(raw: ApiTsneRow): TsneRow | null {
  if (!raw.ticker || !Number.isFinite(raw.x) || !Number.isFinite(raw.y)) {
    return null;
  }
  return {
    ticker: raw.ticker.toUpperCase(),
    x: raw.x,
    y: raw.y,
    sector: raw.sector || 'Unknown',
  };
}

function toNewsItem(raw: ApiNewsRow): NewsItem | null {
  if (!raw.title || !raw.date || !raw.content) {
    return null;
  }
  return { title: raw.title, date: raw.date, content: raw.content };
}
