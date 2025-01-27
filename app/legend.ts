import * as _ from 'lodash'
import roundedRect from '../util/roundedRect'

type LabelData = {
  label: string
  color: string
  value: number
}

export default function Legend (c, data) {
  const { cell, cornerRadius: r } = c
  const height = c.width / c.aspectRatio
  c.svg.selectAll('.legend').remove()

  const container = c.svg.selectAll('g.legend').data([null]).join('g')
    .classed('legend', true)
    .style('transform', `translate(${ c.margin.left + cell * 4 }px, ${ height - cell * 5 }px)`)

  const labels = container.selectAll('g.label')
    .data(data)
    .join('g')
    .classed('label', true)
    .style('transform', (d, i) => `translate(${ i % 2 * (c.width / 2 - c.margin.left) }px, ${ Math.floor(i / 2) * cell * 4 }px)`)

  labels.selectAll('text')
    .data(d => [d])
    .join('text')
    .attr('font-size', c.fontSize1)
    .text(d => d.label)

  labels.selectAll('path')
    .data(d => [d])
    .join('path')
    .attr('d', () => (
      roundedRect(-cell * 2.5, -cell * 1.5, cell * 2, cell * 2, [r, r, r, r])
    ))
    .attr('stroke', d => d.color)
    .attr('fill', d => d.enabled ? d.color : 'white')
    .on('click', (e, d) => c.onToggle(_.indexOf(data, d)))
}