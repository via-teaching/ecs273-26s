##Vite was having trouble with some of the characters from the News article names (mainly punctuation like ?,!, etc.)
##So to make it easier to work with i used this script to convert the news files into json files
##I then stored those files into the public data directory

import os, json

src = os.path.join(os.path.dirname(__file__), 'data/stocknews')
dst = os.path.join(os.path.dirname(__file__), 'public/data/stocknews')
os.makedirs(dst, exist_ok=True)

for ticker in os.listdir(src):
    folder = os.path.join(src, ticker)
    if not os.path.isdir(folder):
        continue
    articles = []
    for fname in os.listdir(folder):
        if not fname.endswith('.txt'):
            continue
        with open(os.path.join(folder, fname), encoding='utf-8') as f:
            lines = f.read().split('\n')
        def get(key):
            line = next((l for l in lines if l.startswith(key + ':')), '')
            return line[len(key)+1:].strip()
        articles.append({
            'title': get('Title'),
            'date': get('Date'),
            'content': get('Content')
        })
    with open(os.path.join(dst, ticker + '.json'), 'w') as f:
        json.dump(articles, f)
    print(f'Saved {ticker}.json with {len(articles)} articles')

print('Done.')