import * as d3 from "d3";
import tsneRaw from "../data/tsne.csv?raw";

import { NewsItem, StockPriceRow, TSNEPoint } from "./types";
import { rawNewsEntries } from "./generated/newsData";

const stockFileContents = import.meta.glob("../data/stockdata/*.csv", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const sectorByTicker: Record<string, string> = {
  AAPL: "Technology",
  BAC: "Finance",
  CAT: "Industrials",
  CVX: "Energy",
  DAL: "Industrials",
  GOOGL: "Technology",
  GS: "Finance",
  HAL: "Energy",
  JNJ: "Healthcare",
  JPM: "Finance",
  KO: "Consumer",
  MCD: "Consumer",
  META: "Technology",
  MMM: "Industrials",
  MSFT: "Technology",
  NKE: "Consumer",
  NVDA: "Technology",
  PFE: "Healthcare",
  UNH: "Healthcare",
  XOM: "Energy",
};

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const stockTickers = Object.keys(stockFileContents)
  .map(extractTickerFromPath)
  .sort((left, right) => left.localeCompare(right));

const stockSeriesByTicker = new Map(
  Object.entries(stockFileContents).map(([path, raw]) => {
    const ticker = extractTickerFromPath(path);
    const rows = d3
      .csvParse(raw)
      .map((row) => ({
        ticker,
        date: new Date(`${row.Date}T00:00:00`),
        dateLabel: row.Date ?? "",
        open: Number(row.Open ?? 0),
        high: Number(row.High ?? 0),
        low: Number(row.Low ?? 0),
        close: Number(row.Close ?? 0),
        volume: Number(row.Volume ?? 0),
      }))
      .sort((left, right) => left.date.getTime() - right.date.getTime());

    return [ticker, rows satisfies StockPriceRow[]] as const;
  }),
);

const tsnePoints = d3
  .csvParse(tsneRaw)
  .map((row) => {
    const ticker = row.ticker ?? "";

    return {
      ticker,
      x: Number(row.tsne_dim_1 ?? 0),
      y: Number(row.tsne_dim_2 ?? 0),
      sector: inferSector(ticker),
    } satisfies TSNEPoint;
  })
  .sort((left, right) => left.ticker.localeCompare(right.ticker));

const newsItemsByTicker = new Map<string, NewsItem[]>();

for (const { path, raw } of rawNewsEntries) {
  const ticker = extractNewsTickerFromPath(path);
  const item = parseNewsItem(path, raw);
  const existingItems = newsItemsByTicker.get(ticker) ?? [];
  existingItems.push(item);
  newsItemsByTicker.set(ticker, existingItems);
}

for (const items of newsItemsByTicker.values()) {
  items.sort((left, right) => right.date.getTime() - left.date.getTime());
}

export const STOCK_TICKERS = stockTickers;

export function getStockSeries(ticker: string): StockPriceRow[] {
  return stockSeriesByTicker.get(ticker) ?? [];
}

export function getTSNEPoints(): TSNEPoint[] {
  return tsnePoints;
}

export function getNewsItems(ticker: string): NewsItem[] {
  return newsItemsByTicker.get(ticker) ?? [];
}

export function inferSector(ticker: string): string {
  return sectorByTicker[ticker] ?? "Other";
}

function parseNewsItem(path: string, raw: string): NewsItem {
  const lines = raw.split(/\r?\n/);
  const ticker = extractNewsTickerFromPath(path);
  const title = lines[0]?.replace(/^Title:\s*/, "").trim() ?? extractTickerFromPath(path);
  const dateText = lines[1]?.replace(/^Date:\s*/, "").trim() ?? "";
  const url = lines[2]?.replace(/^URL:\s*/, "").trim() ?? "";

  const contentStartIndex = lines.findIndex((line, index) => index >= 3 && line.trim() === "");
  const content = lines
    .slice(contentStartIndex >= 0 ? contentStartIndex + 1 : 3)
    .join("\n")
    .trim();
  const date = new Date(dateText.replace(" ", "T"));

  return {
    id: path,
    ticker,
    title,
    date,
    dateLabel: Number.isNaN(date.getTime()) ? dateText : dateTimeFormatter.format(date),
    url,
    content,
  };
}

function extractTickerFromPath(path: string): string {
  const filename = path.split("/").pop() ?? "";
  return filename.replace(".csv", "");
}

function extractNewsTickerFromPath(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 2] ?? "";
}

export function formatShortDate(date: Date): string {
  return shortDateFormatter.format(date);
}
