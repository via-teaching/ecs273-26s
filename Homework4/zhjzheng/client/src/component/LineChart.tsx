import * as d3 from 'd3'
import { useEffect, useRef, useState } from 'react'

interface StockRow {
  Date: Date
  Open: number
  High: number
  Low: number
  Close: number
}

const margin = { top: 20, right: 130, bottom: 50, left: 60 }
const lineColors: Record<string, string> = {
  Open: 'steelblue',
  High: 'green',
  Low: 'red',
  Close: 'orange'
}
const keys = ['Open', 'High', 'Low', 'Close'] as const

const API_URL = 'http://localhost:8000'

export default function LineChart({ ticker }: { ticker: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<StockRow[]>([])

  useEffect(() => {
    if (!ticker) return
    fetch(`${API_URL}/stock/${ticker}`)
      .then(res => res.json())
      .then(json => {
        const parsed = json.stock_series.map((d: any) => ({
          Date: new Date(d.date),
          Open: d.Open,
          High: d.High,
          Low: d.Low,
          Close: d.Close,
        }))
        setData(parsed)
      })
      .catch(err => console.error('failed to fetch stock data:', err))
  }, [ticker])

  useEffect(() => {
    if (!data.length || !svgRef.current || !containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    if (width && height) drawChart(svgRef.current, data, width, height)
  }, [data])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  )
}

function drawChart(svgEl: SVGSVGElement, data: StockRow[], width: number, height: number) {
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  svg.append('defs').append('clipPath').attr('id', 'line-clip')
    .append('rect').attr('width', innerW).attr('height', innerH + 10).attr('y', -5)

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const xScale = d3.scaleTime()
    .domain(d3.extent(data, (d) => d.Date) as [Date, Date])
    .range([0, innerW])

  const yMin = d3.min(data, (d) => Math.min(d.Open, d.High, d.Low, d.Close))!
  const yMax = d3.max(data, (d) => Math.max(d.Open, d.High, d.Low, d.Close))!
  const yScale = d3.scaleLinear().domain([yMin * 0.98, yMax * 1.02]).range([innerH, 0])

  const xAxisG = g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale))

  g.append('g').call(d3.axisLeft(yScale))

  g.append('text')
    .attr('transform', `translate(${-40},${innerH / 2}) rotate(-90)`)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Price (USD)')

  g.append('text')
    .attr('transform', `translate(${innerW / 2},${innerH + 40})`)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Date')

  const linesG = g.append('g').attr('clip-path', 'url(#line-clip)')

  keys.forEach((key) => {
    const lineGen = d3.line<StockRow>()
      .x((d) => xScale(d.Date))
      .y((d) => yScale(d[key]))

    linesG.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', lineColors[key])
      .attr('stroke-width', 1.5)
      .attr('d', lineGen)
      .attr('class', `line-${key}`)
  })

  // legend
  keys.forEach((key, i) => {
    const legendX = innerW + 10
    const legendY = 20 + i * 20
    g.append('line')
      .attr('x1', legendX).attr('x2', legendX + 20)
      .attr('y1', legendY).attr('y2', legendY)
      .attr('stroke', lineColors[key]).attr('stroke-width', 2)
    g.append('text')
      .attr('x', legendX + 25).attr('y', legendY + 4)
      .style('font-size', '12px')
      .text(key)
  })

  // zoom horizontal only
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 30])
    .translateExtent([[0, 0], [innerW, innerH]])
    .extent([[0, 0], [innerW, innerH]])
    .on('zoom', (event) => {
      const newX = event.transform.rescaleX(xScale)
      const zoomLevel = event.transform.k
      let tickFormat
      if (zoomLevel > 15) {
        tickFormat = d3.timeFormat('%b %d, %Y')
      } else if (zoomLevel > 5) {
        tickFormat = d3.timeFormat('%b %d')
      } else {
        tickFormat = d3.timeFormat('%b %Y')
      }
      xAxisG.call(d3.axisBottom(newX).tickFormat(tickFormat as any))
      keys.forEach((key) => {
        const newLine = d3.line<StockRow>()
          .x((d) => newX(d.Date))
          .y((d) => yScale(d[key]))
        linesG.select(`.line-${key}`).attr('d', newLine(data))
      })
    })

  d3.select(svgEl).call(zoom)
}
