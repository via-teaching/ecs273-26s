from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV2, StockNewsItem, tsneDataModel

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_zjz

app = FastAPI(
    title="Stock tracking API",
    summary="An application tracking stock prices and respective news"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stock_list", response_model=StockListModel)
async def get_stock_list():
    col = db.get_collection("stock_list")
    result = await col.find_one()
    if not result:
        raise HTTPException(status_code=404, detail="Stock list not found")
    return result

@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str):
    col = db.get_collection("stock_prices")
    result = await col.find_one({"name": stock_name})
    if not result:
        raise HTTPException(status_code=404, detail=f"Stock {stock_name} not found")
    return result

@app.get("/stocknews/{stock_name}", response_model=list[StockNewsItem])
async def get_stock_news(stock_name: str):
    col = db.get_collection("stock_news")
    cursor = col.find({"Stock": stock_name}).sort("Date", -1)
    news = await cursor.to_list(length=100)
    if not news:
        raise HTTPException(status_code=404, detail=f"No news for {stock_name}")
    return news

@app.get("/tsne", response_model=list[tsneDataModel])
async def get_tsne():
    col = db.get_collection("tsne")
    cursor = col.find()
    data = await cursor.to_list(length=100)
    return data
