import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core'
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
export class ChartComponent implements AfterViewInit, OnInit {

  selectedOption: string = ''; // Default selected value

  dataUrl1 = './data/d2.json'
  dataUrl2 = './data/d3.json'
  svg: any
  config = {
    width: 0,
    aspectRatio: 1,
    step: 0,
    skipTransition: false,
    xKey: 'speed',
    y: [{
      key: 'current_quant_time',
      label: 'Quantriq',
      color: '#1E1545',
      enabled: true,
    }, {
      key: 'other_quant_time',
      label: 'Other quantriqs',
      color: '#402d93',
      enabled: true,
    }, {
      key: 'non_quant_time',
      label: 'Free ski',
      color: '#0079be',
      enabled: false,
    }, {
      key: 'average_quant_time',
      label: 'All athletes',
      color: '#9e9e9e',
      base: true,
      enabled: true
    }],
  }
  data = []

  @HostListener('window:resize', ['$event'])

  ngOnInit() {
    this.setData(this.dataUrl1)
  }

  onResize (event: any): void {
    this.debounce(() => this.render({ skipTransition: true }), 200)()
  }

  onToggle (i: number): void {
    this.config.y[i].enabled = !this.config.y[i].enabled
    this.render({ skipTransition: true })
  }

  debounce (func: Function, wait: number): () => void {
    let timeout: any
    return function (...args: any[]) {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  clickedOption1() {
    this.setData(this.dataUrl1)
  }

  clickedOption2() {
    this.setData(this.dataUrl2)
  }

  async ngAfterViewInit () {
    this.svg = d3.select('.histogram')

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

  }

  async setData(option) {
    console.log("option", option)
    const r = await fetch(option)
    const raw = await r.json()
    console.log("raw", raw)
    this.data = raw
    const xMax = _.findLast(this.data, (d) => _.sumBy(this.config.y, (y) => d[y.key as string]) > 0).speed * 1;
    this.data = _.filter(
      _.sortBy(this.data, this.config.xKey),
      (d) => _.sumBy(this.config.y, (y) => d[y.key]) > 0 || d[this.config.xKey] < xMax
    );

    const xExtent = d3.extent(this.data, (d) => d[this.config.xKey]);
    const step = (xExtent[1] - xExtent[0]) / (this.data.length - 1);
    this.config.step = step;

    this.render();
  }



  render (p?: any) {
    this.config.width = window.innerWidth / 1
    this.config.skipTransition = p?.skipTransition

    const cell = this.config.width ** 0.38
    const margin = {
      top: cell * 6,
      right: cell * 7,
      bottom: cell * 3,
      left: cell * 5,
    }

    _.merge(this.config, {
      svg: this.svg,
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
      cornerRadius: 3,
      onToggle: this.onToggle.bind(this),
    })

    this.svg.attr('width', this.config.width).attr('height', this.config.width / this.config.aspectRatio)

    Chart(this.config, this.data)
    Legend(this.config, this.config.y)
  }
}