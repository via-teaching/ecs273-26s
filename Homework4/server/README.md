# Homework 4 Server

This folder contains the FastAPI backend for ECS 273 Homework 4. It loads stock data, news, and t-SNE data into MongoDB, then serves that data to the React frontend.

## What This Server Provides

- Stock ticker list
- Stock price data for a selected ticker
- News for a selected ticker
- t-SNE data for all stocks or one selected ticker

The frontend in `../client` expects this API to run on port `8000`.

## Folder Notes

```text
Homework4/server/
├── data/
├── data_scheme.py
├── import_data.py
├── main.py
├── requirements.txt
└── README.md
```

Stock data, news files, and `tsne.csv` are expected under `Homework4/server/data/`.

## Prerequisites

Install Python and MongoDB.

MongoDB must be running locally on the default port:

```text
27017
```

## Install Server Dependencies

From this folder:

```powershell
cd .\ecs273-26s\Homework4\server
pip install -r requirements.txt
```

## Import Data

After MongoDB is running, load the data:

```powershell
python import_data.py
```

The import script loads data into the MongoDB database:

```text
stock_agothankar
```

Run `python import_data.py` again if the data folder changes or if MongoDB has been cleared.

## Run the Server

Start the FastAPI development server:

```powershell
uvicorn main:app --reload --port 8000
```

The API will be available at:

```text
http://localhost:8000
```

## API Endpoints

```text
GET /stock_list
GET /stock/{ticker}
GET /stocknews/
GET /stocknews/{ticker}
GET /tsne/
GET /tsne/{ticker}
```

## Troubleshooting

If `/stock_list` returns `Stock list not found`, make sure MongoDB is running and run:

```powershell
python import_data.py
```

If the frontend shows failed requests to `localhost:8000`, make sure the backend is running:

```powershell
uvicorn main:app --reload --port 8000
```

If MongoDB is not available, confirm that your local MongoDB service is installed and started.

## Assumptions

- MongoDB runs locally on the default port `27017`.
- FastAPI runs locally on port `8000`.
- Stock data, news files, and `tsne.csv` are stored under `Homework4/server/data/`.
