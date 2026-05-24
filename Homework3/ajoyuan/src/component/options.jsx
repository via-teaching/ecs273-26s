export default function RenderOptions() {

    const myStocks = [
        "AAPL", "NVDA", "MSFT", "GOOGL", "META",
        "JPM", "GS", "BAC", "XOM", "CVX",
        "HAL", "MMM", "CAT", "DAL", "MCD",
        "NKE", "KO", "JNJ", "PFE", "UNH"
    ];

    return myStocks.map((ticker, index) => (
        <option key={index} value={ticker}>
            {ticker}
        </option>
    ));
}