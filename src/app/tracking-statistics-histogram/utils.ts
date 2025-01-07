import * as _ from 'lodash';
import * as d3 from 'd3';

function Step(context, t) {
  this._context = context;
  this._t = t;
}

const r = 0.15;

Step.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function () {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    if (this._line >= 0) (this._t = 1 - this._t), (this._line = 1 - this._line);
  },
  point: function (x, y) {
    (x = +x), (y = +y);
    switch (this._point) {
      case 0:
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2; // proceed
      default: {
        var xN, yN, mYb, mYa;
        if (this._t <= 0) {
          xN = Math.abs(x - this._x) * r;
          yN = Math.abs(y - this._y) * r;
          mYb = this._y < y ? this._y + yN : this._y - yN;
          mYa = this._y > y ? y + yN : y - yN;

          this._context.quadraticCurveTo(this._x, this._y, this._x, mYb);
          this._context.lineTo(this._x, mYa);
          this._context.quadraticCurveTo(this._x, y, this._x + xN, y);
          this._context.lineTo(x - xN, y);
        } else {
          var x1 = this._x * (1 - this._t) + x * this._t;

          xN = Math.abs(x - x1) * r;
          yN = Math.abs(y - this._y) * r;
          mYb = this._y < y ? this._y + yN : this._y - yN;
          mYa = this._y > y ? y + yN : y - yN;

          this._context.quadraticCurveTo(x1, this._y, x1, mYb);
          this._context.lineTo(x1, mYa);
          this._context.quadraticCurveTo(x1, y, x1 + xN, y);
          this._context.lineTo(x - xN, y);
        }
        break;
      }
    }
    (this._x = x), (this._y = y);
  },
};

export function stepRound(context) {
  return new Step(context, 0.5);
}

export function stepRoundBefore(context) {
  return new Step(context, 0);
}

export function stepRoundAfter(context) {
  return new Step(context, 1);
}


export function loadData(sessionReportData) {
  const raw = sessionReportData
  const data = []
  _.each(raw[0], (d, k) => {
    if (!k.startsWith('time_in')) return

    const datum = {
      type: k.match(/(\d+)_([a-z]+)_skiing/)?.[2] || 'gate',
      speed: parseInt(k.match(/in_(\d+)_kmh/)?.[1]),
      time: d.split(':').reduce((acc, time) => acc * 60 + +time, 0),
    }
    data.push(datum)
  })
  return data
}


export function roundedRect(x, y, width, height, r) {
  r = [
    Math.min(r[0], height, width),
    Math.min(r[1], height, width),
    Math.min(r[2], height, width),
    Math.min(r[3], height, width),
  ];

  return `M${x + r[0]},${y}h${width - r[0] - r[1]}${arc(r[1], [1, 1, 1, 1])}v${height - r[1] - r[2]}${arc(
    r[2],
    [1, 1, -1, 1]
  )}h${-width + r[2] + r[3]}${arc(r[3], [1, 1, -1, -1])}v${-height + r[3] + r[0]}${arc(r[0], [1, 1, 1, -1])}z`;
}
export function arc(r, sign) {
  return r ? `a${r * sign[0]},${r * sign[1]} 0 0 1 ${r * sign[2]},${r * sign[3]}` : '';
}

type DataPoint = {
  speed: number;
  gate?: number;
  free?: number;
};

