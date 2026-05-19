# Stock Market Dashboard — ECS 273 Homework 3

```
Author: Muyang Zheng (muyzheng@ucdavis.edu)
```

An interactive stock market visualization built with React, D3.js, and Tailwind CSS.

## Setup

```bash
cd muyzheng
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Data

All data lives in the `data/` folder (served as static assets by Vite):

```
data/
├── tsne.csv              # t-SNE projection (ticker, x, y, sector)
├── stockdata/            # HW1 Task 1 — 2 years of daily OHLCV data
│   ├── AAPL.csv
│   ├── NVDA.csv
│   └── …  (20 stocks total)
└── stocknews/            # HW1 Task 2 — recent news articles
    ├── AAPL.json
    ├── NVDA.json
    └── …  (19 stocks; MMM has no news data)
```

**Stock CSV format:** `Date, Open, High, Low, Close, Volume`

**News JSON format:** `[{ "title", "date", "content", "preview" }]` (sorted newest first)

## Stocks covered (20 total)

| Sector | Tickers |
|---|---|
| Energy | XOM, CVX, HAL |
| Industrial | MMM, CAT, DAL |
| Consumer | MCD, NKE, KO |
| Healthcare | JNJ, PFE, UNH |
| Finance | JPM, GS, BAC |
| Tech | AAPL, MSFT, NVDA, GOOGL, META |

## Features

### Dropdown (header)
Select any of the 20 stocks. All three views update instantly.

### View 1 — Stock Overview Line Chart (top-left)
- Draws **Open, High, Low, Close** as four separate lines.
- **Horizontal zoom** via mouse wheel / trackpad pinch (D3 zoom, X-axis only).
- **Horizontal scroll** — the SVG expands to fit the full 2-year time series; overflow container scrolls.
- Color-coded legend (top-right corner of the chart).
- Properly labeled axes: *Date* (X), *Price (USD)* (Y).

### View 2 — t-SNE Scatter Plot (bottom-left)
- One point per stock, **colored by sector**.
- **Selected stock** is shown larger with its ticker label.
- **Click any point** to select that stock (links all views).
- **Zoom** (mouse wheel) rescales both axes.
- Sector color legend on the right side.
- Labeled axes: *t-SNE Dimension 1 / 2*.

### View 3 — News List (right)
- Displays recent news for the selected stock.
- Each card shows **title** and **date**.
- **Click to expand** full article content (accordion).
- Scrollable; sorted newest-first.

### Linked interactions (bonus)
Selecting a stock in the dropdown simultaneously updates all three views.

## Tech stack

- **React 19** + **Vite 6**
- **D3.js v7** — all chart rendering
- **Tailwind CSS v4** — layout and utility styles
- **Lodash** — debounced resize observer
