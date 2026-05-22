# Homework 4 — Stock Visualization (Full Stack)
**Yuhua Huang · ECS 273 · Spring 2026**

React + D3 frontend · FastAPI backend · MongoDB database.

---

## 1. Install client dependencies

```bash
cd Homework4/yuuhuang/client
npm install
```

---

## 2. Install server dependencies

```bash
cd Homework4/yuuhuang/server
pip install -r requirements.txt
```

---

## 3. Start MongoDB

```bash
brew services start mongodb-community
```

Or, if not using Homebrew:

```bash
mongod --dbpath /usr/local/var/mongodb
```

---

## 4. Import the data

```bash
cd Homework4/yuuhuang/server
python import_data.py
```

Creates database `stock_yuhua` with collections: `stock_list`, `stock_prices`, `stock_news`, `tsne_data`.  
Run this **once** before starting the server.

---

## 5. Run the FastAPI backend

```bash
cd Homework4/yuuhuang/server
uvicorn main:app --reload --port 8000
```

API at `http://localhost:8000` · Interactive docs at `http://localhost:8000/docs`

| Endpoint | Description |
|---|---|
| `GET /stock_list` | List of all 20 ticker symbols |
| `GET /stock/{ticker}` | OHLC price series — e.g. `/stock/AAPL` |
| `GET /stocknews/?stock_name=AAPL` | Up to 30 news articles for a ticker |
| `GET /tsne/` | t-SNE projection data for all 20 stocks |

---

## 6. Run the React frontend

```bash
cd Homework4/yuuhuang/client
npm run dev
```

Runs at `http://localhost:5173`. Vite proxies all `/stock*` and `/tsne` requests to the FastAPI backend automatically.

---

## 7. Assumptions and known issues

- MongoDB must be running **before** starting the FastAPI backend.
- Data must be imported (`import_data.py`) before the frontend shows anything.
- The 20 tickers covered: XOM, CVX, HAL, MMM, CAT, DAL, MCD, NKE, KO, JNJ, PFE, UNH, JPM, GS, BAC, AAPL, MSFT, NVDA, GOOGL, META.
- News articles are stored in `.txt` files under `server/data/stocknews/<TICKER>/`. If a ticker has no news files, the news panel shows "No articles."
- The t-SNE plot supports scroll-to-zoom and drag-to-pan; click any point to select that stock across all three views.
