# Homework 4 — Full-Stack Stock Explorer (myyyu)

Extends Homework 3's React + D3 visualization into a full-stack app:
- MongoDB stores all stock data (prices, news, t-SNE)
- FastAPI exposes JSON endpoints
- React frontend fetches everything from the backend (no local CSV/JSON)

```
myyyu/
├── client/            # React + TypeScript + D3 (Vite)
│   ├── src/
│   │   ├── component/ # LineChart, TSNEScatter, NewsList, options
│   │   ├── data/      # loaders.ts (HTTP API), sampleData (offline fallback)
│   │   └── App.tsx
│   └── .env           # VITE_API_BASE=http://localhost:8000
└── server/            # FastAPI + Motor (async Mongo)
    ├── data/          # stockdata/, stocknews/, tsne.csv (HW1 + HW2 outputs)
    ├── data_scheme.py # Pydantic models + DB/collection names
    ├── import_data.py # CSV/.txt → MongoDB importer
    ├── main.py        # FastAPI app
    └── requirements.txt
```

---

## 1. Install client dependencies

Requires Node.js 18+.

```powershell
cd client
npm install
```

## 2. Install server dependencies

Requires Python 3.10+. Inside your conda env (or any venv):

```powershell
cd server
pip install -r requirements.txt
```

## 3. Start MongoDB

The backend connects to `mongodb://localhost:27017` and writes into a database
named `stock_myyyu`.

### Option A — Docker (recommended)

```powershell
docker run -d --name hw4-mongo -p 27017:27017 -v hw4-mongo-data:/data/db mongo:7
```

Subsequent runs (after a reboot or `docker stop`):

```powershell
docker start hw4-mongo
```

To open a Mongo shell inside the container:

```powershell
docker exec -it hw4-mongo mongosh stock_myyyu
```

### Option B — local mongod

Install MongoDB Community Server, then start `mongod` listening on the default
port `27017`. On Windows it can also run as a service.

## 4. Import the data

```powershell
cd server
python import_data.py
```

Expected output: ~10 020 price rows across 20 tickers, ~300 news articles,
and 20 t-SNE points. The script drops each collection before re-inserting,
so it is safe to re-run.

Verify (with the Mongo shell):

```javascript
use stock_myyyu
db.stock_prices.countDocuments({ticker: "AAPL"})  // > 0
db.stock_news.countDocuments({ticker: "NVDA"})    // > 0
db.stock_tsne.countDocuments({})                  // 20
```

## 5. Run the FastAPI backend

```powershell
cd server
uvicorn main:app --reload --port 8000
```

Quick check:

```powershell
curl http://localhost:8000/tickers              # 20-element JSON array
curl http://localhost:8000/stock/AAPL/prices    # OHLC time-series
curl http://localhost:8000/stock/NVDA/news      # news articles
curl http://localhost:8000/tsne                 # 20 t-SNE rows
curl http://localhost:8000/stock/ZZZZ/prices    # 404 + JSON detail
```

Endpoints:

| Method | Path                       | Returns                                     |
|--------|----------------------------|---------------------------------------------|
| GET    | `/tickers`                 | sorted ticker list                          |
| GET    | `/stock/{ticker}/prices`   | OHLC rows, ascending by date                |
| GET    | `/stock/{ticker}/news`     | news articles, newest first                 |
| GET    | `/tsne`                    | all 20 t-SNE points with sector             |

Invalid tickers return HTTP 404 with a JSON `detail` body.

## 6. Run the React frontend

In a separate shell, with the backend already running:

```powershell
cd client
npm run dev
```

Open http://localhost:5173. The dropdown is populated by `/tickers`; selecting
a stock updates the line chart, highlights the t-SNE point, and refreshes the
news list — all via API calls (verifiable in DevTools → Network).

To produce a production build:

```powershell
npm run build      # type-check + bundle into dist/
npm run preview    # serve the built bundle
```

`VITE_API_BASE` in `client/.env` controls the backend URL the frontend talks
to (default `http://localhost:8000`).

## 7. Assumptions and known issues

- **Mongo connection**: hard-coded to `mongodb://localhost:27017` in
  `server/main.py` and `server/import_data.py`. Edit those constants if your
  Mongo lives elsewhere.
- **Database name**: `stock_myyyu` (per the HW4 spec convention
  `stock_<abbr_of_your_name>`).
- **News storage**: all stocks share a single `stock_news` collection;
  per-stock filtering uses the `ticker` field (per spec — do *not* split into
  per-stock collections).
- **News data source**: imported from raw HW1 `.txt` articles
  (`Title:`/`Date:`/`URL:`/`Content:` header format). Lines that fail to parse
  are skipped with a stderr warning.
- **Date format**: dates are stored as ISO-ish strings (`"YYYY-MM-DD"` for
  prices, `"YYYY-MM-DD HH:MM UTC"` for news) for direct round-tripping; the
  client parses them with `new Date(...)`.
- **CORS**: backend allows any origin for dev convenience (`allow_origins=["*"]`).
  Tighten before any non-local deployment.
- **Offline fallback**: if the backend is unreachable, the client falls back to
  generated sample data (`src/data/sampleData.ts`) so the UI still renders.
  In production you'd remove this; it's left in to ease local debugging.
- **One-time import**: `import_data.py` is idempotent (drops + reinserts) but
  not incremental. Re-run after replacing files in `server/data/`.
