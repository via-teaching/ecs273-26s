# Homework 4 — Stock Market Dashboard (Full-Stack)

A full-stack stock visualization application built with **FastAPI** (backend), **MongoDB** (database), and **React + D3** (frontend).

---

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- MongoDB (running locally on port 27018)

---

## 1. Install Client Dependencies

```bash
cd client-jsx
npm install
```

---

## 2. Install Server Dependencies

```bash
cd server
pip install -r requirements.txt
```

---

## 3. Start MongoDB

Make sure your local MongoDB instance is running before importing data or starting the backend.

**macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**Ubuntu / Debian:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
net start MongoDB
```

---

## 4. Import Data into MongoDB

From the `server/` directory:

```bash
cd server
python import_data.py
```

This script creates (or resets) the `stock_muyzheng` database and populates four collections:

| Collection | Contents |
|---|---|
| `stock_list` | List of 20 ticker symbols |
| `stock_prices` | OHLC time-series per ticker |
| `stock_news` | All news articles with a `Stock` field for filtering |
| `tsne` | t-SNE projection coordinates with sector labels |

---

## 5. Run the FastAPI Backend

```bash
cd server
uvicorn main:app --reload --port 8002
```

The API will be available at `http://localhost:8002`.  
Interactive docs: `http://localhost:8002/docs`

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stock_list` | List of all ticker symbols |
| GET | `/stock/{ticker}` | OHLC price series for a ticker |
| GET | `/stocknews/{ticker}` | News articles for a ticker (sorted by date) |
| GET | `/tsne` | t-SNE coordinates for all stocks |

---

## 6. Run the React Frontend

```bash
cd client-jsx
npm run dev
```

Open `http://localhost:5173` in your browser.

The dashboard shows:
1. **Line Chart** — OHLC price history for the selected stock (zoomable)
2. **t-SNE Scatter Plot** — Stocks colored by sector; click a point to switch stock
3. **News List** — Latest news articles for the selected stock (click to expand)

---

## 7. Assumptions and Known Issues

- The backend must be running on port `8002` before starting the frontend; the stock list is fetched on page load.
- `MMM` has no news articles in the dataset; its news panel shows an empty state.
- CORS is set to allow all origins (`*`) for local development.
- The database is named `stock_muyzheng`.
