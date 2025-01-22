export default function (x, y, width, height, r) {
  r = [Math.min(r[0], height, width),
    Math.min(r[1], height, width),
    Math.min(r[2], height, width),
    Math.min(r[3], height, width)]

  return `M${ x + r[0] },${ y
  }h${ width - r[0] - r[1] }${ arc(r[1], [1, 1, 1, 1])
  }v${ height - r[1] - r[2] }${ arc(r[2], [1, 1, -1, 1])
  }h${ -width + r[2] + r[3] }${ arc(r[3], [1, 1, -1, -1])
  }v${ -height + r[3] + r[0] }${ arc(r[0], [1, 1, 1, -1])
  }z`
}
export function arc (r, sign) {
  return r ? `a${r * sign[0]},${r * sign[1]} 0 0 1 ${r * sign[2]},${r * sign[3]}` : ""
}