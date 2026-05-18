# Homework 4 Full Stack Stock Dashboard

This project extends the Homework 3 React/D3 stock dashboard into a full-stack application. The backend stores stock prices, stock news, and t-SNE coordinates in MongoDB, then serves them through FastAPI endpoints used by the React frontend.

## Client Setup

```bash
cd Homework4/fznfaisal/client
npm install
```

## Server Setup

```bash
cd Homework4/fznfaisal/server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Start MongoDB

Make sure MongoDB is installed locally, then start the local server before importing data or running the API.

```bash
brew services start mongodb-community
```

If you do not use Homebrew services, start `mongod` with your normal local MongoDB command. The app expects MongoDB at `mongodb://localhost:27017`.

## Import Data

The database name is `stock_faze`. The import script reads from `Homework4/fznfaisal/server/data`.

```bash
cd Homework4/fznfaisal/server
source .venv/bin/activate
python import_data.py
```

This creates these MongoDB collections:

- `stock_list`: one document containing the available ticker symbols.
- `stock_prices`: one document per ticker with an array of price records.
- `stock_news`: one shared collection for all news articles, filtered by ticker.
- `tsne_points`: one document per ticker with t-SNE coordinates and sector.

## Run FastAPI Backend

```bash
cd Homework4/fznfaisal/server
source .venv/bin/activate
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`.

Main endpoints:

- `GET /api/tickers`
- `GET /api/stocks/{ticker}`
- `GET /api/news/{ticker}`
- `GET /api/tsne`

## Run React Frontend

In a second terminal:

```bash
cd Homework4/fznfaisal/client
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

By default, the client calls `http://localhost:8000`. To use a different backend URL, create a client environment file with:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Assumptions and Known Issues

- MongoDB must be running before `python import_data.py` or `uvicorn main:app --reload`.
- Run the import script after changing files in `server/data`.
- The frontend preserves the Homework 3 visualizations but fetches ticker lists, stock series, news, and t-SNE points from FastAPI.
- Invalid ticker requests return a `404` response from the backend and show an error message in the frontend.
