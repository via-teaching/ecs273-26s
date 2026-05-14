import os
import json


# This is used to prepare news articles to be read by the server side
# Parses through each ticker's news folder, and reads/stores the filenames into a .json file
dir_news = os.path.join("data", "stocknews")

tickers = os.listdir(dir_news)

for ticker in tickers:
    folder = os.path.join(dir_news, ticker)

    if not os.path.isdir(folder):
        continue

    files = os.listdir(folder)
    txt_files = [] # store all text files in here

    for file in files:
        if file.endswith(".txt"):
            txt_files.append(file)


    ticker_json_dir = os.path.join(folder, "tickernews.json")

    with open(ticker_json_dir, "w") as f:
        json.dump(txt_files, f)

print("Prepared all stock ticker news json files!")

