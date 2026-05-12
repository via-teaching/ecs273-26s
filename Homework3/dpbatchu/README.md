# HW3 – D3 Interactive Stock Visualization
## ECS 273 Visual Analytics · UC Davis · Spring 2026

---

## Setup

```bash
npm install
npm run dev
```

App opens at http://localhost:5173

---

## Data Layout

Place your HW1/HW2 data under `public/`:

```
public/
└── data/
    ├── stockdata/          ← HW1 Task 1 CSVs (2 years of daily OHLC)
    │   ├── AAPL.csv
    │   ├── MSFT.csv
    │   └── ... (20 stocks)
    ├── stocknews/          ← HW1 Task 2 news
    │   ├── AAPL/
    │   │   └── news.json
    │   ├── MSFT/
    │   │   └── news.json
    │   └── ...
    └── tsne.csv            ← HW2 t-SNE output
```

---

## Data Formats

### stockdata/TICKER.csv
Must have these columns (case-insensitive):
```
Date,Open,High,Low,Close,Volume
2023-01-03,130.28,130.90,124.17,125.07,112117500
...
```

### stocknews/TICKER/news.json
JSON array:
```json
[
  {
    "title": "Apple posts record quarter...",
    "date": "2024-02-02",
    "content": "Full article text here...",
    "source": "Reuters"
  }
]
```

### tsne.csv
One row per stock, columns: `ticker`, `x`, `y`
(sector is auto-mapped from option.ts)
```
ticker,x,y
AAPL,-2.31,1.54
MSFT,-2.18,1.72
NVDA,-1.87,2.01
...
```

---

## Features Implemented

| Requirement | Status |
|---|---|
| Dropdown with 20 stocks | ✅ |
| View 1: Line chart (Open/High/Low/Close) | ✅ |
| View 1: Legend | ✅ |
| View 1: Labeled axes | ✅ |
| View 1: Horizontal zoom (scroll wheel) | ✅ |
| View 1: Horizontal scroll (pan) | ✅ |
| View 2: t-SNE scatter plot | ✅ |
| View 2: Color by sector | ✅ |
| View 2: Highlight selected stock (larger dot + label) | ✅ |
| View 2: Sector legend | ✅ |
| View 2: Labeled axes | ✅ |
| View 2: Zoom | ✅ |
| View 3: News list (title + date) | ✅ |
| View 3: Click to expand full content | ✅ |
| **Bonus**: Linking – dropdown updates all 3 views | ✅ |
| **Bonus**: Click t-SNE dot to select stock | ✅ |

---

## Submission

Your folder: `Homework3/dpbatchu/`

Files to include:
- `src/` (all component files)
- `index.html`
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `public/data/` (your actual data files)
