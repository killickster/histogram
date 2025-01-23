//@ts-nocheck
import * as _ from 'lodash'
import * as d3 from 'd3'

import roundedRect from '../util/roundedRect'
import { stepRoundBefore as curveStepRound } from '../util/curveStepRound'

export default function Chart (c, data, svg) {
  const y0 = c.categories[0]
  const y1 = c.categories[1]
  const breakpoints = _.map(c.breakpoints, (value, key) => ({ key, value }))
  const breakpoint = _.find(breakpoints, (b, i) => {
    const next = breakpoints[i + 1]
    if (c.width < b.value || (c.width > b.value && (!next || c.width < next.value))) return true
  }).key
  const height = c.width / c.aspectRatio
  const barWidth = (c.width - c.margin.left - c.margin.right) / data.length
  const xScale = d3.scaleBand(
    data.map(d => d.speed),
    [c.margin.left - (barWidth * c.padding) / 2, c.width - c.margin.right]
  ).padding(c.padding)

  const colorScale = d3.scaleOrdinal(c.categories, c.colors)
  const xExtent = d3.extent(data, d => d[c.xKey])

  const xScaleAxis = d3.scaleLinear(
    d3.extent(data, (d) => d[c.xKey]),
    [c.margin.left, c.width - c.margin.right]
  )

  const yScale = d3.scaleLinear(
    [0, d3.max(data, d => _.sumBy(c.categories, category => d[category] || 0))],
    [height - c.margin.bottom, c.margin.top]
  )
  const maxY = yScale(0)

  const stack = d3.stack()
    .keys(c.categories)
  const series = stack(data)

  const plot = svg.selectAll('g.plot').data([null])
    .join('g')
    .classed('plot', true)

  function baseArea () {
    const step = (xExtent[1] - xExtent[0]) / (data.length - 1)
    const stepLeft = xExtent[0] - step
    const stepRight = xExtent[1] + step
    const xScaleBaseline = d3.scaleBand(
      [stepLeft, ...data.map(d => d[c.xKey]), stepRight],
      [c.margin.left - barWidth, c.width - c.margin.right - barWidth * c.padding / 2 + barWidth],
    )

    const baseData = [
      { ...data[0], [c.xKey]: stepLeft },
      ...data,
      { [c.xKey]: stepRight, [c.base.key]: 0 },
    ]
    const area = d3.area()
      .x(d => xScaleBaseline(d[c.xKey]) + barWidth)
      .y0(maxY)
      .y1(d => yScale(d[c.base.key]))
      .curve(curveStepRound)

    const group = plot.selectAll('g.base-area').data([null])
      .join('g')
      .classed('base-area', true)

    group
      .selectAll('path')
      .data([baseData])
      .join('path')
      .attr('d', area)
      .style('fill', d => c.base.color)
  }

  function stackedBar () {
    const groups = plot.selectAll('g.bar')
      .data(series)
      .join('g')
      .classed('bar', true)
      .style('fill', d => colorScale(d.key))

    groups.selectAll('path')
      .data(d => d)
      .join('path')
      .transition()
      .duration(c.skipTransition ? 0 : 750)
      .attr('class', d => `xKey-${ d.data[c.xKey] }`, true)
      .attr('d', (d, i, j) => {
        const isFlat = d[1] !== _.sumBy(c.categories, cat => d.data[cat])
        return roundedRect(
          xScale(d.data[c.xKey]),
          yScale(d[1]),
          xScale.bandwidth(),
          yScale(d[0]) - yScale(d[1]),
          [isFlat ? 0 : c.cornerRadius, isFlat ? 0 : c.cornerRadius, 0, 0,]
        )
      })
  }

  function xAxis () {
    const xAxis = d3.axisBottom(xScaleAxis)
      .ticks(c.ticks[breakpoint] + 1)

    const xAxisEl = svg.selectAll('g.x-axis').data([null]).join('g')
      .classed('axis', true)
      .classed('x-axis', true)
      .attr('transform', `translate(0,${ height - c.margin.bottom })`)
      .call(xAxis)

    xAxisEl.selectAll('text.label').data([null]).join('text')
      .classed('label', true)
      .attr('x', c.width - c.margin.right / 2)
      .attr('y', c.cell * 2.2)
      .attr('font-size', c.fontSize2)
      .text('km/h')

    xAxisEl.selectAll('line.axis').data([null]).join('line')
      .classed('axis', true)
      .attr('x1', c.margin.left)
      .attr('y1', 0)
      .attr('x2', c.width - c.cell)
      .attr('y2', 0)
      .attr('marker-end', 'url(#triangle)')
  }

  function yAxis () {
    const yAxis = d3.axisLeft(yScale)
      .ticks(c.ticks[breakpoint])
    const yAxisEl = (d3.select('g.y-axis').node() ? d3.select('g.y-axis') : svg.append('g'))
      .classed('axis', true)
      .classed('y-axis', true)
      .attr('transform', `translate(${ c.margin.left },0)`)
      .transition()
      .call(yAxis)
      .selection()

    yAxisEl.selectAll('line.axis').data([null]).join('line')
      .classed('axis', true)
      .attr('x1', 0)
      .attr('y1', maxY)
      .attr('x2', 0)
      .attr('y2', c.cell)
      .attr('marker-end', 'url(#triangle)')

    yAxisEl.selectAll('text.label').data([null]).join('text')
      .classed('label', true)
      .attr('x', c.cell + c.margin.left)
      .attr('y', c.cell)
      .attr('font-size', c.fontSize2)
      .text('seconds')

    svg.selectAll('.domain')
      .style('stroke-width', `${ c.cell / 4 }px`)
    svg.selectAll('.tick text')
      .style('font-size', `${ c.fontSize1 }px`)
  }

  baseArea()
  stackedBar()
  xAxis()
  yAxis()
  c.skipTransition = false
}