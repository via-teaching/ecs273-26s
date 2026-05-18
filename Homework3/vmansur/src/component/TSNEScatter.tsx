import * as d3 from "d3";
import debounce from "lodash/debounce";
import { useEffect, useRef, useState } from "react";

import { getTsneData } from "./dataLoader";
import { TSNEPoint } from "../types";

const margin = { top: 44, right: 24, bottom: 56, left: 64 };
const axisTextColor = "#334155";
const axisLineColor = "#94a3b8";
const axisDomainColor = "#64748b";
const tsnePalette = [...d3.schemeTableau10, ...d3.schemeSet3, ...d3.schemePaired];
const legendWidth = 170;
const legendSpace = 190;
type TsnePoint = TSNEPoint;
type LabelMode = "all" | "selected";

interface TSNEScatterProps {
  selectedStock: string;
  onSelectStock: (ticker: string) => void;
}

export default function TSNEScatter({ selectedStock, onSelectStock }: TSNEScatterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [tsneData, setTsneData] = useState<TSNEPoint[]>([]);
  const [labelMode, setLabelMode] = useState<LabelMode>("all");

  useEffect(() => {
    let isActive = true;
    getTsneData().then((points) => {
      if (isActive) {
        setTsneData(points);
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) {
      return;
    }

    const draw = () => {
      if (!containerRef.current || !svgRef.current) {
        return;
      }
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width <= 0 || height <= 0) {
        return;
      }
      zoomBehaviorRef.current = drawScatter(
        svgRef.current,
        tooltipRef.current,
        tsneData,
        width,
        height,
        selectedStock,
        labelMode,
        onSelectStock,
      );
    };

    const observer = new ResizeObserver(debounce(draw, 120));
    observer.observe(containerRef.current);
    draw();

    return () => observer.disconnect();
  }, [selectedStock, tsneData, labelMode, onSelectStock]);

  const resetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) {
      return;
    }
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  const toggleLabelMode = () => {
    setLabelMode((current) => (current === "all" ? "selected" : "all"));
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div className="absolute left-3 top-1 z-10 flex gap-2">
        <button
          type="button"
          onClick={toggleLabelMode}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
        >
          Labels: {labelMode === "all" ? "All" : "Selected"}
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm"
        >
          Reset Zoom
        </button>
      </div>
      <svg ref={svgRef} className="h-full w-full" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-20 hidden rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-xs text-slate-700 shadow"
      />
      <div className="pointer-events-none absolute bottom-2 left-3 rounded bg-white/85 px-2 py-1 text-[10px] text-slate-600 shadow-sm">
        t-SNE is exploratory: cluster distance is qualitative, not a predictive signal.
      </div>
    </div>
  );
}

