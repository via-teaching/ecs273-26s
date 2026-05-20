import { StockRow } from "../types";
import { API_BASE_URL } from "../config";

function parseRow(d: Record<string, string>): StockRow | null {
    const date = new Date(d.date ?? "");
    const close = Number(d.close) || 0;
    const open = Number(d.open) || 0;
    const high = Number(d.high) || 0;
    const low = Number(d.low) || 0;

    return { date, close, open, high, low };
}

async function fetchStockData(stock: string): Promise<StockRow[]> {
    try {
        const data = await fetch(`${API_BASE_URL}stock/${stock}`);
        const jsonData = await data.json();
        const { stock_series } : { stock_series: any[] } = jsonData;
        
        return stock_series?.map((item) => parseRow(item)).filter((r): r is StockRow => r != null) || [];
    } catch (error) {
        console.error("Error fetching stock data:", error);
        return [];
    }
}

export { fetchStockData };