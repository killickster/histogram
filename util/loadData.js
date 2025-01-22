import _ from 'lodash'

export default async function loadData (url) {
  const r = await fetch(url)
  const raw = await r.json()
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