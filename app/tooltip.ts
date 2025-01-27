import * as d3 from 'd3'
import * as _ from 'lodash'

export default function (c, d) {
  const height = c.width / c.aspectRatio
  const { cell } = c
  const data = d?.data
  c.svg.select('g.tooltip').remove()
  if (!data) return

  const container = c.svg.append('g')
    .classed('tooltip', true)

  container
    .append('text')
    .classed('speed', true)
    .attr('dx', c.width - cell)
    .attr('dy', height - c.margin.bottom - cell)
    .attr('font-size', c.fontSize1)
    .text(`${ data?.[c.xKey] - c.step } - ${ data?.[c.xKey] }`)

  container
    .selectAll('text.time')
    .data(_.map(c.y, def => data[def.key]))
    .join('text')
    .classed('time', true)
    .attr('x', c.margin.left + cell * 3 / 4)
    .attr('y', height - cell * 5)
    .attr('dx', (d, i) => `${ i % 2 * (c.width / 2 - c.margin.left) }`)
    .attr('dy', (d, i) => Math.floor(i / 2) * cell * 4)
    .attr('font-size', c.fontSize1)
    .text(d => d)
}