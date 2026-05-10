# ECS 273 Homework 3: D3 and Interactive Visualization

Interactive Stock Visualization Dashboard

## Features
* **View 1: Line Chart** - Displays 2-year historical stock prices (Open, High, Low, Close).
* **View 2: t-SNE Scatter Plot** - Visualizes t-SNE coordinates.
* **View 3: News List** - A list of stock-related news.
* **Linked Interactions** - Selecting a stock from the menu updates all three views simultaneously.

## Structure

```text
Homework3/
└── user/
    ├── data/
    │   ├── stockdata/     (Stock data files for the past 2 years)
    │   ├── stocknews/     (Stock news)
    │   ├── filename.py    (Script for renaming news files to prevent URI issues)
    │   └── tsne.csv       (t-SNE projection coordinates)
    ├── src/
    │   ├── component/
    │   │   ├── LineChart.tsx    (Line Chart)
    │   │   ├── TSNEScatter.tsx  (t-SNE Scatter Plot)
    │   │   ├── NewsList.tsx     (News List) 
    │   │   └── options.tsx      (Dropdown menu)
    │   └── App.tsx              (Main layout) 
    ├── package.json       (Dependencies)
    └── README.md          (This instruction file)
```
## How to Run
1. Install dependencies:
```bash
npm install 
```
2. Start the development server:
```bash
npm run dev
```
