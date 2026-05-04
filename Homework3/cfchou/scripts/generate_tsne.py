import os
import numpy as np
import pandas as pd
from sklearn.manifold import TSNE

SECTOR_MAP = {
    'AAPL': 'Tech', 'MSFT': 'Tech', 'GOOGL': 'Tech', 'META': 'Tech', 'NVDA': 'Tech',
    'JPM': 'Finance', 'BAC': 'Finance', 'GS': 'Finance',
    'JNJ': 'Healthcare', 'PFE': 'Healthcare', 'UNH': 'Healthcare',
    'KO': 'Consumer', 'NKE': 'Consumer', 'MCD': 'Consumer',
    'CAT': 'Industrial', 'MMM': 'Industrial', 'DAL': 'Industrial',
    'XOM': 'Energy', 'CVX': 'Energy', 'HAL': 'Energy',
}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data', 'stockdata')
OUT_PATH = os.path.join(ROOT, 'data', 'tsne.csv')


def load_features():
    raw = {}
    for sym in SECTOR_MAP:
        df = pd.read_csv(os.path.join(DATA_DIR, f'{sym}.csv'))
        raw[sym] = df['Close'].values
    T = min(len(v) for v in raw.values())

    X, symbols, sectors = [], [], []
    for sym, sec in SECTOR_MAP.items():
        closes = raw[sym][:T]
        feat = (closes / closes[0]) - 1.0
        X.append(feat)
        symbols.append(sym)
        sectors.append(sec)
    return np.asarray(X, dtype=float), symbols, sectors


def main():
    X, symbols, sectors = load_features()
    print(f'Feature matrix: {X.shape} (20 stocks × {X.shape[1]} days)')

    tsne = TSNE(n_components=2, random_state=42, perplexity=5, init='pca', learning_rate='auto')
    coords = tsne.fit_transform(X)

    df = pd.DataFrame({
        'symbol': symbols,
        'x': coords[:, 0],
        'y': coords[:, 1],
        'sector': sectors,
    })
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    df.to_csv(OUT_PATH, index=False)
    print(f'Wrote {OUT_PATH}')
    print(df.to_string(index=False))


if __name__ == '__main__':
    main()
