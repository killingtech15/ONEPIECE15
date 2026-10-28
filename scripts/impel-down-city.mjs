import * as T from 'three'
import layout from '../src/impel-down-layout.json' with { type: 'json' }
import { detailPrison } from './impel-down-details.mjs'

// Original authored cutaway. Coordinates are artistic units, not a canon floorplan.
export function buildCity({ add, box, cyl, ring, sign, beam, rand, layer, orient }) {
  const stone = '#7d8993',
    trim = '#b8bdba',
    iron = '#33424d'
  function arcWall(r, y, h, c, start = Math.PI / 2, length = Math.PI) {
    const shape = new T.Shape()
    const n = 60
    for (let i = 0; i <= n; i++) {
      const a = start + (length * i) / n
      const x = Math.sin(a) * r,
        z = Math.cos(a) * r
      i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)
    }
    for (let i = n; i >= 0; i--) {
      const a = start + (length * i) / n
      shape.lineTo(Math.sin(a) * (r - 3), -Math.cos(a) * (r - 3))
    }
    shape.closePath()
    const g = new T.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, steps: 1 })
    g.rotateX(-Math.PI / 2)
    add(g, c, [0, y, 0])
  }
  function cell(x, y, z, w = 12, h = 18, c = stone) {
    box([x, y + h / 2, z], [w + 3, h, 9], c)
    box([x, y + h * 0.43, z + 4.6], [w, h * 0.79, 0.4], '#182d3b')
    for (let i = 0; i <= 8; i++)
      box([x - w / 2 + (i * w) / 8, y + h * 0.43, z + 5], [0.35, h * 0.82, 0.45], iron)
    for (const dy of [2, h * 0.72]) box([x, y + dy, z + 5.3], [w + 1, 0.6, 0.5], trim)
    box([x - w / 2 - 1, y + h * 0.5, z + 5], [1.7, h + 1, 1.8], trim)
    box([x + w / 2 + 1, y + h * 0.5, z + 5], [1.7, h + 1, 1.8], trim)
    box([x, y + h, z + 5], [w + 4, 2, 2.2], trim)
  }
  layer('surface')
  cyl([0, 0, 0], 58, 60, 8, stone, 64)
  cyl([0, 24, -8], 47, 50, 44, stone, 64)
  cyl([0, 51, -17], 33, 36, 15, stone, 48)
  cyl([0, 75, -23], 9, 11, 35, stone, 24)
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI * 2) / 36
    box([Math.sin(a) * 47, 48, Math.cos(a) * 47 - 8], [4, 5, 4], trim, a)
  }
  for (const x of [-23, 23]) {
    box([x, 25, 40], [17, 48, 17], stone)
    cyl([x, 56, 40], 0, 14, 20, '#3b6266', 4)
  }
  // Gate opening, radial voussoirs and actual metal grid.
  box([0, 18, 49], [30, 35, 2], '#202f3b')
  for (let x = -14; x <= 14; x += 2.4) box([x, 18, 50.5], [0.8, 35, 0.8], trim)
  for (let y = 3; y < 36; y += 3) box([0, y, 51], [29, 0.7, 1], iron)
  for (let i = 0; i < 13; i++) {
    const a = (Math.PI * i) / 12
    add(
      new T.BoxGeometry(5, 6, 4),
      trim,
      [Math.cos(a) * 17, 31 + Math.sin(a) * 17, 50],
      [0, 0, a - Math.PI / 2],
    )
  }
  box([0, 52, 49], [24, 7, 3], '#34424a')
  sign('IMPEL DOWN', [0, 51, 50.6], 2.1)
  for (const x of [-24, 24]) for (let y = 9; y < 45; y += 9) cell(x, y, 49, 5, 5)
  for (const f of layout.floors) {
    layer('floor' + f.id)
    const color =
      f.id === '5' ? '#bfdbe1' : f.id === '55' ? '#a96c89' : f.id === '3' ? '#b99964' : '#657481'
    cyl([0, f.y - 2, 0], f.r, f.r, 4, color, 64)
    arcWall(f.r, f.y, f.h, color)
    if (['1', '2', '3', '4'].includes(f.id))
      for (let i = -2; i <= 2; i++) cell(i * f.r * 0.32, f.y, -f.r * 0.7, 13, f.h * 0.65, color)
  }
  detailPrison({ add, box, cyl, ring, sign, beam, rand, layer, orient, arcWall, cell })
}
