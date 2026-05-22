/**
 * API client for the HW4 backend.
 *
 * The backend URL can be overridden by setting VITE_API_BASE_URL
 * in client/.env (e.g. http://localhost:8000). Defaults to localhost:8000.
 */

const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

export type StockListResponse = {
  tickers: string[];
  sectors: Record<string, string>;
  sector_order: string[];
};

export type StockRow = {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
};

export type StockTimeseriesResponse = {
  ticker: string;
  rows: StockRow[];
};

export type NewsArticle = {
  Stock: string;
  Filename: string;
  Title: string;
  Date: string;
  URL: string;
  Content: string;
};

export type NewsResponse = {
  ticker: string;
  articles: NewsArticle[];
};

export type TSNEPoint = {
  Ticker: string;
  x: number;
  y: number;
  Sector: string;
};

export type TSNEResponse = {
  points: TSNEPoint[];
  sector_order: string[];
};

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`API ${path} failed: ${res.status} ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listStocks: (signal?: AbortSignal) => getJSON<StockListResponse>('/api/stocks', signal),
  stock: (ticker: string, signal?: AbortSignal) =>
    getJSON<StockTimeseriesResponse>(`/api/stock/${encodeURIComponent(ticker)}`, signal),
  news: (ticker: string, signal?: AbortSignal) =>
    getJSON<NewsResponse>(`/api/news/${encodeURIComponent(ticker)}`, signal),
  tsne: (signal?: AbortSignal) => getJSON<TSNEResponse>('/api/tsne', signal),
};
