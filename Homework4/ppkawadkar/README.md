# ECS 273 Homework 4 — Full-Stack Stock Visualization

**Prasannadatta Kawadkar** · ppkawadkar@ucdavis.edu

React + D3 dashboard (Homework 3) extended with **MongoDB** and **FastAPI**. The API serves data from database `stock_ppk`; the frontend loads everything from `http://localhost:8000`.

## Features

- Stock selector dropdown
- Stock price line chart
- t-SNE scatter plot
- Expandable news list

## Project structure

```
Homework4/ppkawadkar/
├── client/          # React + Vite
├── server/          # FastAPI + import script
│   └── data/
│       ├── stockdata/   # one CSV per ticker
│       ├── stocknews/   # TICKER/*.txt news files
│       └── tsne.csv
└── README.md
```

**MongoDB:** `stock_ppk` · collections: `stock_prices`, `stock_news`, `tsne_projection`

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local)

---

## 1. Install server dependencies

From `Homework4/ppkawadkar/server`:

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Windows: `venv\Scripts\activate`

## 2. Install client dependencies

From `Homework4/ppkawadkar/client`:

```bash
cd client
npm install
```

## 3. Start MongoDB

**Homebrew (macOS):**

```bash
brew services start mongodb-community@8.0
```

Check status:

```bash
brew services list | grep mongodb
```

**Manual start (alternative):**

```bash
mongod --dbpath ~/data/db
```

## 4. Import the data

MongoDB must be running. From `server/` with the virtual environment active:

```bash
cd server
source venv/bin/activate
python import_data.py
```

This loads `server/data/` into `stock_ppk`. Re-run after changing local data files.

## 5. Run the FastAPI backend

From `server/` with the virtual environment active:

```bash
cd server
source venv/bin/activate
uvicorn main:app --reload
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/docs  

**Useful endpoints:**

| Endpoint | Description |
|----------|-------------|
| `GET /api/stocks` | List of tickers |
| `GET /api/stocks/{ticker}/prices` | OHLC time series |
| `GET /api/tsne` | t-SNE points for all stocks |
| `GET /api/stocks/{ticker}/news` | News articles for a ticker |

## 6. Run the React frontend

In a **second terminal**, from `client/`:

```bash
cd client
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

**Start the backend before using the dashboard.**

## Quick start order

1. Start MongoDB  
2. Server: `pip install` → `python import_data.py` → `uvicorn main:app --reload`  
3. Client: `npm install` → `npm run dev`  
4. Open http://localhost:5173  

---

## 7. Assumptions and known issues

- MongoDB runs on `localhost:27017` with no authentication.
- The frontend expects the API at **http://localhost:8000** (hardcoded in `client/src/api.js`).
- The backend reads from **MongoDB only** at runtime, not CSV/TXT files under `server/data/`.
- Homework 3 chart layout and styling are preserved; data comes from FastAPI.
- News is imported from local `.txt` files into a **single** `stock_news` collection (filtered by `ticker`).
- Invalid tickers return **404** JSON from the API; the UI shows short error messages and does not crash.
- If the backend is down, charts and news show “Could not load data from backend.”
