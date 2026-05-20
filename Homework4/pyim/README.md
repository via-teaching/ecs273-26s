# Homework 4 — Stock Visualization Dashboard

A full-stack application featuring a FastAPI backend, MongoDB database, and a React + TypeScript frontend for visualizing stock prices, news, and t-SNE embeddings.

## Project Structure

```
Homework4/
├── server/       # FastAPI backend
│   ├── data/
│   │   ├── stockdata/   # CSV files per ticker (e.g. AAPL.csv)
│   │   ├── stocknews/   # News .txt files per ticker
│   │   └── tsne.csv
│   ├── main.py
│   ├── data_scheme.py
│   ├── import_data.py
│   └── requirements.txt
└── pyim/         # React + TypeScript frontend
    ├── src/
    └── package.json
```

---

## Prerequisites

- **Python 3.12+**
- **Node.js 18+** and **npm**
- **MongoDB** (local instance)

---

## 1. Install Server Dependencies

Navigate to the server directory and create a virtual environment, then install packages.

**macOS / Linux:**

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Windows (Command Prompt):**

```cmd
cd server
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
```
---

## 2. Install Client Dependencies

```bash
cd pyim
npm install
```
---

## 3. Start MongoDB

MongoDB must be running before importing data or starting the server.

**macOS (Homebrew):**

```bash
brew services start mongodb-community
```

**Linux (systemd):**

```bash
sudo systemctl start mongod
# To enable on boot:
sudo systemctl enable mongod
```

**Windows:**

MongoDB runs as a Windows Service by default after installation. Start it from an elevated Command Prompt:

```cmd
net start MongoDB
```

Or use the **Services** panel: press `Win + R`, type `services.msc`, find **MongoDB**, and click **Start**.

To verify MongoDB is running (all platforms):

```bash
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

---

## 4. Import the Data

Run from inside the `server/` directory with the virtual environment activated. The script reads CSV and `.txt` files from `server/data/` and loads them into MongoDB.

```bash
cd server
python import_data.py
```

The script imports four collections into the `stock_py` database:

| Collection | Source |
|---|---|
| `stock_list` | Hardcoded ticker list |
| `stock_data` | `data/stockdata/<TICKER>.csv` |
| `stock_news_list` | `data/stocknews/<TICKER>/*.txt` |
| `tsne_data` | `data/tsne.csv` |

---

## 5. Run the FastAPI Backend

With the virtual environment active and MongoDB running:

```bash
cd server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

**Available endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stock_list` | List of all tracked tickers |
| GET | `/stock/{stock_name}` | OHLC price series for a ticker |
| GET | `/stocknews/?stock_name=XOM` | News articles for a ticker |
| GET | `/tsne/?stock_name=XOM` | t-SNE coordinates for a ticker |

---

## 6. Run the React Frontend

In a separate terminal:

```bash
cd pyim
npm run dev
```

The app will be available at `http://localhost:5173`.

The frontend expects the backend running at `http://localhost:8000` (configured in `src/config.ts`).

---

## 7. Assumptions and Known Issues

- **MongoDB must be on localhost:27017** (default port). The connection string is hardcoded in both `main.py` and `import_data.py`. Change `AsyncIOMotorClient("mongodb://localhost:27017")` if your setup differs.
- **Data files must exist before importing.** The scripts skip missing files with a warning but do not abort. Ensure `server/data/stockdata/` and `server/data/stocknews/` are populated before running `import_data.py`.
- **Import is not idempotent.** Running `import_data.py` more than once will create duplicate documents. Drop the `stock_py` database in `mongosh` before re-importing:

  ```js
  use stock_py
  db.dropDatabase()
  ```
- **Python 3.12** is required; the virtual environment was created with `/usr/bin/python3.12`. Earlier versions may work but are untested.
