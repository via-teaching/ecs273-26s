from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from data_scheme import StockListModel, StockModelV2, StockNewsModelList, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_agothankar

app = FastAPI(
    title="Stock tracking API",
    summary="An application tracking stock prices and respective news",
)

# Enables CORS to allow frontend apps to make requests to this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clean_id(document):
    if document and "_id" in document:
        document["_id"] = str(document["_id"])
    return document


def normalize_stock_name(stock_name: str) -> str:
    return stock_name.strip().upper()


@app.get("/stock_list", response_model=StockListModel)
async def get_stock_list():
    """
    Get the list of stocks from the database.
    """
    stock_name_collection = db.get_collection("stock_list")
    stock_list = await stock_name_collection.find_one()
    if not stock_list:
        raise HTTPException(status_code=404, detail="Stock list not found. Run import_data.py first.")
    return stock_list


@app.get("/stocknews/", response_model=StockNewsModelList)
async def get_stock_news(stock_name: str = "XOM") -> StockNewsModelList:
    return await get_stock_news_by_name(stock_name)


@app.get("/stocknews/{stock_name}", response_model=StockNewsModelList)
async def get_stock_news_by_name(stock_name: str) -> StockNewsModelList:
    """
    Get the list of news for a specific stock from the database.
    The news is sorted by date in descending order.
    """
    stock_name = normalize_stock_name(stock_name)
    stock_news_collection = db.get_collection("stock_news")
    news = await stock_news_collection.find({"Stock": stock_name}).sort("Date", -1).to_list(length=None)
    if not news:
        raise HTTPException(status_code=404, detail=f"No news found for ticker {stock_name}")
    return {"Stock": stock_name, "News": [clean_id(item) for item in news]}


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str) -> StockModelV2:
    """
    Get the stock data for a specific stock.
    """
    stock_name = normalize_stock_name(stock_name)
    stock_data_collection = db.get_collection("stock_data")
    stock = await stock_data_collection.find_one({"name": stock_name})
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock ticker {stock_name} not found")
    return clean_id(stock)


@app.get("/tsne/", response_model=list[tsneDataModel])
async def get_tsne() -> list[tsneDataModel]:
    """
    Get all t-SNE data.
    """
    tsne_collection = db.get_collection("tsne_data")
    tsne_data = await tsne_collection.find({}).sort("Stock", 1).to_list(length=None)
    if not tsne_data:
        raise HTTPException(status_code=404, detail="t-SNE data not found. Run import_data.py first.")
    return [clean_id(item) for item in tsne_data]


@app.get("/tsne/{stock_name}", response_model=tsneDataModel)
async def get_tsne_by_name(stock_name: str) -> tsneDataModel:
    """
    Get the t-SNE data for a specific stock.
    """
    stock_name = normalize_stock_name(stock_name)
    tsne_collection = db.get_collection("tsne_data")
    tsne_data = await tsne_collection.find_one({"Stock": stock_name})
    if not tsne_data:
        raise HTTPException(status_code=404, detail=f"t-SNE data for ticker {stock_name} not found")
    return clean_id(tsne_data)
