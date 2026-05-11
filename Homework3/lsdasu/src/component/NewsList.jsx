import { useState, useMemo, useEffect } from 'react';
import newsData from '../../data/stocknews.json';

export function NewsList({ selectedStock }) {
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { setExpanded(null); }, [selectedStock]);

  const articles = useMemo(() => {
    if (!selectedStock || !newsData[selectedStock]) return [];
    return newsData[selectedStock];
  }, [selectedStock]);

  const handleExpand = (i) => setExpanded(expanded === i ? null : i);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '8px' }}>
      <h4 style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: '#374151' }}>
        {selectedStock} News ({articles.length} articles)
      </h4>
      {articles.length === 0 && (
        <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '40px' }}>No news available</p>
      )}
      {articles.map((article, i) => (
        <div
          key={i}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '8px',
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <button
            onClick={() => handleExpand(i)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              background: expanded === i ? '#eff6ff' : '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af', lineHeight: '1.3' }}>
              {article.title}
            </span>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>{article.date}</span>
          </button>
          {expanded === i && (
            <div style={{
              padding: '8px 12px 12px',
              fontSize: '12px',
              color: '#374151',
              lineHeight: '1.6',
              borderTop: '1px solid #e5e7eb',
              background: '#f9fafb',
            }}>
              {article.content
                ? article.content
                : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                    Full content not available.{' '}
                    {article.url && <a href={article.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Read original article ↗</a>}
                  </span>
              }
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
