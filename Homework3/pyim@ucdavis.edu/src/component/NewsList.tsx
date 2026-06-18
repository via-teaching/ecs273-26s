import { useState, useEffect } from "react";
import { StockNewsRow } from "../types";
import { loadStockNews } from "../data/StockNews";

export function NewsList({ stock = "AAPL" }: { stock?: string }) {
    const [rows, setRows] = useState<string[][]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const toggleRow = (rowIndex: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rowIndex)) {
                newSet.delete(rowIndex);
            } else {
                newSet.add(rowIndex);
            }
            return newSet;
        });
    };

    useEffect(() => {
        console.log("Loading news for stock:", stock);
        loadStockNews(stock).then((news: StockNewsRow[]) => {
            const newsRows = news.map(n => [n.title, n.date.toLocaleDateString(), n.content]);
            setRows(newsRows);
        }).catch((error) => {
            console.error("Error loading stock news", error);
        });
    }, [stock]);


    return (
        <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] flex min-h-0 flex-col overflow-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 table-fixed">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                    <tr>
                        <th className="px-6 py-3 w-1/3">Title</th>
                        <th className="px-6 py-3 w-1/6">Date</th>
                        <th className="px-6 py-3 w-1/2">Content</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {rows.map((row, rowIndex: number) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer" onClick={() => toggleRow(rowIndex)}>
                            {row.map((cell, cellIndex: number) => {
                                const isExpanded = expandedRows.has(rowIndex);
                                let displayText = cell;
                                let cellClass = "px-6 py-4 overflow-hidden";

                                if (cellIndex === 0) { // Title column
                                    if (!isExpanded && cell.length > 40) {
                                        displayText = cell.slice(0, 40) + "...";
                                        cellClass += " whitespace-nowrap text-ellipsis";
                                    } else if (isExpanded) {
                                        cellClass += " whitespace-normal";
                                    } else {
                                        cellClass += " whitespace-nowrap text-ellipsis";
                                    }
                                } else if (cellIndex === 1) { // Date column
                                    cellClass += " whitespace-nowrap";
                                } else if (cellIndex === 2) { // Content column
                                    if (!isExpanded && cell.length > 50) {
                                        displayText = cell.slice(0, 50) + "...";
                                        cellClass += " whitespace-nowrap text-ellipsis";
                                    } else if (isExpanded) {
                                        cellClass += " whitespace-normal";
                                    } else {
                                        cellClass += " whitespace-nowrap text-ellipsis";
                                    }
                                }

                                return (
                                    <td key={cellIndex} className={cellClass}>{displayText}</td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

}