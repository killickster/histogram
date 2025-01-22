import * as _ from 'lodash'
import roundedRect from '../util/roundedRect'

type LabelData = {
  name: string
  color: string
}

export default function Legend ({ width, margin, cell, fontSize2, cornerRadius: r }, data, svg) {
  // Clear existing X and Y axes
  svg.selectAll('.leg').remove()

  const container = svg
    .selectAll('g.leg')
    .data([null])
    .join('g')
    .classed('leg', true)
    .style('transform', `translate(${ width - margin.right - cell * 2 }px, ${ cell * 3 }px)`)

  const labels = container
    .selectAll('g.label')
    .data(data)
    .join('g')
    .classed('svg-label', true)
    .style('transform', (d, i) => `translate(0, ${ i * cell * 3 }px)`)

  labels
    .selectAll('text')
    .data((d) => [d])
    .join('text')
    .attr('font-size', fontSize2)
    .text((d) => d.name)

  labels
    .selectAll('path')
    .data((d) => [d])
    .join('path')
    .attr('d', (d: LabelData) => {
      const i = _.findIndex(data, d)
      const topR = i == 0 ? r : 0
      const bottomR = i == data.length - 1 ? r : 0
      return roundedRect(-cell * 4, -cell * 2, cell * 3, cell * 3, [topR, topR, bottomR, bottomR])
    })
    .attr('fill', (d) => d.color)
}