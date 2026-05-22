# Homework 4 — React Client

React + Vite frontend for the ECS 273 stock dashboard. The app extends the Homework 3 visualization and loads all stock data from the FastAPI backend instead of local CSV or JSON files.

## Views

Selecting a ticker from the dropdown updates:

- **Line chart** — daily price series for the active stock
- **t-SNE scatter** — positions for all tickers (highlights the selection)
- **News panel** — recent headlines and article text for the active stock

The ticker list itself is fetched from the API on load.

## Layout

```text
client-jsx/
├── src/
│   ├── api.js              # fetch helpers for backend routes
│   ├── App.jsx
│   └── component/          # charts, news, stock selector
├── index.html
├── package.json
├── vite.config.js          # dev proxy to port 8000
└── README.md
```

## Prerequisites

- **Node.js 18+** and npm
- **FastAPI backend** running on port `8000` (see `../server/README.md`)

Without the backend, the stock dropdown and charts will fail to load.

## Install

From this directory:

```bash
cd Homework4/priramachandran/client-jsx
npm install
```

## Run

Start the Vite dev server:

```bash
npm run dev
```

Open the URL printed in the terminal (typically **http://localhost:5173**). If that port is busy, Vite picks another one—use whatever URL it shows.

## API usage

All requests go through `src/api.js`:

| Purpose        | Endpoint                          |
|----------------|-----------------------------------|
| Ticker list    | `GET /stock_list`                 |
| Price history  | `GET /stock/{ticker}`             |
| News           | `GET /stocknews/?stock_name={ticker}` |
| t-SNE (all)    | `GET /tsne/`                      |



## Troubleshooting

- **Empty dropdown or network errors** — Confirm MongoDB is running, data is imported (`python import_data.py` in `../server`), and uvicorn is listening on port `8000`.
- **Charts load but news fails** — Check the browser console; news uses a query parameter (`stock_name`), not a path segment.
- **Wrong port** — Use the exact URL Vite prints, not a bookmark from an earlier session.

## Assumptions

- Backend is available at **http://localhost:8000** during local development.
- Node **18+**; dependencies are installed with `npm install`.
