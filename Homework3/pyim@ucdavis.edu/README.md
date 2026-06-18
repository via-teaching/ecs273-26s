# ECS 273 – Homework 3: Interactive Stock Dashboard

A multi-view interactive data visualization dashboard built with React, TypeScript, D3.js, and Vite. The app lets users explore historical stock prices, dimensionality-reduced embeddings (t-SNE), and related news for 20 S&P 500 companies.

---

## Overview

The dashboard presents three coordinated views:

| View | Description |
|------|-------------|
| **Stock Price Line Chart** | Multi-series line chart (Open, Close, High, Low) with horizontal zoom and pan |
| **t-SNE Scatter Plot** | 2-D projection of stock embeddings colored by market sector; supports zoom and click-to-select |
| **Latest News** | Scrollable table of recent news headlines and summaries for the selected ticker |

All three views are linked — selecting a stock from the dropdown or clicking a point on the scatter plot updates the other views in real time.

---

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 18.x |
| npm | 9.x |

No other global dependencies are required.

---

## Setup

```bash
# 1. Clone the repository (or navigate to the homework directory)
cd Homework3/pyim@ucdavis.edu

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
pyim@ucdavis.edu/
├── data/
│   ├── stockdata/          # Historical OHLCV CSVs for 20 tickers (AAPL, MSFT, …)
│   └── t-SNE/
│       ├── tsne_raw.csv    # t-SNE coordinates from raw price features
│       └── tsne_latent.csv # t-SNE coordinates from latent/encoded features
├── public/
│   └── vite.svg
├── src/
│   ├── component/
│   │   ├── LineChart.tsx   # Zoomable multi-series line chart
│   │   ├── TSNEScatter.tsx # Interactive t-SNE scatter plot
│   │   ├── NewsList.tsx    # Expandable news table
│   │   ├── options.tsx     # Dropdown option renderer
│   ├── data/               # Data loaders (CSV parsers)
│   ├── types.ts            # Shared TypeScript interfaces
│   ├── App.tsx             # Root layout and shared state
│   ├── main.tsx            # React entry point
│   └── index.css           # Global styles (Tailwind)
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Note

AI usage is used for debugging, and recommendations. All final code and documentation are manually reviewed and edited by the student.
