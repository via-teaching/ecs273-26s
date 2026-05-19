import os
import re

news_root = "../data/stocknews"  # go up from src/ to project root, then into data/

for ticker in os.listdir(news_root):
    ticker_dir = os.path.join(news_root, ticker)
    if not os.path.isdir(ticker_dir):
        continue
    for filename in os.listdir(ticker_dir):
        if not filename.endswith(".txt"):
            continue
        new_name = re.sub(r"[^a-zA-Z0-9.\-_]", "_", filename)
        if new_name != filename:
            os.rename(
                os.path.join(ticker_dir, filename),
                os.path.join(ticker_dir, new_name)
            )
            print(f"Renamed: {filename} -> {new_name}")

print("Done")