
// Grouped by sector
// const grouped_tickers = ['XOM', 'CVX', 'HAL',
//                'MMM', 'CAT', 'DAL',
//                'MCD', 'NKE', 'KO',
//                'JNJ', 'PFE', 'UNH',
//                'JPM', 'GS', 'BAC',
//                'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']

// Alphabetical order
const tickers = ['AAPL', 'BAC', 'CAT', 'CVX', 'DAL', 'GOOGL', 'GS', 'HAL', 'JNJ', 'JPM', 'KO', 'MCD', 'META', 'MMM', 'MSFT', 'NKE', 'NVDA', 'PFE', 'UNH', 'XOM']

  export default function RenderOptions() {
      return tickers.map((ticker, index) => (
          <option key = {index} value = {ticker}>
              {ticker}
          </option>
      ));
  }