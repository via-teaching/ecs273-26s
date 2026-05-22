from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware

from data_scheme import (
    StockListModel,
    StockModelV2,
    StockNewsModelList,
    TsneDataModel,
)

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_hb

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


@app.get("/")
async def root():
    return {"message": "Stock API is running"}





@app.get("/stock_list",
         response_model=StockListModel)
async def get_stock_list():

    stock_name_collection = db.get_collection("stock_list")

    stock_list = await stock_name_collection.find_one({})

    if stock_list is None:
        raise HTTPException(
            status_code=404,
            detail="No stock list found"
        )

    stock_list["_id"] = str(stock_list["_id"])

    return stock_list

@app.get("/stocknews/", response_model=StockNewsModelList)
async def get_stock_news(stock_name: str = "XOM"):
    stock_name = stock_name.upper()

    news_collection = db.get_collection("stock_news")
    cursor = news_collection.find({"Stock": stock_name})

    news_list = []
    async for news in cursor:
        news_list.append(news)

    if len(news_list) == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No news found for stock {stock_name}"
        )

    return {
        "Stock": stock_name,
        "News": news_list
    }


@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str):
    stock_name = stock_name.upper()

    stock_collection = db.get_collection("stock_data")
    stock_data = await stock_collection.find_one({"name": stock_name})

    if stock_data is None:
        raise HTTPException(
            status_code=404,
            detail=f"Stock {stock_name} not found"
        )

    return stock_data


@app.get("/tsne/")
async def get_all_tsne():
    tsne_collection = db.get_collection("tsne_data")
    cursor = tsne_collection.find({})

    data = []

    async for item in cursor:
        item["_id"] = str(item["_id"])
        data.append(item)

    return {"data": data}