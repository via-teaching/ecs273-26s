import { useEffect, useState } from "react";
import { Ticker } from "../types";

const API = "http://localhost:8000";

interface NewsArticle {
  Stock: string;
  Title: string;
  Date: string;
  content: string;
}

export default function NewsList({ ticker }: { ticker: Ticker }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => {
    if (!ticker) return;
    fetch(`${API}/stocknews/?stock_name=${ticker}`)
      .then(res => res.json())
      .then((data: NewsArticle[]) => {
        setArticles([...data].reverse());
        setOpenIdx(0);
      })
      .catch(() => setArticles([]));
  }, [ticker]);

  function toggleArticle(i: number) {
    setOpenIdx(prev => (prev === i ? null : i));
  }

  return (
    <div className="h-full overflow-y-auto">
      {articles.map((article, i) => (
        <button
          key={`${article.Date}-${i}`}
          className="w-full text-left px-3 py-2 border-b border-gray-200 hover:bg-gray-100"
          onClick={() => toggleArticle(i)}
        >
          <div className="font-medium text-sm">{article.Title}</div>
          <div className="text-xs text-gray-500">{article.Date}</div>
          {openIdx === i && (
            <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
              {article.content}
            </pre>
          )}
        </button>
      ))}
    </div>
  );
}
