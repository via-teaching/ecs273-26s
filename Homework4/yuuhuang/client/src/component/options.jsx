// import Data from "../../data/demo.json";

// export default function RenderOptions() {
//     const bars = Data.data;
//     return bars.map((bar, index) => (
//       <option key={index} value={bar.category}>
//         {bar.category}
//       </option>
//     ));
//   }


const TICKERS = [
  'AAPL', 'BAC', 'CAT', 'CVX', 'DAL',
  'GOOGL', 'GS', 'HAL', 'JNJ', 'JPM',
  'KO', 'MCD', 'META', 'MMM', 'MSFT',
  'NKE', 'NVDA', 'PFE', 'UNH', 'XOM'
];

export default function RenderOptions() {
  return TICKERS.map((ticker) => (
    <option key={ticker} value={ticker}>
      {ticker}
    </option>
  ));
}
