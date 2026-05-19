const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

export interface PriceRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockPrices {
  ticker: string;
  records: PriceRecord[];
}

export interface NewsArticle {
  ticker: string;
  title: string;
  date: string;
  content: string;
  url?: string;
}

export interface TSNERow {
  ticker: string;
  x: number;
  y: number;
  sector: string;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail ?? detail; } catch { /* ignore */ }
    throw new Error(`API ${path} → ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const fetchStocks = (): Promise<string[]> =>
  apiFetch<string[]>("/api/stocks");

export const fetchPrices = (ticker: string): Promise<StockPrices> =>
  apiFetch<StockPrices>(`/api/stocks/${ticker}/prices`);

export const fetchNews = (ticker: string): Promise<NewsArticle[]> =>
  apiFetch<NewsArticle[]>(`/api/stocks/${ticker}/news`);

export const fetchTSNE = (): Promise<TSNERow[]> =>
  apiFetch<TSNERow[]>("/api/tsne");
