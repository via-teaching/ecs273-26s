from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from data_scheme import (
    stock_prices_collection,
    stock_news_collection,
    tsne_collection,
)

app = FastAPI(
    title="Stock Tracking API",
    summary="A backend API for stock prices, stock news, and t-SNE visualization data",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clean_mongo_doc(doc):
  
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


@app.get("/")
def root():
    return {"message": "Stock Tracking API is running"}


@app.get("/api/stocks")
def get_stock_list():

    tickers = stock_prices_collection.distinct("ticker")
    tickers = sorted(tickers)

    return {
        "stocks": tickers
    }


@app.get("/api/stocks/{ticker}")
def get_stock_price(ticker: str):

    ticker = ticker.upper()

    doc = stock_prices_collection.find_one({"ticker": ticker})

    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"Ticker {ticker} not found"
        )

    return clean_mongo_doc(doc)


@app.get("/api/news/{ticker}")
def get_stock_news(ticker: str):

    ticker = ticker.upper()

    news = list(stock_news_collection.find({"ticker": ticker}))

    for article in news:
        article["_id"] = str(article["_id"])

    return {
        "ticker": ticker,
        "news": news
    }


@app.get("/api/tsne")
def get_all_tsne():

    rows = list(tsne_collection.find({}))

    for row in rows:
        row["_id"] = str(row["_id"])

    return {
        "data": rows
    }


@app.get("/api/tsne/{ticker}")
def get_one_tsne(ticker: str):
 
    ticker = ticker.upper()

    doc = tsne_collection.find_one({"ticker": ticker})

    if not doc:
        raise HTTPException(
            status_code=404,
            detail=f"t-SNE data for {ticker} not found"
        )

    return clean_mongo_doc(doc)