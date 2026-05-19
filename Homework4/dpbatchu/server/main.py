import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "stock_dp")

mongo_client = MongoClient(MONGODB_URI)
db = mongo_client[DB_NAME]

app = FastAPI(
    title="Stock Tracking API",
    summary="Stock prices, news, and t-SNE projection for ECS 273 HW4",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    try:
        mongo_client.admin.command("ping")
        mongo_status = "connected"
    except Exception:
        mongo_status = "disconnected"
    return {"status": "ok", "mongodb": mongo_status, "database": DB_NAME}


@app.get("/api/stocks")
def get_stocks():
    tickers = db.stock_prices.distinct("ticker")
    return sorted(tickers)


@app.get("/api/stocks/{ticker}/prices")
def get_prices(ticker: str):
    doc = db.stock_prices.find_one({"ticker": ticker.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found")
    return doc


@app.get("/api/stocks/{ticker}/news")
def get_news(ticker: str):
    upper = ticker.upper()
    if not db.stock_prices.find_one({"ticker": upper}):
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found")
    articles = list(db.stock_news.find({"ticker": upper}, {"_id": 0}))
    return articles


@app.get("/api/tsne")
def get_tsne():
    return list(db.tsne_projection.find({}, {"_id": 0}))


@app.get("/api/stocks/{ticker}/tsne")
def get_tsne_ticker(ticker: str):
    doc = db.tsne_projection.find_one({"ticker": ticker.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found in t-SNE data")
    return doc
