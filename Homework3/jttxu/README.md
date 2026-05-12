# ECS 273 Homework3
This repository is for ECS 273 Visual Analytics homework 3. 

## Prerequisites
Before running the code, please make sure you have installed `Node.js` and `npm` (Node Package Manager). Run the following command to check:
```
node -v
npm -v
```
If you have not installed them yet, please go to the official website of [Node.js](https://nodejs.org/) to download the latest version.

## Installation
After cloning the repository, nagivate to the project directoty and run the following code in the terminal to install all the required dependencies. 
```
cd ecs273-26s\Homework3\jttxu
npm install
```
If you want to run both the frontend and backend with a single command, also install:
```
npm install -D concurrently
```

## Data requirements
To make sure all the charts can be render successfully, please make sure you saved data from homework1 and homework2 in the `data` folder in the following structure:
```
data/
├── stockdata/
│    ├── AAPL.csv
│    ├── NVDA.csv
│    └── ...
├── stocknews/
│    ├── AAPL/
│    │    ├── 2026-04-24 10-35_This Tech ... .txt
│    ├── NVDA/
│    └── ...
└── tsne.csv
```
Note: `tsne.csv` should contain one row per stock and include the stock ticker, two t-SNE coordinates, and the sector label.

## Running the project
There are two options to run the project.
### Option 1 - single command (recommended)
This command uses `concurrently` to start both the backend API and the Vite frontend server at the same time:
```
npm run start
```

### Option 2 - two separate terminals:
```
# terminal 1: start the API server (port 3001)
npm run server

# terminal 2: start the Vite dev server
npm run dev
```

To see the dashboard visualization, click the local URL provided in the terminal, which usually is `http://localhost:5173/`.

## Interaction
This dashboard provides an interactive view of stock data. Here's the interaction instruction:
1. **Select a Stock:** select a stock ticker from the dropdown menu at the top of the page. This action acts as a global trigger to synchronize all views on the dashboard.
2. **View Stock Trends:** Once a stock is selected, the top-left view will automatically render a detailed line chart displaying the historical price trends (Open, High, Low, Close) for that specific stock. You can pan and zoom within the chart for a closer look.
3. **Explore Market Clustering:** The bottom-left scatter plot displays a t-SNE projection of all available stocks. When you select a stock from the top menu, its corresponding data point will be dynamically highlighted and labeled on this map, allowing you to easily identify its position among sector peers.
4. **Read Related News:** The right panel will update and display a list of news articles related specifically to your chosen stock. Click on any news headline to seamlessly expand and read the full article content via lazy loading. Click the headline again to collapse it.