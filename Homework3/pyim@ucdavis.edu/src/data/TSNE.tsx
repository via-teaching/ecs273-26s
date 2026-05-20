import * as d3 from "d3";
import { TSNEDataPoint } from "../types";

async function loadTSNE(): Promise<TSNEDataPoint[]> {
    const csv = new URL(`../../data/t-SNE/tsne_latent.csv`, import.meta.url).href;
    const rows = await d3.csv(csv, (d) => {
        const x = Number(d.tsne_x) || 0;
        const y = Number(d.tsne_y) || 0;
        const sector = d.sector ?? "";
        const ticker = d.ticker ?? "";
        return { x, y, sector, ticker };
    });

    if (rows === null) {
        throw new Error("Failed to load t-SNE data");
    }

    return rows.filter((r): r is { x: number; y: number; sector: string; ticker: string } => r != null);
}

export { loadTSNE };