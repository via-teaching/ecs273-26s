# ECS 273 Homework 4 — Full-Stack Stock Visual Analytics Dashboard

## Overview

This project extends the Homework 3 React + D3 stock visualization dashboard into a full-stack web application.

The application uses MongoDB for storing stock data, FastAPI for backend API endpoints, React + TypeScript for the frontend, and D3.js for interactive visualizations.

The dashboard includes a stock price line chart, t-SNE scatter plot, stock news list, and linked interactions between all views.

---

## Project Structure

```txt
Homework4/
└── akandya/
    ├── client/
    └── server/
        ├── data/
        │   ├── stockdata/
        │   ├── stocknews/
        │   └── tsne.csv
        ├── data_scheme.py
        ├── import_data.py
        ├── main.py
        └── requirements.txt
```

---

## How to Install Dependencies for the Client

Navigate to the client folder:

```bash
cd Homework4/akandya/client
```

Install dependencies:

```bash
npm install
```

---

## How to Install Dependencies for the Server

Navigate to the server folder:

```bash
cd Homework4/akandya/server
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment.

For Windows PowerShell:

```bash
.\venv\Scripts\activate
```

For Git Bash:

```bash
source venv/Scripts/activate
```

Install server dependencies:

```bash
pip install -r requirements.txt
```

---

## How to Start MongoDB

Install MongoDB Community Server if it is not already installed.

During installation, select:

```txt
Install MongoDB as a Service
```

Start MongoDB using Windows Services:

```txt
Windows Search → Services → MongoDB → Start
```

You can verify MongoDB is running by opening:

```txt
http://localhost:27017
```

Expected message:

```txt
It looks like you are trying to access MongoDB over HTTP...
```

MongoDB Compass can also connect using:

```txt
mongodb://localhost:27017
```

---

## How to Import the Data

Make sure MongoDB is running first.

Navigate to the server folder:

```bash
cd Homework4/akandya/server
```

Activate the virtual environment.

For Windows PowerShell:

```bash
.\venv\Scripts\activate
```

For Git Bash:

```bash
source venv/Scripts/activate
```

Run the import script:

```bash
python import_data.py
```

This imports stock price time-series data, stock news articles, and t-SNE projection data into the MongoDB database:

```txt
stock_ak
```

---

## How to Run the FastAPI Backend

Navigate to the server folder:

```bash
cd Homework4/akandya/server
```

Activate the virtual environment.

For Windows PowerShell:

```bash
.\venv\Scripts\activate
```

For Git Bash:

```bash
source venv/Scripts/activate
```

Run the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend runs at:

```txt
http://127.0.0.1:8000
```

Useful backend endpoints:

```txt
http://127.0.0.1:8000/
http://127.0.0.1:8000/stocks
http://127.0.0.1:8000/stock/AAPL
http://127.0.0.1:8000/news/AAPL
http://127.0.0.1:8000/tsne
```

---

## How to Run the React Frontend

Open a second terminal.

Navigate to the client folder:

```bash
cd Homework4/akandya/client
```

Install dependencies if they are not already installed:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

The frontend usually runs at:

```txt
http://localhost:5173
```

Keep the FastAPI backend running while using the frontend.

---

## Assumptions and Known Issues

- MongoDB must be running before importing data.
- The backend assumes MongoDB is available at `mongodb://localhost:27017`.
- The database name is `stock_ak`.
- The frontend assumes the FastAPI backend is running at `http://127.0.0.1:8000`.
- Data files must be located inside `server/data/`.
- Stock data should be placed in `server/data/stockdata/`.
- News JSON files should be placed in `server/data/stocknews/{ticker}/news.json`.
- The t-SNE file should be placed at `server/data/tsne.csv`.
- News article formatting depends on the scraped text from Homework 1.
- If the frontend does not load data, check that MongoDB and FastAPI are both running.
- If MongoDB connection fails, verify that the MongoDB service is started.
- If a Python module is missing, make sure the server virtual environment is activated before running `pip install -r requirements.txt`.
- If a frontend package is missing, run `npm install` inside the `client` folder.

---

## Author

Avni Kandya  
ECS 273: Visual Analytics  
University of California, Davis