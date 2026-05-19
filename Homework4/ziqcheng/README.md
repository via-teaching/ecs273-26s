# Homework 4: Full-Stack Stock Visualization

This project extends the Homework 3 React + D3 stock visualization system into a full-stack application. The frontend is built with React + TypeScript, the backend is built with FastAPI, and the data is stored in MongoDB.

## Project Structure

```text
Homework4/
├── client/
│   ├── src/
│   ├── package.json
│   └── ...
├── server/
│   ├── data/
│   │   ├── stockdata/
│   │   ├── stocknews/
│   │   └── tsne.csv
│   ├── data_scheme.py
│   ├── import_data.py
│   ├── main.py
│   └── requirements.txt
└── README.md
```

## Data Structure

All stock-related data should be placed inside:

```text
server/data/
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

The stock price CSV files come from Homework 1 Task 1.  
The stock news files come from Homework 1 Task 2.  
The `tsne.csv` file comes from Homework 2.

## Install Client Dependencies

From the `Homework4` directory, run:

```bash
cd client
npm install
```

## Install Server Dependencies

From the `Homework4` directory, run:

```bash
cd server
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Then install the required Python packages:

```bash
pip install -r requirements.txt
```

If `requirements.txt` is missing or incomplete, install the main packages manually:

```bash
pip install fastapi uvicorn pymongo pandas
```

## Start MongoDB

Make sure MongoDB Community Server is installed.

Start MongoDB with:

```bash
mongod
```

If `mongod` is not recognized on Windows, run it with the full path instead. For example:

```bash
"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath C:\data\db
```

Keep this terminal open while running the project.

## Import the Data

After MongoDB is running, open a new terminal and run:

```bash
cd server
venv\Scripts\activate
python import_data.py
```

This script imports:

- stock price data into the `stock_prices` collection
- stock news data into the `stock_news` collection
- t-SNE projection data into the `tsne` collection

The MongoDB database name used in this project is:

```text
stock_zq
```

## Run the FastAPI Backend

After importing the data, run the backend:

```bash
cd server
venv\Scripts\activate
uvicorn main:app --reload
```

The backend runs at:

```text
http://127.0.0.1:8000
```

Useful API endpoints:

```text
GET /api/stocks
GET /api/stocks/{ticker}
GET /api/news/{ticker}
GET /api/tsne
GET /api/tsne/{ticker}
```

The FastAPI documentation page is available at:

```text
http://127.0.0.1:8000/docs
```

## Run the React Frontend

Open another terminal and run:

```bash
cd client
npm run dev
```

The frontend usually runs at:

```text
http://localhost:5173
```

## Running the Full Project

Use three terminals:

```text
Terminal 1: Start MongoDB
Terminal 2: Run FastAPI backend
Terminal 3: Run React frontend
```

Example:

```bash
# Terminal 1
mongod
```

```bash
# Terminal 2
cd server
venv\Scripts\activate
uvicorn main:app --reload
```

```bash
# Terminal 3
cd client
npm run dev
```

## Features

The frontend preserves the main Homework 3 visualizations:

1. Stock overview line chart
   - shows Open, High, Low, and Close values
   - includes legend and labeled axes
   - supports horizontal zooming

2. t-SNE scatter plot
   - shows one point per stock
   - colors points by sector
   - highlights the selected stock
   - includes legend, labeled axes, and zooming

3. News list
   - shows news title and date
   - allows clicking to expand full content

The selected stock from the dropdown updates all three views.

## Assumptions and Known Issues

- MongoDB is expected to run locally on port `27017`.
- The backend is expected to run at `http://127.0.0.1:8000`.
- The frontend fetches data from the FastAPI backend instead of directly reading local CSV or JSON files.
- The database name is `stock_zq`.
- The stock list contains 20 tickers.
- The t-SNE file may contain fewer rows than the full stock list, so only stocks included in `tsne.csv` can be highlighted in the t-SNE scatter plot.
- If the frontend shows `ERR_CONNECTION_REFUSED`, the FastAPI backend is probably not running.
- If MongoDB data does not update after changing raw data files, rerun `python import_data.py`.
