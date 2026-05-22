const API_BASE_URL = "http://localhost:8000";

async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    const err = new Error(`API ${res.status}: ${path}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function fetchStocks() {
  const data = await apiGet("/api/stocks");
  return data.stocks ?? [];
}

export async function fetchStockPrices(ticker) {
  const symbol = encodeURIComponent(ticker);
  return apiGet(`/api/stocks/${symbol}/prices`);
}

export async function fetchTsne() {
  return apiGet("/api/tsne");
}

export async function fetchStockNews(ticker) {
  const symbol = encodeURIComponent(ticker);
  return apiGet(`/api/stocks/${symbol}/news`);
}
