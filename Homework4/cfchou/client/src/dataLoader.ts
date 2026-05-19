import type { PricePoint, StockSeries } from './types';

const API_BASE = 'http://localhost:8000';

const stockCache = new Map<string, StockSeries>();

interface RawPricePoint {
  date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

function toPricePoint(row: RawPricePoint): PricePoint {
  const [y, m, d] = row.date.slice(0, 10).split('-').map(Number);
  return {
    date: new Date(y, m - 1, d),
    open: +row.Open,
    high: +row.High,
    low: +row.Low,
    close: +row.Close,
    volume: +row.Volume,
  };
}

export async function loadStock(symbol: string): Promise<StockSeries> {
  const cached = stockCache.get(symbol);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Failed to load ${symbol}: HTTP ${res.status}`);
  const body = (await res.json()) as { name: string; stock_series: RawPricePoint[] };
  const series: StockSeries = {
    symbol: body.name ?? symbol,
    data: (body.stock_series ?? []).map(toPricePoint),
  };
  stockCache.set(symbol, series);
  return series;
}

export async function loadStocks(symbols: string[]): Promise<StockSeries[]> {
  return Promise.all(symbols.map(loadStock));
}

export interface TSNEPoint {
  symbol: string;
  x: number;
  y: number;
  sector: string;
}

let tsneCache: TSNEPoint[] | null = null;

interface RawTSNEPoint {
  Stock: string;
  x: number;
  y: number;
  sector?: string;
}

export async function loadTSNE(): Promise<TSNEPoint[]> {
  if (tsneCache) return tsneCache;
  const res = await fetch(`${API_BASE}/tsne`);
  if (!res.ok) throw new Error(`Failed to load t-SNE: HTTP ${res.status}`);
  const body = (await res.json()) as { points: RawTSNEPoint[] };
  tsneCache = (body.points ?? [])
    .map((r) => ({
      symbol: r.Stock,
      x: +r.x,
      y: +r.y,
      sector: r.sector ?? '',
    }))
    .filter((r) => r.symbol);
  return tsneCache;
}

export interface NewsItem {
  title: string;
  date: string;
  url: string;
  content: string;
}

interface RawNewsItem {
  Stock: string;
  Title: string;
  Date: string;
  URL?: string;
  content: string;
}

function cleanHtml(html: string): string {
  return html
    .replace(/<\/span>\s*<span[^>]*>/gi, '\n\n')
    .replace(/<\/?span[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const newsCache = new Map<string, NewsItem[]>();

export async function loadNews(symbol: string): Promise<NewsItem[]> {
  const cached = newsCache.get(symbol);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/stocknews/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Failed to load news for ${symbol}: HTTP ${res.status}`);
  const body = (await res.json()) as { Stock: string; News: RawNewsItem[] };
  const items: NewsItem[] = (body.News ?? []).map((n) => ({
    title: n.Title ?? '',
    date: n.Date ?? '',
    url: n.URL ?? '',
    content: cleanHtml(n.content ?? ''),
  }));
  items.sort((a, b) => b.date.localeCompare(a.date));
  newsCache.set(symbol, items);
  return items;
}
