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

const margin: Margin = { top: 20, right: 20, bottom: 40, left: 56 };

const series: Series[] = [
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
    let stale = false;
    let data: Row[] = [];

    const redraw = (w: number, h: number) => {
      if (!svgRef.current || !data.length) return;
      drawChart(svgRef.current, data, w, h, ticker);
    };

    const resizeObserver = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect as ComponentSize;
          if (width && height) redraw(width, height);
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    d3.csv(`/data/stockdata/${ticker}.csv`).then((raw) => {
      if (stale) return;
      data = raw.map((r: any) => ({
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
      stale = true;
      resizeObserver.disconnect();
    };
  }, [ticker]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawChart(svgEl: SVGSVGElement, data: Row[], width: number, height: number, ticker: string) {
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  svg.append("defs").append("clipPath")
    .attr("id", "line-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  const xScale = d3.scaleTime()
    .domain(d3.extent(data, r => r.date) as [Date, Date])
    .range([margin.left, innerWidth + margin.left]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(data, r => r.low)! * 0.98, d3.max(data, r => r.high)! * 1.02])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y") as any));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat(d => "$" + d3.format(",.0f")(d as number)));

  svg.append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - 2)
    .attr("text-anchor", "middle")
    .style("font-size", "0.75rem")
    .text("Date");

  svg.append("text")
    .attr("transform", `translate(12, ${margin.top + innerHeight / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .style("font-size", "0.75rem")
    .text("Price (USD)");

  svg.append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", margin.top - 4)
    .attr("text-anchor", "middle")
    .style("font-size", "0.875rem")
    .style("font-weight", "bold")
    .text(`${ticker} — Open / High / Low / Close`);

  const lineGroup = svg.append("g").attr("clip-path", "url(#line-clip)");
  const lines = lineGroup.selectAll<SVGPathElement, Series>("path")
    .data(series)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", s => s.color)
    .attr("stroke-width", 1.5)
    .attr("d", s => d3.line<Row>().x(r => xScale(r.date)).y(r => yScale(s.accessor(r)))(data));

  const legend = svg.append("g")
    .attr("transform", `translate(${margin.left + innerWidth - 64}, ${margin.top + 4})`);

  series.forEach((s, i) => {
    const g = legend.append("g").attr("transform", `translate(0, ${i * 18})`);
    g.append("rect").attr("width", 12).attr("height", 3).attr("y", 3).attr("fill", s.color);
    g.append("text").attr("x", 16).attr("y", 9).style("font-size", "0.7rem").text(s.label);
  });

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 20])
    .translateExtent([[margin.left, 0], [width - margin.right, height]])
    .extent([[margin.left, 0], [width - margin.right, height]])
    .on("zoom", (e) => {
      const zx = e.transform.rescaleX(xScale);
      xAxis.call(d3.axisBottom(zx).tickFormat(d3.timeFormat("%b %Y") as any));
      lines.attr("d", s => d3.line<Row>().x(r => zx(r.date)).y(r => yScale(s.accessor(r)))(data));
    });

  svg.call(zoom);
}
