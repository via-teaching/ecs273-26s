// import Data from "../../data/demo.json";

const stockTickers = [
  'XOM', 'CVX', 'HAL',
  'MMM', 'CAT', 'DAL',
  'MCD', 'NKE', 'KO',
  'JNJ', 'PFE', 'UNH',
  'JPM', 'GS', 'BAC',
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'
]

export default function RenderOptions() {
    // const bars = Data.data;
    return stockTickers.sort().map((ticker, index) => (
      <option key={index} value={ticker}>
        {ticker}
      </option>
    ));
  }
