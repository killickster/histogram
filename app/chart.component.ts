import { AfterViewInit, Component, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import * as _ from 'lodash'
import * as d3 from 'd3'

import Chart from './chart'
import Legend from './legend'

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-chart',
  styleUrls: ['./chart.component.scss'],
  templateUrl: './chart.component.html',
})
export class ChartComponent implements AfterViewInit {
  dataUrl = './data/d2.json'
  svg: any
  config: any = {
    colors: ['#1E1545', '#402d93', '#0079be'],
    xKey: 'speed',
    categories: ['current_quant_time', 'other_quant_time', 'non_quant_time'],
    labels: ['Quantriq', 'Other quantriqs', 'Free skiing'],
    base: { key: 'average_quant_time', label: 'All athletes', color: '#9e9e9e' },
  }
  data = []

  @HostListener('window:resize', ['$event'])

  onResize (event: any): void {
    this.debounce(() => this.render({ skipTransition: true }), 200)()
  }

  debounce (func: Function, wait: number): () => void {
    let timeout: any
    return function (...args: any[]) {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  async ngAfterViewInit () {
    this.svg = d3.select('#histogram')

    this.svg
      .append('svg:defs')
      .append('svg:marker')
      .attr('id', 'triangle')
      .attr('viewBox', '0 -5 10 10')
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('refX', 5)
      .attr('refY', 0)
      .attr('markerWidth', 12)
      .attr('markerHeight', 12)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')

    const r = await fetch(this.dataUrl)
    const raw = await r.json()
    const xMax = _.findLast(raw, d => _.sumBy(this.config.categories, cat => d[cat as string]) > 0).speed * 1.2
    this.data = _.filter(_.sortBy(raw, this.config.xKey), d => (
      _.sumBy(this.config.categories, cat => d[cat as string]) > 0 || d[this.config.xKey] < xMax
    ))

    const xExtent = d3.extent(this.data, d => d[this.config.xKey])
    const step = (xExtent[1] - xExtent[0]) / (this.data.length - 1)
    this.config.step = step

    this.render()
  }

  render (p?: any) {
    this.config.width = window.innerWidth / 1.2
    this.config.skipTransition = p?.skipTransition

    const cell = this.config.width ** 0.38
    const margin = {
      top: cell * 6,
      right: cell * 7,
      bottom: cell * 6,
      left: cell * 5,
    }

    _.merge(this.config, {
      aspectRatio: 1.9,
      breakpoints: {
        xs: 480,
        sm: 768,
        lg: 1200,
      },
      ticks: {
        xs: 2,
        sm: 3,
        lg: 5,
      },
      margin,
      cell,
      padding: 0.3,
      fontSize1: cell * 1.5,
      fontSize2: cell * 1.5 * 1.2,
      cornerRadius: 3,
    })

    this.svg.attr('width', this.config.width).attr('height', this.config.width / this.config.aspectRatio)

    const legendData = _.map(this.config.labels,
      (label, i) => ({
        label,
        color: this.config.colors[i],
      }))

    if (this.config.base) legendData.push(this.config.base)

    Chart(this.config, this.data, this.svg)
    Legend(this.config, legendData, this.svg)
  }
}