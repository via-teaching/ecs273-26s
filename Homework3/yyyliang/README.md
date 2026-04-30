# ECS 273 - Homework 3

Author: Yan Liang (yyyliang@ucdavis.edu)

## How to Run

```bash
cd Homework3/yyyliang
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.

## Features

- **Stock Selector**: Dropdown menu listing 20 stocks (sorted A–Z)
- **View 1 — OHLC Line Chart**: Open / High / Low / Close prices over the past 2 years, with horizontal zoom (mouse wheel) and pan (drag)
- **View 2 — t-SNE Scatter Plot**: 2D projection of LSTM-autoencoder latent embeddings, colored by sector. Click a point to select that stock; hover shows ticker. Supports zoom and pan.
- **View 3 — News List**: News articles for the selected stock, sorted by date. Click a headline to expand the full article.
- **Bonus — Linked Views**: Selecting a stock in any view updates all other views.

## Data

- `data/stockdata/` — 20 CSV files of historical OHLCV data (from HW1)
- `data/stocknews/` — News articles per stock (from HW1)
- `data/tsne.csv` — Pre-computed t-SNE coordinates (from HW2)

## Tech Stack

- React (Vite + JavaScript)
- D3.js for visualization
- Tailwind CSS for styling