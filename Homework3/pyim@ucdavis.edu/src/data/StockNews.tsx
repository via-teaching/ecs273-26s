import { StockNewsRow } from "../types";

function parseNewsFile(fileContent: string): StockNewsRow | null {
    try {
        const titleMatch = fileContent.match(/Title:\s*(.+)/);
        const title = titleMatch ? titleMatch[1].trim() : "";

        const dateMatch = fileContent.match(/Date:\s*(.+)/);
        const dateStr = dateMatch ? dateMatch[1].trim() : "";

        const contentMatch = fileContent.match(/--Article Content--\s*([\s\S]*)/);
        const content = contentMatch ? contentMatch[1].trim() : "";

        if (!title || !dateStr || !content) {
            return null;
        }

        return { 
            title, 
            date: new Date(dateStr), 
            content 
        };
    } catch (error) {
        console.error("Error parsing news file:", error);
        return null;
    }
}

export async function loadStockNews(stock: string): Promise<StockNewsRow[]> {
    try {
        // Use glob to load all text files from the stocknews directory
        const files = import.meta.glob<string>("../../data/stocknews/**/*.txt", { as: "raw" });
        
        const stockPattern = `../../data/stocknews/${stock}/`;
        const stockFiles = Object.entries(files)
            .filter(([path]) => path.startsWith(stockPattern))
            .map(([_path, importFn]) => importFn());

        const newsRows: StockNewsRow[] = [];

        for (const filePromise of stockFiles) {
            const fileContent = await filePromise;
            const parsed = parseNewsFile(fileContent);
            if (parsed) {
                newsRows.push(parsed);
            }
        }

        newsRows.sort((a, b) => b.date.getTime() - a.date.getTime());

        return newsRows;
    } catch (error) {
        console.error("Error loading stock news:", error);
        return [];
    }
}