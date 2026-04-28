from __future__ import annotations

import csv
import json
import numpy as np
import pandas as pd
import random
import re
import shutil
import torch
import torch.nn as nn
from pathlib import Path
from sklearn.manifold import TSNE
from torch.utils.data import DataLoader, Dataset

APP_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = APP_DIR / "public" / "data"

HW1_DIR = Path(r"D:\Github\ecs273\assignment1\hw1-skeleton")
HW1_STOCKDATA = HW1_DIR / "stockdata"
HW1_STOCKNEWS = HW1_DIR / "stocknews"
HW2_SCRIPT = Path(r"D:\Github\ecs273\assignment2\HW2\T2\script.py")

TICKERS = [
    "AAPL",
    "BAC",
    "CAT",
    "CVX",
    "DAL",
    "GOOGL",
    "GS",
    "HAL",
    "JNJ",
    "JPM",
    "KO",
    "MCD",
    "META",
    "MMM",
    "MSFT",
    "NKE",
    "NVDA",
    "PFE",
    "UNH",
    "XOM",
]

CATEGORY_BY_TICKER = {
    "XOM": "Energy",
    "CVX": "Energy",
    "HAL": "Energy",
    "MMM": "Industrial/Transport",
    "CAT": "Industrial/Transport",
    "DAL": "Industrial/Transport",
    "MCD": "Consumer",
    "NKE": "Consumer",
    "KO": "Consumer",
    "JNJ": "Healthcare",
    "PFE": "Healthcare",
    "UNH": "Healthcare",
    "JPM": "Finance",
    "GS": "Finance",
    "BAC": "Finance",
    "AAPL": "Tech",
    "MSFT": "Tech",
    "NVDA": "Tech",
    "GOOGL": "Tech",
    "META": "Tech",
}


def main() -> None:
    validate_sources()
    copy_stockdata()
    convert_news()
    write_latent_tsne_csv()
    write_readme()
    print("Imported real HW1/HW2 data into public/data.")


def validate_sources() -> None:
    missing_paths = [
        path
        for path in [HW1_STOCKDATA, HW1_STOCKNEWS, HW2_SCRIPT]
        if not path.exists()
    ]
    if missing_paths:
        missing_text = "\n".join(str(path) for path in missing_paths)
        raise FileNotFoundError(f"Required source paths are missing:\n{missing_text}")

    missing_csvs = [ticker for ticker in TICKERS if not (HW1_STOCKDATA / f"{ticker}.csv").exists()]
    if missing_csvs:
        raise FileNotFoundError(f"Missing HW1 stock CSV files for: {', '.join(missing_csvs)}")


def copy_stockdata() -> None:
    output_dir = reset_output_dir(DATA_DIR / "stockdata")
    for ticker in TICKERS:
        shutil.copy2(HW1_STOCKDATA / f"{ticker}.csv", output_dir / f"{ticker}.csv")


def convert_news() -> None:
    output_root = reset_output_dir(DATA_DIR / "stocknews")
    for ticker in TICKERS:
        source_dir = HW1_STOCKNEWS / ticker
        output_dir = output_root / ticker
        output_dir.mkdir(parents=True, exist_ok=True)

        items = [parse_news_file(path) for path in sorted(source_dir.glob("*.txt"), reverse=True)]
        items = [item for item in items if item is not None]
        (output_dir / "news.json").write_text(
            json.dumps(items, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )


def parse_news_file(path: Path) -> dict[str, str] | None:
    text = path.read_text(encoding="utf-8", errors="replace")
    match = re.search(
        r"^Title:\s*(?P<title>.*?)\r?\n"
        r"Date:\s*(?P<date>.*?)\r?\n"
        r"URL:\s*(?P<url>.*?)\r?\n"
        r"Content:\s*(?P<content>.*)$",
        text,
        flags=re.DOTALL,
    )

    if not match:
        fallback_title = path.stem.split("_UTC_", maxsplit=1)[-1].replace("_", " ")
        return {
            "title": fallback_title,
            "date": infer_date_from_filename(path),
            "content": text.strip(),
            "url": "",
        }

    return {
        "title": clean_field(match.group("title")),
        "date": clean_field(match.group("date")),
        "content": clean_field(match.group("content")),
        "url": clean_field(match.group("url")),
    }


def write_latent_tsne_csv() -> None:
    random.seed(42)
    np.random.seed(42)
    torch.manual_seed(42)

    dataset = StockDataset(HW1_STOCKDATA)
    generator = torch.Generator().manual_seed(42)
    train_loader = DataLoader(dataset, batch_size=4, shuffle=True, generator=generator)

    model = LSTMAutoencoder(seq_len=dataset.seq_len)
    train_autoencoder(model, train_loader, num_epochs=20, lr=1e-3)

    eval_loader = DataLoader(dataset, batch_size=4, shuffle=False)
    latent_vectors = get_latent(model, eval_loader)
    latent_embedding = compute_tsne(latent_vectors, random_state=42)

    tsne_path = DATA_DIR / "tsne.csv"
    tsne_path.parent.mkdir(parents=True, exist_ok=True)
    with tsne_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["ticker", "x", "y", "sector"])
        for ticker, coords, sector in zip(dataset.tickers, latent_embedding, dataset.categories):
            writer.writerow([ticker, f"{coords[0]:.8f}", f"{coords[1]:.8f}", sector])


