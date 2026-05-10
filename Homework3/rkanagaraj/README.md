# Homework 3 — Stock Dashboard

An interactive stock data dashboard built with React, D3.js, and Tailwind CSS. It displays three linked views for 20 S&P 500 stocks: a line chart of OHLC prices, a t-SNE scatter plot of stock pattern similarity, and a news feed with expandable articles.

## Views

- **View 1 (Line Chart):** Plots Open, High, Low, and Close prices over two years for the selected stock. Supports horizontal zoom and pan.
- **View 2 (t-SNE Scatter):** Shows a 2D t-SNE projection of all 20 stocks colored by sector. Click any dot to select that stock across all views.
- **View 3 (News List):** Lists recent news articles for the selected stock. Click an article to expand and read the full content.

All three views are linked — selecting a stock via the dropdown, the scatter plot, or navigating updates every view simultaneously.

## Setup

**1. Navigate to the project folder**

```
cd Homework3/rkanagaraj
```

**2. Install required Node.js packages**

```
npm install
```

**3. Start the development server**

```
npm run dev
```

**4. Open the app in your browser**

```
http://localhost:5173
```

## Data

All data files are pre-generated and served from the `data/` directory (mapped to the Vite public root):

- `data/stockdata/<TICKER>.csv` — 2 years of daily OHLCV data (via yfinance) for 20 stocks
- `data/tsne.csv` — t-SNE 2D coordinates computed from normalized price patterns (via sklearn)
- `data/stocknews/<TICKER>/news.json` — 20 recent news articles per stock (scraped via Selenium + feedparser)

## Stocks Included

AAPL, BAC, CAT, CVX, DAL, GOOGL, GS, HAL, JNJ, JPM, KO, MCD, META, MMM, MSFT, NKE, NVDA, PFE, UNH, XOM

## AI Disclaimer
Used Claude to clean up code and test the changes.
