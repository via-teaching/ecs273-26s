from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from data_scheme import DATABASE_NAME, PRICE_COLLECTION, NEWS_COLLECTION, TSNE_COLLECTION

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient("mongodb://localhost:27017/")
db = client[DATABASE_NAME]

price_collection = db[PRICE_COLLECTION]
news_collection = db[NEWS_COLLECTION]
tsne_collection = db[TSNE_COLLECTION]


def clean_mongo_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@app.get("/")
def home():
    return {"message": "Stock Visual Analytics API is running"}


@app.get("/stocks")
def get_stocks():
    stocks = price_collection.find({}, {"ticker": 1, "_id": 0})
    tickers = sorted([stock["ticker"] for stock in stocks])
    return {"stocks": tickers}


@app.get("/stock/{ticker}")
def get_stock_data(ticker: str):
    ticker = ticker.upper()

    doc = price_collection.find_one({"ticker": ticker})

    if not doc:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")

    clean_mongo_doc(doc)
    return doc


@app.get("/news/{ticker}")
def get_news(ticker: str):
    ticker = ticker.upper()

    articles = list(news_collection.find({"ticker": ticker}))

    if not articles:
        return {
            "ticker": ticker,
            "news": []
        }

    cleaned_articles = [clean_mongo_doc(article) for article in articles]

    return {
        "ticker": ticker,
        "news": cleaned_articles
    }


@app.get("/tsne")
def get_tsne():
    points = list(tsne_collection.find({}))

    cleaned_points = [clean_mongo_doc(point) for point in points]

    return {
        "points": cleaned_points
    }


@app.get("/tsne/{ticker}")
def get_tsne_for_stock(ticker: str):
    ticker = ticker.upper()

    point = tsne_collection.find_one({"ticker": ticker})

    if not point:
        raise HTTPException(status_code=404, detail=f"t-SNE point for {ticker} not found")

    clean_mongo_doc(point)
    return point