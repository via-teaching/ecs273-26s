from fastapi import FastAPI
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV1, StockModelV2, StockNewsModel, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_ws # please replace the database name with stock_[your name] to avoid collision at TA's side
            
app = FastAPI(
    title="Stock tracking API",
    summary="An aplication tracking stock prices and respective news"
)

# Enables CORS to allow frontend apps to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stock_list", 
         response_model=StockListModel
    )
async def get_stock_list():
    """
    Get the list of stocks from the database
    """
    stock_name_collection = db.get_collection("stock_list")
    stock_list = await stock_name_collection.find_one()
    return stock_list

@app.get("/stocknews/", 
        response_model=list[StockNewsModel]
    )
async def get_stock_news(stock_name: str = 'XOM') -> list[StockNewsModel]:
    """
    Get the list of news for a specific stock from the database
    The news is sorted by date in ascending order
    """
    stock_name = stock_name.upper()
    stock_news_collection = db.get_collection("stock_news")
    cursor = stock_news_collection.find({
        "$or": [
            {"Stock": stock_name},
            {"ticker": stock_name}
        ]
    })

    news = await cursor.to_list(length=100)
    formatted_news = []
    for article in news:
        article["_id"] = str(article["_id"])
        formatted_news.append({
            "_id": article["_id"],
            "Stock": article.get("Stock", article.get("ticker", stock_name)),
            "Title": article.get("Title", article.get("title", "")),
            "Date": article.get("Date", article.get("date", "")),
            "content": article.get("content", "")
        })

    return formatted_news

@app.get("/stock/{stock_name}", 
        response_model=StockModelV2
    )
async def get_stock(stock_name: str) -> StockModelV2:
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    stock_name = stock_name.upper()
    stock_price_collection = db.get_collection("stock_prices")
    stock = await stock_price_collection.find_one({
        "$or": [
            {"name": stock_name},
            {"ticker": stock_name}
        ]
    })

    stock["_id"] = str(stock["_id"])
    stock_series = []
    for row in stock["records"]:
        stock_series.append({
            "date": str(row["Date"]),
            "Open": float(row["Open"]),
            "High": float(row["High"]),
            "Low": float(row["Low"]),
            "Close": float(row["Close"])
        })

    return {
        "_id": stock["_id"],
        "name": stock.get("name", stock.get("ticker", stock_name)),
        "stock_series": stock_series
    }


@app.get("/tsne/",
        response_model=tsneDataModel
    )
async def get_tsne(stock_name: str = 'XOM') -> tsneDataModel:
    """
    Get the t-SNE data for a specific stock
    """
    stock_name = stock_name.upper()
    tsne_collection = db.get_collection("tsne")
    item = await tsne_collection.find_one({
        "$or": [
            {"Stock": stock_name},
            {"ticker": stock_name},
            {"name": stock_name}
        ]
    })

    item["_id"] = str(item["_id"])

    return {
        "_id": item["_id"],
        "Stock": item.get("Stock", item.get("ticker", item.get("name", stock_name))),
        "x": float(item.get("x", item.get("tsne_1", item.get("TSNE1", 0)))),
        "y": float(item.get("y", item.get("tsne_2", item.get("TSNE2", 0)))),
        "sector": item.get("sector", item.get("Sector", "Unknown"))
    }