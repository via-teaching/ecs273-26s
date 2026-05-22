# ECS 273 — Homework 3

**Prasannadatta Kawadkar** · ppkawadkar@ucdavis.edu · UCD ID: 924167184

## Project

Submitted app: **`ppkawadkar/react-js-template`** — React + Vite dashboard (stock OHLC line chart, t-SNE scatter, local news from `public/data/stocknews`). Course templates (`react-js-example`, etc.) are unchanged reference copies.

## Run the app

```bash
cd ppkawadkar/react-js-template
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Restart the dev server after changing `vite.config.js`.

Other commands:

```bash
npm run build    # production bundle → dist/
npm run preview  # serve dist locally
npm run lint     # ESLint
```

## Data

Static assets live under **`public/data/`** (`stockdata/`, `stocknews/`, `tsne.csv`). The app does not call live Yahoo APIs; news and prices are local files listed in `public/data/stocknews/news_manifest.json` (fallback: `manifest.json`).
