"""
Generate tsne.csv from HW1 stock data using HW2 LSTM autoencoder approach.
Output: ticker, x, y, sector
"""
import os
import sys
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from sklearn.manifold import TSNE

# Reproducibility
torch.manual_seed(42)
np.random.seed(42)

STOCK_DIR = "/home/claude/HW1/HW1-answer/T1/stockdata"
OUT = "/home/claude/hw3-project/tsne.csv"

ticker_dict = {
    'Energy': ['XOM', 'CVX', 'HAL'],
    'Industrials': ['MMM', 'CAT', 'DAL'],
    'Consumer_Discretionary': ['MCD', 'NKE'],
    'Consumer_Staples': ['KO'],
    'Healthcare': ['JNJ', 'PFE', 'UNH'],
    'Financials': ['JPM', 'BAC', 'GS'],
    'Information_Technology': ['AAPL', 'MSFT', 'NVDA', 'GOOG', 'META'],
}


class StockDataset(Dataset):
    def __init__(self, folder, feature_cols=('Open', 'High', 'Low', 'Close', 'Volume')):
        self.feature_cols = list(feature_cols)
        files = sorted(f for f in os.listdir(folder) if f.endswith('.csv'))
        self.tickers = [f.replace('.csv', '') for f in files]
        self.stock_data = []
        for f in files:
            df = pd.read_csv(os.path.join(folder, f))[self.feature_cols]
            df = (df - df.mean()) / df.std()
            df = df.fillna(0)
            self.stock_data.append(torch.tensor(df.values, dtype=torch.float32))

    def __len__(self):
        return len(self.stock_data)

    def __getitem__(self, idx):
        return self.stock_data[idx]


class LSTMAutoencoder(nn.Module):
    def __init__(self, input_dim=5, hidden_dim=64, latent_dim=16, seq_len=23):
        super().__init__()
        self.seq_len = seq_len
        self.encoder_lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.fc_enc = nn.Linear(hidden_dim, latent_dim)
        self.fc_dec = nn.Linear(latent_dim, hidden_dim)
        self.decoder_lstm = nn.LSTM(hidden_dim, input_dim, batch_first=True)

    def forward(self, x):
        _, (h_n, _) = self.encoder_lstm(x)
        h_n = h_n.squeeze(0)
        z = self.fc_enc(h_n)
        dec_hidden = self.fc_dec(z)
        dec_input = dec_hidden.unsqueeze(1).repeat(1, self.seq_len, 1)
        x_recon, _ = self.decoder_lstm(dec_input)
        return x_recon, z


def train(model, loader, epochs=50, lr=5e-3):
    loss_fn = nn.MSELoss()
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    for ep in range(epochs):
        model.train()
        total = 0.0
        for batch in loader:
            recon, _ = model(batch)
            loss = loss_fn(recon, batch)
            opt.zero_grad()
            loss.backward()
            opt.step()
            total += loss.item()
        if (ep + 1) % 10 == 0:
            print(f"Epoch {ep+1}/{epochs} loss={total/len(loader):.6f}")
    return model


def get_latent(model, loader):
    model.eval()
    out = []
    with torch.no_grad():
        for b in loader:
            _, z = model(b)
            out.append(z.cpu())
    return torch.cat(out, 0).numpy()


def sector_for(ticker):
    for sector, tickers in ticker_dict.items():
        if ticker in tickers:
            return sector
    return "Unknown"


def main():
    ds = StockDataset(STOCK_DIR)
    seq_len = ds[0].shape[0]
    feat = ds[0].shape[1]
    print(f"Loaded {len(ds)} stocks, seq_len={seq_len}, features={feat}")

    loader = DataLoader(ds, batch_size=10, shuffle=False)
    model = LSTMAutoencoder(input_dim=feat, hidden_dim=64, latent_dim=16, seq_len=seq_len)
    model = train(model, loader, epochs=50, lr=5e-3)
    Z = get_latent(model, loader)
    print("Latent shape:", Z.shape)

    tsne = TSNE(n_components=2, perplexity=4, random_state=42, init='pca')
    coords = tsne.fit_transform(Z)

    rows = []
    for tick, (x, y) in zip(ds.tickers, coords):
        rows.append({'ticker': tick, 'x': float(x), 'y': float(y), 'sector': sector_for(tick)})
    out_df = pd.DataFrame(rows)
    out_df.to_csv(OUT, index=False)
    print(f"Saved {OUT}")
    print(out_df)


if __name__ == "__main__":
    main()
