import os
from pathlib import Path

import pandas as pd
try:
    from pymongo import MongoClient
except ModuleNotFoundError as e:
    raise ModuleNotFoundError(
        "Missing dependency 'pymongo'. Install it in your active Python environment, "
        "then rerun this script.\n\n"
        "Common fixes on Windows:\n"
        "- Use a virtualenv: python -m venv .venv; .venv\\Scripts\\activate; pip install pymongo\n"
        "- Or run an elevated terminal to install system-wide.\n"
    ) from e


def _server_data_dir() -> Path:
    # import_data.py lives in Homework4/server/
    return Path(__file__).resolve().parent / "data"


def _read_tickers(stockdata_dir: Path) -> list[str]:
    tickers = sorted([p.stem for p in stockdata_dir.glob("*.csv")])
    if not tickers:
        raise FileNotFoundError(f"No CSVs found under {stockdata_dir}")
    return tickers


def import_stock_list(db, tickers: list[str]) -> None:
    col = db["stock_list"]
    col.drop()
    col.insert_one({"tickers": tickers})
    print(f"[stock_list] inserted 1 document with {len(tickers)} tickers")


def import_stock_prices(db, stockdata_dir: Path, tickers: list[str]) -> None:
    col = db["stock_price"]
    col.drop()

    inserted = 0
    for t in tickers:
        csv_path = stockdata_dir / f"{t}.csv"
        # Data has an extra 2nd row with repeated ticker labels; skip it.
        df = pd.read_csv(csv_path, skiprows=[1])
        required = ["Date", "Open", "High", "Low", "Close"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f"{csv_path} missing columns: {missing}")

        doc = {
            "name": t,
            "date": df["Date"].astype(str).tolist(),
            "Open": df["Open"].astype(float).tolist(),
            "High": df["High"].astype(float).tolist(),
            "Low": df["Low"].astype(float).tolist(),
            "Close": df["Close"].astype(float).tolist(),
        }
        col.insert_one(doc)
        inserted += 1
        if inserted % 5 == 0 or inserted == len(tickers):
            print(f"[stock_price] inserted {inserted}/{len(tickers)}")


def _parse_news_file(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    if len(lines) < 3:
        raise ValueError(f"News file too short: {path}")

    title = ""
    date = ""
    content_lines: list[str] = []

    i = 0
    if lines[i].startswith("Title:"):
        title = lines[i].split("Title:", 1)[1].strip()
        i += 1
    else:
        raise ValueError(f"Missing Title header: {path}")

    if i < len(lines) and lines[i].startswith("Date:"):
        date = lines[i].split("Date:", 1)[1].strip()
        i += 1
    else:
        raise ValueError(f"Missing Date header: {path}")

    # Skip optional URL line and blank lines
    while i < len(lines) and (lines[i].strip() == "" or lines[i].startswith("URL:")):
        i += 1

    content_lines = lines[i:]
    content = "\n".join(content_lines).strip()

    return {"Title": title, "Date": date, "content": content}


def import_stock_news(db, stocknews_dir: Path, tickers: list[str]) -> None:
    col = db["stock_news"]
    col.drop()

    inserted = 0
    for t in tickers:
        t_dir = stocknews_dir / t
        if not t_dir.exists():
            print(f"[stock_news] WARNING: missing folder for {t}: {t_dir}")
            continue

        for path in sorted(t_dir.glob("*.txt")):
            parsed = _parse_news_file(path)
            doc = {"Stock": t, **parsed}
            col.insert_one(doc)
            inserted += 1
        print(f"[stock_news] {t}: imported {len(list(t_dir.glob('*.txt')))} articles")

    print(f"[stock_news] inserted {inserted} articles total")


def import_stock_tsne(db, tsne_csv: Path) -> None:
    col = db["stock_tsne"]
    col.drop()

    df = pd.read_csv(tsne_csv)
    required = ["tsne_1", "tsne_2", "ticker", "sector"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"{tsne_csv} missing columns: {missing}")

    docs = []
    for _, row in df.iterrows():
        docs.append(
            {
                "Stock": str(row["ticker"]),
                "x": float(row["tsne_1"]),
                "y": float(row["tsne_2"]),
                "sector": str(row["sector"]),
            }
        )

    if docs:
        col.insert_many(docs)
    print(f"[stock_tsne] inserted {len(docs)} documents")


def main() -> None:
    data_dir = _server_data_dir()
    stockdata_dir = data_dir / "stockdata"
    stocknews_dir = data_dir / "stocknews"
    tsne_csv = data_dir / "tsne.csv"

    client = MongoClient("mongodb://localhost:27017")
    db = client["stock_hima"]

    tickers = _read_tickers(stockdata_dir)
    print(f"Connecting to MongoDB db='stock_hima' on localhost:27017")
    print(f"Found {len(tickers)} tickers from stockdata/")

    import_stock_list(db, tickers)
    import_stock_prices(db, stockdata_dir, tickers)
    import_stock_news(db, stocknews_dir, tickers)
    import_stock_tsne(db, tsne_csv)

    print("Done.")


if __name__ == "__main__":
    main()
