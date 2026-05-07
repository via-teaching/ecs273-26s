import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { debounce } from "lodash";
import { Ticker } from "../stocks";
import { ComponentSize, Margin } from "../types";

interface Row {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

type Series = { label: string; color: string; accessor: (r: Row) => number };

const MARGIN: Margin = { top: 20, right: 20, bottom: 40, left: 56 };

const SERIES: Series[] = [
  { label: "Open",  color: "#1f77b4", accessor: r => r.open  },
  { label: "High",  color: "#2ca02c", accessor: r => r.high  },
  { label: "Low",   color: "#d62728", accessor: r => r.low   },
  { label: "Close", color: "#ff7f0e", accessor: r => r.close },
];

export default function LineChart({ ticker }: { ticker: Ticker }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    let cancelled = false;
    let latestRows: Row[] = [];

    const redraw = (w: number, h: number) => {
      if (!svgRef.current || !latestRows.length) return;
      renderChart(svgRef.current, latestRows, w, h, ticker);
    };

    const observer = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect as ComponentSize;
          if (width && height) redraw(width, height);
        }
      }, 100)
    );

    observer.observe(containerRef.current);

    d3.csv(`/data/stockdata/${ticker}.csv`).then((raw) => {
      if (cancelled) return;
      latestRows = raw.map((r: any) => ({
        date: new Date(r.Date.split(" ")[0]),
        open: +r.Open,
        high: +r.High,
        low: +r.Low,
        close: +r.Close,
      }));
      const { width, height } = containerRef.current!.getBoundingClientRect();
      if (width && height) redraw(width, height);
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [ticker]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function renderChart(
  svgEl: SVGSVGElement,
  rows: Row[],
  width: number,
  height: number,
  ticker: string,
) {
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  svg.append("defs").append("clipPath")
    .attr("id", "line-clip")
    .append("rect")
    .attr("x", MARGIN.left)
    .attr("y", MARGIN.top)
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  const xScale = d3.scaleTime()
    .domain(d3.extent(rows, r => r.date) as [Date, Date])
    .range([MARGIN.left, innerWidth + MARGIN.left]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(rows, r => r.low)! * 0.98, d3.max(rows, r => r.high)! * 1.02])
    .nice()
    .range([height - MARGIN.bottom, MARGIN.top]);

  const xAxisG = svg.append("g")
    .attr("transform", `translate(0, ${height - MARGIN.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y") as any));

  svg.append("g")
    .attr("transform", `translate(${MARGIN.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat(d => "$" + d3.format(",.0f")(d as number)));

  svg.append("text")
    .attr("x", MARGIN.left + innerWidth / 2)
    .attr("y", height - 2)
    .attr("text-anchor", "middle")
    .style("font-size", "0.75rem")
    .text("Date");

  svg.append("text")
    .attr("transform", `translate(12, ${MARGIN.top + innerHeight / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .style("font-size", "0.75rem")
    .text("Price (USD)");

  svg.append("text")
    .attr("x", MARGIN.left + innerWidth / 2)
    .attr("y", MARGIN.top - 4)
    .attr("text-anchor", "middle")
    .style("font-size", "0.875rem")
    .style("font-weight", "bold")
    .text(`${ticker} — Open / High / Low / Close`);

  const pathsG = svg.append("g").attr("clip-path", "url(#line-clip)");
  const paths = pathsG.selectAll<SVGPathElement, Series>("path")
    .data(SERIES)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", s => s.color)
    .attr("stroke-width", 1.5)
    .attr("d", s => d3.line<Row>().x(r => xScale(r.date)).y(r => yScale(s.accessor(r)))(rows));

  const legendG = svg.append("g")
    .attr("transform", `translate(${MARGIN.left + innerWidth - 64}, ${MARGIN.top + 4})`);

  SERIES.forEach((s, i) => {
    const g = legendG.append("g").attr("transform", `translate(0, ${i * 18})`);
    g.append("rect").attr("width", 12).attr("height", 3).attr("y", 3).attr("fill", s.color);
    g.append("text").attr("x", 16).attr("y", 9).style("font-size", "0.7rem").text(s.label);
  });

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 20])
    .translateExtent([[MARGIN.left, 0], [width - MARGIN.right, height]])
    .extent([[MARGIN.left, 0], [width - MARGIN.right, height]])
    .on("zoom", (e) => {
      const zx = e.transform.rescaleX(xScale);
      xAxisG.call(d3.axisBottom(zx).tickFormat(d3.timeFormat("%b %Y") as any));
      paths.attr("d", s => d3.line<Row>().x(r => zx(r.date)).y(r => yScale(s.accessor(r)))(rows));
    });

  svg.call(zoom);
}
