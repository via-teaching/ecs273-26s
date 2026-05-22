# Homework 4 — Full-stack Stock Explorer

Full-stack version of the HW3 stock dashboard. The React frontend now fetches
all data from a FastAPI backend, which reads from MongoDB.

```
React (port 5173)  →  FastAPI (port 8000)  →  MongoDB (port 27017)
```

## Project layout

```
.
├── client/                React + TypeScript + D3 + Tailwind frontend
│   └── src/
│       ├── api.ts                  centralized backend client
│       ├── App.tsx
│       ├── component/              dropdown + 3 views
│       └── data/stocks.ts          sector display labels
├── server/                FastAPI backend
│   ├── main.py                     API endpoints
│   ├── import_data.py              CSV/txt -> MongoDB importer
│   ├── data_scheme.py              Pydantic schemas
│   ├── requirements.txt
│   └── data/                       raw HW1/HW2 data
│       ├── stockdata/              <TICKER>.csv (20 files)
│       ├── stocknews/              <TICKER>/*.txt
│       └── tsne.csv
└── README.md
```

## Prerequisites

- **Node.js 18+** (`node -v` to check)
- **Python 3.10+** (`python3 -V`)
- **MongoDB Community** running locally on the default port `27017`

## 1. Install dependencies

### Server

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Client

```bash
cd client
npm install
```

## 2. Start MongoDB

### macOS (Homebrew)

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Verify with `mongosh` — you should land at the `test>` prompt.

### Linux

Follow the official instructions at
<https://www.mongodb.com/docs/manual/administration/install-on-linux/> and
ensure `mongod` is running.

## 3. Import data into MongoDB

From `server/` (with the virtualenv active):

```bash
python import_data.py
```

This populates the **`stock_sm`** database with three collections:

| Collection      | Documents                            | Indexed on        |
| --------------- | ------------------------------------ | ----------------- |
| `stock_prices`  | one per (ticker, date) — OHLCV       | `Ticker, Date`    |
| `stock_news`    | one per article, `Stock` field used  | `Stock`           |
| `stock_tsne`    | one per ticker — t-SNE x/y + sector  | `Ticker`          |

Re-running the script is safe — each collection is dropped and re-imported.

To use a different MongoDB URI, set `MONGO_URI` before running:

```bash
MONGO_URI="mongodb://localhost:27017" python import_data.py
```

## 4. Run the backend

From `server/` (with the virtualenv active):

```bash
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/` — you should see a JSON description of the API.
Interactive docs are at `http://localhost:8000/docs`.

### Endpoints

| Method | Path                    | Returns                                            |
| ------ | ----------------------- | -------------------------------------------------- |
| GET    | `/api/stocks`           | `{ tickers, sectors, sector_order }`               |
| GET    | `/api/stock/{ticker}`   | `{ ticker, rows: [{Date,Open,High,Low,Close,Vol}] }` |
| GET    | `/api/news/{ticker}`    | `{ ticker, articles: [...] }`                      |
| GET    | `/api/tsne`             | `{ points: [{Ticker,x,y,Sector}], sector_order }`  |

Invalid tickers return HTTP `404` with a `{ "detail": "Unknown ticker '...'" }`
body. Tickers are case-insensitive (passed through `.upper()` internally).

## 5. Run the frontend

In a new terminal, from `client/`:

```bash
npm run dev
```

Open `http://localhost:5173`. The dropdown will populate from the backend, and
changing the selection updates all three views.

### Custom backend URL

By default the frontend talks to `http://localhost:8000`. To point at a
different host, create `client/.env` with:

```
VITE_API_BASE_URL=http://localhost:8000
```

(see `client/.env.example`).

## Features

- **Dropdown** — populated from `/api/stocks`, grouped by sector
- **Line chart** — OHLC time series with horizontal zoom slider and scroll
- **t-SNE scatter** — sector-colored points, selected stock highlighted with
  label, wheel/drag zoom, double-click to reset
- **News list** — title + date, click to expand full content
- **Linked views** — selecting a stock anywhere updates all three panels;
  most recent news article auto-expands

## Assumptions and known issues

- The frontend assumes the backend is reachable from the browser at the URL
  configured in `VITE_API_BASE_URL` (default `http://localhost:8000`). CORS
  is enabled on the backend for any origin.
- News article dates are stored as the original strings from the HW1 `.txt`
  files (e.g. `"2026-04-24 10:35"`) to preserve any timezone formatting.
- Dates in stock prices are stripped to `YYYY-MM-DD` before insertion (HW1's
  CSV columns include timezone offsets that vary by source).
- If `tsne.csv` is missing or empty, the t-SNE collection will be empty and
  the scatter plot will show "Loading…" indefinitely — re-run `import_data.py`
  after generating it.
