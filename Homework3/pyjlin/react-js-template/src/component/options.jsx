export default function RenderOptions() {
    const stocks = [
        "AAPL", "BAC", "CAT", "CVX", "DAL",
        "GOOGL", "GS", "HAL", "JNJ", "JPM",
        "MCD", "META", "MSFT", "NKE", "NVDA",
        "MMM", "XOM", "UNH", "PEE"
    ];

    return stocks.map((stock, index) => (
        <option key={index} value={stock}>
            {stock}
        </option>
    ));
}