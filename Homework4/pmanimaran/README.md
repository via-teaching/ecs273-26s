# Homework 4 — Full-Stack Stock Dashboard

**Student:** pmanimaran | ECS 273 Visual Analytics | UC Davis Spring 2026

## Setup Instructions

### 1. Start MongoDB
```bash
brew services start mongodb-community
# or just: mongod
```

### 2. Install server dependencies
```bash
cd server
pip install -r requirements.txt
```

### 3. Import data into MongoDB
```bash
cd server
python import_data.py
```
This populates the `stock_pmanimaran` database with 4 collections: `stock_list`, `stock_prices`, `stock_news`, `tsne_data`.

### 4. Start the FastAPI backend
```bash
cd server
uvicorn main:app --reload --port 8000
```
API runs at http://localhost:8000. Docs at http://localhost:8000/docs.

### 5. Install client dependencies and start the frontend
```bash
cd client
npm install
npm run dev
```
App runs at http://localhost:5173 (or next available port).

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /stock_list` | List of 20 stock tickers |
| `GET /stock/{stock_name}` | OHLC time-series for a stock |
| `GET /stocknews/?stock_name=AAPL` | News articles for a stock |
| `GET /tsne/?stock_name=AAPL` | t-SNE coordinates for one stock |
| `GET /tsne/all` | t-SNE coordinates for all stocks |

## Database

- **Name:** `stock_pmanimaran`
- **Collections:** `stock_list`, `stock_prices`, `stock_news`, `tsne_data`
- **Data source:** HW1 (stock prices + news), HW2 (t-SNE embeddings)
