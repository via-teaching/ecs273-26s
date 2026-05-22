# Homework 3 — Stock Dashboard

A React + Vite dashboard for exploring stock data across 20 tickers.

## Features

- **Stock selector** — dropdown in the header switches all views to the chosen ticker
- **Line chart** (`LineChart.jsx`) — plots Open, High, Low, Close over time from CSV data; supports horizontal scroll-to-zoom with dynamic y-axis rescaling
- **t-SNE scatter** (`TSNEScatter.jsx`) — shows 20 stocks clustered by sector; click a dot to select that stock; hover reveals ticker label; supports pan/zoom
- **News feed** (`NewsList.jsx`) — lists news articles for the selected stock (loaded from `.txt` files); click an article to expand its content

## Running

```bash
npm install
npm run dev
```
