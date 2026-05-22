# ECS273 Homework 4 — Huanglun Adam. Zhu

A full-stack stock analysis web application built with FastAPI, MongoDB, and React.

---

> **!IMPORTANT! Two terminals required**
>
> You must run the backend and frontend **simultaneously** in **two separate terminals**.
> Always start the backend first, then start the frontend.
>
> **Terminal 1 — Backend (start this first):**
> ```bash
> cd server
> python -m uvicorn main:app --reload
> ```
>
> **Terminal 2 — Frontend (start after backend is running):**
> ```bash
> cd client-jsx
> npm run dev
> ```
>
> Then open `http://localhost:5173` in your browser.
> The frontend will not load data if the backend is not running.

---

## Server

### Dependencies

For the sever, install Python dependencies:

```bash
cd server
pip install -r requirements.txt
```

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework for building the REST API endpoints |
| `uvicorn` | ASGI server used to run the FastAPI application |
| `motor` | Asynchronous MongoDB driver for Python (built on top of PyMongo) |
| `pydantic` | Data validation and response schema definitions for API models |
| `pandas` | Reading and parsing CSV data files during the one-time data import |

### Setup

#### 1. Start MongoDB

MongoDB must be running as a Windows service before starting the server.

Check if it is already running:

```powershell
Get-Service -Name MongoDB
```

If the status shows `Running`, MongoDB is ready. If it shows `Stopped`, start it:

```powershell
Start-Service -Name MongoDB
```

#### 2. Import data into MongoDB (run once)

This step reads all CSV and text files from the `server/data/` folder and loads them into the `stock_hz` MongoDB database. You only need to run this once (or if you want to reset the data).

```bash
cd server
python import_data.py
```

Expected output:
```
Tickers imported.
Stock price imported: XOM
Stock price imported: CVX
... (one line per ticker)
News imported: XOM
News imported: CVX
... (one line per ticker)
t-SNE imported: perplexity 3
t-SNE imported: perplexity 4
... (one line per perplexity value)
All data imported successfully.
```

After this, MongoDB should contain 4 collections in the `stock_hz` database:
- `stock_list` — 1 document (list of 20 tickers)
- `stock_price` — 20 documents (one per stock)
- `stock_news` — 292 documents (all news articles)
- `tsne` — 340 documents (20 stocks × 17 perplexity values (3-19))

#### 3. Start the API server

```bash
cd server
python -m uvicorn main:app --reload
```

The server runs at `http://localhost:8000`.
Interactive API docs are available at `http://localhost:8000/docs`.

---

### Server File Breakdown

#### `import_data.py` — One-time data import script

Connects to MongoDB at `mongodb://localhost:27017`, targets database `stock_hz`, and loads all data from the `server/data/` directory. Run with `python import_data.py`.

| Function | What it does |
|----------|-------------|
| `import_tickers_to_mongodb()` | Clears the `stock_list` collection, then inserts one document containing the list of 20 ticker symbols (XOM, CVX, HAL, MMM, CAT, DAL, MCD, NKE, KO, JNJ, PFE, UNH, JPM, GS, BAC, AAPL, MSFT, NVDA, GOOGL, META) |
| `import_stock_prices()` | Clears the `stock_price` collection, then reads each `data/stockdata/<TICKER>.csv` file and inserts one document per stock containing the ticker name and an array of daily OHLC records (date, Open, High, Low, Close) |
| `import_stock_news()` | Clears the `stock_news` collection, then reads every `.txt` file inside `data/stocknews/<TICKER>/` for each ticker, parses the `Title:` and `Date:` fields from the file header, and inserts one document per article |
| `import_tsne()` | Clears the `tsne` collection, then reads every `data/tsne_result/tsne_p<N>.csv` file (perplexity values 3–19), extracts the ticker, sector category, Raw TSNE coordinates (x, y) and Latent TSNE coordinates (latent_x, latent_y), and inserts 20 documents per file (one per stock) tagged with their perplexity value |
| `main()` | Calls all four import functions in sequence using `asyncio.run()` |

#### `data_scheme.py` — Pydantic response models

Defines the schema classes used by FastAPI to validate and serialize MongoDB documents into JSON responses.

