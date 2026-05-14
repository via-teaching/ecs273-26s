# Homework 3: D3 and Interactive Visualization

## Introduction

This project builds an interactive stock market visualization dashboard using D3.js and React. It uses stock data from Homework 1 and t-SNE representations from Homework 2.

## Setup Instructions

### Prerequisites

- Node.js v22 or higher
- npm

### 1. Navigate to the project folder
cd Homework3/imaverma/react-js-template

### 2. Install required Node.js packages
npm install

### 3. Start the React development server
npm run dev

### 4. Visit the app in your browser
http://localhost:5173

## Data

The `data/` folder contains:

- `stockdata/` — CSV files for 20 stocks (2-year daily OHLCV data from Homework 1)
- `stocknews/` — News articles for each stock (from Homework 1)
- `tsne.csv` — 2D t-SNE coordinates generated from the LSTM autoencoder latent representations in Homework 2

## Views

**View 1 — Stock Overview Line Chart**
Displays Open, High, Low, and Close prices for the selected stock. Supports horizontal zoom (Ctrl + scroll) and horizontal scrolling.

**View 2 — t-SNE Scatter Plot**
Shows all 20 stocks as points colored by sector. The selected stock is highlighted with a larger circle and a label. Supports zoom and pan.

**View 3 — News List**
Displays news articles for the selected stock. Click any article to expand and read the full content.

All three views are linked to the dropdown — selecting a stock updates all views simultaneously.

## Additional Notes

- t-SNE coordinates were generated using perplexity=5 and random_state=42 on the latent vectors from the LSTM autoencoder trained in Homework 2.
- Sector labels used: Energy, Industrials, Consumer, Healthcare, Financials, Info Tech.
