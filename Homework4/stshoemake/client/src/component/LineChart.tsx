import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { isEmpty, debounce } from 'lodash';

import { Bar, ComponentSize, Margin, TickerPoint, tickerFieldList, TickerField, TIMEOUT_INTERVAL } from '../types';

interface DataPoint extends Bar {
  date: Date;
}

type ColorValue = {
  value: TickerField | "date";
  color: string;
}

const margin = { left: 45, right: 20, top: 20, bottom: 40 } as Margin;

  
export function LineChart() {
  let currentData: TickerPoint[] = []

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // NOTE: This should always be called after mount, but it'll completely break if this is the case
    if (!containerRef.current || !svgRef.current) return;

    const categorySelect = d3.select('#bar-select');

    let timeout: number;
    const fetchData = (ticker: string) => {
      fetch(`http://localhost:8000/stock/${ticker}`)
        .then(res => res.json())
        .then(data => {
          const stockData = data['stock_series'];
          currentData = cleanTickerData(stockData);
          setLoading(false);

          const { width, height } = (containerRef.current!).getBoundingClientRect();
          if (width && height) {
            drawChart(svgRef.current!, currentData, width, height);
          }
        })
        .catch(_ => {
          console.log('Failed to fetch Linechart Data. Retrying in 3s...');
          timeout = setTimeout(() => fetchData(ticker), TIMEOUT_INTERVAL)
        });
    }


    // ----------> Draw: Initial Draw <----------
    const initialSelected = categorySelect.property('value');
    fetchData(initialSelected);


    // ----------> Draw: When Selection Changes <----------
    categorySelect
      .on('change.first', function(event) {
        // Prevent data from getting set from previous loads
        clearTimeout(timeout);
        // Update the UI to reflect loading state
        setLoading(true);
        // Gather new data and update UI when recieved
        const ticker = event.target.value;
        fetchData(ticker)
      });


    // ----------> Draw: Every Page Resize <----------
    const resizeObserver = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect as ComponentSize;
          if (width && height && !isEmpty(currentData)) {
            drawChart(svgRef.current!, currentData, width, height);
          }
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeout);
    }
  }, []);

  const colorData: ColorValue[] = tickerFieldList.map((tickerKey: TickerField) => {
    return {
      value: tickerKey,
      color: getColorFromColumn(tickerKey)
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* --- Loading Text ---*/}
      <div className="flex-grow flex h-full w-full" style={{ display: loading ? 'flex' : 'none'}}> Loading... </div>
      {/* --- Chart and Legend --- */}
      <div className="flex-grow flex h-full w-full" style={{ visibility: loading ? 'hidden' : 'visible'}}>
        {/* --- Chart --- */}
        <div className="flex-1 h-full" ref={containerRef}>
          <svg id="line-svg" ref={svgRef} width="100%" height="100%"></svg>
        </div>
        {/* --- Legend --- */}
        <div className="w-[150px] flex-none p-4 h-35">
          <div className="grid auto-rows-fr h-full border bg-slate-100">
            <div className="border font-bold text-center">Legend</div>
            {
            colorData.map((data, index) => (
              <div className="flex items-center" key={index}>
                <div className="h-[50%] w-[20px] m-[2px] border" style={{ backgroundColor: data.color}}></div>
                <div className="h-full mb-[5px]"> {data.value} </div>
              </div>
            ))
            }
          </div>
        </div>
      </div>
      {/* --- Instruction Text below --- */}
      <div className="flex-none text-center p-2">
        Zoom in/out with the scroll wheel, pan (horizontally) with the cursor
      </div>
    </div>
  );
}

