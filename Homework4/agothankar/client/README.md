# Homework 4 Client

This folder contains the React frontend for ECS 273 Homework 4. It is based on the Homework 3 JavaScript visualization app and now loads stock data from the FastAPI backend instead of reading local CSV/JSON files directly.

## What This Client Shows

- Stock overview line chart
- t-SNE scatter plot
- News list for the selected stock
- Stock dropdown populated from the backend

When a stock is selected, the frontend requests updated stock prices, t-SNE data, and news from the FastAPI API running on port `8000`.

## Folder Notes

The active frontend is the JavaScript version:

```text
Homework4/agothankar/client/
├── src/
├── package.json
├── vite.config.js
├── index.html
├── eslint.config.js
└── README.md
```

## Prerequisites

Install Node.js and npm.

The backend must also be running before the frontend can load data. See `../server/README.md` for backend setup. The frontend expects the API at:

```text
http://localhost:8000
```

## Install Client Dependencies

From this folder:

```powershell
cd .\ecs273-26s\Homework4\agothankar\client
npm install
```

## Run the Client

Start the Vite development server:

```powershell
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:5173/
```

## API Endpoints Used

The frontend calls these backend endpoints:

```text
GET /stock_list
GET /stock/{ticker}
GET /tsne/
GET /stocknews/{ticker}
```

## Troubleshooting

If the page says the stock list was not found or the browser console shows failed requests to `localhost:8000`, check the backend setup in `../server/README.md`.

If port `5173` is already in use, Vite will show another local URL in the terminal. Open that URL instead.

## Assumptions

- FastAPI runs locally on port `8000`.
