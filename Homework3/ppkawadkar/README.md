# ECS 273 — Homework 3 (stock dashboard)

**Prasannadatta Kawadkar** · ppkawadkar@ucdavis.edu · UCD ID: 924167184

React + Vite app: OHLC line chart, t-SNE scatter, local news under `public/data/`.

## Run

From this folder (`Homework3/ppkawadkar`):

```bash
cd Homework3/ppkawadkar
npm install
npm run dev
```

```bash
npm run build   # output in dist/
npm run preview # serve dist
npm run lint
```

Restart `npm run dev` after editing `vite.config.js`. Vite prints the local URL (often `http://localhost:5173`).

## Data

`public/data/` — `stockdata/*.csv`, `stocknews/` (see `public/data/stocknews/news_manifest.json`), `tsne.csv`. No live external news scrape in the UI.
