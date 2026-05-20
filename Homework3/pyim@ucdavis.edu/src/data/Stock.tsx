import * as d3 from "d3";
import { StockRow } from "../types";

function parseRow(d: Record<string, string>): StockRow | null {
    const date = new Date(d.Date ?? "");
    const close = Number(d.Close) || 0;
    const open = Number(d.Open) || 0;
    const high = Number(d.High) || 0;
    const low = Number(d.Low) || 0;

    return { date, close, open, high, low };
}

async function loadStock(stock: string): Promise<StockRow[]> {
    const csv = new URL(`../../data/stockdata/${stock}.csv`, import.meta.url).href;
    const rows = await d3.csv(csv, parseRow);
    if (rows === null) {
        throw new Error(`Failed to load stock data for ${stock}`);
    }

    return rows.filter((r): r is StockRow => r != null);
}

export { loadStock };