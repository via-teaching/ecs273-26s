import os
import json

base_dir = "public/data/stocknews"
output_file = "public/data/stocknews/news_index.json"

news_index = {}

for ticker in os.listdir(base_dir):
    ticker_path = os.path.join(base_dir, ticker)

    if os.path.isdir(ticker_path):
        files = [
            f for f in os.listdir(ticker_path)
            if f.endswith(".txt")
        ]

        files.sort()
        news_index[ticker] = files

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(news_index, f, indent=2)

print("news_index.json generated successfully.")