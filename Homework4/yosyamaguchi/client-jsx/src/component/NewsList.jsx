import { useState } from "react";

export function NewsList({ articles }) {
  const [openKey, setOpenKey] = useState(null);

  if (!articles || articles.length === 0) {
    return <p className="p-4 text-gray-500">No news available.</p>;
  }

  return (
    <div className="h-full overflow-y-auto p-2">
      {articles.map((item) => {
        const key = `${item.Date}-${item.Title}`;
        return (
          <button
            key={key}
            type="button"
            className="mb-2 w-full border-b border-gray-200 pb-2 text-left"
            onClick={() => setOpenKey(openKey === key ? null : key)}
          >
            <div className="text-sm font-semibold text-black">{item.Title}</div>
            <div className="text-xs text-gray-500">{item.Date}</div>
            {openKey === key && (
              <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {item.content}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
