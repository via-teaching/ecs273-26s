from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockNewsModelList, StockSeriesModel, TSNEListModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_faze
            
app = FastAPI(
    title="Stock tracking API",
    summary="An application tracking stock prices and respective news",
)

# Enables CORS to allow frontend apps to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/tickers", response_model=StockListModel)
async def get_stock_list() -> StockListModel:
    """
    Get the list of stocks from the database
    """
    stock_list = await db.stock_list.find_one({}, {"_id": False})
    if not stock_list:
        return StockListModel(tickers=[])

    return stock_list


@app.get("/api/stocks/{ticker}", response_model=StockSeriesModel)
async def get_stock(ticker: str) -> StockSeriesModel:
    """
    Get the stock price time series for a specific ticker.
    """
    normalized_ticker = ticker.upper()
    stock = await db.stock_prices.find_one({"ticker": normalized_ticker}, {"_id": False})

    if not stock:
        raise HTTPException(status_code=404, detail=f"Ticker {normalized_ticker} was not found.")

    return stock


@app.get("/api/news/{ticker}", response_model=StockNewsModelList)
async def get_stock_news(ticker: str) -> StockNewsModelList:
    """
    Get news articles for a specific ticker.
    """
    normalized_ticker = ticker.upper()
    known_ticker = await db.stock_prices.find_one({"ticker": normalized_ticker}, {"_id": False, "ticker": True})

    if not known_ticker:
        raise HTTPException(status_code=404, detail=f"Ticker {normalized_ticker} was not found.")

    cursor = db.stock_news.find({"ticker": normalized_ticker}, {"_id": False}).sort("dateSort", -1)
    news = await cursor.to_list(length=None)

    return {"ticker": normalized_ticker, "news": news}


@app.get("/api/tsne", response_model=TSNEListModel)
async def get_tsne_points() -> TSNEListModel:
    """
    Get all t-SNE projection points.
    """
    cursor = db.tsne_points.find({}, {"_id": False}).sort("ticker", 1)
    points = await cursor.to_list(length=None)

    return {"points": points}
