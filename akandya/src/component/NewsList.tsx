import { useEffect, useState } from "react";

type NewsItem = {
  title: string;
  date: string;
  content: string;
};

type Props = {
  selectedStock: string;
};

export default function NewsList({ selectedStock }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch(`./data/stocknews/${selectedStock}/news.json`)
      .then((res) => res.json())
      .then((data) => setNews(data));
  }, [selectedStock]);

  return (
    <div>
      <h2>{selectedStock} News</h2>
      {news.map((item, index) => (
        <div
          key={index}
          style={{
            border: "1px solid gray",
            marginBottom: "10px",
            padding: "10px",
            cursor: "pointer",
          }}
          onClick={() =>
            setExpanded(expanded === index ? null : index)
          }
        >
          <h3>{item.title}</h3>
          <p>{item.date}</p>

          {expanded === index && (
            <p>{item.content}</p>
          )}
        </div>
      ))}
    </div>
  );
}