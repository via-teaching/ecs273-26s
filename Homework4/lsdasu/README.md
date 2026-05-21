# Homework 4 — lsdasu

Full-stack stock visualization app: React (JSX) + D3 frontend, FastAPI backend, MongoDB database.

## Setup

### 1. Start MongoDB

```bash
brew services start mongodb-community
```

### 2. Install Python dependencies

```bash
cd ../server
pip install -r requirements.txt
```

### 3. Import data into MongoDB

```bash
cd ../server
python import_data.py
```

This imports stock prices, news articles, and t-SNE embeddings into the `stock_lsd` database.

### 4. Start the API server

```bash
cd ../server
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 5. Start the frontend

```bash
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## Views

- **View 1** — Stock Price Overview: line chart (Open/High/Low/Close) with scroll-to-zoom
- **View 2** — t-SNE Stock Embedding: scatter plot coloured by sector, click a dot to select that stock
- **View 3** — News: expandable articles for the selected stock, fetched from backend

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /stock_list` | List of all 20 ticker symbols |
| `GET /stock/{ticker}` | OHLC price series for a ticker |
| `GET /stocknews/?stock_name=AAPL` | News articles for a ticker |
| `GET /tsne/` | t-SNE coordinates for all stocks |
