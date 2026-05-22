# Homework 4 — Server

FastAPI backend for the ECS 273 stock dashboard. Raw files under `data/` are imported into MongoDB; the React client in `../client-jsx` reads everything through HTTP.

## Layout

```text
server/
├── data/
│   ├── stockdata/     # one CSV per ticker
│   ├── stocknews/     # .txt articles per ticker
│   └── tsne.csv
├── data_scheme.py     # Pydantic models and collection names
├── import_data.py     # load data into MongoDB
├── main.py            # FastAPI app and routes
├── requirements.txt
└── README.md
```

## Prerequisites

- **Python 3.10+**
- **MongoDB** on the default host/port: `mongodb://localhost:27017`

**macOS (Homebrew):**

```bash
brew services start mongodb-community
```

**Verify MongoDB:**

```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

You should see `{ ok: 1 }`.

## Install

From this directory:

```bash
cd Homework4/priramachandran/server
python3 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Import data

With MongoDB running, load (or reload) collections from `data/`:

```bash
python import_data.py
```

Data is stored in database `**stock_priramachandran**` with collections:

- `stock_list`
- `stock_prices`
- `stock_news`
- `tsne`

The script **drops and repopulates** those four collections each run. Re-run it after changing files under `data/` or if the API returns “not found” errors.

## Run

```bash
uvicorn main:app --reload --port 8000
```

- API root: **[http://localhost:8000](http://localhost:8000)**

## Endpoints


| Method | Path                              | Description                                |
| ------ | --------------------------------- | ------------------------------------------ |
| GET    | `/stock_list`                     | All tickers                                |
| GET    | `/stock/{ticker}`                 | Price series for one ticker                |
| GET    | `/stocknews/?stock_name={ticker}` | News for one ticker (default query: `XOM`) |
| GET    | `/tsne/`                          | t-SNE points for every ticker              |
| GET    | `/tsne/{ticker}`                  | t-SNE point for one ticker                 |


Invalid tickers return **404** with a message pointing to `/stock_list`.

## Troubleshooting


| Symptom                       | Fix                                                              |
| ----------------------------- | ---------------------------------------------------------------- |
| `Stock list not found`        | Start MongoDB, then run `python import_data.py`                  |
| `No price data` / empty news  | Confirm CSV/TXT files exist under `data/` and re-import          |
| Frontend cannot reach API     | Run uvicorn on port **8000**; check `http://localhost:8000/stock_list` |
| Connection refused to MongoDB | Install/start MongoDB on port **27017**                          |


## Assumptions

- MongoDB listens on **localhost:27017** (hard-coded in `main.py` and `import_data.py`).
- API listens on port **8000** (matches the Vite dev proxy in `../client-jsx`).
- Source files live under `server/data/` as shipped with the assignment.

