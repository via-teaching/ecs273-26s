# ECS 273 Homework 3 Submission

This repository contains my Homework 3 React application in `Homework3/dqfan`. The app visualizes stock data with linked views for stock prices, T-SNE positions, and related news articles.

## Project Location

The submitted project is located here:

```text
Homework3/dqfan
```

Main project files:

```text
Homework3/dqfan/
+-- data/
|   +-- stockdata/      # Stock price CSV files
|   +-- stocknews/      # Stock news text files
|   +-- tsne.csv        # T-SNE coordinates and categories
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

These instructions assume Node.js and npm are installed.

### 1. Clone the repository

```bash
git clone https://github.com/via-teaching/ecs273-26s.git
cd ecs273-26s
```

If running from an existing local copy, start from the repository root instead.

### 2. Navigate to the app folder

```bash
cd Homework3/dqfan
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the app

Visit the local URL printed by Vite. Usually it is:

```text
http://localhost:5173/
```

## Build Instructions

To verify the project builds successfully:

```bash
cd Homework3/dqfan
npm run build
```

The production files are generated in:

```text
Homework3/dqfan/dist
```

## App Description

The app contains three linked sections:

- `Stock Overview Line Chart`: displays price history for the selected stock.
- `T-SNE Scatter Plot`: displays stock positions from `data/tsne.csv`, colored by category.
- `List of News`: displays related news files for the selected stock.

Changing the stock selector updates all three views.

## Data Notes

Stock price data is stored in:

```text
Homework3/dqfan/data/stockdata
```

News article text files are stored in:

```text
Homework3/dqfan/data/stocknews
```

The news loader supports file names in this format:

```text
YYYY-MM-DD HH-MM_Title.txt
```

The UI displays Alphabet as `GOOGL`, while the updated data folder and stock CSV use `GOOG`.

## Available Scripts

Run these commands from `Homework3/dqfan`.

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

Runs ESLint.

```bash
npm run preview
```

Serves the production build locally after running `npm run build`.
