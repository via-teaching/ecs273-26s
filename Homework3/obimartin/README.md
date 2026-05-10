# Homework 3

A React + Vite stock dashboard built in `react-js/`.

## How to run

```bash
cd react-js
npm install
npm run dev
```

## Visualizations

All views update when a stock is selected from the dropdown in the header.

### Line Chart (`src/component/LineChart.jsx`)
Plots Open, High, Low, and Close prices over time for the selected stock. Supports scroll-to-zoom; the y-axis rescales dynamically to the visible date window. Data is loaded from CSV files in `data/stockdata/`.

### t-SNE Scatter (`src/component/TSNEScatter.jsx`)
Shows 20 stocks clustered by sector using t-SNE coordinates from `data/tsne.csv`. The selected stock is highlighted with a larger dot. Click any dot to switch the active stock. Supports pan and zoom.

### News Feed (`src/component/NewsList.jsx`)
Lists news articles for the selected stock loaded from `data/stocknews/<ticker>/`. Articles are sorted by date; click one to expand the full content.
