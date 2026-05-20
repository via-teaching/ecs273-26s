import { API_BASE_URL } from "../config";
import { StockNewsRow } from "../types";

export async function fetchStockNews(stock: string): Promise<StockNewsRow[]> {
    try {
        const response = await fetch(`${API_BASE_URL}stocknews/?stock_name=${stock}`);
        const newsData = await response.json();
        if (!newsData || !newsData.news) {
            throw new Error(`Unexpected response format: ${JSON.stringify(newsData)}`);
        }

        const { news } : { news: any[] } = newsData;

        return news.map((d: any) => ({
            title: d.title,
            date: new Date(d.date),
            content: d.content
        }));
    } catch (error) {
        console.error("Error fetching stock news:", error);
        return [];
    }
}