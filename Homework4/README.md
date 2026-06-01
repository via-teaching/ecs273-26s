# Homework 4: Full-Stack Stock Visualization Dashboard

## Overview

This project extends the stock visualization dashboard developed in Homework 3 into a full-stack web application. The frontend is implemented using React and D3.js, while the backend uses FastAPI and MongoDB for data storage and retrieval.

## Client Installation

Navigate to the client directory:

```bash
cd client-jsx
```

Install the required dependencies:

```bash
npm install
```

## Server Installation

Navigate to the server directory:

```bash
cd server
```

Install the required Python dependencies:

```bash
python -m pip install -r requirements.txt
```

## Starting MongoDB

Ensure MongoDB Community Server is installed.

Start the MongoDB service:

### Windows

MongoDB should automatically run as a Windows service after installation.

Verify that MongoDB is running:

```powershell
Get-Service MongoDB
```

The service status should be:

```text
Running
```

Alternatively, MongoDB Compass can be used to verify the connection:

```text
mongodb://localhost:27017
```

## Importing Data

Place the required datasets in the server data directory:

```text
server/
└── data/
    ├── stockdata/
    ├── stocknews/
    └── tsne.csv
```

Run the data import script:

```bash
python import_data.py
```

This creates the following MongoDB collections:

* stock_list
* stock_prices
* stock_news
* tsne_data

## Running the FastAPI Backend

Navigate to the server directory:

```bash
cd server
```

Start the backend server:

```bash
python -m uvicorn main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

Example endpoints:

```text
http://localhost:8000/stock_list
http://localhost:8000/stock/AAPL
http://localhost:8000/stocknews/AAPL
http://localhost:8000/tsne
```

## Running the React Frontend

Navigate to the client directory:

```bash
cd client-jsx
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

## Important Notes

* MongoDB is running locally on port 27017.
* FastAPI is running on port 8000.
* React/Vite is running on port 5173.
* Stock CSV files, news files, and t-SNE data have been imported before running the application.
* The application is designed for local execution and does not include deployment configuration.
* If MongoDB is not running, API requests will fail.
* If the backend server is not running, the frontend will not populate visualizations.
* Initial loading may take a few seconds while data is retrieved from MongoDB.

```
```
