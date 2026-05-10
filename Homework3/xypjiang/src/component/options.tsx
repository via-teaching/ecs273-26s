import Data from "../../data/demo.json";

const TICKERS = ['XOM', 'CVX', 'HAL', 'MMM', 'CAT', 'DAL', 'MCD', 'NKE', 'KO', 'JNJ', 'PFE', 
               'UNH', 'JPM', 'GS', 'BAC', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'];
export default function RenderOptions() {
  return TICKERS.map((ticker, index) => (
    <option key={index} value={ticker}>
      {ticker}
    </option>
  ));
}