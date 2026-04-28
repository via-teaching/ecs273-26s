import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const dataDir = join(rootDir, 'public', 'data');

const stocks = [
  ['AAPL', 'Apple', 'Technology', -28, 18],
  ['MSFT', 'Microsoft', 'Technology', -24, 23],
  ['NVDA', 'NVIDIA', 'Technology', -20, 15],
  ['AMZN', 'Amazon', 'Consumer Discretionary', 10, 14],
  ['GOOGL', 'Alphabet', 'Communication Services', -6, 7],
  ['META', 'Meta Platforms', 'Communication Services', -2, 12],
  ['TSLA', 'Tesla', 'Consumer Discretionary', 18, 18],
  ['JPM', 'JPMorgan Chase', 'Financials', 25, -12],
  ['V', 'Visa', 'Financials', 30, -8],
  ['UNH', 'UnitedHealth Group', 'Health Care', 6, -27],
  ['HD', 'Home Depot', 'Consumer Discretionary', 15, 4],
  ['PG', 'Procter & Gamble', 'Consumer Staples', -10, -22],
  ['MA', 'Mastercard', 'Financials', 34, -11],
  ['XOM', 'Exxon Mobil', 'Energy', -34, -9],
  ['CVX', 'Chevron', 'Energy', -30, -15],
  ['CAT', 'Caterpillar', 'Industrials', 3, -4],
  ['KO', 'Coca-Cola', 'Consumer Staples', -14, -29],
  ['PEP', 'PepsiCo', 'Consumer Staples', -8, -32],
  ['COST', 'Costco Wholesale', 'Consumer Staples', 2, -20],
  ['NFLX', 'Netflix', 'Communication Services', 6, 24],
];

mkdirSync(join(dataDir, 'stockdata'), { recursive: true });
mkdirSync(join(dataDir, 'stocknews'), { recursive: true });

const tsneRows = ['ticker,x,y,sector'];

for (const [ticker, name, sector, x, y] of stocks) {
  const seed = ticker.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  const base = 55 + (seed % 180);
  const trend = 0.45 + (seed % 9) / 18;
  const rows = ['Date,Open,High,Low,Close'];

  for (let index = 0; index < 24; index += 1) {
    const date = new Date(Date.UTC(2024, 4 + index, 1)).toISOString().slice(0, 10);
    const wave = Math.sin((index + (seed % 7)) * 0.72) * (4 + (seed % 8));
    const close = Math.max(8, base + index * trend + wave);
    const open = close + Math.cos(index * 0.5 + seed) * 2.4;
    const high = Math.max(open, close) + 2.5 + ((seed + index) % 5);
    const low = Math.min(open, close) - 2.5 - ((seed + index) % 4);
    rows.push([date, open, high, low, close].map(formatCsvValue).join(','));
  }

  writeFileSync(join(dataDir, 'stockdata', `${ticker}.csv`), `${rows.join('\n')}\n`, 'utf8');

  const newsDir = join(dataDir, 'stocknews', ticker);
  mkdirSync(newsDir, { recursive: true });
  writeFileSync(
    join(newsDir, 'news.json'),
    `${JSON.stringify(createNewsItems(ticker, name, sector), null, 2)}\n`,
    'utf8',
  );

  tsneRows.push(`${ticker},${x},${y},"${sector}"`);
}

writeFileSync(join(dataDir, 'tsne.csv'), `${tsneRows.join('\n')}\n`, 'utf8');

function createNewsItems(ticker, name, sector) {
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

function formatCsvValue(value) {
  return typeof value === 'number' ? value.toFixed(2) : value;
}
