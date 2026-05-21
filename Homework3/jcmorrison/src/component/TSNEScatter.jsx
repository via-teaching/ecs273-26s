import * as d3 from "d3";
import {useEffect, useRef, useState} from "react";
import {debounce} from "lodash";

const MARGIN = { left: 50, right: 140, top: 20, bottom: 45 };

// sector colors close to HW2 colors
// some difference for more clear distinction
const SECTOR_COLORS = {
  "Energy": "#b62528",
  "Industrials": "#db7814",
  "Consumer": "#338129",
  "Healthcare": "#215b99",
  "Financials": "#ce7cb7",
  "Tech": "#71ddd4",
};

export default function TSNEScatter({selectedStock, onSelectStock}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const dataRef = useRef(null);
  const dimsRef = useRef({ width: 0, height: 0 });
  // store zoom for reset button
  const zoomRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // load tsne.csv from HW2 output
  useEffect(() => {
    d3.csv("/tsne.csv", function(row) {
      return {
        ticker: row.ticker,
        x: +row.x,
        y: +row.y,
        sector: row.sector,
      };
    }).then(function(data) {
      dataRef.current = data;
      setLoaded(true);
    });
  }, []);

  // redraw when selected stock changes or data finishes loading
  useEffect(() => {
    if (!loaded) return;
    var dims = dimsRef.current;
    if (dims.width && dims.height) {
      drawScatter(svgRef.current, dataRef.current, selectedStock, dims.width, dims.height, onSelectStock, zoomRef);
    }
  }, [selectedStock, loaded]);

  // watch for container resize
  useEffect(() => {
    if (!containerRef.current) return;

    var observer = new ResizeObserver(
      debounce(function(entries) {
        for (var i = 0; i < entries.length; i++) {
          var width = entries[i].contentRect.width;
          var height = entries[i].contentRect.height;
          dimsRef.current = { width: width, height: height };
          if (dataRef.current && width && height) {
            drawScatter(svgRef.current, dataRef.current, selectedStock, width, height, onSelectStock, zoomRef);
          }
        }
      }, 80)
    );

    observer.observe(containerRef.current);
    return function() {observer.disconnect();};
  }, [selectedStock, loaded]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* reset zoom button, from github.com/d3/d3-zoom */}
      <button
        onClick={function() {
          if (!zoomRef.current || !svgRef.current) return;
          d3.select(svgRef.current)
          .transition()
          .duration(300)
          .call(zoomRef.current.transform, d3.zoomIdentity);
        }}
        style={{
          position: "absolute",
          top: "6px",
          right: "148px",
          fontSize: "11px",
          padding: "3px 8px",
          background: "#f0f0f0",
          border: "1px solid #ccc",
          borderRadius: "4px",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        Reset Zoom
      </button>
      <div ref={containerRef} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
        <svg ref={svgRef} width="100%" height="100%"></svg>
      </div>
    </div>
  );
}

function drawScatter(svgEl, data, selectedStock, width, height, onSelectStock, zoomRef) {
  if (!svgEl || !width || !height || !data) return;

  var svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  var innerW = width - MARGIN.left - MARGIN.right;
  var innerH = height - MARGIN.top - MARGIN.bottom;

  var xScale = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.x; })).nice()
    .range([0, innerW]);

  var yScale = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.y; })).nice()
    .range([innerH, 0]);

  // clip path to keep points inside chart area during zoom
  svg.append("defs").append("clipPath").attr("id", "tsne-clip")
    .append("rect").attr("width", innerW).attr("height", innerH);

  var g = svg.append("g")
    .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")");

  // axes
  var xAxisG = g.append("g")
    .attr("transform", "translate(0," + innerH + ")")
    .call(d3.axisBottom(xScale).ticks(5));

  var yAxisG = g.append("g")
    .call(d3.axisLeft(yScale).ticks(5));

  // axis labels
  g.append("text")
    .attr("x", innerW / 2)
    .attr("y", innerH + 38)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "#555")
    .text("t-SNE Dimension 1");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -38)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .attr("fill", "#555")
    .text("t-SNE Dimension 2");

  // group for points with clipping applied
  var pointsG = g.append("g").attr("clip-path", "url(#tsne-clip)");

  // tooltip div, reuse if already exists
  var tooltip = d3.select("body").select(".tsne-tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body").append("div")
      .attr("class", "tsne-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.75)")
      .style("color", "#fff")
      .style("padding", "5px 9px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("display", "none");
  }

  // one circle per stock
  // r, stroke, opacity animate smoothly using transition from d3indepth.com/transitions
  pointsG.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", function(d) {return xScale(d.x);})
    .attr("cy", function(d) {return yScale(d.y);})
    .attr("fill", function(d) {return SECTOR_COLORS[d.sector] || "#888";})
    .attr("cursor", "pointer")
    .transition()
    .duration(400)
    .attr("r", function(d) {return d.ticker === selectedStock ? 10 : 6;})
    .attr("stroke", function(d) {return d.ticker === selectedStock ? "#000" : "white";})
    .attr("stroke-width", function(d) {return d.ticker === selectedStock ? 2 : 0.8;})
    .attr("opacity", function(d) {return d.ticker === selectedStock ? 1.0 : 0.75;});

  // tooltip and click events after transition
  // click updates selected stock in all three views for bonus linking interaction
  pointsG.selectAll("circle")
    .on("mouseover", function(event, d) {
      tooltip.style("display", "block")
        .html(
          "<b>" + d.ticker + "</b><br/>" +
          "Sector: " + d.sector + "<br/>" +
          "t-SNE 1: " + d.x.toFixed(3) + "<br/>" +
          "t-SNE 2: " + d.y.toFixed(3)
        )
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseleave", function() {
      tooltip.style("display", "none");
    })
    .on("click", function(event, d) {
      onSelectStock(d.ticker);
    });

  // label only the selected stock
  pointsG.selectAll("text.stock-label")
    .data(data.filter(function(d) {return d.ticker === selectedStock;}))
    .join("text")
    .attr("class", "stock-label")
    .attr("x", function(d) { return xScale(d.x) + 13; })
    .attr("y", function(d) { return yScale(d.y) + 4; })
    .attr("font-size", 13)
    .attr("font-weight", "bold")
    .attr("fill", "#111")
    .text(function(d) { return d.ticker; });

  // legend on the right side
  var sectors = Object.keys(SECTOR_COLORS);
  var legendG = svg.append("g")
    .attr("transform", "translate(" + (MARGIN.left + innerW + 12) + "," + MARGIN.top + ")");

  legendG.append("text")
    .attr("y", -4)
    .attr("font-size", 11)
    .attr("font-weight", "bold")
    .attr("fill", "#333")
    .text("Sector");

  for (var si = 0; si < sectors.length; si++) {
    var row = legendG.append("g").attr("transform", "translate(0," + (si * 18 + 4) + ")");
    row.append("circle")
      .attr("cx", 7).attr("cy", 7).attr("r", 6)
      .attr("fill", SECTOR_COLORS[sectors[si]]);
    row.append("text")
      .attr("x", 17).attr("y", 11)
      .attr("font-size", 11)
      .attr("fill", "#333")
      .text(sectors[si]);
  }

  // zoom behavior from github.com/d3/d3-zoom
  var zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", function(event) {
      var t = event.transform;
      var newX = t.rescaleX(xScale);
      var newY = t.rescaleY(yScale);

      xAxisG.call(d3.axisBottom(newX).ticks(5));
      yAxisG.call(d3.axisLeft(newY).ticks(5));

      pointsG.selectAll("circle")
        .attr("cx", function(d) { return newX(d.x); })
        .attr("cy", function(d) { return newY(d.y); });

      pointsG.selectAll("text.stock-label")
        .attr("x", function(d) { return newX(d.x) + 13; })
        .attr("y", function(d) { return newY(d.y) + 4; });
    });

  svg.call(zoom);

  // store zoom reference for reset button
  zoomRef.current = zoom;
}
