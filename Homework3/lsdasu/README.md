# Homework 3: D3 and Interactive Visualization
**ECS 273 - Visual Analytics | UC Davis | Spring 2026**
**Student:** Lalitha Dasu

## Overview

An interactive stock market dashboard built with React + D3.js. The dashboard visualizes 20 stocks across three linked views: a multi-line price chart, a t-SNE embedding scatter plot, and a news feed. All views update in sync when a stock is selected.

## Setup and Running

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Data

```
data/
├── demo.json              # Template demo file (not used)
├── stockdata/             # HW1 Task 1 - 2 years of daily OHLC price data (20 CSVs)
│   ├── AAPL.csv
│   └── ...
├── stocknews/             # HW1 Task 2 - raw news articles per stock (text files)
│   ├── AAPL/
│   └── ...
├── stocknews.json         # Aggregated news for all 20 stocks (title, date, url, content)
└── tsne.csv               # HW2 t-SNE 2D projection with sector labels
```

**Stocks covered (20):** AAPL, BAC, CAT, CVX, DAL, GOOGL, GS, HAL, JNJ, JPM, KO, MCD, META, MMM, MSFT, NKE, NVDA, PFE, UNH, XOM

**Sectors:** Technology, Financials, Industrials, Energy, Healthcare, Consumer Staples, Consumer Discretionary

## Features

### Dropdown Menu
- Selects from all 20 stocks; changing the selection updates all three views simultaneously.

### View 1 - Stock Price Line Chart (top left)
- Displays **Open, High, Low, Close** prices as four color-coded lines for the selected stock.
- Color-coded legend, labeled axes (Date / Price USD), and chart title.
- **Horizontal zoom** via mouse wheel / trackpad pinch.
- **Horizontal pan/scroll** via click-and-drag after zooming in.

### View 2 - t-SNE Scatter Plot (bottom left)
- Shows all 20 stocks projected into 2D space from HW2 latent representations.
- Points **colored by sector** with a sector legend.
- **Selected stock highlighted** with a larger dot, black border, and ticker label.
- Labeled axes (t-SNE Dimension 1 / 2).
- **Zoom** (pinch/wheel) and pan supported.
- Clicking any dot selects that stock and updates all other views.

### View 3 - News Feed (right)
- Lists news articles for the selected stock (title + date).
- **Click to expand** an article and read the full content; click again to collapse.
- Scrollable list; resets expanded state when a different stock is selected.

### Bonus - Cross-View Linking
All three views are linked through a shared `selectedStock` state in `App.jsx`:
- Changing the dropdown updates the line chart, highlights the correct dot in the scatter plot, and loads news for that stock.
- Clicking a dot in the scatter plot updates the dropdown, line chart, and news feed to match.

## Project Structure

```
src/
├── App.jsx                   # Layout and shared selectedStock state
├── main.jsx
├── index.css
└── component/
    ├── options.jsx            # Dropdown stock list
    ├── LineChart.jsx          # View 1 - multi-line price chart with zoom/pan
    ├── TSNEScatter.jsx        # View 2 - t-SNE scatter with zoom and cross-view linking
    └── NewsList.jsx           # View 3 - expandable news list
```

## Dependencies

- [React](https://react.dev/) - UI framework
- [D3.js](https://d3js.org/) - data visualization
- [Vite](https://vitejs.dev/) - build tool
- [Tailwind CSS](https://tailwindcss.com/) - layout and styling
- [Lodash](https://lodash.com/) - debounce for resize observer