| Class | Purpose |
|-------|---------|
| `StockListModel` | Schema for `/stock_list` — contains a `tickers` field (list of strings) |
| `StockModelUnit` | Schema for a single OHLC row — `date`, `Open`, `High`, `Low`, `Close` |
| `StockModelV2` | Schema for `/stock/<name>` — contains `name` and a `stock_series` array of `StockModelUnit` |
| `StockNewsModel` | Schema for `/stocknews/` — contains `Stock`, `Title`, `Date`, and `content` |
| `tsneDataModel` | Schema for `/tsne/` — contains `Stock`, `Category`, `x`, `y`, `latent_x`, `latent_y`, `perplexity` |

#### `main.py` — FastAPI application and API endpoints

Connects to MongoDB, configures CORS (so the React frontend at port 5173 can call the API at port 8000), and exposes 4 endpoints.

| Endpoint | Method | Parameters | Returns | Description |
|----------|--------|-----------|---------|-------------|
| `/stock_list` | GET | — | `StockListModel` | Returns the list of all 20 ticker symbols |
| `/stock/{stock_name}` | GET | `stock_name` (path) | `StockModelV2` | Returns full OHLC price history for one stock; 404 if ticker not found |
| `/stocknews/` | GET | `stock_name` (query, default `XOM`) | `List[StockNewsModel]` | Returns all news articles for a stock, sorted by date ascending |
| `/tsne/` | GET | `perplexity` (query, default `5`, range `3–19`) | `List[tsneDataModel]` | Returns t-SNE scatter coordinates for all 20 stocks at the given perplexity; 404 if no data found |

---

## Client

### Dependencies

Install JavaScript dependencies:

```bash
cd client-jsx
npm install
```

| Package | Purpose |
|---------|---------|
| `react` | UI library for building declarative, component-based user interfaces |
| `react-dom` | Renders React component trees into the browser DOM |
| `d3` | Data visualization library used for the line chart (zoom, pan, crosshair tooltip) and t-SNE scatter plot (zoom, pan, sector colors) |
| `lodash` | Utility library — used specifically for `debounce` to throttle resize event handlers |
| `tailwindcss` | Utility-first CSS framework used for layout, spacing, and header styling |
| `vite` | Frontend build tool and development server with hot module replacement |

### Run

```bash
cd client-jsx
npm run dev
```

Client runs at `http://localhost:5173`.

---

### Frontend File Breakdown

| File | Purpose |
|------|---------|
| `src/App.jsx` | Root component — fetches the ticker list from `/stock_list`, renders the header with the stock selector dropdown, and lays out the three panels (line chart, t-SNE scatter, news list) |
| `src/component/options.jsx` | Renders `<option>` elements inside the stock selector dropdown; maps ticker symbols to human-readable company names |
| `src/component/LineChart.jsx` | D3 line chart showing Open, High, Low, and Close prices over time for the selected stock; supports zoom, pan, and a crosshair tooltip; fetches from `/stock/<ticker>` |
| `src/component/TSNEScatter.jsx` | D3 scatter plot of t-SNE embeddings for all 20 stocks; color-coded by sector; supports zoom, pan, double-click to reset; dropdown to select perplexity (3–19); toggle buttons to switch between Raw and Latent score types; fetches from `/tsne/?perplexity=<N>` |
| `src/component/NewsList.jsx` | Scrollable list of news articles for the selected stock; fetches from `/stocknews/?stock_name=<ticker>`; articles displayed in chronological order |

---

## Assumptions and Known Issues

- **MongoDB must be running before starting the server.** If the server starts while MongoDB is off, all API calls will fail with connection errors.
- **`python import_data.py` must be run once** before the frontend will display any data. Skipping this step means all four collections are empty and the app will show nothing.
- **`uvicorn` must be invoked as `python -m uvicorn`** on Windows if the `uvicorn` command is not on the PATH after pip install.
- **Both terminals must stay open** while using the app. Closing the backend terminal will cause all API calls from the frontend to fail (ERR_CONNECTION_REFUSED).
- **Perplexity range is 3–19.** The t-SNE CSV files only cover these 17 values. Requesting any other perplexity value returns a 404.
- **Data is pre-computed.** The t-SNE coordinates are stored in CSV files and imported as-is; the server does not compute t-SNE on the fly.
