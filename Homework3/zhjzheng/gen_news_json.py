import os, json

news_dir = 'data/stocknews'
result = {}

for ticker in os.listdir(news_dir):
    ticker_path = os.path.join(news_dir, ticker)
    if not os.path.isdir(ticker_path):
        continue
    result[ticker] = []
    for fname in os.listdir(ticker_path):
        if not fname.endswith('.txt'):
            continue
        fpath = os.path.join(ticker_path, fname)
        with open(fpath, encoding='utf-8', errors='ignore') as f:
            raw = f.read()

        lines = raw.split('\n')
        title, date, content_lines = '', '', []
        past_sep = False
        for line in lines:
            if line.startswith('Title:'):
                title = line.replace('Title:', '').strip()
            elif line.startswith('Date:'):
                date = line.replace('Date:', '').strip()
            elif line.startswith('---'):
                past_sep = True
            elif past_sep:
                content_lines.append(line)

        result[ticker].append({
            'title': title,
            'date': date,
            'content': '\n'.join(content_lines).strip()
        })

    result[ticker].sort(key=lambda x: x['date'], reverse=True)

with open('data/stocknews.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print('done, saved to data/stocknews.json')
