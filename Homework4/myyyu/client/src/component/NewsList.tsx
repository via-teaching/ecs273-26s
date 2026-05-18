import { useEffect, useState } from 'react';
import { loadNewsItems } from '../data/loaders';
import type { NewsItem } from '../types';

type NewsListProps = {
  selectedTicker: string;
  selectedName: string;
};

function NewsList({ selectedTicker, selectedName }: NewsListProps) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setExpandedIndex(0);

    loadNewsItems(selectedTicker)
      .then((nextItems) => {
        if (active) {
          setItems(nextItems);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedTicker]);

  return (
    <>
      <div className="panel-header">
        <div>
          <p className="panel-kicker">View 3</p>
          <h2 className="panel-title">{selectedTicker} News</h2>
          <p className="panel-note">
            Related articles for {selectedName}. Select a card to expand or collapse the full content.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">Loading news for {selectedTicker}...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No news items found for {selectedTicker}.</div>
      ) : (
        <div className="news-list">
          {items.map((item, index) => {
            const expanded = expandedIndex === index;

            return (
              <button
                aria-expanded={expanded}
                className="news-card"
                key={`${item.title}-${item.date}`}
                onClick={() => setExpandedIndex(expanded ? null : index)}
                type="button"
              >
                <p className="news-date">{formatDate(item.date)}</p>
                <h3 className="news-title">{item.title}</h3>
                {expanded ? <p className="news-content">{item.content}</p> : null}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default NewsList;
