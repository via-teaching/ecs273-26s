import { NewsItem, StockPriceRow, TSNEPoint } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

interface StockSeriesResponse {
  ticker: string;
  series: Array<Omit<StockPriceRow, "ticker" | "dateLabel" | "date"> & { date: string }>;
}

interface NewsResponse {
  news: Array<Omit<NewsItem, "date"> & { date: string }>;
}

interface TSNEResponse {
  points: TSNEPoint[];
}

export async function fetchStockTickers(): Promise<string[]> {
  const response = await fetchFromApi<{ tickers: string[] }>("/api/tickers");
  return response.tickers;
}

export async function fetchStockSeries(ticker: string): Promise<StockPriceRow[]> {
  const response = await fetchFromApi<StockSeriesResponse>(`/api/stocks/${ticker}`);

  return response.series.map((row) => ({
    ...row,
    ticker: response.ticker,
    date: new Date(`${row.date}T00:00:00`),
    dateLabel: row.date,
  }));
}

export async function fetchTSNEPoints(): Promise<TSNEPoint[]> {
  const response = await fetchFromApi<TSNEResponse>("/api/tsne");
  return response.points;
}

export async function fetchNewsItems(ticker: string): Promise<NewsItem[]> {
  const response = await fetchFromApi<NewsResponse>(`/api/news/${ticker}`);

  return response.news.map((item) => ({
    ...item,
    date: new Date(item.date.replace(" ", "T")),
  }));
}

export function formatShortDate(date: Date): string {
  return shortDateFormatter.format(date);
}

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

async function fetchFromApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
