# Homework 4 — Stock Visualization Dashboard

A full-stack stock visualization application with a FastAPI backend (MongoDB) and a React frontend (D3.js).

## Prerequisites

- **Node.js** (v18+) and npm
- **Python** (3.9+) and pip
- **MongoDB Community Edition** (installed via Homebrew on macOS)

## 1. Install MongoDB (macOS)

```bash
brew tap mongodb/brew
brew install mongodb-community
```

## 2. Start MongoDB

```bash
brew services start mongodb-community
```

To verify it is running:

```bash
mongosh
```

You should see a MongoDB shell prompt. Type `exit` to leave.

## 3. Install Server Dependencies

```bash
cd server
pip install -r requirements.txt
```

## 4. Import Data into MongoDB

Make sure MongoDB is running, then:

```bash
cd server
python import_data.py
```

This will create the `stock_xiaoyu` database with four collections:
- `stock_list` — list of all ticker symbols
- `stock_prices` — OHLC time-series data for each stock (Array of Records format)
- `stock_news` — all news articles in a single collection, filterable by `Stock` field
- `tsne_data` — t-SNE 2D projection coordinates and sector for each stock

To verify the import, run:

```bash
mongosh
> use stock_xiaoyu
> db.stock_prices.countDocuments()   // expected: 20
> db.stock_news.countDocuments()     // expected: several hundred
> db.tsne_data.countDocuments()      // expected: 20
```

## 5. Run the FastAPI Backend

```bash
cd server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive API documentation is at `http://localhost:8000/docs`.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stock_list` | Returns all available ticker symbols |
| GET | `/stock/{stock_name}` | Returns OHLC price time-series for a stock |
| GET | `/stocknews/{stock_name}` | Returns news articles for a stock, sorted by date |
| GET | `/tsne` | Returns t-SNE coordinates and sector for all stocks |
| GET | `/tsne/{stock_name}` | Returns t-SNE coordinate for a specific stock |

Invalid ticker symbols return a 404 error with a descriptive message.

## 6. Run the React Frontend

```bash
cd client-jsx
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

Make sure the backend is running on port 8000 before starting the frontend.

## Assumptions and Known Issues

- MongoDB is expected to run locally on the default port (27017).
- The backend must be running at `http://localhost:8000` for the frontend to fetch data.
- The frontend uses the JSX (JavaScript) template (`client-jsx`), not the TypeScript template.
- Stock price dates are stored as strings in the format `YYYY-MM-DD HH:MM:SS±HH:MM` and parsed on the frontend.
- News articles are stored in a single collection and filtered by the `Stock` field, as required by the assignment.
- The t-SNE data includes a `sector` field used for color-coding in the scatter plot.