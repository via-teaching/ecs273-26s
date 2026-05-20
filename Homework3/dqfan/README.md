# Homework 3 Stock Visualization

This project is a React, TypeScript, Vite, D3, and Tailwind CSS application for exploring stock data. It shows three linked views for the selected stock:

- A stock price line chart using CSV files in `data/stockdata`
- A T-SNE scatter plot using `data/tsne.csv`
- A related news list using text files in `data/stocknews`

The stock selector at the top controls all three views.

## Project Structure

```text
dqfan/
+-- data/
|   +-- stockdata/      # Stock price CSV files
|   +-- stocknews/      # News text files organized by ticker folder
|   +-- tsne.csv        # T-SNE coordinates and stock categories
+-- src/
|   +-- component/
|   |   +-- LineChart.tsx
|   |   +-- NewsList.tsx
|   |   +-- TSNEScatter.tsx
|   |   +-- options.tsx
|   +-- App.tsx
|   +-- main.tsx
+-- package.json
+-- vite.config.ts
```

## Setup Instructions

These instructions assume Node.js and npm are already installed.

### 1. Navigate to the project folder

From the repository root:

```bash
cd Homework3/dqfan
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

### 4. Open the app

Visit the local URL printed by Vite. Usually it is:

```text
http://localhost:5173/
```

## Build

To check that the project compiles for production:

```bash
npm run build
```

The production output is generated in the `dist` folder.

## Data Notes

Stock price files are loaded from `data/stockdata`. Each CSV file should include columns such as:

```text
Date,Open,High,Low,Close,Volume
```

News files are loaded from `data/stocknews/<ticker>/`. The app supports news file names in this format:

```text
YYYY-MM-DD HH-MM_Title.txt
```

For example:

```text
2026-04-24 10-35_This Tech Company Is a Top AI Stock on Robinhood. .txt
```

The UI uses `GOOGL` as the displayed ticker for Alphabet, while the updated stock data and news folder use `GOOG`.

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Runs TypeScript checks and builds the production version.

```bash
npm run lint
```

Runs ESLint on the project.

```bash
npm run preview
```

Serves the production build locally after `npm run build`.
