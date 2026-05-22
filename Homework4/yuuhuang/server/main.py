from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware
from data_scheme import StockListModel, StockModelV2, StockNewsModelList, tsneDataListModel, SECTOR_MAP

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_yuhua

app = FastAPI(title="HW4 Stock API")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/stock_list", response_model=StockListModel)
async def get_stock_list():
    doc = await db.get_collection("stock_list").find_one({}, {"_id": 0})
    if not doc: raise HTTPException(500, "Run import_data.py first.")
    return doc

@app.get("/stock/{stock_name}", response_model=StockModelV2)
async def get_stock(stock_name: str):
    ticker = stock_name.upper()
    if ticker not in SECTOR_MAP: raise HTTPException(404, f"Unknown ticker: {stock_name}")
    doc = await db.get_collection("stock_prices").find_one({"name": ticker}, {"_id": 0})
    if not doc: raise HTTPException(404, f"No data for {ticker}. Run import_data.py.")
    return doc

@app.get("/stocknews/", response_model=StockNewsModelList)
async def get_stock_news(stock_name: str = "AAPL"):
    ticker = stock_name.upper()
    if ticker not in SECTOR_MAP: raise HTTPException(404, f"Unknown ticker: {stock_name}")
    cursor = db.get_collection("stock_news").find({"Stock": ticker}, {"_id": 0}).sort("Date", -1).limit(30)
    articles = await cursor.to_list(length=30)
    return {"Stock": ticker, "News": articles}

@app.get("/tsne/", response_model=tsneDataListModel)
async def get_tsne():
    cursor = db.get_collection("tsne_data").find({}, {"_id": 0})
    data = await cursor.to_list(length=100)
    if not data: raise HTTPException(500, "Run import_data.py first.")
    return {"data": data}

@app.get("/")
async def root():
    return {"message": "HW4 Stock API running. Visit /docs"}
