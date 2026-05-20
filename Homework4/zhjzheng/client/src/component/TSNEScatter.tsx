import * as d3 from 'd3'
import { useEffect, useRef, useState } from 'react'

interface TSNERow {
  Stock: string
  x: number
  y: number
  sector: string
}

const margin = { top: 20, right: 150, bottom: 50, left: 60 }

const sectorColors: Record<string, string> = {
  Tech: '#4e79a7',
  Finance: '#f28e2b',
  Energy: '#e15759',
  Healthcare: '#76b7b2',
  Industrial: '#59a14f',
  Consumer: '#edc948',
}

const API_URL = 'http://localhost:8000'

export default function TSNEScatter({ ticker }: { ticker: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [tsneData, setTsneData] = useState<TSNERow[]>([])

  useEffect(() => {
    fetch(`${API_URL}/tsne`)
      .then(r => r.json())
      .then(data => setTsneData(data))
      .catch(err => console.error('failed to load tsne:', err))
  }, [])

  useEffect(() => {
    if (!tsneData.length || !svgRef.current || !containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    if (width && height) drawScatter(svgRef.current, tsneData, ticker, width, height)
  }, [tsneData, ticker])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  )
}

function drawScatter(
  svgEl: SVGSVGElement,
  data: TSNERow[],
  selectedTicker: string,
  width: number,
  height: number
) {
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  svg.append('defs').append('clipPath').attr('id', 'scatter-clip')
    .append('rect').attr('width', innerW).attr('height', innerH)

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const xScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.x)! - 5, d3.max(data, d => d.x)! + 5])
    .range([0, innerW])

  const yScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.y)! - 5, d3.max(data, d => d.y)! + 5])
    .range([innerH, 0])

  const xAxisG = g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale))

  const yAxisG = g.append('g').call(d3.axisLeft(yScale))

  g.append('text')
    .attr('transform', `translate(${-40},${innerH / 2}) rotate(-90)`)
    .style('text-anchor', 'middle').style('font-size', '12px')
    .text('t-SNE Y')

  g.append('text')
    .attr('transform', `translate(${innerW / 2},${innerH + 40})`)
    .style('text-anchor', 'middle').style('font-size', '12px')
    .text('t-SNE X')

  const pointsG = g.append('g').attr('clip-path', 'url(#scatter-clip)')

  data.forEach((d) => {
    const isSelected = d.Stock === selectedTicker
    pointsG.append('circle')
      .attr('cx', xScale(d.x))
      .attr('cy', yScale(d.y))
      .attr('r', isSelected ? 10 : 6)
      .attr('fill', sectorColors[d.sector] || 'gray')
      .attr('stroke', isSelected ? 'black' : 'none')
      .attr('stroke-width', isSelected ? 2 : 0)
      .attr('class', `dot-${d.Stock}`)

    if (isSelected) {
      pointsG.append('text')
        .attr('x', xScale(d.x) + 12)
        .attr('y', yScale(d.y) + 4)
        .style('font-size', '13px')
        .style('font-weight', 'bold')
        .text(d.Stock)
    } else {
      pointsG.append('text')
        .attr('x', xScale(d.x) + 8)
        .attr('y', yScale(d.y) + 4)
        .style('font-size', '10px')
        .style('fill', '#555')
        .text(d.Stock)
    }
  })

  // legend
  const sectors = Object.keys(sectorColors)
  sectors.forEach((sec, i) => {
    const lx = innerW + 15
    const ly = 20 + i * 22
    g.append('circle').attr('cx', lx + 6).attr('cy', ly).attr('r', 6)
      .attr('fill', sectorColors[sec])
    g.append('text').attr('x', lx + 16).attr('y', ly + 4)
      .style('font-size', '11px').text(sec)
  })

  // zoom
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 10])
    .on('zoom', (event) => {
      const newX = event.transform.rescaleX(xScale)
      const newY = event.transform.rescaleY(yScale)
      xAxisG.call(d3.axisBottom(newX))
      yAxisG.call(d3.axisLeft(newY))
      data.forEach((d) => {
        pointsG.select(`.dot-${d.Stock}`)
          .attr('cx', newX(d.x))
          .attr('cy', newY(d.y))
      })
      pointsG.selectAll('text').each(function(_, i) {
        const row = data[i]
        if (!row) return
        d3.select(this)
          .attr('x', newX(row.x) + (row.Stock === selectedTicker ? 12 : 8))
          .attr('y', newY(row.y) + 4)
      })
    })

  d3.select(svgEl).call(zoom)
}
