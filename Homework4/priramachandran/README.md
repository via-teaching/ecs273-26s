# Homework 4 — Backend

Stock visualization app with a FastAPI/MongoDB backend and a React (Vite) frontend. All commands below are run from `Homework4/priramachandran/`.

---

## Install server dependencies

```bash
cd server
python3 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## Install client dependencies

```bash
cd client-jsx
npm install
```

---

## Start MongoDB

The server and import script connect to `**mongodb://localhost:27017**`.

**macOS (Homebrew):**

```bash
brew services start mongodb-community
```

**Linux (example):**

```bash
sudo systemctl start mongod
```

**Check that MongoDB is running:**

```bash
mongosh --eval "db.runCommand({ ping: 1 })"
```

Expected: `{ ok: 1 }`.

---

## Import the data

Run this from the `**server/**` directory with MongoDB running. It loads CSV/TXT files from `server/data/` into the database `**stock_priramachandran**` and replaces existing data in the HW4 collections.

```bash
cd server
source venv/bin/activate    # if using a virtual environment
python import_data.py
```

You should see document counts for `stock_list`, `stock_prices`, `stock_news`, and `tsne`. Run this again if you change files under `server/data/` or need a fresh database.

---

## Run the FastAPI backend

From `**server/**` (with the virtual environment activated if you use one):

```bash
uvicorn main:app --reload --port 8000
```

- API: [http://localhost:8000](http://localhost:8000)

---

## Run the React frontend

In a **separate terminal**, with the backend already running on port 8000:

```bash
cd client-jsx
npm run dev
```

Open the URL shown in the terminal (usually [http://localhost:5173](http://localhost:5173)). During development, Vite proxies API requests to `http://localhost:8000`, so you do not need extra environment variables for local use.

---

## Assumptions and known issues

- **MongoDB** must be installed locally and listening on the default host/port (`localhost:27017`). Connection strings are fixed in `server/import_data.py` and `server/main.py`.
- The **frontend** expects the API on port **8000**. If the backend is not running, the dropdown and charts will show errors.