export function Chart(c, data: DataPoint[], svg) {
  const breakpoints = _.map(c.breakpoints, (value, key) => ({ key, value }));
  const breakpoint = _.find(breakpoints, (b, i) => {
    const next = breakpoints[i + 1];
    if (c.width < b.value || (c.width > b.value && (!next || c.width < next.value))) return true;
  }).key;
  const height = c.width / c.aspectRatio;
  const barWidth = (c.width - c.margin.left - c.margin.right) / data.length;
  const xScale = d3
    .scaleBand(
      data.map((d) => d.speed),
      [c.margin.left - (barWidth * c.padding) / 2, c.width - c.margin.right]
    )
    .padding(c.padding);

  const colorScale = d3.scaleOrdinal(c.categories, c.colors);
  const xScaleAxis = d3.scaleLinear(
    d3.extent(data, (d) => d.speed),
    [c.margin.left, c.width - c.margin.right]
  );

  const yScale = d3.scaleLinear(
    [0, d3.max(data, (d) => (d.gate || 0) + (d.free || 0))],
    [height - c.margin.bottom, c.margin.top]
  );
  const maxY = yScale(0);

  // Clear existing X and Y axes
  svg.selectAll('.x-axis').remove();
  svg.selectAll('.y-axis').remove();

  const stack = d3.stack().keys(c.categories);

  const series = stack(data);

  // Main
  const groups = svg
    .selectAll('g.plot')
    .data([null])
    .join('g')
    .classed('plot', true)
    .selectAll('g')
    .data(series)
    .join('g')
    .style('fill', (d) => colorScale(d.key));

  groups
    .selectAll('path')
    .data((d) => d)
    .join('path')
    .transition()
    .duration(c.skipTransition ? 0 : 750)
    .attr('class', (d) => `speed-${d.data.speed}`, true)
    .attr('d', (d) => {
      const isFlat = d[0] == 0 && d.data.free > 0 && d.data.gate > 0;
      return roundedRect(xScale(d.data.speed), yScale(d[1]), xScale.bandwidth(), yScale(d[0]) - yScale(d[1]), [
        isFlat ? 0 : c.cornerRadius,
        isFlat ? 0 : c.cornerRadius,
        0,
        0,
      ]);
    });

  // X Axis
  const xAxis = d3.axisBottom(xScaleAxis).ticks(c.ticks[breakpoint] + 1);

  const xAxisEl = svg
    .selectAll('g.x-axis')
    .data([null])
    .join('g')
    .classed('axis', true)
    .classed('x-axis', true)
    .attr('transform', `translate(0,${height - c.margin.bottom})`)
    .call(xAxis);

  // Y Axis
  const yAxis = d3.axisLeft(yScale).ticks(c.ticks[breakpoint]);
  const yAxisEl = (d3.select('g.y-axis').node() ? d3.select('g.y-axis') : svg.append('g'))
    .classed('axis', true)
    .classed('y-axis', true)
    .attr('transform', `translate(${c.margin.left},0)`)
    .transition()
    .call(yAxis)
    .selection();

  xAxisEl
    .selectAll('text.label')
    .data([null])
    .join('text')
    .classed('svg-label', true)
    .attr('x', c.width - c.margin.right / 2)
    .attr('y', c.cell * 2.2)
    .attr('font-size', c.fontSize2)
    .text('km/h');

  xAxisEl
    .selectAll('line.axis')
    .data([null])
    .join('line')
    .classed('axis', true)
    .attr('x1', c.margin.left)
    .attr('y1', 0)
    .attr('x2', c.width - c.cell)
    .attr('y2', 0)
    .attr('marker-end', 'url(#triangle)');

  yAxisEl
    .selectAll('line.axis')
    .data([null])
    .join('line')
    .classed('axis', true)
    .attr('x1', 0)
    .attr('y1', maxY)
    .attr('x2', 0)
    .attr('y2', c.cell)
    .attr('marker-end', 'url(#triangle)');

  yAxisEl
    .selectAll('text.label')
    .data([null])
    .join('text')
    .classed('svg-label', true)
    .attr('x', c.cell + c.margin.left)
    .attr('y', c.cell)
    .attr('font-size', c.fontSize2)
    .text('seconds');

  svg.selectAll('.domain').style('stroke-width', `${c.cell / 4}px`);
  svg.selectAll('.tick text').style('font-size', `${c.fontSize1}px`);

  c.skipTransition = false;
}

export function Legend({ width, margin, cell, fontSize2, cornerRadius: r }, data, svg) {
  // Clear existing X and Y axes
  svg.selectAll('.leg').remove();

  const container = svg
    .selectAll('g.leg')
    .data([null])
    .join('g')
    .classed('leg', true)
    .style('transform', `translate(${width - margin.right - cell * 2}px, ${cell * 3}px)`);

  const labels = container
    .selectAll('g.label')
    .data(data)
    .join('g')
    .classed('svg-label', true)
    .style('transform', (d, i) => `translate(0, ${i * cell * 3}px)`);

  labels
    .selectAll('text')
    .data((d) => [d])
    .join('text')
    .attr('font-size', fontSize2)
    .text((d) => d.name);

  labels
    .selectAll('path')
    .data((d) => [d])
    .join('path')
    .attr('d', (d: LabelData) => {
      const i = _.findIndex(data, d);
      const topR = i == 0 ? r : 0;
      const bottomR = i == data.length - 1 ? r : 0;
      return roundedRect(-cell * 4, -cell * 2, cell * 3, cell * 3, [topR, topR, bottomR, bottomR]);
    })
    .attr('fill', (d) => d.color);
}

type LabelData = {
  name: string;
  color: string;
};
