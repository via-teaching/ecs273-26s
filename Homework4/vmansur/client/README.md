# Homework 4 Client (React + TypeScript + Vite)

This is the frontend half of the full-stack dashboard. It expects the FastAPI
backend (in `../server`) to be running on `http://localhost:8000`.

## Install

```bash
cd client
npm install
```

## Run (dev)

```bash
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`).

## Configuration

The API base URL defaults to `http://localhost:8000`. To point at a different
host, set `VITE_API_BASE_URL` before running Vite:

```bash
VITE_API_BASE_URL=http://localhost:9000 npm run dev
```

## Data Flow

* `GET /stock_list`            -> dropdown options
* `GET /stock/{ticker}`        -> View 1 OHLC line chart
* `GET /tsne/`                 -> View 2 t-SNE scatter plot
* `GET /stocknews/?stock_name` -> View 3 news list

No CSV/text files are read directly by the frontend; everything goes through
the backend API.
