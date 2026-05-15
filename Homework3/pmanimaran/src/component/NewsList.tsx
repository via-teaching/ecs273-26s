import { useEffect, useState } from 'react';
import { NewsItem } from '../types';

function parseTxt(raw: string, filename: string): NewsItem {
  const sections: Record<string, string> = { Title: '', Date: '', URL: '', Content: '' };
  let current = '';
  const buf: string[] = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed in sections) {
      if (current) sections[current] = buf.join('\n').trim();
      current = trimmed;
      buf.length = 0;
    } else if (current) {
      buf.push(line);
    }
  }
  if (current) sections[current] = buf.join('\n').trim();

  return {
    title: sections['Title'] || filename.replace(/\.txt$/, ''),
    date: sections['Date'],
    url: sections['URL'],
    content: sections['Content'],
  };
}

export function NewsList({ selectedStock }: { selectedStock: string }) {
  const [index, setIndex] = useState<Record<string, string[]>>({});
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/data/newsindex.json')
      .then((r) => r.json())
      .then((data: Record<string, string[]>) => setIndex(data));
  }, []);

  useEffect(() => {
    const filenames = index[selectedStock];
    if (!filenames || filenames.length === 0) {
      setArticles([]);
      setExpanded(new Set([0]));
      return;
    }

    setLoading(true);
    setArticles([]);
    setExpanded(new Set([0])); // auto-expand first article on stock change

    Promise.all(
      filenames.map((fname) =>
        fetch(`/data/stocknews/${selectedStock}/${encodeURIComponent(fname)}`)
          .then((r) => r.text())
          .then((raw) => parseTxt(raw, fname))
      )
    ).then((parsed) => {
      setArticles(parsed);
      setLoading(false);
    });
  }, [index, selectedStock]);

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  if (loading) {
    return <div className="p-3 text-gray-400 text-sm">Loading news…</div>;
  }

  if (articles.length === 0) {
    return <div className="p-3 text-gray-400 text-sm">No news available for {selectedStock}.</div>;
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%' }} className="p-2">
      {articles.map((article, i) => (
        <div
          key={i}
          className="mb-2 border border-gray-200 rounded-lg overflow-hidden"
          style={{ background: '#fff' }}
        >
          <button
            onClick={() => toggle(i)}
            className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
            style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
          >
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm font-medium text-gray-800 leading-snug">{article.title}</p>
              <span className="text-gray-400 text-xs flex-shrink-0 mt-0.5">
                {expanded.has(i) ? '▲' : '▼'}
              </span>
            </div>
            {article.date && (
              <p className="text-xs text-gray-400 mt-1">{article.date}</p>
            )}
          </button>

          {expanded.has(i) && (
            <div className="px-3 pb-3 border-t border-gray-100">
              <p
                className="text-xs text-gray-700 mt-2 leading-relaxed"
                style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}
              >
                {article.content || 'No content available.'}
              </p>
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 mt-2 block hover:underline"
                >
                  Read original →
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
