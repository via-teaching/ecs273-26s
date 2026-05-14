# Homework 3

My HW3 folder is:
`prodriguezqu/`

I used the React + TypeScript template.

## How to run

Go into my folder:
```
cd Homework3/prodriguezqu
```

Install packages:
```
npm install
```

Run the app:
```
npm run dev
```

Then open the Vite link in the browser. Usually it is on port `5173`.
If you just want to make sure it builds:
```
npm run build
```

## Notes

- The stock csv files are in `data/stockdata/`
- The stock news text files are in `data/stocknews/`
- The t-SNE data is in `data/tsne.csv`

- For the news view, I kept the original `.txt` files from the complete answer example
- I ran into an issue with some of the stocknews filenames when trying to load them directly in the app, so I used a small Vite-side helper to read those files without renaming the dataset.
- Because of that, I added the Node type package for TypeScript support. There should not be any extra setup besides normal `npm install`.

- Some of the HW1 news files, including the TA answer version, have article text that starts with `Oops, something went wrong` or the Yahoo symbol tip message.
- I filtered those out in the app because I thought it made the news panel cleaner and easier to read.

## Files I changed

- `src/App.tsx`
- `src/component/options.tsx`
- `src/component/LineChart.tsx`
- `src/component/TSNEScatter.tsx`
- `src/component/NewsList.tsx`
- `vite.config.ts`
