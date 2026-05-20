# ECS 273 Homework 3 Submission

This repository contains my Homework 3 React application in `Homework3/dqfan`. The app visualizes stock data with linked views for stock prices, T-SNE positions, and related news articles.

## Project Location

The submitted project is located here:

```text
Homework3/dqfan
```

Main project files:

```text
Homework3/dqfan/
+-- data/
|   +-- stockdata/      # Stock price CSV files
|   +-- stocknews/      # Stock news text files
|   +-- tsne.csv        # T-SNE coordinates and categories
+-- src/
|   +-- component/
|   |   +-- LineChart.tsx
|   |   +-- NewsList.tsx
|   |   +-- TSNEScatter.tsx
|   |   +-- options.tsx
|   +-- App.tsx
|   +-- main.tsx
+-- package.json
+-- vite.config.ts
```

## Setup Instructions

These instructions assume Node.js and npm are installed.

### 1. Clone the repository

```bash
git clone https://github.com/via-teaching/ecs273-26s.git
cd ecs273-26s
```

If running from an existing local copy, start from the repository root instead.

### 2. Navigate to the app folder

```bash
cd Homework3/dqfan
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the app

Visit the local URL printed by Vite. Usually it is:

```text
http://localhost:5173/
```

## Build Instructions

To verify the project builds successfully:

```bash
cd Homework3/dqfan
npm run build
```

The production files are generated in:

```text
Homework3/dqfan/dist
```

## App Description

The app contains three linked sections:

- `Stock Overview Line Chart`: displays price history for the selected stock.
- `T-SNE Scatter Plot`: displays stock positions from `data/tsne.csv`, colored by category.
- `List of News`: displays related news files for the selected stock.

Changing the stock selector updates all three views.

## Data Notes

Stock price data is stored in:

```text
Homework3/dqfan/data/stockdata
```

News article text files are stored in:

```text
Homework3/dqfan/data/stocknews
```

The news loader supports file names in this format:

```text
YYYY-MM-DD HH-MM_Title.txt
```

The UI displays Alphabet as `GOOGL`, while the updated data folder and stock CSV use `GOOG`.

## Available Scripts

Run these commands from `Homework3/dqfan`.

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Runs TypeScript checks and builds the production version.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run preview
```

Serves the production build locally after running `npm run build`.

# Homework 4 Full-Stack Stock Visualization

This project is a full-stack version of the Homework 3 stock visualization. The frontend is built with React, TypeScript, and D3. The backend is built with FastAPI and MongoDB.

## Project Structure

```text
dqfan/
├─ client/   # React + TypeScript frontend
├─ server/   # FastAPI + MongoDB backend
└─ README.md
```

## Prerequisites

Make sure these are installed before running the project:

- Python
- Node.js and npm
- MongoDB Community Server

This project expects MongoDB to be available at:

```text
mongodb://localhost:27017
```

The database used by this project is:

```text
stock_sijia
```

## 1. Install Client Dependencies

From the `client/` directory:

```bash
cd client
npm install
```

## 2. Install Server Dependencies

From the `server/` directory:

```bash
cd server
pip install -r requirements.txt
```

## 3. Start MongoDB

You need to start your local MongoDB server before importing data or running the backend.

For this project, MongoDB can be started manually with a local data folder.

### Step 1: Create a folder for MongoDB data

Create a folder to store the MongoDB database files. For example:

```text
D:\MongoDB\data\stockhw
```

If the folder does not exist yet, create it first.

### Step 2: Start MongoDB from the command line

Run:

```bash
mongod --dbpath "D:\MongoDB\data\stockhw"
```

This starts the MongoDB server and tells it to store database files in that folder.

### How to verify MongoDB is running

A simple check is:

- the `mongod` process stays running without immediately exiting
- or MongoDB Compass can connect to `mongodb://localhost:27017`

You can also test by running the import script in the next step. If MongoDB is not running, the script will fail to connect.

## 4. Import the Data into MongoDB

After MongoDB is running, import the provided stock data:

```bash
cd server
python import_data.py
```

This script reads:

- `server/data/stockdata/*.csv`
- `server/data/stocknews/<ticker>/*.txt`
- `server/data/tsne.csv`

and imports them into these MongoDB collections:

- `stock_list`
- `stock_prices`
- `stock_news`
- `tsne`

The script clears existing documents in these collections before re-importing so you do not get duplicate data.

## 5. Run the FastAPI Backend

From the `server/` directory:

```bash
uvicorn main:app --reload --port 8000
```

If the backend starts correctly, you can test these endpoints in your browser:

```text
http://localhost:8000/stock_list
http://localhost:8000/stock/AAPL
http://localhost:8000/stocknews/AAPL
http://localhost:8000/tsne
```

They should all return JSON.

## 6. Run the React Frontend

Open a second terminal. From the `client/` directory:

```bash
cd client
npm run dev
```

Vite will print a local development URL, usually:

```text
http://localhost:5173
```

Open that URL in your browser.

## 7. Expected Behavior

When everything is running:

- the dropdown loads available stock tickers from the backend
- View 1 shows the stock line chart
- View 2 shows the t-SNE scatter plot
- View 3 shows stock news
- changing the selected stock updates all three views

## Assumptions

- MongoDB is running locally on port `27017`
- the database name is `stock_sijia`
- the provided data files remain in `server/data/`
- the frontend connects to the backend at `http://localhost:8000`

## Known Issues

- If MongoDB is not running, `import_data.py` and the backend API will fail
- If you forget to run `python import_data.py`, the frontend may show no stock data
- Some news files contain noisy scraped text from the provided dataset
- If you change the backend port, the frontend fetch URLs must be updated to match

## Recommended Run Order

For a clean start, use this order:

1. Start MongoDB
2. `cd server` and run `python import_data.py`
3. In the same `server/` directory, run `uvicorn main:app --reload --port 8000`
4. Open a new terminal, `cd client`, and run `npm run dev`
5. Open the Vite URL in the browser