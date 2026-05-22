from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware
from data_scheme import StockListModel, StockModelV2, StockNewsModel, tsneDataModel

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_jason

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

@app.get("/stock_list")
async def get_stock_list():
    col = db.get_collection("stock_list")
    doc = await col.find_one({}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Stock list not found")
    return doc

@app.get("/stock/{stock_name}")
async def get_stock(stock_name: str):
    col = db.get_collection("stock_prices")
    doc = await col.find_one({"name": stock_name.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Stock '{stock_name}' not found")
    return doc

@app.get("/stocknews/")
async def get_stock_news(stock_name: str = "XOM"):
    col = db.get_collection("stock_news")
    cursor = col.find({"Stock": stock_name.upper()}, {"_id": 0})
    articles = await cursor.to_list(length=100)
    return {"Stock": stock_name.upper(), "News": articles}

@app.get("/tsne/")
async def get_tsne(stock_name: str = None):
    col = db.get_collection("tsne")
    cursor = col.find({}, {"_id": 0})
    records = await cursor.to_list(length=1000)
    return records