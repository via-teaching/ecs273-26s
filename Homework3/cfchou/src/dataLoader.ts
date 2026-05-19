import * as d3 from 'd3';
import type { PricePoint, StockSeries } from './types';
import newsDataRaw from './newsData.json';

const stockUrlLoaders = import.meta.glob('/data/stockdata/*.csv', {
  query: '?url',
  import: 'default',
}) as Record<string, () => Promise<string>>;

const stockCache = new Map<string, StockSeries>();

function pathToSymbol(path: string): string {
  const m = path.match(/\/([^/]+)\.csv$/);
  return m ? m[1] : '';
}

function parseRow(row: d3.DSVRowString): PricePoint {
  const [y, m, d] = row.Date.slice(0, 10).split('-').map(Number);
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

  const entry = Object.entries(stockUrlLoaders).find(([p]) => pathToSymbol(p) === symbol);
  if (!entry) throw new Error(`No CSV found for symbol "${symbol}"`);
  const url = await entry[1]();
  const rows = await d3.csv(url, parseRow);
  const series: StockSeries = { symbol, data: rows };
  stockCache.set(symbol, series);
  return series;
}

export async function loadStocks(symbols: string[]): Promise<StockSeries[]> {
  return Promise.all(symbols.map(loadStock));
}

const tsneUrlLoaders = import.meta.glob('/data/tsne.csv', {
  query: '?url',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export interface TSNEPoint {
  symbol: string;
  x: number;
  y: number;
  sector: string;
}

let tsneCache: TSNEPoint[] | null = null;

export async function loadTSNE(): Promise<TSNEPoint[]> {
  if (tsneCache) return tsneCache;
  const entry = Object.entries(tsneUrlLoaders)[0];
  if (!entry) {
    return [];
  }
  const url = await entry[1]();
  const rows = await d3.csv(url, (row) => ({
    symbol: (row.symbol ?? row.Symbol ?? row.ticker ?? row.Ticker ?? '').trim(),
    x: +(row.x ?? row.X ?? 0),
    y: +(row.y ?? row.Y ?? 0),
    sector: (row.sector ?? row.Sector ?? '').trim(),
  }));
  tsneCache = rows.filter((r) => r.symbol);
  return tsneCache;
}

const newsBySymbol = (() => {
  const m = new Map<string, { filename: string; text: string }[]>();
  for (const [symbol, items] of Object.entries(newsDataRaw as Record<string, { filename: string; text: string }[]>)) {
    m.set(symbol, items);
  }
  return m;
})();

export interface NewsItem {
  title: string;
  date: string;
  url: string;
  content: string;
}

function parseNewsFile(raw: string, fallbackTitle: string): NewsItem {
  const lines = raw.split(/\r?\n/);
  let title = fallbackTitle, date = '', url = '';
  const contentLines: string[] = [];
  let inContent = false;
  for (const line of lines) {
    if (inContent) {
      contentLines.push(line);
      continue;
    }
    if (line.startsWith('Title:')) title = line.slice(6).trim();
    else if (line.startsWith('Date:')) date = line.slice(5).trim();
    else if (line.startsWith('URL:')) url = line.slice(4).trim();
    else if (line.startsWith('Content:')) inContent = true;
  }
  const html = contentLines.join('\n');
  const content = html
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
  return { title, date, url, content };
}

const newsCache = new Map<string, NewsItem[]>();

export async function loadNews(symbol: string): Promise<NewsItem[]> {
  const cached = newsCache.get(symbol);
  if (cached) return cached;
  const entries = newsBySymbol.get(symbol) ?? [];
  const items = entries.map(({ filename, text }) => {
    const fallbackTitle = filename.replace(/^\d{4}-\d{2}-\d{2} \d{2}-\d{2}_/, '').replace(/\.txt$/, '');
    return parseNewsFile(text, fallbackTitle);
  });
  items.sort((a, b) => b.date.localeCompare(a.date));
  newsCache.set(symbol, items);
  return items;
}
