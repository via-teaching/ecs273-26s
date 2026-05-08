# ECS 273 Homework 3 — Interactive Stock Visual Analytics Dashboard

## Introduction

This project is an interactive stock visualization dashboard built using React, TypeScript, and D3.js for ECS 273: Visual Analytics at UC Davis by AVNI KANDYA.

The dashboard visualizes:
- Historical stock price trends
- t-SNE latent-space relationships between stocks
- Recent stock news articles

---

# Features

## View 1 — Interactive Stock Line Chart
- Displays Open, High, Low, and Close stock prices
- Dynamic update based on selected stock
- Zoomable time-series visualization
- Axis labels and legends

## View 2 — t-SNE Scatter Plot
- Visualizes stock similarity using latent representations
- Color-coded by sector
- Interactive zooming and panning
- Clicking a point updates all linked views
- Selected stock is highlighted

## View 3 — News Panel
- Displays recent stock-related news
- Expandable news content
- Dynamically updates based on selected stock

---

# Technologies Used

- React
- TypeScript
- D3.js
- Vite
- Tailwind CSS

---
# Setup Instructions :
# 1. Clone Repository
git clone https://github.com/Avni-K/ecs273-26s
cd ecs273-26s/akandya

# 2. Install Dependencies
npm install
npm install d3
npm install -D @types/d3

# 3. Run the Project and Open in Browser
npm run dev
- Usually available at : http://localhost:5173

---

# Project Structure

```txt
akandya/
├── data/
│   ├── stockdata/
│   ├── stocknews/
│   └── tsne.csv
│
├── src/
│   ├── component/
│   │   ├── LineChart.tsx
│   │   ├── TSNEScatter.tsx
│   │   ├── NewsList.tsx
│   │   └── options.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
└── README.md

