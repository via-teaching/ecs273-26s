# ECS 273 Homework 4 — Make it Full-Stack

**Student:** dpbatchu  
**Project path:** `Homework4/dpbatchu/`

Full-stack stock visualisation app extending HW3.  
Data is imported into MongoDB, served via FastAPI, and fetched by a React/D3 frontend.

---

## Quick Start

```
# Terminal 1 — start MongoDB
brew services start mongodb-community@8.0

# Terminal 2 — backend
cd Homework4/dpbatchu/server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python import_data.py          # one-time, safe to repeat
uvicorn main:app --reload --port 8000

# Terminal 3 — frontend
cd Homework4/dpbatchu/client
npm install
npm run dev                    # opens http://localhost:5173
```

---

## 1 · Install client dependencies

```bash
cd Homework4/dpbatchu/client
npm install
```

Requires Node ≥ 18.

---

## 2 · Install server dependencies

```bash
cd Homework4/dpbatchu/server
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Libraries: `fastapi`, `pymongo`, `uvicorn[standard]`, `pydantic`.

---

## 3 · Start MongoDB

**macOS (Homebrew):**
```bash
brew services start mongodb-community@8.0
```

**Verify it is running:**
```bash
mongosh --eval "db.runCommand({ping:1})"
```

---

## 4 · Import data into MongoDB

With the virtual environment active and MongoDB running:

```bash
cd Homework4/dpbatchu/server
python import_data.py
```

Expected output:
```
Database : stock_dp
URI      : mongodb://localhost:27017

Importing stock prices...
  20 CSV files, N price records
Importing news articles...
  N news articles
Importing t-SNE data...
  20 t-SNE rows

Import summary
========================================
  Database          : stock_dp
  Collections       : stock_prices, stock_news, tsne_projection
  Stock CSV files   : 20
  Price records     : N
  News articles     : N
  t-SNE rows        : 20
```

The script is **idempotent** — safe to run multiple times (drops and re-creates each collection).

---

## 5 · Run FastAPI backend

```bash
cd Homework4/dpbatchu/server
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Override defaults via environment variables:
```bash
MONGODB_URI=mongodb://localhost:27017 DB_NAME=stock_dp uvicorn main:app --reload --port 8000
```

---

## 6 · Run React frontend

```bash
cd Homework4/dpbatchu/client
npm run dev
```

Opens at `http://localhost:5173` (falls back to 5174 if 5173 is busy).

To set a custom API URL:
```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

---

## 7 · API endpoint list

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Backend + MongoDB status |
| GET | `/api/stocks` | All tickers (sorted A–Z) |
| GET | `/api/stocks/{ticker}/prices` | OHLCV time-series for ticker |
| GET | `/api/stocks/{ticker}/news` | News articles for ticker |
| GET | `/api/tsne` | All 20 t-SNE rows |
| GET | `/api/stocks/{ticker}/tsne` | t-SNE row for one ticker |

Invalid tickers return `404 {"detail": "..."}`.

**Test:**
```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/stocks
curl http://localhost:8000/api/stocks/AAPL/prices
curl http://localhost:8000/api/stocks/AAPL/news
curl http://localhost:8000/api/tsne
curl http://localhost:8000/api/stocks/INVALID/prices   # → 404
```

---

## 8 · Assumptions and known issues

- **Data source:** 20-stock dataset from HW3 (tickers: AAPL, BAC, CAT, CVX, DAL, GOOG, GS, HAL, JNJ, JPM, KO, MCD, META, MMM, MSFT, NKE, NVDA, PFE, UNH, XOM).  
  Note: ticker is **GOOG** (not GOOGL) — matches the CSV and news data from HW3.
- **News format:** `stocknews/<ticker>/news.json` (JSON array of `{title, date, content, url?}`).
- **MongoDB:** assumes a local instance on port 27017 with no authentication.
- **CORS:** allows `localhost:5173` and `localhost:5174`. Other origins will be blocked.
- **x-axis zoom:** labels adapt automatically — zoomed out shows `Jul '24`, medium zoom `Jul 10`, high zoom `Jul 10, 2024`.

---

## 9 · Troubleshooting

### MongoDB not running
```
pymongo.errors.ServerSelectionTimeoutError
```
Start MongoDB: `brew services start mongodb-community@8.0`  
Check status: `brew services list`

### Port 8000 already in use
```bash
lsof -i :8000      # find the PID
kill <PID>
```
Or run on a different port: `uvicorn main:app --port 8001`  
Then set `VITE_API_BASE_URL=http://localhost:8001` for the frontend.

### Port 5173 already in use / Vite uses 5174
Vite auto-increments to 5174. The CORS middleware allows both ports.  
Check the URL in the terminal output; update `VITE_API_BASE_URL` if needed.

### CORS / API URL mismatch
If the frontend shows "Backend unreachable", check:
1. Backend is running on port 8000.
2. `VITE_API_BASE_URL` (if set) matches the backend port.
3. Browser console → Network tab → look for the failing request.

### import_data.py fails
```
pymongo.errors.ConnectionFailure
```
MongoDB must be running **before** running `import_data.py`.  
Start it first: `brew services start mongodb-community@8.0`

### TypeScript build errors
```bash
cd Homework4/dpbatchu/client
npm run build
```
Check the error messages. Common issue: `@types/react` version mismatch.  
Fix: `npm install` to pull exact versions from `package.json`.
