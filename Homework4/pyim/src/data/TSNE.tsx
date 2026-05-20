import { TSNEDataPoint } from "../types";
import { API_BASE_URL } from "../config";

export async function fetchTSNE(): Promise<TSNEDataPoint[]> {
    try {
        const data: TSNEDataPoint[] = [];
        const stock_list_response = await fetch(`${API_BASE_URL}stock_list/`);
        const { tickers }: { tickers: string[] } = await stock_list_response.json();
        if (!tickers || tickers.length === 0) {
            throw new Error("No stocks found in stock list");
        }

        for (const ticker of tickers) {
            const tsne_response = await fetch(`${API_BASE_URL}tsne/?stock_name=${ticker}`);
            if (!tsne_response.ok) {
                console.warn(`No t-SNE data found for stock: ${ticker}`);
                continue;
            }

            const tsneData = await tsne_response.json();
            data.push({ x: tsneData.x, y: tsneData.y, sector: tsneData.sector, ticker: tsneData.stock });
        }

        return data;
    } catch (error) {
        console.error("Error fetching t-SNE data:", error);
        throw new Error("Failed to fetch t-SNE data");
    }
}
