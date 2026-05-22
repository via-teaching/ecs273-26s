import { useEffect, useState } from "react";
import stockNews from "../../data/stocknews.json";

export default function NewsList({ selectedStock }) {
  const [news, setNews] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {

    // this will load news for the currently selected stock
    const stockItems = stockNews[selectedStock] || [];

    setNews(stockItems);

    // this automatically open first article
    setOpenIndex(stockItems.length ? 0 : null);

  }, [selectedStock]);

  // this will show a simple message if there is no news for the stock
  if (!news.length) {
    return (
      <p className="p-4 text-gray-400">
        No news available
      </p>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-2">

      {/* this will loop through all news articles for the selected stock */}
      {news.map((item, i) => (
        <div
          key={i}
          className="border-b py-2 cursor-pointer"
          onClick={() =>
            setOpenIndex(openIndex === i ? null : i)
          }
        >

          {/* this will show the article title preview */}
          <div className="font-medium text-sm">
            {item.title}
          </div>

          {/* this will show the article date preview */}
          <div className="text-xs text-gray-500">
            {item.date}
          </div>

          {/* this will expand and show full article content when clicked */}
          {openIndex === i && (
            <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
              {item.content}
            </div>
          )}

        </div>
      ))}

    </div>
  );
}