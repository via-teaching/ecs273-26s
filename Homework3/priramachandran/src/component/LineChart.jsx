import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import { debounce, isEmpty } from "lodash";

const margin = { top: 28, right: 108, bottom: 52, left: 58 };

const stockCsvRaw = import.meta.glob("../../data/stockdata/*.csv", {
  eager: true,
  query: "?raw",
  import: "default",
});

function getRawCsvForSymbol(symbol) {
  const hit = Object.entries(stockCsvRaw).find(([path]) =>
    path.endsWith(`/${symbol}.csv`)
  );
  return hit ? hit[1] : "";
}

const SERIES = [
  { key: "open", label: "Open", color: "#0284c7", acc: (d) => d.open },
  { key: "high", label: "High", color: "#16a34a", acc: (d) => d.high },
  { key: "low", label: "Low", color: "#dc2626", acc: (d) => d.low },
  { key: "close", label: "Close", color: "#7c3aed", acc: (d) => d.close },
];

function parseRows(raw) {
  if (!raw) return [];
  const parsed = d3.csvParse(raw, (row) => {
    const date = new Date(row.Date);
    if (Number.isNaN(+date)) return null;
    const open = +row.Open;
    const high = +row.High;
    const low = +row.Low;
    const close = +row.Close;
    if ([open, high, low, close].some((v) => Number.isNaN(v))) return null;
    return { date, open, high, low, close };
  });
  return parsed.filter(Boolean);
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
      .text(`No CSV data for ${symbol}.`);
    return;
  }

  const innerPlotW = Math.max(
    viewportWidth - margin.left - margin.right,
    Math.max(data.length - 1, 1) * 2 * zoom
  );

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
  const [zoom, setZoom] = useState(1);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const data = useMemo(() => parseRows(getRawCsvForSymbol(symbol)), [symbol]);

  useEffect(() => {
    setZoom(1);
  }, [symbol]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.min(8, Math.max(1, z * factor)));
    };
    scrollEl.addEventListener("wheel", onWheel, { passive: false });
    return () => scrollEl.removeEventListener("wheel", onWheel);
  }, []);

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
  }, [symbol, data, dims, zoom]);

  return (
    <div className="flex h-full w-full min-h-[220px] flex-col">
      <div
        ref={scrollRef}
        className="min-h-[180px] flex-1 w-full overflow-x-auto overflow-y-hidden rounded-b-lg"
      >
        <svg ref={svgRef} className="block" />
      </div>
    </div>
  );
}
