import torch
import numpy as np
import pandas as pd
from sklearn.manifold import TSNE
from torch.utils.data import DataLoader
from hw2Script import StockDataset, LSTMAutoencoder, train_autoencoder, get_latent

# Define stock categories
SECTOR_MAP = {
    'XOM': 'Energy', 'CVX': 'Energy', 'HAL': 'Energy',
    'MMM': 'Industrials', 'CAT': 'Industrials', 'DAL': 'Industrials',
    'MCD': 'Consumer', 'NKE': 'Consumer', 'KO': 'Consumer',
    'JNJ': 'Healthcare', 'PFE': 'Healthcare', 'UNH': 'Healthcare',
    'JPM': 'Financials', 'GS': 'Financials', 'BAC': 'Financials',
    'AAPL': 'Info Tech', 'MSFT': 'Info Tech', 'NVDA': 'Info Tech',
    'GOOGL': 'Info Tech', 'META': 'Info Tech'
}


def save_tsne_csv(embeddings, tickers, output_path):
    """
    Apply t-SNE to embeddings and save 2D coordinates to CSV.

    Args:
        embeddings (np.ndarray): Array of shape (num_stocks, features).
        tickers (list): List of ticker symbols.
        output_path (str): Path to save the CSV file.
    """
    tsne = TSNE(n_components=2, random_state=42, perplexity=5)
    embeddings_2d = tsne.fit_transform(embeddings)

    df = pd.DataFrame({
        'ticker': tickers,
        'x': embeddings_2d[:, 0],
        'y': embeddings_2d[:, 1],
        'sector': [SECTOR_MAP[t] for t in tickers]
    })

    df.to_csv(output_path, index=False)
    print(f"Saved t-SNE CSV to {output_path}")
    print(df)


def main():
    import os
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    dataset = StockDataset(os.path.join(BASE_DIR, "data", "stockdata"))
    tickers = dataset.tickers
    dataloader = DataLoader(dataset)

    seq_len = dataset[0].shape[0]

    print("Training autoencoder")
    model = LSTMAutoencoder(seq_len=seq_len)
    train_autoencoder(model, dataloader, num_epochs=50)

    print("Extracting latent representations")
    latent = get_latent(model, dataloader)

    save_tsne_csv(latent, tickers, output_path=os.path.join(BASE_DIR, "data", "tsne.csv"))


if __name__ == '__main__':
    main()