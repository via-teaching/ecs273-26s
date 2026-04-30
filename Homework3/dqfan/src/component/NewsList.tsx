import { useEffect, useMemo, useState } from "react";
import newsFiles from "virtual:stock-news";

interface NewsItem {
  id: string;
  ticker: string;
  title: string;
  date: string;
  content: string;
}

interface NewsListProps {
  selectedStock: string;
}

const allNews: NewsItem[] = newsFiles
  .map(({ path, content }) => parseNewsFile(path, content))
  .filter((item): item is NewsItem => item !== null)
  .sort((a, b) => b.date.localeCompare(a.date));

const stockKeywords: Record<string, string[]> = {
  AAPL: ["AAPL", "Apple", "iPhone"],
  BAC: ["BAC", "Bank of America", "BofA"],
  CAT: ["CAT", "Caterpillar"],
  CVX: ["CVX", "Chevron"],
  DAL: ["DAL", "Delta Air Lines", "Delta"],
  GOOGL: ["GOOGL", "Google", "Alphabet"],
  GS: ["GS", "Goldman Sachs", "Goldman"],
  HAL: ["HAL", "Halliburton"],
  JNJ: ["JNJ", "Johnson & Johnson"],
  JPM: ["JPM", "JPMorgan", "JP Morgan", "Chase"],
  KO: ["KO", "Coca-Cola", "Coca Cola"],
  MCD: ["MCD", "McDonald's", "McDonald"],
  META: ["META", "Meta", "Facebook"],
  MMM: ["MMM", "3M"],
  MSFT: ["MSFT", "Microsoft"],
  NKE: ["NKE", "Nike"],
  NVDA: ["NVDA", "Nvidia", "NVIDIA"],
  PFE: ["PFE", "Pfizer"],
  UNH: ["UNH", "UnitedHealth", "UnitedHealth Group"],
  XOM: ["XOM", "Exxon", "ExxonMobil"],
};

export default function NewsList({ selectedStock }: NewsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const news = useMemo(
    () => {
      const folderMatches = allNews.filter((item) => item.ticker === selectedStock);
      const relevantMatches = folderMatches.filter((item) =>
        isRelevantNews(item, selectedStock)
      );

      return relevantMatches.length > 0 ? relevantMatches : folderMatches;
    },
    [selectedStock]
  );

  useEffect(() => {
    setExpandedId(news[0]?.id ?? null);
  }, [news]);

  if (news.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        No news found for {selectedStock}.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="space-y-2">
        {news.map((item) => {
          const isExpanded = item.id === expandedId;

          return (
            <button
              key={item.id}
              type="button"
              className="w-full rounded border border-gray-300 bg-white p-3 text-left shadow-sm transition hover:border-gray-500"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
            >
              <div className="text-xs font-semibold text-gray-500">{item.date}</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{item.title}</div>
              {isExpanded && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {item.content}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isRelevantNews(item: NewsItem, selectedStock: string) {
  const keywords = stockKeywords[selectedStock] ?? [selectedStock];
  const searchableText = `${item.title}\n${item.content}`.toLowerCase();

  return keywords.some((keyword) => searchableText.includes(keyword.toLowerCase()));
}

function parseNewsFile(path: string, content: string): NewsItem | null {
  const normalizedPath = path.replace(/\\/g, "/");
  const match = normalizedPath.match(/\/stocknews\/([^/]+)\/([^/]+)\.txt$/);

  if (!match) {
    return null;
  }

  const [, rawTicker, fileName] = match;
  const ticker = rawTicker === "GOOG" ? "GOOGL" : rawTicker;
  const fileMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})[ _](\d{2}-\d{2})_(.+)$/);

  if (!fileMatch) {
    return null;
  }

  const [, datePart, timePart, rawTitle] = fileMatch;

  return {
    id: normalizedPath,
    ticker,
    title: rawTitle.replace(/_/g, ":"),
    date: `${datePart} ${timePart.replace("-", ":")}`,
    content,
  };
}
