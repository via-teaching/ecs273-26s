import { useEffect, useState } from "react";
import { Ticker } from "../stocks";

const bodyCache: Record<string, string> = {};

function parseFilename(file: string): { title: string; date: string } {
  const underscoreIdx = file.indexOf("_");
  const datePart = file.slice(0, underscoreIdx);
  const titlePart = file.slice(underscoreIdx + 1, -4);
  const date = datePart.replace(/(\d{2})-(\d{2})$/, "$1:$2");

  return { title: titlePart, date };
}

export default function NewsList({ ticker }: { ticker: Ticker }) {
  const [files, setFiles] = useState<string[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [bodies, setBodies] = useState<Record<string, string>>({});

  useEffect(() => {
    setOpenIdx(null);

    fetch(`/api/news-files/${ticker}`)
      .then(r => r.json())
      .then((list: string[]) => setFiles([...list].reverse()));
  }, [ticker]);

  async function toggle(i: number) {
    const file = files[i];
    if (openIdx === i) { setOpenIdx(null); return; }
    setOpenIdx(i);

    if (bodies[file] || bodyCache[file]) {
      if (bodyCache[file]) setBodies(prev => ({ ...prev, [file]: bodyCache[file] }));
      return;
    }

    const txt = await fetch(`/data/stocknews/${ticker}/${encodeURIComponent(file)}`).then(r => r.text());
    const body = txt.replace(/^[\s\S]*?\n\n/, "");
    bodyCache[file] = body;
    setBodies(prev => ({ ...prev, [file]: body }));
  }

  return (
    <div className="h-full overflow-y-auto">
      {files.map((file, i) => {
        const { title, date } = parseFilename(file);
        return (
          <button
            key={file}
            className="w-full text-left px-3 py-2 border-b border-gray-200 hover:bg-gray-100"
            onClick={() => toggle(i)}
          >
            <div className="font-medium text-sm">{title}</div>
            <div className="text-xs text-gray-500">{date}</div>
            {openIdx === i && (
              <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {bodies[file] ?? "Loading…"}
              </pre>
            )}
          </button>
        );
      })}
    </div>
  );
}