function drawScatter(
  svgElement: SVGSVGElement,
  tooltipElement: HTMLDivElement | null,
  tsneData: TSNEPoint[],
  width: number,
  height: number,
  selectedStock: string,
  labelMode: LabelMode,
  onSelectStock: (ticker: string) => void,
): d3.ZoomBehavior<SVGSVGElement, unknown> | null {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  if (tooltipElement) {
    tooltipElement.style.display = "none";
  }

  if (tsneData.length === 0) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .text("No t-SNE file found at data/tsne.csv.");
    return null;
  }

  const xExtent = d3.extent(tsneData, (d) => d.x) as [number, number];
  const yExtent = d3.extent(tsneData, (d) => d.y) as [number, number];
  const x = d3
    .scaleLinear()
    .domain([xExtent[0] - 1, xExtent[1] + 1])
    .range([margin.left, width - margin.right - legendSpace]);
  const y = d3
    .scaleLinear()
    .domain([yExtent[0] - 1, yExtent[1] + 1])
    .range([height - margin.bottom, margin.top]);
  const plotRight = width - margin.right - legendSpace;

  const sectors = Array.from(new Set(tsneData.map((d) => d.sector)));
  const color = d3.scaleOrdinal<string, string>().domain(sectors).range(tsnePalette);

  const defs = svg.append("defs");
  const bgGradientId = `scatter-bg-${selectedStock}`;
  const selectedGlowId = `scatter-glow-${selectedStock}`;

  const bgGradient = defs
    .append("linearGradient")
    .attr("id", bgGradientId)
    .attr("x1", "0%")
    .attr("x2", "0%")
    .attr("y1", "0%")
    .attr("y2", "100%");
  bgGradient.append("stop").attr("offset", "0%").attr("stop-color", "#f0f9ff");
  bgGradient.append("stop").attr("offset", "100%").attr("stop-color", "#f8fafc");

  const selectedGlow = defs.append("filter").attr("id", selectedGlowId);
  selectedGlow
    .append("feDropShadow")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("stdDeviation", 2.6)
    .attr("flood-color", "#f59e0b")
    .attr("flood-opacity", 0.42);

  svg
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", plotRight - margin.left)
    .attr("height", height - margin.top - margin.bottom)
    .attr("rx", 12)
    .attr("fill", `url(#${bgGradientId})`);

  const xGrid = d3
    .axisBottom(x)
    .ticks(8)
    .tickSize(-(height - margin.top - margin.bottom))
    .tickFormat(() => "");
  const yGrid = d3
    .axisLeft(y)
    .ticks(8)
    .tickSize(-(plotRight - margin.left))
    .tickFormat(() => "");

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xGrid)
    .call((g) => g.select(".domain").remove())
    .selectAll("line")
    .attr("stroke", "#bfdbfe")
    .attr("stroke-opacity", 0.55);
  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yGrid)
    .call((g) => g.select(".domain").remove())
    .selectAll("line")
    .attr("stroke", "#cbd5e1")
    .attr("stroke-opacity", 0.55);

  const xAxis = svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(8));

  const yAxis = svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(8));

  styleAxis(xAxis);
  styleAxis(yAxis);

  xAxis
    .append("text")
    .attr("x", width / 2)
    .attr("y", 42)
    .attr("fill", "#0f172a")
    .attr("text-anchor", "middle")
    .text("t-SNE Dimension 1");

  yAxis
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height / 2))
    .attr("y", -44)
    .attr("fill", "#0f172a")
    .attr("text-anchor", "middle")
    .text("t-SNE Dimension 2");

  const plot = svg.append("g");
  const labels = svg.append("g");

  const renderPoints = (
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
  ) => {
    const points = plot
      .selectAll<SVGCircleElement, TsnePoint>("circle")
      .data(tsneData, (d) => d.ticker);
    points
      .join("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", (d) => (d.ticker === selectedStock ? 9 : 5.2))
      .attr("fill", (d) => color(d.sector))
      .attr("stroke", (d) => (d.ticker === selectedStock ? "#0f172a" : "#ffffff"))
      .attr("stroke-width", (d) => (d.ticker === selectedStock ? 2.3 : 0.8))
      .attr("filter", (d) => (d.ticker === selectedStock ? `url(#${selectedGlowId})` : null))
      .attr("opacity", (d) => (d.ticker === selectedStock ? 1 : 0.86))
      .style("cursor", "pointer")
      .on("click", (_event, d) => onSelectStock(d.ticker))
      .on("mouseenter mousemove", (event, d) => {
        if (!tooltipElement) {
          return;
        }
        tooltipElement.style.display = "block";
        tooltipElement.style.left = `${event.offsetX + 14}px`;
        tooltipElement.style.top = `${event.offsetY + 14}px`;
        tooltipElement.innerHTML = `
          <div class="font-semibold text-slate-800">${d.ticker}</div>
          <div>Sector: ${d.sector}</div>
          <div>x: ${d.x.toFixed(2)}, y: ${d.y.toFixed(2)}</div>
        `;
      })
      .on("mouseleave", () => {
        if (tooltipElement) {
          tooltipElement.style.display = "none";
        }
      });

    const labelData =
      labelMode === "all" ? tsneData : tsneData.filter((d) => d.ticker === selectedStock);

    labels
      .selectAll<SVGTextElement, TsnePoint>("text")
      .data(labelData, (d) => d.ticker)
      .join("text")
      .attr("x", (d) => xScale(d.x) + 8)
      .attr("y", (d) => yScale(d.y) - 8)
      .attr("fill", (d) => (d.ticker === selectedStock ? "#0f172a" : "#334155"))
      .attr("stroke", "white")
      .attr("stroke-width", 2.4)
      .attr("paint-order", "stroke")
      .style("font-size", (d) => (d.ticker === selectedStock ? "12px" : "10px"))
      .style("font-weight", (d) => (d.ticker === selectedStock ? "700" : "500"))
      .style("pointer-events", "none")
      .text((d) => d.ticker);
  };

  renderPoints(x, y);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("fill", "#1e293b")
    .style("font-weight", "600")
    .text("t-SNE Projection of Stock Latent Representations");

  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - margin.right - legendWidth}, ${margin.top + 14})`);
  legend
    .append("rect")
    .attr("x", -10)
    .attr("y", -14)
    .attr("width", legendWidth + 12)
    .attr("height", sectors.length * 18 + 24)
    .attr("rx", 10)
    .attr("fill", "white")
    .attr("fill-opacity", 0.86)
    .attr("stroke", "#e2e8f0");
  sectors.forEach((sector, idx) => {
    const row = legend.append("g").attr("transform", `translate(0, ${idx * 18})`);
    row.append("circle").attr("r", 5).attr("cx", 6).attr("cy", 0).attr("fill", color(sector));
    row
      .append("text")
      .attr("x", 18)
      .attr("y", 4)
      .style("font-size", "12px")
      .attr("fill", "#1e293b")
      .text(sector);
  });

  const zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.7, 12])
    .on("zoom", (event) => {
      const zx = event.transform.rescaleX(x);
      const zy = event.transform.rescaleY(y);
      xAxis.call(d3.axisBottom(zx).ticks(8));
      yAxis.call(d3.axisLeft(zy).ticks(8));
      styleAxis(xAxis);
      styleAxis(yAxis);
      renderPoints(zx, zy);
    });

  svg.call(zoomBehavior);
  return zoomBehavior;
}

function styleAxis(axisGroup: d3.Selection<SVGGElement, unknown, null, undefined>) {
  axisGroup.select(".domain").attr("stroke", axisDomainColor);
  axisGroup.selectAll("line").attr("stroke", axisLineColor);
  axisGroup.selectAll("text").attr("fill", axisTextColor);
}
