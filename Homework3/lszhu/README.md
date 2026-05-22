# ECS273 Homework 3 - Huanglun Adam Zhu

## Overview

This project visualizes stock data using React + js. It includes:
- A line chart of stock prices over time
- A news list showing articles for each stock
- A t-SNE scatter plot showing raw and latent embeddings

## Setup Instructions

**1. Navigate to the project folder**

cd Homework3/lszhu


**2. Install dependencies**

npm install


**3. Start the development server**

npm run dev


**4. Open in your browser**

## Project Structure

- `src/components/LineChart.jsx` — visualizes stock prices over a 2-year period
- `src/components/NewsList.jsx` — displays news articles for the selected stock
- `src/components/TSNEScatter.jsx` — t-SNE scatter plot (raw and latent) for a selected stock
- `src/App.jsx` — manages state, dropdown selection, and layout
- `src/index.css` — custom styling
- Dataset files: `stockdata/`, `stocknews/`, t-SNE results, and a preprocessed JS news file

## Notes

- Stock news was preprocessed from `.txt` files into a `.js` module for easy loading in the browser.
- The stock dropdown allows selecting from
```python
['XOM', 'CVX', 'HAL', 'MMM', 'CAT', 'DAL', 'MCD', 'NKE', 'KO', 'JNJ', 'PFE', 'UNH', 'JPM', 'GS', 'BAC', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']
```
 over a 2-year period.
