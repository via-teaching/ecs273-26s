import * as d3 from "d3";
import { debounce, isEmpty } from "lodash";
import { useEffect, useMemo, useRef } from "react";

import aaplCsv from "../../data/stockdata/AAPL.csv?raw";
import bacCsv from "../../data/stockdata/BAC.csv?raw";
import catCsv from "../../data/stockdata/CAT.csv?raw";
import cvxCsv from "../../data/stockdata/CVX.csv?raw";
import dalCsv from "../../data/stockdata/DAL.csv?raw";
import googlCsv from "../../data/stockdata/GOOG.csv?raw";
import gsCsv from "../../data/stockdata/GS.csv?raw";
import halCsv from "../../data/stockdata/HAL.csv?raw";
import jnjCsv from "../../data/stockdata/JNJ.csv?raw";
import jpmCsv from "../../data/stockdata/JPM.csv?raw";
import koCsv from "../../data/stockdata/KO.csv?raw";
import mcdCsv from "../../data/stockdata/MCD.csv?raw";
import metaCsv from "../../data/stockdata/META.csv?raw";
import mmmCsv from "../../data/stockdata/MMM.csv?raw";
import msftCsv from "../../data/stockdata/MSFT.csv?raw";
import nkeCsv from "../../data/stockdata/NKE.csv?raw";
import nvdaCsv from "../../data/stockdata/NVDA.csv?raw";
import pfeCsv from "../../data/stockdata/PFE.csv?raw";
import unhCsv from "../../data/stockdata/UNH.csv?raw";
import xomCsv from "../../data/stockdata/XOM.csv?raw";

import { ComponentSize, Margin } from "../types";

type StockTicker =
  | "AAPL"
  | "BAC"
  | "CAT"
  | "CVX"
  | "DAL"
  | "GOOGL"
  | "GS"
  | "HAL"
  | "JNJ"
  | "JPM"
  | "KO"
  | "MCD"
  | "META"
  | "MMM"
  | "MSFT"
  | "NKE"
  | "NVDA"
  | "PFE"
  | "UNH"
  | "XOM";

interface StockRow {
  date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

interface LineChartProps {
  selectedStock: string;
}

const csvByTicker: Record<StockTicker, string> = {
  AAPL: aaplCsv,
  BAC: bacCsv,
  CAT: catCsv,
  CVX: cvxCsv,
  DAL: dalCsv,
  GOOGL: googlCsv,
  GS: gsCsv,
  HAL: halCsv,
  JNJ: jnjCsv,
  JPM: jpmCsv,
  KO: koCsv,
  MCD: mcdCsv,
  META: metaCsv,
  MMM: mmmCsv,
  MSFT: msftCsv,
  NKE: nkeCsv,
  NVDA: nvdaCsv,
  PFE: pfeCsv,
  UNH: unhCsv,
  XOM: xomCsv,
};

const margin = { left: 56, right: 160, top: 24, bottom: 46 } as Margin;
const seriesKeys = ["Open", "High", "Low", "Close"] as const;
const colors = d3
  .scaleOrdinal<(typeof seriesKeys)[number], string>()
  .domain(seriesKeys)
  .range(["#2563eb", "#dc2626", "#16a34a", "#7c3aed"]);

export default function LineChart({ selectedStock }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const stock = isStockTicker(selectedStock) ? selectedStock : "AAPL";

  const rows = useMemo(() => parseStockCsv(csvByTicker[stock]), [stock]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || isEmpty(rows)) return;

    const redraw = (size: ComponentSize) => {
      drawLineChart(svgRef.current!, rows, stock, size.width, size.height);
    };

    const resizeObserver = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.target === containerRef.current) {
            redraw(entry.contentRect as ComponentSize);
          }
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    const { width, height } = containerRef.current.getBoundingClientRect();
    redraw({ width, height });

    return () => resizeObserver.disconnect();
  }, [rows, stock]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-x-auto overflow-y-hidden"
    >
      <svg ref={svgRef} className="block h-full" />
    </div>
  );
}

function isStockTicker(value: string): value is StockTicker {
  return value in csvByTicker;
}

function parseStockCsv(csv: string): StockRow[] {
  return d3
    .csvParse(csv)
    .map((row) => ({
      date: new Date(row.Date ?? ""),
      Open: Number(row.Open),
      High: Number(row.High),
      Low: Number(row.Low),
      Close: Number(row.Close),
    }))
    .filter(
      (row) =>
        !Number.isNaN(row.date.getTime()) &&
        seriesKeys.every((key) => Number.isFinite(row[key]))
    );
}

function drawLineChart(
  svgElement: SVGSVGElement,
  rows: StockRow[],
  stock: string,
  visibleWidth: number,
  height: number
) {
  const chartWidth = Math.max(visibleWidth, rows.length * 8 + margin.left + margin.right);
  const innerHeight = Math.max(height - margin.top - margin.bottom, 20);
  const svg = d3.select(svgElement);

  svg.selectAll("*").remove();
  svg.attr("width", chartWidth).attr("height", height);

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(rows, (d) => d.date) as [Date, Date])
    .range([margin.left, chartWidth - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain([
      d3.min(rows, (d) => d.Low) ?? 0,
      d3.max(rows, (d) => d.High) ?? 1,
    ])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(Math.max(4, Math.floor(chartWidth / 120))));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(Math.max(3, Math.floor(innerHeight / 40))));

  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", 16)
    .attr("font-weight", "700")
    .attr("font-size", "14px")
    .text(`${stock} Stock Overview`);

  svg
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", height - 8)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("Date");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 14)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("Price (USD)");

  svg
    .append("defs")
    .append("clipPath")
    .attr("id", "line-chart-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", chartWidth - margin.left - margin.right)
    .attr("height", innerHeight);

  const lineGroup = svg.append("g").attr("clip-path", "url(#line-chart-clip)");

  const drawSeries = (currentXScale: d3.ScaleTime<number, number>) => {
    const line = d3
      .line<StockRow>()
      .x((d) => currentXScale(d.date))
      .y((d) => yScale(d.Open));

    seriesKeys.forEach((key) => {
      line.y((d) => yScale(d[key]));
      lineGroup
        .selectAll<SVGPathElement, StockRow[]>(`.line-${key}`)
        .data([rows])
        .join("path")
        .attr("class", `line-${key}`)
        .attr("fill", "none")
        .attr("stroke", colors(key))
        .attr("stroke-width", 2)
        .attr("d", line);
    });
  };

  drawSeries(xScale);

  const legend = svg
    .append("g")
    .attr("transform", `translate(${chartWidth - margin.right + 24},${margin.top})`);

  seriesKeys.forEach((key, index) => {
    const item = legend.append("g").attr("transform", `translate(0,${index * 22})`);

    item
      .append("line")
      .attr("x1", 0)
      .attr("x2", 24)
      .attr("y1", 7)
      .attr("y2", 7)
      .attr("stroke", colors(key))
      .attr("stroke-width", 3);

    item
      .append("text")
      .attr("x", 32)
      .attr("y", 11)
      .attr("font-size", "12px")
      .text(key);
  });

  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 12])
    .translateExtent([
      [margin.left, 0],
      [chartWidth - margin.right, height],
    ])
    .extent([
      [margin.left, 0],
      [chartWidth - margin.right, height],
    ])
    .on("zoom", (event) => {
      const zoomedXScale = event.transform.rescaleX(xScale);
      xAxis.call(d3.axisBottom(zoomedXScale).ticks(Math.max(4, Math.floor(chartWidth / 120))));
      drawSeries(zoomedXScale);
    });

  svg.call(zoom);
}
