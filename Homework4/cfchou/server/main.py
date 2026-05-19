from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_chifang

app = FastAPI(
    title="Stock tracking API",
    summary="HW4: serves stock prices, news, and t-SNE projection from MongoDB.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _known_tickers() -> set[str]:
    doc = await db.stock_list.find_one({}, {"_id": 0, "tickers": 1})
    return set(doc.get("tickers", [])) if doc else set()


@app.get("/stock_list")
async def get_stock_list():
    doc = await db.stock_list.find_one({}, {"_id": 0, "tickers": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="stock list not found; did you run import_data.py?")
    return {"tickers": doc.get("tickers", [])}


@app.get("/stock/{ticker}")
async def get_stock(ticker: str):
    ticker = ticker.upper()
    doc = await db.stock_prices.find_one({"name": ticker}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"unknown ticker '{ticker}'")
    return doc


@app.get("/stocknews/{ticker}")
async def get_stock_news(ticker: str):
    ticker = ticker.upper()
    if ticker not in await _known_tickers():
        raise HTTPException(status_code=404, detail=f"unknown ticker '{ticker}'")
    cursor = db.stock_news.find({"Stock": ticker}, {"_id": 0}).sort("Date", -1)
    return {"Stock": ticker, "News": await cursor.to_list(length=None)}


@app.get("/tsne")
async def get_tsne_all():
    cursor = db.tsne.find({}, {"_id": 0})
    return {"points": await cursor.to_list(length=None)}


@app.get("/tsne/{ticker}")
async def get_tsne_one(ticker: str):
    ticker = ticker.upper()
    doc = await db.tsne.find_one({"Stock": ticker}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"unknown ticker '{ticker}'")
    return doc
