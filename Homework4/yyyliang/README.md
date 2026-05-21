## Requirements

- **MongoDB** Community Edition 7+ running locally on `mongodb://localhost:27017`
- **Python** 3.10+
- **Node.js** 18+

The Python backend uses: `fastapi`, `motor`, `uvicorn`, `pydantic`, `pandas`
(see `server/requirements.txt`).
The frontend uses React, Vite, D3.js and Tailwind CSS.

## Setup & run

### 1. Start MongoDB

Make sure the MongoDB service is running on the default port 27017.

- **Windows**: MongoDB Community is installed as a Windows service named
  `MongoDB` and starts automatically at boot. You can verify with
  `sc query MongoDB` (look for `STATE : 4  RUNNING`).
- **macOS** (Homebrew): `brew services start mongodb-community`
- **Linux** (systemd): `sudo systemctl start mongod`

### 2. Backend

From the repo root:

```bash
cd yyyliang/server
pip install -r requirements.txt

# One-time: import all CSVs / news / t-SNE coordinates into MongoDB.
# The script is idempotent — it clears each collection before re-inserting,
# so you can safely run it again whenever data changes.
python import_data.py

# Start the API server on http://127.0.0.1:8000
uvicorn main:app --reload
```

You can verify the backend by visiting `http://127.0.0.1:8000/docs` to see
the auto-generated Swagger UI.

### 3. Frontend

In a separate terminal:

```bash
cd yyyliang/client
npm install
npm run dev
```

Then open `http://localhost:5173/` in your browser.

## Database

- **Database name**: `stock_yl`
- **Collections**:
  - `stock_list` — single document holding an array of 20 tickers
  - `stock_prices` — one document per stock, OHLC time series stored as
    an array of `{date, Open, High, Low, Close}` records (StockModelV2 layout)
  - `stock_news` — all news in a single collection; filter by the `Stock` field
  - `tsne` — one document per stock with `Stock`, `x`, `y`, `sector`

## API endpoints

| Method | Path                       | Description                                      |
|--------|----------------------------|--------------------------------------------------|
| GET    | `/stock_list`              | List of all available tickers                    |
| GET    | `/stock/{stock_name}`      | OHLC time series for one stock (404 if unknown)  |
| GET    | `/stocknews/{stock_name}`  | All news items for one stock, sorted by date asc |
| GET    | `/tsne`                    | t-SNE coordinates for all 20 stocks              |

Invalid tickers either return HTTP 404 (single-stock endpoints) or an empty
list (news endpoint), and the frontend handles both gracefully.

## Frontend views

- **View 1 — Line chart**: OHLC price series for the selected stock,
  with horizontal zoom and pan.
- **View 2 — t-SNE scatter**: 2D projection of all 20 stocks colored by
  sector. The currently selected stock is highlighted, and clicking any
  point selects that stock.
- **View 3 — News list**: news headlines for the selected stock, sorted
  newest first; clicking a headline expands the full article text.

## Known issues

- MongoDB must be running locally before the backend is started, otherwise
  the API will return errors on the first request.
- `import_data.py` clears each collection on every run, so do not run it
  while users are actively querying the API.
