# Homework 4
Note: Open three terminals before starting. All three must remain open while running the app — one for MongoDB, one for the API server, and one for the React frontend.

## 1. Install Client Dependencies

In **Terminal 1**, run:

```bash
cd client-jsx
npm install
```

## 2. Install Server Dependencies

In **Terminal 2**, run:

```bash
cd server
pip install -r requirements.txt
```

## 3. Start MongoDB

In **Terminal 3**, run:

```bash
mkdir C:\data\db
mongod --dbpath C:\data\db
```

## 4. Import Data

In **Terminal 2**, run:

```bash
python import_data.py
```

## 5. Run the FastAPI Backend

In **Terminal 2**, run:

```bash
uvicorn main:app --reload --port 8000
```

## 6. Run the React Frontend

In **Terminal 1**, run:

```bash
npm run dev
```

## 7. Test Database

To verify that data was imported correctly into MongoDB, run in **Terminal 2**:

```bash
python test_db.py
```

This script pulls one sample document from each collection (`stock_list`, `stock_prices`, `stock_news`, `tsne`) and prints it to the console so you can confirm the structure and content look correct. `pymongo` is included in `requirements.txt`.

## 8. Assumptions and Known Issues

- MongoDB must be running before starting the server or importing data.
- The database is named `stock_obimartin`.
- News articles with blank lines after the `Content:` label are handled correctly.
- Some article content may contain encoding artifacts from the original source files.