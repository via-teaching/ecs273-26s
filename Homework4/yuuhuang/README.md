# Homework 4 — Stock Visualization (Full Stack) - Yuhua Huang 

React + D3 frontend, FastAPI backend, MongoDB database.

---

## Client setup

```bash
cd client
npm install
npm run dev
```

Runs at `http://localhost:5173`

---

## Server setup

```bash
cd server
pip install -r requirements.txt
```

---

## Start MongoDB

```bash
brew services start mongodb-community
```

---

## Import data

```bash
cd server
python import_data.py
```

Creates database `stock_yuhua` with collections: `stock_list`, `stock_prices`, `stock_news`, `tsne_data`. Run once before starting the server.

---

## Run backend

```bash
cd server
uvicorn main:app --reload --port 8000
```

API at `http://localhost:8000`, docs at `http://localhost:8000/docs`

| Endpoint | Description |
|---|---|
| `GET /stock_list` | List of all 20 ticker symbols |
| `GET /stock/{ticker}` | OHLC price series — e.g. `/stock/AAPL` |
| `GET /stocknews/?stock_name=AAPL` | Up to 30 news articles for a ticker |
| `GET /tsne/` | t-SNE projection data for all 20 stocks |

---

## Notes

- MongoDB must be running before starting the backend
- Data must be imported before the frontend shows anything
- 20 tickers: XOM, CVX, HAL, MMM, CAT, DAL, MCD, NKE, KO, JNJ, PFE, UNH, JPM, GS, BAC, AAPL, MSFT, NVDA, GOOGL, META
- t-SNE plot supports zoom/pan, click a point to select that stock
