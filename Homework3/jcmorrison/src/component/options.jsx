// instead of the example, use hardcoded from HW 1
const TICKERS = [
{symbol:"XOM", name:"ExxonMobil"},
  {symbol:"CVX", name:"Chevron"},
  {symbol:"HAL", name:"Halliburton"},
  {symbol:"MMM", name:"3M"},
  {symbol:"CAT", name:"Caterpillar"},
  {symbol:"DAL", name:"Delta Air Lines"},
  {symbol:"MCD", name:"McDonald's"},
  {symbol:"NKE", name:"Nike"},
  {symbol:"KO",  name:"Coca-Cola"},
  {symbol:"JNJ", name:"Johnson & Johnson"},
  {symbol:"PFE", name:"Pfizer"},
  {symbol:"UNH", name:"UnitedHealth"},
  {symbol:"JPM", name:"JPMorgan Chase"},
  {symbol:"GS",  name:"Goldman Sachs"},
  {symbol:"BAC", name:"Bank of America"},
  {symbol:"AAPL", name:"Apple"},
  {symbol:"MSFT", name:"Microsoft"},
  {symbol:"NVDA", name:"NVIDIA"},
  {symbol:"GOOGL", name:"Alphabet"},
  {symbol:"META", name:"Meta"},
];

export default function RenderOptions() {
  return TICKERS.map((ticker, index) => (
    <option key={index} value={ticker.symbol}>
      {ticker.symbol} - {ticker.name}
    </option>
  ));
}

export {TICKERS};
