import { csvParse } from 'd3';
import type { NewsItem, StockPriceRow, TsneRow } from '../types';
import { getSampleNewsItems, getSampleStockPrices, sampleTsneRows } from './sampleData';

type CsvRow = Record<string, string | undefined>;

export async function loadStockPrices(ticker: string): Promise<StockPriceRow[]> {
  try {
    const text = await fetchText(`data/stockdata/${ticker}.csv`);
    const rows = csvParse(text)
      .map(normalizeStockRow)
      .filter((row): row is StockPriceRow => row !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (rows.length > 0) {
      return rows;
    }
  } catch {
    // Fall back to generated sample data when public files are not present.
  }

  return getSampleStockPrices(ticker);
}

export async function loadTsneRows(): Promise<TsneRow[]> {
  try {
    const text = await fetchText('data/tsne.csv');
    const rows = csvParse(text)
      .map(normalizeTsneRow)
      .filter((row): row is TsneRow => row !== null);

    if (rows.length > 0) {
      return rows;
    }
  } catch {
    // Fall back to generated sample data when public files are not present.
  }

  return sampleTsneRows;
}

export async function loadNewsItems(ticker: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(dataUrl(`data/stocknews/${ticker}/news.json`));

    if (!response.ok) {
      throw new Error(`Could not load news for ${ticker}`);
    }

    const payload = await response.json();
    const rows = normalizeNewsPayload(payload);

    if (rows.length > 0) {
      return rows;
    }
  } catch {
    // Fall back to generated sample data when public files are not present.
  }

  return getSampleNewsItems(ticker);
}

async function fetchText(path: string) {
  const response = await fetch(dataUrl(path));

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  return response.text();
}

function dataUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

function normalizeStockRow(row: CsvRow): StockPriceRow | null {
  const dateText = pick(row, ['Date', 'date', 'Datetime', 'datetime', 'timestamp']);
  const date = dateText ? new Date(dateText) : new Date(Number.NaN);
  const open = toNumber(pick(row, ['Open', 'open']));
  const high = toNumber(pick(row, ['High', 'high']));
  const low = toNumber(pick(row, ['Low', 'low']));
  const close = toNumber(pick(row, ['Close', 'close', 'Adj Close', 'adjClose', 'adj_close']));

  if (!Number.isFinite(date.getTime()) || !allFinite(open, high, low, close)) {
    return null;
  }

  return { date, open, high, low, close };
}

function normalizeTsneRow(row: CsvRow): TsneRow | null {
  const ticker = pick(row, ['ticker', 'Ticker', 'symbol', 'Symbol', 'stock', 'Stock']);
  const x = toNumber(pick(row, ['x', 'X', 'tsne1', 'TSNE1', 'tsne_1', 'dim1', 'Dim1']));
  const y = toNumber(pick(row, ['y', 'Y', 'tsne2', 'TSNE2', 'tsne_2', 'dim2', 'Dim2']));
  const sector = pick(row, ['sector', 'Sector', 'category', 'Category', 'label', 'Label']) ?? 'Unknown';

  if (!ticker || !allFinite(x, y)) {
    return null;
  }

  return {
    ticker: ticker.toUpperCase(),
    x,
    y,
    sector,
  };
}

function normalizeNewsPayload(payload: unknown): NewsItem[] {
  const candidates = Array.isArray(payload)
    ? payload
    : isObject(payload) && Array.isArray(payload.articles)
      ? payload.articles
      : isObject(payload) && Array.isArray(payload.news)
        ? payload.news
        : [];

  return candidates
    .map((item) => {
      if (!isObject(item)) {
        return null;
      }

      const title = stringField(item, ['title', 'headline', 'name']);
      const date = stringField(item, ['date', 'published', 'publishedAt', 'time']);
      const content = stringField(item, ['content', 'summary', 'description', 'text']);

      if (!title || !date || !content) {
        return null;
      }

      return { title, date, content };
    })
    .filter((item): item is NewsItem => item !== null);
}

function pick(row: CsvRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value.trim() !== '') {
      return value.trim();
    }
  }

  return undefined;
}

function toNumber(value: string | undefined) {
  return Number((value ?? '').replace(/[$,]/g, ''));
}

function allFinite(...values: number[]) {
  return values.every(Number.isFinite);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringField(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = item[key];

    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return undefined;
}
