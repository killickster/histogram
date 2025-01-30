import * as _ from 'lodash'
import { arrow, computePosition, offset, flip } from '@floating-ui/dom'

export default function (c, d, el) {
  const tooltip = document.querySelector('.tooltip') as HTMLElement
  const arrowEl = document.querySelector('.tooltip .arrow') as HTMLElement

  if (!d) return tooltip.style.display = 'none'

  tooltip.style.display = 'block'
  tooltip.style.fontSize = c.fontSize1 + 'px'
  tooltip.querySelector('.xKey').innerHTML = `${d.data[c.xKey]} - ${ d.data[c.xKey] + c.step } km/h`
  const key = el.parentElement.classList[0]
  tooltip.querySelector('.yKey').innerHTML = `${d.data[key]} seconds`

  computePosition(el, tooltip, {
    placement: 'right',
    middleware: [
      flip(),
      offset(6),
      arrow({ element: arrowEl }),
    ],
  }).then(({ x, y, placement, middlewareData }) => {
    _.assign(tooltip.style, {
      left: `${ x }px`,
      top: `${ y }px`,
    })
    const { x: arrowX, y: arrowY } = middlewareData.arrow

    const staticSide = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    }[placement.split('-')[0]]

    _.assign(arrowEl.style, {
      left: arrowX != null ? `${ arrowX }px` : '',
      top: arrowY != null ? `${ arrowY }px` : '',
      right: '',
      bottom: '',
      [staticSide]: '-4px',
    })
  })
}