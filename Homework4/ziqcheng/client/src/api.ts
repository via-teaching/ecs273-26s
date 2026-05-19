const API_BASE = "http://127.0.0.1:8000/api";

export async function fetchStockList(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/stocks`);

  if (!res.ok) {
    throw new Error("Failed to fetch stock list");
  }

  const data = await res.json();
  return data.stocks;
}

export async function fetchStockPrice(ticker: string) {
  const res = await fetch(`${API_BASE}/stocks/${ticker}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch stock data for ${ticker}`);
  }

  return await res.json();
}

export async function fetchStockNews(ticker: string) {
  const res = await fetch(`${API_BASE}/news/${ticker}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch news for ${ticker}`);
  }

  return await res.json();
}

export async function fetchTsne() {
  const res = await fetch(`${API_BASE}/tsne`);

  if (!res.ok) {
    throw new Error("Failed to fetch t-SNE data");
  }

  return await res.json();
}