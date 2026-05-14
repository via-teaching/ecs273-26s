import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

export function NewsList({ selectedStock }) {
  const containerRef = useRef(null);
  const [articles, setArticles] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setExpandedIndex(0);  //for bonus point i have set the expanded index to 0 thanks!
    setArticles([]);

    const newsFiles = import.meta.glob('/data/stocknews/**/!(*%*).txt', {
      query: '?raw',
      import: 'default',
      eager: true,
    });

    const matchingFiles = Object.entries(newsFiles).filter(([path]) =>
      path.includes(`/stocknews/${selectedStock}/`)
    );

    const results = matchingFiles.map(([path, raw]) => {
      const titleMatch = raw.match(/^Title:\s*(.+)/m);
      const dateMatch = raw.match(/^Date:\s*(.+)/m);
      const urlMatch = raw.match(/^URL:\s*(.+)/m);
      const contentStart = raw.indexOf('\n\n', raw.indexOf('URL:'));
      const content = contentStart !== -1 ? raw.slice(contentStart).trim() : raw;

      return {
        title: titleMatch ? titleMatch[1].trim() : 'No Title',
        date: dateMatch ? dateMatch[1].trim() : 'No Date',
        url: urlMatch ? urlMatch[1].trim() : '#',
        content,
        path,
      };
    });

    results.sort((a, b) => b.date.localeCompare(a.date));
    setArticles(results);
  }, [selectedStock]);

  const toggleExpand = (index) => {
    setExpandedIndex(prev => prev === index ? null : index);
  };

  return (
    <div
      className="chart-container d-flex"
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    >
      <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
          News for {selectedStock} ({articles.length} articles)
        </h4>
        {articles.length === 0 && (
          <p style={{ color: '#888', fontSize: '13px' }}>No news found for {selectedStock}.</p>
        )}
        {articles.map((article, i) => (
          <div
            key={i}
            onClick={() => toggleExpand(i)}
            style={{
              marginBottom: '8px',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: expandedIndex === i ? '#e8f0fe' : '#fff',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>
              {article.title}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              {article.date}
            </div>
            {expandedIndex === i && (
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#333',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                borderTop: '1px solid #ddd',
                paddingTop: '8px'
              }}>
                {article.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
