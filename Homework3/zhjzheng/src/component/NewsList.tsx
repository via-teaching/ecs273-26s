import { useEffect, useState } from 'react'
import newsData from '../../data/stocknews.json'

interface NewsItem {
  title: string
  date: string
  content: string
}

export default function NewsList({ ticker }: { ticker: string }) {
  const [newsList, setNewsList] = useState<NewsItem[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    setExpanded(null)
    const items = (newsData as Record<string, NewsItem[]>)[ticker] || []
    setNewsList(items)
  }, [ticker])

  if (!newsList.length) return <p className="p-4 text-gray-400">Loading news...</p>

  return (
    <div className="p-2">
      {newsList.map((item, i) => (
        <div
          key={i}
          className="border-b border-gray-200 py-2 cursor-pointer"
          onClick={() => setExpanded(expanded === i ? null : i)}
        >
          <div className="font-medium text-sm">{item.title || '(no title)'}</div>
          <div className="text-xs text-gray-500 mt-1">{item.date}</div>
          {expanded === i && (
            <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
