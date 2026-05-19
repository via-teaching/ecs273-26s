import { useEffect, useState } from "react";

type NewsItem = {
  ticker?: string;
  title: string;
  date: string;
  url: string;
  content: string;
};

type Props = {
  ticker: string;
};

export default function NewsList({ ticker }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadNews() {
      try {
        setError("");
        setOpenIndex(null);

        const response = await fetch(`/data/stocknews/${ticker}/news.json`);

        if (!response.ok) {
          throw new Error(`Could not load news.json for ${ticker}`);
        }

        const items: NewsItem[] = await response.json();

        setNews(items);
      } catch (err) {
        console.error(err);
        setNews([]);
        setError(`No news found for ${ticker}. Check public/data/stocknews/${ticker}/news.json`);
      }
    }

    loadNews();
  }, [ticker]);

  return (
    <div className="p-3">
      <h2 className="text-xl font-bold mb-4">{ticker} News</h2>

      {error && (
        <p className="text-red-500 text-sm mb-4">
          {error}
        </p>
      )}

      {!error && news.length === 0 && (
        <p className="text-gray-500 text-sm">
          Loading news...
        </p>
      )}

      <div className="space-y-3">
        {news.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="border rounded p-3 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <div className="font-semibold text-gray-800">
              {item.title}
            </div>

            <div className="text-sm text-gray-500 mt-1">
              {item.date}
            </div>

            {openIndex === index && (
              <div className="mt-3 text-sm leading-relaxed text-gray-700">
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline block mb-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Source Link
                  </a>
                )}

                <p>
                  {item.content || "No article content available."}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}