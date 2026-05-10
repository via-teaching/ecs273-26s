import os
import re

BASE_DIR = r"Homework3\xypjiang\data\stocknews"

def clean_filename(name):
    name = name.lower()
    name = name.replace("%", "_percent")
    name = re.sub(r"[^a-z0-9.]+", "_", name)
    name = re.sub(r"_+", "_", name)
    return name.strip("_")

for stock in os.listdir(BASE_DIR):
    stock_path = os.path.join(BASE_DIR, stock)

    if not os.path.isdir(stock_path):
        continue

    for filename in os.listdir(stock_path):
        if not filename.endswith(".txt"):
            continue

        old_path = os.path.join(stock_path, filename)
        new_name = clean_filename(filename)
        new_path = os.path.join(stock_path, new_name)

        if old_path != new_path:
            os.rename(old_path, new_path)
            print(f"{filename} -> {new_name}")

print("Rename complete.")