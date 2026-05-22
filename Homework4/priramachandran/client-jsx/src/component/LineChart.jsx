import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { debounce, isEmpty } from "lodash";
import { fetchStockPrices } from "../api";

const margin = { top: 28, right: 108, bottom: 52, left: 58 };

const SERIES = [
  { key: "open", label: "Open", color: "#0284c7", acc: (d) => d.open },
  { key: "high", label: "High", color: "#16a34a", acc: (d) => d.high },
  { key: "low", label: "Low", color: "#dc2626", acc: (d) => d.low },
  { key: "close", label: "Close", color: "#7c3aed", acc: (d) => d.close },
];

function parseStockSeries(stockSeries) {
  if (!stockSeries?.length) return [];
  return stockSeries
    .map((row) => {
      const date = new Date(row.date);
      const open = +row.Open;
      const high = +row.High;
      const low = +row.Low;
      const close = +row.Close;
      if (Number.isNaN(+date) || [open, high, low, close].some((v) => Number.isNaN(v))) {
        return null;
      }
      return { date, open, high, low, close };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);
}

function innerPlotWidth(viewportWidth, dataLength, zoom) {
  const base = viewportWidth - margin.left - margin.right;
  const zoomed = Math.max(dataLength - 1, 1) * 2 * zoom;
  return Math.max(base, zoomed);
}

function drawChart(svgElement, symbol, data, viewportWidth, height, zoom) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  if (isEmpty(data) || !viewportWidth || !height) {
    svg
      .append("text")
      .attr("x", viewportWidth / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .text(`No price data for ${symbol}.`);
    return;
  }

  const innerPlotW = innerPlotWidth(viewportWidth, data.length, zoom);

  const svgWidth = margin.left + innerPlotW + margin.right;
  const innerH = height - margin.top - margin.bottom;

  svg.attr("width", svgWidth).attr("height", height);

  const [t0, t1] = d3.extent(data, (d) => d.date);
  const xScale = d3.scaleTime().domain([t0, t1]).range([margin.left, margin.left + innerPlotW]);

  const yMin = d3.min(data, (d) => d.low);
  const yMax = d3.max(data, (d) => d.high);
  const yPad = (yMax - yMin) * 0.06 || 1;
  const yScale = d3
    .scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .nice()
    .range([margin.top + innerH, margin.top]);

  const lineGen = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value));

  const plot = svg.append("g").attr("class", "plot");

  plot
    .append("g")
    .attr("transform", `translate(0,${margin.top + innerH})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(Math.min(10, Math.max(4, Math.floor(innerPlotW / 90))))
        .tickFormat(d3.timeFormat("%b %d, %Y"))
    )
    .selectAll("text")
    .style("font-size", "10px")
    .attr("transform", "rotate(-25)")
    .style("text-anchor", "end");

  plot
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(8).tickFormat((d) => `$${d}`))
    .selectAll("text")
    .style("font-size", "10px");

  plot
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerH / 2))
    .attr("y", 14)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .attr("fill", "#334155")
    .text("Price (USD)");

  plot
    .append("text")
    .attr("x", margin.left + innerPlotW / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .attr("fill", "#334155")
    .text("Date");

  for (const s of SERIES) {
    const pts = data.map((d) => ({ date: d.date, value: s.acc(d) }));
    plot
      .append("path")
      .datum(pts)
      .attr("fill", "none")
      .attr("stroke", s.color)
      .attr("stroke-width", 1.75)
      .attr("d", lineGen);
  }

  const legX = margin.left + innerPlotW + 12;
  let ly = margin.top + 8;
  const legend = svg.append("g").attr("class", "legend");

  legend
    .append("text")
    .attr("x", legX)
    .attr("y", ly)
    .style("font-size", "11px")
    .style("font-weight", "600")
    .attr("fill", "#334155")
    .text("Legend");
  ly += 18;

  for (const s of SERIES) {
    legend
      .append("line")
      .attr("x1", legX)
      .attr("x2", legX + 22)
      .attr("y1", ly)
      .attr("y2", ly)
      .attr("stroke", s.color)
      .attr("stroke-width", 3);
    legend
      .append("text")
      .attr("x", legX + 28)
      .attr("y", ly + 4)
      .style("font-size", "11px")
      .attr("fill", "#334155")
      .text(s.label);
    ly += 20;
  }

  svg
    .append("text")
    .attr("x", margin.left + innerPlotW / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "600")
    .attr("fill", "#0f172a")
    .text(`${symbol} — Open, High, Low, Close`);
}

export function StockLineChart({ symbol }) {
  const scrollRef = useRef(null);
  const svgRef = useRef(null);
  const pendingScrollRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchStockPrices(symbol)
      .then((payload) => {
        if (cancelled) return;
        setData(parseStockSeries(payload.stock_series));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setData([]);
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    setZoom(1);
    pendingScrollRef.current = null;
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [symbol]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      e.preventDefault();
      const rect = scrollEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const contentX = scrollEl.scrollLeft + mouseX;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const dataLen = data.length;

      setZoom((z) => {
        const next = Math.min(8, Math.max(1, z * factor));
        if (next === z || !dims.w || dataLen < 2) return z;

        const oldInner = innerPlotWidth(dims.w, dataLen, z);
        const newInner = innerPlotWidth(dims.w, dataLen, next);
        pendingScrollRef.current = {
          scrollLeft: contentX * (newInner / oldInner) - mouseX,
        };
        return next;
      });
    };
    scrollEl.addEventListener("wheel", onWheel, { passive: false });
    return () => scrollEl.removeEventListener("wheel", onWheel);
  }, [data.length, dims.w]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const ro = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== el) continue;
          const { width, height } = entry.contentRect;
          if (width && height) setDims({ w: width, h: height });
        }
      }, 80)
    );
    ro.observe(el);
    const r = el.getBoundingClientRect();
    if (r.width && r.height) setDims({ w: r.width, h: r.height });

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !dims.w || !dims.h) return;
    drawChart(svgRef.current, symbol, data, dims.w, dims.h, zoom);

    const scrollEl = scrollRef.current;
    const pending = pendingScrollRef.current;
    if (!scrollEl || pending == null) return;

    const maxScroll = Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth);
    scrollEl.scrollLeft = Math.max(0, Math.min(pending.scrollLeft, maxScroll));
    pendingScrollRef.current = null;
  }, [symbol, data, dims, zoom]);

  return (
    <div className="flex h-full w-full min-h-[220px] flex-col">
      {loading && (
        <p className="px-3 py-1 text-sm text-slate-500">Loading prices for {symbol}…</p>
      )}
      {error && (
        <p className="px-3 py-1 text-sm text-red-600">{error}</p>
      )}
      <div
        ref={scrollRef}
        className="min-h-[180px] flex-1 w-full overflow-x-auto overflow-y-hidden rounded-b-lg"
      >
        <svg ref={svgRef} className="block" />
      </div>
    </div>
  );
}
