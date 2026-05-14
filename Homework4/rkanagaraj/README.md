# Homework 4 — Stock Dashboard (Full-Stack)

An interactive stock dashboard built with React + D3 (frontend) and FastAPI + MongoDB (backend). Extends Homework 3 by moving all data access through a REST API instead of local static files.

## Views

- **View 1 (Line Chart):** Open, High, Low, Close prices for the selected stock. Horizontal zoom and pan.
- **View 2 (t-SNE Scatter):** 2D t-SNE projection of all 20 stocks colored by sector. Click a dot to select a stock.
- **View 3 (News List):** Recent news articles for the selected stock. Click to expand full content.

All three views are linked — changing the stock via the dropdown or clicking a scatter dot updates all views.

## Setup

### 1. Start MongoDB

Make sure MongoDB is running locally on the default port (27017).

```
brew services start mongodb-community
```

### 2. Set up the server

**Navigate to the server folder:**

```
cd Homework4/rkanagaraj/server
```

**Create and activate a Python virtual environment:**

```
python3 -m venv venv
source venv/bin/activate
```

**Install dependencies:**

```
pip install -r requirements.txt
```

**Import data into MongoDB:**

```
python import_data.py
```

This creates the `stock_rk` database with four collections: `stock_list`, `stock_prices`, `stock_news`, and `tsne`.

**Start the FastAPI backend:**

```
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 3. Set up the client

**Navigate to the client folder:**

```
cd Homework4/rkanagaraj/client
```

**Install dependencies:**

```
npm install
```

**Start the React development server:**

```
npm run dev
```

**Open the app in your browser:**

```
http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stock_list` | Returns list of all 20 stock tickers |
| GET | `/stock/{ticker}` | Returns OHLC time-series for a stock |
| GET | `/stocknews/?stock_name={ticker}` | Returns news articles for a stock |
| GET | `/tsne/` | Returns t-SNE coordinates for all stocks |

## Data

All data is sourced from Homework 1 and 2 and stored in `server/data/`:

- `server/data/stockdata/<TICKER>.csv` — 2 years of daily OHLCV data (via yfinance)
- `server/data/tsne.csv` — t-SNE 2D coordinates (via sklearn)
- `server/data/stocknews/<TICKER>/news.json` — 20 news articles per stock

## Stocks

AAPL, BAC, CAT, CVX, DAL, GOOGL, GS, HAL, JNJ, JPM, KO, MCD, META, MMM, MSFT, NKE, NVDA, PFE, UNH, XOM

## AI Disclaimer

Used Claude to clean up code and test the changes.
