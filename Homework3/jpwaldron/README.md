# ECS 273 Homework 3 — Jason Waldron (jpwaldron)

Interactive stock data visualization dashboard built with React, D3, and Vite.

## Setup

Requires Node.js 22+.

npm install
npm run dev


## Data Setup (run once before starting)

The data/ folder contains the raw stock data. Before running the app, generate the required files in public/data/:

News JSON files:

python3 generate_news.py

This converts the raw .txt news files from data/stocknews/ into JSON files that the app can fetch.

TSNE coordinates:

python3 generate_tsne.py

This runs the LSTM autoencoder from HW2 on the stock CSVs and generates public/data/tsne.csv.

Stock CSVs and tsne.csv** should already be present in public/data/ from the submission.

## Views

- **View 1 (top left):** Line chart of Open/High/Low/Close for the selected stock. Supports zoom and pan.
- **View 2 (bottom left):** t-SNE scatter plot of all 20 stocks colored by sector. Selected stock is highlighted.
- **View 3 (right):** News list for the selected stock. Click an article to expand full content.

All three views update when the stock is changed in the dropdown.

## Notes

- Stock tickers used may differ from the intended HW1 set — Canvas was unavailable at submission time to verify the correct list. All visualization components are data agnostic and will work with any valid input data in the specified format.

- News data was scraped during HW1 for a subset of tickers. The component supports any ticker with a corresponding JSON file in public/data/stocknews/.

-News data was only scraped for AAPL and NVDA during precious assignment. The NewsList component is fully functional and will display news for any ticker that has a corresponding JSON file in public/data/stocknews/. To add more tickers, run the HW1 news scraping script (T2/script.py) with the desired tickers, then re-run generate_news.py

## AI Assistance Disclosure

I'm fairly inexperienced with javascript and D3 so I consulted Claude during development for debugging assistance, D3 syntax guidance, and help structuring the data pipeline (tsne.csv generation, news JSON conversion). All architectural decisions, debugging, direction, and component integration were my own. Claude was used similarly to how one might use Stack Overflow or the D3 documentation.