class StockDataset(Dataset):
    def __init__(self, folder_path: Path, feature_cols: list[str] | None = None) -> None:
        self.feature_cols = feature_cols or ["Open", "High", "Low", "Close", "Volume"]
        raw_values_by_ticker = {}
        min_length = None

        for ticker in sorted(TICKERS):
            csv_file = folder_path / f"{ticker}.csv"
            frame = pd.read_csv(csv_file)
            missing_cols = set(self.feature_cols) - set(frame.columns)
            if missing_cols:
                raise ValueError(f"{csv_file.name} is missing columns: {sorted(missing_cols)}")

            feature_frame = frame[self.feature_cols].apply(pd.to_numeric, errors="coerce").dropna()
            if feature_frame.empty:
                continue

            values = feature_frame.to_numpy(dtype=np.float32)
            raw_values_by_ticker[ticker] = values
            min_length = len(values) if min_length is None else min(min_length, len(values))

        if not raw_values_by_ticker or min_length is None:
            raise ValueError(f"No valid stock sequences were loaded from {folder_path}.")

        self.seq_len = int(min_length)
        self.samples = []
        self.raw_samples = []
        self.tickers = []
        self.categories = []

        for ticker in sorted(raw_values_by_ticker):
            values = raw_values_by_ticker[ticker][-self.seq_len :]
            mean = values.mean(axis=0, keepdims=True)
            std = values.std(axis=0, keepdims=True)
            std[std == 0] = 1.0
            normalized = (values - mean) / std

            self.samples.append(torch.tensor(normalized, dtype=torch.float32))
            self.raw_samples.append(normalized.astype(np.float32))
            self.tickers.append(ticker)
            self.categories.append(CATEGORY_BY_TICKER.get(ticker, "Other"))

        self.raw_samples = np.stack(self.raw_samples)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> torch.Tensor:
        return self.samples[idx]


class LSTMAutoencoder(nn.Module):
    def __init__(self, input_dim: int = 5, hidden_dim: int = 64, latent_dim: int = 16, seq_len: int = 23) -> None:
        super().__init__()
        self.seq_len = seq_len
        self.encoder = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.to_latent = nn.Linear(hidden_dim, latent_dim)
        self.latent_to_hidden = nn.Linear(latent_dim, hidden_dim)
        self.latent_to_cell = nn.Linear(latent_dim, hidden_dim)
        self.decoder = nn.LSTM(latent_dim, hidden_dim, batch_first=True)
        self.output_layer = nn.Linear(hidden_dim, input_dim)

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        _, (hidden_state, _) = self.encoder(x)
        latent = self.to_latent(hidden_state[-1])

        hidden0 = torch.tanh(self.latent_to_hidden(latent)).unsqueeze(0)
        cell0 = torch.tanh(self.latent_to_cell(latent)).unsqueeze(0)
        decoder_input = latent.unsqueeze(1).repeat(1, self.seq_len, 1)
        decoded, _ = self.decoder(decoder_input, (hidden0, cell0))
        reconstructed = self.output_layer(decoded)
        return reconstructed, latent


def train_autoencoder(model: nn.Module, dataloader: DataLoader, num_epochs: int = 20, lr: float = 1e-3) -> list[float]:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn = nn.MSELoss()
    losses = []

    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        total_examples = 0

        for batch in dataloader:
            batch = batch.to(device)
            optimizer.zero_grad()
            reconstructed, _ = model(batch)
            loss = loss_fn(reconstructed, batch)
            loss.backward()
            optimizer.step()

            batch_size = batch.size(0)
            running_loss += loss.item() * batch_size
            total_examples += batch_size

        average_loss = running_loss / max(total_examples, 1)
        losses.append(average_loss)
        print(f"Epoch {epoch + 1}: Loss = {average_loss:.6f}")

    return losses


def get_latent(model: nn.Module, dataloader: DataLoader) -> np.ndarray:
    model.eval()
    device = next(model.parameters()).device
    latent_vectors = []

    with torch.no_grad():
        for batch in dataloader:
            batch = batch.to(device)
            _, latent = model(batch)
            latent_vectors.append(latent.cpu())

    return torch.cat(latent_vectors, dim=0).numpy()


def compute_tsne(features: np.ndarray, random_state: int = 42) -> np.ndarray:
    num_samples = features.shape[0]
    perplexity = min(5, num_samples - 1)
    tsne = TSNE(
        n_components=2,
        perplexity=perplexity,
        init="random",
        learning_rate="auto",
        random_state=random_state,
    )
    return tsne.fit_transform(features)


def write_readme() -> None:
    readme = DATA_DIR / "README.md"
    readme.write_text(
        "# Homework 3 Data Folder\n\n"
        "This folder follows the data layout described in `HW3-Description.docx.md`.\n\n"
        "The files in this folder are imported from the local Homework 1 and Homework 2 outputs:\n\n"
        "- `stockdata/<TICKER>.csv` - copied from `D:\\Github\\ecs273\\assignment1\\hw1-skeleton\\stockdata`.\n"
        "- `stocknews/<TICKER>/news.json` - converted from `D:\\Github\\ecs273\\assignment1\\hw1-skeleton\\stocknews\\<TICKER>\\*.txt`.\n"
        "- `tsne.csv` - regenerated with the same latent LSTM autoencoder t-SNE workflow defined in `D:\\Github\\ecs273\\assignment2\\HW2\\T2\\script.py`.\n\n"
        "Run `scripts/import-real-hw-data.py` from the app folder if the HW1 or HW2 outputs change.\n",
        encoding="utf-8",
    )


def reset_output_dir(path: Path) -> Path:
    resolved = path.resolve()
    app_root = APP_DIR.resolve()
    if app_root not in resolved.parents:
        raise RuntimeError(f"Refusing to reset a path outside the app folder: {resolved}")

    if resolved.exists():
        shutil.rmtree(resolved)

    resolved.mkdir(parents=True, exist_ok=True)
    return resolved


def infer_date_from_filename(path: Path) -> str:
    prefix = path.stem.split("_UTC_", maxsplit=1)[0]
    return prefix.replace("_", " ") + " UTC"


def clean_field(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


if __name__ == "__main__":
    main()
