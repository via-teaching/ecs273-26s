import * as d3 from "d3";

import { NewsItem, StockCandle, TSNEPoint } from "../types";
import { STOCK_SECTOR_MAP } from "./stocks";

const stockCsvModules = import.meta.glob("../../data/stockdata/*.csv", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const newsTextModules = import.meta.glob("../../data/stocknews/**/*.txt", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const tsneModules = import.meta.glob("../../data/tsne*.csv", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

interface DateRangeSummary {
  start: string;
  end: string;
  count: number;
}

export interface DatasetSummary {
  stockTickerCount: number;
  stockStart: string | null;
  stockEnd: string | null;
  stockRowsPerTicker: number | null;
  newsStart: string | null;
  newsEnd: string | null;
  newsItemCount: number;
}

function toNumber(value: string | undefined): number {
  if (value === undefined) {
    return Number.NaN;
  }
  return Number.parseFloat(value);
}

function extractTickerFromPath(path: string, folderName: "stockdata" | "stocknews"): string | null {
  const matcher = folderName === "stockdata"
    ? /stockdata\/([A-Z.]+)\.csv$/i
    : /stocknews\/([A-Z.]+)\//i;
  const match = path.match(matcher);
  return match?.[1]?.toUpperCase() ?? null;
}

const stockPathByTicker = Object.keys(stockCsvModules).reduce<Record<string, string>>((acc, path) => {
  const ticker = extractTickerFromPath(path, "stockdata");
  if (ticker) {
    acc[ticker] = path;
  }
  return acc;
}, {});

const stockCache = new Map<string, Promise<StockCandle[]>>();

export function getStockDataByTicker(ticker: string): Promise<StockCandle[]> {
  const normalizedTicker = ticker.toUpperCase();
  if (stockCache.has(normalizedTicker)) {
    return stockCache.get(normalizedTicker)!;
  }

  const stockPath = stockPathByTicker[normalizedTicker];
  if (!stockPath) {
    return Promise.resolve([]);
  }

  const loadPromise = stockCsvModules[stockPath]().then((rawCsv) => {
    const rows = d3.csvParse(rawCsv);
    return rows
      .map((row) => ({
        date: new Date(row.Date ?? ""),
        open: toNumber(row.Open),
        high: toNumber(row.High),
        low: toNumber(row.Low),
        close: toNumber(row.Close),
        volume: toNumber(row.Volume),
      }))
      .filter((row) => !Number.isNaN(row.date.getTime()) && Number.isFinite(row.open))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  stockCache.set(normalizedTicker, loadPromise);
  return loadPromise;
}

function parseNewsText(rawText: string, ticker: string): NewsItem {
  const lines = rawText.split(/\r?\n/);
  const titleIdx = lines.findIndex((line) => line.trim().toLowerCase() === "title");
  const dateIdx = lines.findIndex((line) => line.trim().toLowerCase() === "date");
  const urlIdx = lines.findIndex((line) => line.trim().toLowerCase() === "url");
  const contentIdx = lines.findIndex((line) => line.trim().toLowerCase() === "content");

  const title = titleIdx >= 0 && lines[titleIdx + 1] ? lines[titleIdx + 1].trim() : "Untitled";
  const date = dateIdx >= 0 && lines[dateIdx + 1] ? lines[dateIdx + 1].trim() : "Unknown date";
  const url = urlIdx >= 0 && lines[urlIdx + 1] ? lines[urlIdx + 1].trim() : undefined;
  const contentStart = contentIdx >= 0 ? contentIdx + 1 : 0;
  const content = lines.slice(contentStart).join("\n").trim();

  return {
    ticker,
    title,
    date,
    url,
    content,
  };
}

const newsTickerIndex = Object.keys(newsTextModules).reduce<Record<string, string[]>>((acc, path) => {
  const ticker = extractTickerFromPath(path, "stocknews");
  if (!ticker) {
    return acc;
  }
  if (!acc[ticker]) {
    acc[ticker] = [];
  }
  acc[ticker].push(path);
  return acc;
}, {});

function extractNewsDateFromPath(path: string): string | null {
  const match = path.match(/\/(\d{4}-\d{2}-\d{2})_/);
  return match?.[1] ?? null;
}

const newsCache = new Map<string, Promise<NewsItem[]>>();

export function getNewsDataByTicker(ticker: string): Promise<NewsItem[]> {
  const normalizedTicker = ticker.toUpperCase();
  if (newsCache.has(normalizedTicker)) {
    return newsCache.get(normalizedTicker)!;
  }

  const paths = newsTickerIndex[normalizedTicker] ?? [];
  const loadPromise = Promise.all(
    paths.map(async (path) => {
      const rawText = await newsTextModules[path]();
      return parseNewsText(rawText, normalizedTicker);
    }),
  ).then((items) => items.sort((a, b) => b.date.localeCompare(a.date)));

  newsCache.set(normalizedTicker, loadPromise);
  return loadPromise;
}

export function getNewsDateRangeByTicker(ticker: string): DateRangeSummary | null {
  const normalizedTicker = ticker.toUpperCase();
  const paths = newsTickerIndex[normalizedTicker] ?? [];
  const dates = paths
    .map(extractNewsDateFromPath)
    .filter((date): date is string => Boolean(date));

  if (dates.length === 0) {
    return null;
  }

  const sortedDates = [...dates].sort();
  return {
    start: sortedDates[0],
    end: sortedDates[sortedDates.length - 1],
    count: sortedDates.length,
  };
}

function resolveColumnName(
  row: d3.DSVRowString<string>,
  candidates: string[],
): string | undefined {
  const available = Object.keys(row);
  const lowered = available.map((col) => col.toLowerCase());
  for (const candidate of candidates) {
    const idx = lowered.indexOf(candidate.toLowerCase());
    if (idx >= 0) {
      return available[idx];
    }
  }
  return undefined;
}

let tsneCache: Promise<TSNEPoint[]> | null = null;
let datasetSummaryCache: Promise<DatasetSummary> | null = null;

export function getTsneData(): Promise<TSNEPoint[]> {
  if (tsneCache) {
    return tsneCache;
  }

  const tsneLoader = Object.values(tsneModules)[0];
  if (!tsneLoader) {
    return Promise.resolve([]);
  }

  tsneCache = tsneLoader().then((tsneRaw) => {
    const rows = d3.csvParse(tsneRaw);
    if (rows.length === 0) {
      return [];
    }

    const first = rows[0];
    const tickerCol = resolveColumnName(first, ["ticker", "stock", "symbol", "name"]);
    const xCol = resolveColumnName(first, ["x", "tsne_x", "dim1", "component1", "pc1"]);
    const yCol = resolveColumnName(first, ["y", "tsne_y", "dim2", "component2", "pc2"]);
    const sectorCol = resolveColumnName(first, ["sector", "category", "label", "industry"]);

    if (!tickerCol || !xCol || !yCol) {
      return [];
    }

    return rows
      .map((row) => {
        const ticker = (row[tickerCol] ?? "").trim().toUpperCase();
        const x = toNumber(row[xCol]);
        const y = toNumber(row[yCol]);
        const sectorValue = sectorCol ? (row[sectorCol] ?? "").trim() : "";
        const sector = sectorValue || STOCK_SECTOR_MAP[ticker] || "Unknown";
        return { ticker, x, y, sector };
      })
      .filter((point) => point.ticker && Number.isFinite(point.x) && Number.isFinite(point.y));
  });

  return tsneCache;
}

export function getDatasetSummary(): Promise<DatasetSummary> {
  if (datasetSummaryCache) {
    return datasetSummaryCache;
  }

  datasetSummaryCache = Promise.all(
    Object.values(stockPathByTicker).map(async (path) => {
      const rawCsv = await stockCsvModules[path]();
      const rows = d3.csvParse(rawCsv);
      const dates = rows.map((row) => row.Date ?? "").filter((date) => Boolean(date));
      return {
        rowCount: dates.length,
        start: dates.length > 0 ? dates[0] : null,
        end: dates.length > 0 ? dates[dates.length - 1] : null,
      };
    }),
  ).then((stockResults) => {
    const stockDates = stockResults.flatMap((result) => [result.start, result.end].filter(Boolean) as string[]);
    const newsDates = Object.keys(newsTextModules)
      .map(extractNewsDateFromPath)
      .filter((date): date is string => Boolean(date));

    const sortedStockDates = [...stockDates].sort();
    const sortedNewsDates = [...newsDates].sort();

    return {
      stockTickerCount: Object.keys(stockPathByTicker).length,
      stockStart: sortedStockDates[0] ?? null,
      stockEnd: sortedStockDates[sortedStockDates.length - 1] ?? null,
      stockRowsPerTicker: stockResults[0]?.rowCount ?? null,
      newsStart: sortedNewsDates[0] ?? null,
      newsEnd: sortedNewsDates[sortedNewsDates.length - 1] ?? null,
      newsItemCount: newsDates.length,
    };
  });

  return datasetSummaryCache;
}
