# Homework 4: Full-Stack Stock Visualization

## 1. Install Client Dependencies

From the `client-jsx` folder, install the React frontend dependencies:

```bash
cd Homework4/client-jsx
npm install
```

## 2. Install Server Dependencies

From the `server` folder, install the Python backend dependencies:

```bash
cd Homework4/server
python -m pip install fastapi uvicorn motor pymongo pandas pydantic
```

The backend uses `fastapi` for the API, `uvicorn` to run the API server, `motor` / `pymongo` to connect to MongoDB, `pandas` to read CSV files during data import, and `pydantic` for response models.

## 3. Start MongoDB

MongoDB should be running locally before importing data or starting the backend.

If MongoDB was installed through Homebrew, start it with:

```bash
brew services start mongodb-community@7.0
```

To verify MongoDB is running:

```bash
mongosh
```

Inside the MongoDB shell, run:

```js
show dbs
```

The application connects to MongoDB at:

```text
mongodb://localhost:27017
```

The database name used for this project is:

```text
stock_ws
```

## 4. Import the Data

Before running the backend, import the data into MongoDB.

Make sure the data is stored in the following structure:

```text
Homework4/server/data/
├── stockdata/
│   ├── AAPL.csv
│   ├── NVDA.csv
│   └── ...
├── stocknews/
│   ├── AAPL/
│   ├── NVDA/
│   └── ...
└── tsne.csv
```

Then run:

```bash
cd Homework4/server
python import_data.py
```

This imports the stock ticker list into `stock_list`, stock price time series into `stock_prices`, stock news articles into `stock_news`, and t-SNE projection data into `tsne`.

To verify the import, open MongoDB:

```bash
mongosh
```

Then run:

```js
use stock_ws
show collections
db.stock_list.findOne()
db.stock_prices.findOne()
db.stock_news.findOne()
db.tsne.findOne()
```

## 5. Run the FastAPI Backend

From the `server` folder, run:

```bash
cd Homework4/server
python -m uvicorn main:app --reload
```

The backend will run at:

```text
http://localhost:8000
```

The API documentation can be viewed at:

```text
http://localhost:8000/docs
```

The main endpoints are:

```text
GET /stock_list
GET /stock/{stock_name}
GET /stocknews/?stock_name={stock_name}
GET /tsne/?stock_name={stock_name}
```

Example URLs:

```text
http://localhost:8000/stock_list
http://localhost:8000/stock/AAPL
http://localhost:8000/stocknews/?stock_name=AAPL
http://localhost:8000/tsne/?stock_name=AAPL
```

## 6. Run the React Frontend

Open a second terminal and run:

```bash
cd Homework4/client-jsx
npm run dev
```

The frontend will usually run at:

```text
http://localhost:5173
```

The frontend fetches data from the FastAPI backend and updates the visualizations based on the selected stock.

## Assumptions and Known Issues

- MongoDB must be running locally before running `import_data.py` or starting the FastAPI backend.
- The backend assumes the MongoDB database is named `stock_ws`.
- The frontend assumes the backend is running at `http://localhost:8000`.
- Some collected news files contain low quality scraped text where some articles will begin with text such as `"Oops, something went wrong Tip: Try a valid symbol or a specific company name for relevant results..."` before the relevant stock related article content appears.
