import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { debounce } from "lodash";

const API_BASE = "http://localhost:8002";

const margin = { left: 60, right: 20, top: 30, bottom: 50 };

const LINES = [
  { key: "Open",  color: "#4895ef", label: "Open"  },
  { key: "High",  color: "#4cc9f0", label: "High"  },
  { key: "Low",   color: "#f72585", label: "Low"   },
  { key: "Close", color: "#7209b7", label: "Close" },
];

export function LineChart({ stock }) {
  const wrapperRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!stock) return;
    setData([]);
    fetch(`${API_BASE}/stock/${stock}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Stock not found: ${stock}`);
        return r.json();
      })
      .then((json) => {
        const parsed = json.stock_series
          .map((d) => ({
            date:  new Date(d.date),
            Open:  d.Open,
            High:  d.High,
            Low:   d.Low,
            Close: d.Close,
          }))
          .sort((a, b) => a.date - b.date);
        setData(parsed);
      })
      .catch((err) => console.error("LineChart fetch error:", err));
  }, [stock]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(
      debounce((entries) => {
        const { width, height } = entries[0].contentRect;
        if (width && height) setDims({ width, height });
      }, 80)
    );
    ro.observe(wrapperRef.current);
    const { width, height } = wrapperRef.current.getBoundingClientRect();
    if (width && height) setDims({ width, height });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!data.length || !dims.width || !dims.height || !svgRef.current) return;

    const { width: containerW, height } = dims;
    const innerH = height - margin.top - margin.bottom;

    const PX_PER_POINT = 3;
    const innerW = Math.max(containerW - margin.left - margin.right, data.length * PX_PER_POINT);
    const totalW = innerW + margin.left + margin.right;

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, (d) => d.date))
      .range([0, innerW]);

    const allValues = data.flatMap((d) => LINES.map((l) => d[l.key]));
    const yScale = d3.scaleLinear()
      .domain([d3.min(allValues) * 0.99, d3.max(allValues) * 1.01])
      .range([innerH, 0])
      .nice();

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", totalW).attr("height", height);

    const clip = svg.append("defs").append("clipPath").attr("id", `clip-${stock}`);
    clip.append("rect").attr("width", innerW).attr("height", innerH);

    const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const chartArea = root.append("g").attr("clip-path", `url(#clip-${stock})`);
    const xAxisG = root.append("g").attr("transform", `translate(0,${innerH})`);
    const yAxisG = root.append("g");

    xAxisG
      .call(d3.axisBottom(xScale).ticks(Math.max(4, Math.floor(innerW / 80))).tickFormat(d3.timeFormat("%b %d")))
      .selectAll("text").attr("transform", "rotate(-35)").style("text-anchor", "end");

    yAxisG.call(d3.axisLeft(yScale).ticks(6));

    root.append("text")
      .attr("x", innerW / 2).attr("y", innerH + margin.bottom - 2)
      .attr("text-anchor", "middle").style("font-size", "11px").text("Date");

    root.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2).attr("y", -margin.left + 14)
      .attr("text-anchor", "middle").style("font-size", "11px").text("Price (USD)");

    const lineGen = (key) =>
      d3.line().x((d) => xScale(d.date)).y((d) => yScale(d[key])).curve(d3.curveMonotoneX);

    LINES.forEach(({ key, color }) => {
      chartArea.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("d", lineGen(key))
        .attr("class", `line-${key}`);
    });

    const legendX = innerW - 10;
    const legendG = root.append("g").attr("transform", `translate(${legendX},4)`);
    legendG.append("rect")
      .attr("x", -90).attr("y", -4)
      .attr("width", 94).attr("height", LINES.length * 18 + 8)
      .attr("fill", "white").attr("opacity", 0.85).attr("rx", 4);
    LINES.forEach(({ label, color }, i) => {
      const g = legendG.append("g").attr("transform", `translate(-86,${i * 18 + 4})`);
      g.append("rect").attr("width", 10).attr("height", 10).attr("fill", color).attr("rx", 2);
      g.append("text").attr("x", 14).attr("y", 9).style("font-size", "11px").text(label);
    });

    const zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .translateExtent([[0, 0], [innerW, innerH]])
      .extent([[0, 0], [innerW, innerH]])
      .on("zoom", (event) => {
        const newX = event.transform.rescaleX(xScale);
        xAxisG
          .call(d3.axisBottom(newX).ticks(Math.max(4, Math.floor(innerW / 80))).tickFormat(d3.timeFormat("%b %d")))
          .selectAll("text").attr("transform", "rotate(-35)").style("text-anchor", "end");
        LINES.forEach(({ key }) => {
          chartArea.select(`.line-${key}`).attr(
            "d",
            d3.line().x((d) => newX(d.date)).y((d) => yScale(d[key])).curve(d3.curveMonotoneX)(data)
          );
        });
      });

    svg.call(zoom);
  }, [data, dims, stock]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="px-4 pt-3 shrink-0">
        <h2 className="text-sm font-semibold text-zinc-700">Price History: {stock}</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Scroll / pinch to zoom · drag to pan</p>
      </div>
      <div ref={wrapperRef} style={{ flex: 1, overflowX: "auto", minHeight: 0 }}>
        <svg ref={svgRef} style={{ display: "block" }} />
      </div>
    </div>
  );
}
