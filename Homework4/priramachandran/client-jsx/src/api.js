const API_BASE = import.meta.env.VITE_API_BASE ?? "";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export function fetchStockList() {
  return apiGet("/stock_list");
}

export function fetchStockPrices(symbol) {
  return apiGet(`/stock/${encodeURIComponent(symbol)}`);
}

export function fetchStockNews(symbol) {
  return apiGet(`/stocknews/?stock_name=${encodeURIComponent(symbol)}`);
}

export function fetchTsneAll() {
  return apiGet("/tsne/");
}

export function fetchTsne(symbol) {
  return apiGet(`/tsne/${encodeURIComponent(symbol)}`);
}
