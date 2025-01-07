import { Component, Input, AfterViewInit, HostListener } from '@angular/core';
import { loadData, Chart, Legend } from './utils';
import * as _ from 'lodash';
import * as d3 from 'd3';
import { SessionReportData } from './session-report.interface';

@Component({
  selector: 'app-tracking-statistics-histogram',
  templateUrl: './tracking-statistics-histogram.component.html',
  styleUrls: ['./tracking-statistics-histogram.component.scss'],
})
export class TrackingStatisticsHistogramComponent implements AfterViewInit {
  @Input() sessionReportData: SessionReportData;
  svg: any;
  config: any = {};
  data = [];

  @HostListener('window:resize', ['$event'])

  onResize(event: any): void {
    this.debounce(() => this.render({ skipTransition: true }), 200)();
  }

  debounce(func: Function, wait: number): () => void {
    let timeout: any;
    return function (...args: any[]) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  constructor() {}

  ngAfterViewInit() {
    this.svg = d3.select('#histogram');

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
      .style('fill', '#808080');

    this.setData();
  }

  async setData() {
    const source = loadData(this.sessionReportData);

    const cache = {};
    _.each(source, (d, i) => {
      cache[d.speed] = cache[d.speed] || { speed: d.speed };
      cache[d.speed][d.type] = d.time || 0.1; // min value is a fix for defective enter / exit
    });
    this.data = _.sortBy(_.toArray(cache), 'speed');

    const xExtent = d3.extent(this.data, (d) => d.speed);
    const step = (xExtent[1] - xExtent[0]) / (this.data.length - 1);
    this.config['step'] = step;

    this.render();
  }

  render(p?: any) {
    this.config.width = window.innerWidth / 1.2;
    this.config.skipTransition = p?.skipTransition;

    const cell = this.config.width ** 0.38;
    const margin = {
      top: cell * 6,
      right: cell * 7,
      bottom: cell * 6,
      left: cell * 5,
    };

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
      colors: ['#1E1545', '#0079be'],
      cell,
      categories: ['gate', 'free'],
      padding: 0.3,
      fontSize1: cell * 1.5,
      fontSize2: cell * 1.5 * 1.2,
      cornerRadius: 3,
    });

    this.svg.attr('width', this.config.width).attr('height', this.config.width / this.config.aspectRatio);

    Chart(this.config, this.data, this.svg);
    Legend(
      this.config,
      [
        {
          //   name: 'All DH Training Days',
          //   color: config.colors[2],
          // }, {
          name: 'Free Ski',
          color: this.config.colors[1],
        },
        {
          name: 'In Quantriqs',
          color: this.config.colors[0],
        },
      ],
      this.svg
    );
  }
}
