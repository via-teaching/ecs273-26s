# Homework 4 — Full-Stack Stock Dashboard

A full-stack stock dashboard built with **React + TypeScript** (frontend), **FastAPI** (backend), and **MongoDB** (database). The app displays an interactive stock price line chart, a t-SNE scatter plot colored by sector, and a per-stock news list — all driven by live API data.

---

## Setup Instructions

### Prerequisites

- [Conda](https://docs.conda.io/en/latest/) with an environment named `ecs273`
- [Node.js](https://nodejs.org/) (v18+) and npm
- [MongoDB](https://www.mongodb.com/docs/manual/installation/) running locally on port 27017

---

### Backend

**1. Activate the conda environment**

```bash
conda activate ecs273
```

**2. Navigate to the server folder**

```bash
cd Homework4/uchandar/server
```

**3. Install Python dependencies**

```bash
pip install -r requirements.txt
```

**4. Start MongoDB**

If using Homebrew on macOS:

```bash
brew services start mongodb/brew/mongodb-community@7.0
```

Or start the daemon directly:

```bash
mongod --dbpath /usr/local/var/mongodb
```

**5. Import data into the database**

This script is idempotent — safe to re-run at any time.

```bash
python import_data.py
```

Expected output:
```
Importing data into stock_uchandar...
stock_list: inserted 1 document (20 tickers)
stock_price: inserted 20 documents
stock_news: inserted <N> documents
tsne: inserted 20 documents
Import complete.
```

**6. Start the FastAPI server**

```bash
uvicorn main:app --reload --port 8000
```

Interactive API docs are available at: http://localhost:8000/docs

---

### Frontend

**1. Open a new terminal and navigate to the client folder**

```bash
cd Homework4/uchandar/client
```

**2. Install Node.js dependencies**

```bash
npm install
```

**3. Start the React development server**

```bash
npm run dev
```

**4. Open the app in your browser**

```
http://localhost:5173
```

---

## How to Use

- Use the dropdown in the header to select any of the 20 stocks.
- **View 1** shows the OHLC (Open/High/Low/Close) price history. Scroll to zoom in/out on the time axis.
- **View 2** shows the t-SNE scatter plot of all 20 stocks colored by sector. Click any dot to switch the selected stock.
- **View 3** shows recent news articles for the selected stock. Click any headline to expand the full article body.

---

## Assumptions & Known Issues

- MongoDB must be running locally on `mongodb://localhost:27017` before starting the backend.
- The FastAPI server must be running on port `8000` before opening the frontend.
- Data was sourced from Homework 3 (`Homework3/uchandar/dist/data/`): 20 stock CSVs, 20 news folders, and `tsne.csv`.
- Database name: `stock_uchandar`.
