import {useEffect, useState} from "react";

export default function NewsList({ selectedStock }) {
  const [articles, setArticles] = useState([]);
  const [expanded, setExpanded] = useState(null);

  // reload articles when stock changes
  useEffect(() => {
    setExpanded(null);
    setArticles([]);

    loadArticles(selectedStock).then(function(arts) {
      setArticles(arts);
    });
  }, [selectedStock]);

  function handleClick(idx) {
    if (expanded === idx) {
      setExpanded(null);
    } else {
      setExpanded(idx);
    }
  }

  if (articles.length === 0) {
    return (
      <p className="text-gray-400 text-center mt-8 text-sm px-4">
        No news articles available for {selectedStock}.
      </p>
    );
  }

  return (
    <div className="overflow-y-auto h-full p-3 space-y-2">
      {articles.map(function(article, idx) {
        return (
          <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">

            <button
              className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={function() {handleClick(idx);}}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="font-medium text-sm text-gray-800 leading-snug">
                  {article.title}
                </span>
                <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                  {article.date}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {expanded === idx ? "▲ collapse" : "▼ expand"}
              </div>
            </button>

            {expanded === idx && (
              <div className="px-3 py-2 bg-white text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border-t border-gray-100">
                {article.content}
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}

// parse a .txt file from HW1
function parseArticle(filename, text) {
  var lines = text.trim().split("\n");
  var title = "";
  var date = "";
  var content = "";

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.startsWith("Title:")) {
      title = line.replace("Title:", "").trim();
    } else if (line.startsWith("Date:")) {
      date = line.replace("Date:", "").trim();
    } else if (line.startsWith("Content:")) {
      content = lines.slice(i).join("\n").replace("Content:", "").trim();
      break;
    }
  }

  if (!title) {
    title = filename.replace(".txt", "");
  }

  return {title: title, date: date, content: content};
}

// try manifest first then numbered filenames
async function loadArticles(ticker) {
  try {
    var manifestResp = await fetch("/stocknews/" + ticker + "/manifest.txt");
    if (manifestResp.ok) {
      var manifestText = await manifestResp.text();
      var filenames = manifestText.trim().split("\n");
      filenames = filenames.map(function(f) {return f.trim();}).filter(function(f) {return f.length > 0;});

      var arts = [];
      for (var i = 0; i < filenames.length; i++) {
        try {
          var resp = await fetch("/stocknews/" + ticker + "/" + filenames[i]);
          var ct = resp.headers.get("content-type") || "";
          if (resp.ok && ct.includes("text/plain")) {
            var text = await resp.text();
            arts.push(parseArticle(filenames[i], text));
          }
        } catch(e) {
          // skip files that fail to load
        }
      }
      return arts;
    }
  } catch(e) {
    // no manifest then try numbered fallback
  }

  // fallback of try article_1.txt through article_10.txt
  var arts = [];
  for (var j = 1; j <= 10; j++) {
    var fname = "article_" + j + ".txt";
    try {
      var r = await fetch("/stocknews/" + ticker + "/" + fname);
      var contentType = r.headers.get("content-type") || "";
      if (r.ok && contentType.includes("text/plain")) {
        var t = await r.text();
        arts.push(parseArticle(fname, t));
      }
    } catch(e) {
      // file doesn't exist, keep going
    }
  }
  return arts;
}
