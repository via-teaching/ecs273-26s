export const stocks = [
  "AAPL","BAC","CAT","CVX","DAL","GOOG","GS","HAL","JNJ","JPM",
  "KO","MCD","META","MMM","MSFT","NKE","NVDA","PFE","UNH","XOM",
] as const;

export type Ticker = typeof stocks[number];
