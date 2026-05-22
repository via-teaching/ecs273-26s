import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface TSNERow {
  ticker: string;
  x: number;
  y: number;
  sector: string;
}

const MARGIN = { top: 16, right: 16, bottom: 40, left: 50 };

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#60a5fa",
  Financials: "#34d399",
  Healthcare: "#f472b6",
  "Consumer Discretionary": "#fbbf24",
  Energy: "#fb923c",
  Industrials: "#a78bfa",
  "Consumer Staples": "#86efac",
  Communication: "#67e8f9",
  Transportation: "#94a3b8",
  Other: "#94a3b8",
};

function sectorColor(sector: string) {
  return SECTOR_COLORS[sector] ?? SECTOR_COLORS.Other;
}

export default function TSNEScatter({
  selectedStock,
  onSelectStock,
}: {
  selectedStock: string;
  onSelectStock: (s: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<TSNERow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    d3.csv("/data/tsne.csv", (raw) => {
      const ticker = String(raw.ticker ?? raw.Ticker ?? raw.symbol ?? "").trim();

      const xValue =
        raw.x ??
        raw.X ??
        raw.tsne1 ??
        raw.TSNE1 ??
        raw["t-SNE 1"] ??
        raw["tsne_1"] ??
        raw["0"];

      const yValue =
        raw.y ??
        raw.Y ??
        raw.tsne2 ??
        raw.TSNE2 ??
        raw["t-SNE 2"] ??
        raw["tsne_2"] ??
        raw["1"];

      const sector = String(raw.sector ?? raw.Sector ?? "Other").trim();

      return {
        ticker,
        x: Number(xValue),
        y: Number(yValue),
        sector,
      };
    })
      .then((rows) => {
        const clean = rows.filter(
          (d) => d.ticker && !Number.isNaN(d.x) && !Number.isNaN(d.y)
        );

        if (clean.length === 0) {
          setError("No valid t-SNE rows found. Check tsne.csv column names.");
          return;
        }

        setData(clean);
      })
      .catch(() => setError("Could not load /data/tsne.csv"));
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const container = containerRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;
    const innerW = W - MARGIN.left - MARGIN.right;
    const innerH = H - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const xExt = d3.extent(data, (d) => d.x) as [number, number];
    const yExt = d3.extent(data, (d) => d.y) as [number, number];

    const xPad = (xExt[1] - xExt[0]) * 0.08 || 1;
    const yPad = (yExt[1] - yExt[0]) * 0.08 || 1;

    const xScale = d3
      .scaleLinear()
      .domain([xExt[0] - xPad, xExt[1] + xPad])
      .range([0, innerW]);

    const yScale = d3
      .scaleLinear()
      .domain([yExt[0] - yPad, yExt[1] + yPad])
      .range([innerH, 0]);

    const xAxisG = g.append("g").attr("transform", `translate(0,${innerH})`);
    const yAxisG = g.append("g");

    xAxisG.call(d3.axisBottom(xScale).ticks(5));
    yAxisG.call(d3.axisLeft(yScale).ticks(5));

    xAxisG.selectAll("line,path").attr("stroke", "#d1d5db");
    yAxisG.selectAll("line,path").attr("stroke", "#d1d5db");

    xAxisG.selectAll("text").attr("fill", "#374151").style("font-size", "10px");
    yAxisG.selectAll("text").attr("fill", "#374151").style("font-size", "10px");

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 32)
      .attr("fill", "#374151")
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .text("t-SNE 1");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -36)
      .attr("fill", "#374151")
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .text("t-SNE 2");

    const tooltip = d3.select(container).select<HTMLDivElement>(".tsne-tooltip");

    g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", (d) => (d.ticker === selectedStock ? 9 : 5))
      .attr("fill", (d) => sectorColor(d.sector))
      .attr("fill-opacity", (d) => (d.ticker === selectedStock ? 1 : 0.75))
      .attr("stroke", (d) => (d.ticker === selectedStock ? "#000000" : "none"))
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", d.ticker === selectedStock ? 10 : 7);

        tooltip
          .style("opacity", 1)
          .html(`<b>${d.ticker}</b><br/>${d.sector}`)
          .style("left", `${event.offsetX + 12}px`)
          .style("top", `${event.offsetY - 10}px`);
      })
      .on("mouseleave", function (_, d) {
        d3.select(this).attr("r", d.ticker === selectedStock ? 9 : 5);
        tooltip.style("opacity", 0);
      })
      .on("click", (_, d) => onSelectStock(d.ticker));

    g.selectAll("text.stock-label")
      .data(data.filter((d) => d.ticker === selectedStock))
      .join("text")
      .attr("class", "stock-label")
      .attr("x", (d) => xScale(d.x) + 12)
      .attr("y", (d) => yScale(d.y) + 4)
      .attr("fill", "#000000")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .text((d) => d.ticker);
  }, [data, selectedStock, onSelectStock]);

  const sectors = Array.from(new Set(data.map((d) => d.sector)));

  return (
    <div ref={containerRef} className="relative w-full h-full bg-white">
      {sectors.length > 0 && (
        <div className="absolute top-2 right-2 flex flex-col gap-0.5 z-10 bg-white/90 px-2 py-1.5 rounded border border-gray-300 shadow">
          {sectors.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                style={{ background: sectorColor(s) }}
              />
              <span className="text-xs text-gray-700 whitespace-nowrap">{s}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-red-600 text-center px-4">
          {error}
          <br />
          <span className="text-gray-600">Place tsne.csv in public/data/</span>
        </div>
      )}

      {data.length === 0 && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600">
          Loading t-SNE…
        </div>
      )}

      <svg ref={svgRef} className="w-full h-full" />

      <div
        className="tsne-tooltip pointer-events-none absolute bg-white border border-gray-300 rounded px-2 py-1 text-xs opacity-0 z-20 shadow text-black"
        style={{ minWidth: 80 }}
      />
    </div>
  );
}