function drawChart(svgElement: SVGSVGElement, points: TickerPoint[], width: number, height: number) {
  const svg = d3.select(svgElement);
  svg.selectAll('*').remove(); // clear previous render

  // At least two points are needed to form the extents
  if(points.length < 2) {
    console.error("Unable to draw LineChart: Data contains less than two points");
    return;
  }


  // ----------> Add Scale Graphics <----------
  // X-Scale
  const xExtents = d3.extent(points.map(point => point.date)) as [Date, Date];
  const xScale = d3.scaleTime()
    .domain(xExtents)
    .rangeRound([margin.left, width - margin.right])

  // Y-Scale
  const maxValue = Math.max(
    ...points.map(point => point.open),
    ...points.map(point => point.high),
    ...points.map(point => point.low),
    ...points.map(point => point.close)
  ) * 1.1;
  const minValue = Math.min(
    ...points.map(point => point.open),
    ...points.map(point => point.high),
    ...points.map(point => point.low),
    ...points.map(point => point.close)
  ) * 0.9;



  // ----------> Calculate Scales <----------
  // Add an extra 10% to the top and bottom of the chart, so the highest point isn't scraping the ceiling and the lowest isn't 0
  const yScale = d3.scaleLinear()
    .domain([minValue, maxValue])
    .range([height - margin.bottom, margin.top])

  // xAxis Scaling
  const xAxis = svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
  // yAxis Scaling
  const yAxis = svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));
  // Line generator
  const dataLine = d3.line<DataPoint>()
    .x(p => xScale(p.date))
    .y(p => yScale(p.value));


  // ----------> Create Path Elements <----------
  const paths: d3.Selection<SVGPathElement, DataPoint[], null, undefined>[] = [];
  tickerFieldList.forEach((key: TickerField) => {
    const dataPoints: DataPoint[] = points.map((point: TickerPoint) => {
      return {
        date: point.date,
        value: point[key] as number
      }
    });

    const color = getColorFromColumn(key);
    const path = svg.append("path")
      .datum(dataPoints)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 0.75)
      .attr("d", dataLine)

    paths.push(path);
  });



  // ----------> Add Zoom Functionality <----------
  const zoomFunction = (event: any) => {
    // Redraw x-scale
    const xTicks = event.transform.rescaleX(xScale);
    xAxis.call(d3.axisBottom(xTicks));
    // Redraw lines
    paths.forEach(path => {
      path.attr("d", dataLine.x(d => xTicks(d.date)));
    });
  }

  const zoomAction: any = d3.zoom()
    .scaleExtent([1, 80]) // One week of data at max zoom for 2yr
    .translateExtent([[0, 0], [width, height]]) 
    .on("zoom", zoomFunction);

  svg.call(zoomAction);



  // ----------> Prevent Clipping <----------
  const clipPath = svg.append("defs")
    .append("clipPath")
    .attr("id", "line-chart-clip-path")

  // Make sure the clip starts after the y-scale and ends w the svg
  // x/width are most important, it just fails without y/height
  clipPath.append("rect")
    .attr("width", width - margin.right - margin.left)
    .attr("height", height - margin.top - margin.bottom)
    .attr("x", margin.left)
    .attr("y", margin.top);

  // Give the path object a limited non-clipping area
  paths.forEach(path => {
    path.attr("clip-path", "url(#line-chart-clip-path)");
  });


  
  // ----------> Add Labels <----------
  svg.append('text')
    .attr('x', (width / 2))
    .attr('y', height - 5)
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text("Date");

  // Preprocess positions ahead of time, helps to rotate it about its own center
  const xPos = 12;
  const yPos = (height / 2);
  const rotationText = 'rotate(-90, ' + xPos + ', ' + yPos + ')'
  svg.append('text')
    .attr('x', xPos)
    .attr('y', yPos)
    .attr('transform', rotationText)
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text("Price ($)");
}

function cleanTickerData(rawData: any[]): TickerPoint[] {
  return rawData.map((tickerData: any) => {
    const date = tickerData['Date'] ?? tickerData['date'];
    return {
      date: new Date(date),
      open: Number(tickerData['Open']),
      high: Number(tickerData['High']),
      low: Number(tickerData['Low']),
      close: Number(tickerData['Close'])
    }
  });
}

// Color palette generated from:
// https://www.learnui.design/tools/data-color-picker.html
function getColorFromColumn(selectedCategory: keyof TickerPoint): string {
  switch (selectedCategory) {
    case 'open':
      return '#003f5c';
    case 'high':
      return '#bb4e99';
    case 'low':
      return '#ff5f68';
    case 'close':
      return '#ffa600';
  }

  // Equivalent to defaulting
  return '#575092';
}