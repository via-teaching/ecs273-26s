# Homework 3 — Stock Dashboard

Interactive stock dashboard built with React, TypeScript, Vite, D3, and Tailwind CSS.

## Setup

```bash
npm install
```

## Running the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Building for production

```bash
npm run build
```

## Previewing the production build

```bash
npm run preview
```

## Data

All static data is served from `public/data/`:

- `public/data/stockdata/<TICKER>.csv` — daily OHLCV data (~2 years) for each of the 20 tickers
- `public/data/stocknews/<TICKER>/` — news articles as `.txt` files per ticker
- `public/data/tsne.csv` — 2D t-SNE coordinates for the 20 stocks

News files are served dynamically via a Vite dev server middleware (`/api/news-files/<TICKER>` and `/api/news-body/<TICKER>/<filename>`), so adding new files to `stocknews/` shows up without restarting the server.

## Tickers

| Sector | Tickers |
|--------|---------|
| Technology | AAPL, MSFT, GOOGL, META, NVDA |
| Energy | XOM, CVX, HAL |
| Industrials | MMM, CAT, DAL |
| Consumer | MCD, NKE, KO |
| Healthcare | JNJ, PFE, UNH |
| Financial | JPM, GS, BAC |

## AI Assistance

I used AI for help with D3.js and Vite.js as both were quite new to me. This includes the D3 chart implementations (line chart, t-SNE scatter plot) and the Vite dev server configuration. In particular, the custom middleware in `vite.config.ts` that dynamically serves stock news files was something I got help with — instead of using a static index file, the middleware reads the `stocknews/` folder live on every request, which makes the website feel more responsive whenever a different stock is selected.
