import * as T from 'three'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { readFileSync } from 'node:fs'
const layout = JSON.parse(readFileSync(new URL('../src/water7-layout.json', import.meta.url)))

export function buildCity({ add, box, cyl, ring, sign, beam, house, bridge, rand, font }) {
  const arch = (x, y, z, w, h, color = 'trim', angle = 0) => {
    const at = (xx, yy) => [x + xx * Math.cos(angle), y + yy, z - xx * Math.sin(angle)]
    for (const s of [-1, 1]) box(at((s * w) / 2, h / 2), [0.45, h, 0.55], color, angle)
    add(new T.TorusGeometry(w / 2, 0.24, 5, 16, Math.PI), color, [x, y + h, z], [0, angle, 0])
  }
  const disk = (x, y, z, r, color) =>
    add(new T.CylinderGeometry(r, r, 0.12, 20), color, [x, y, z], [Math.PI / 2, 0, 0])
  const porthole = (x, y, z, r) => {
    disk(x, y, z, r, 'dark')
    add(new T.TorusGeometry(r, 0.14, 6, 20), 'gold', [x, y, z + 0.08])
    box([x, y, z + 0.1], [r * 1.7, 0.1, 0.13], 'trim')
    box([x, y, z + 0.1], [0.1, r * 1.7, 0.13], 'trim')
  }
  const gable = (x, y, z, w, h, d, c, roof = 'roof') => {
    box([x, y + h / 2, z], [w, h, d], c)
    const shape = new T.Shape()
      .moveTo(-w / 2, 0)
      .lineTo(w / 2, 0)
      .lineTo(0, w * 0.7)
      .closePath()
    add(new T.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false }), c, [x, y + h, z - d / 2])
    beam([x - w * 0.56, y + h, z + d / 2 + 0.1], [x, y + h + w * 0.76, z + d / 2 + 0.1], 0.5, roof)
    beam([x + w * 0.56, y + h, z + d / 2 + 0.1], [x, y + h + w * 0.76, z + d / 2 + 0.1], 0.5, roof)
    for (const side of [-1, 1]) {
      const slope = new T.PlaneGeometry(w * 0.94, d + 1)
      add(slope, roof, [x + side * w * 0.25, y + h + w * 0.37, z], [-Math.PI / 2, side * 0.94, 0])
    }
  }
  const crane = (x, y, z, angle = 0) => {
    cyl([x, y + 1, z], 1.2, 1.5, 2, 'iron', 12)
    beam([x, y, z], [x, y + 13, z], 0.8, 'iron')
    const end = [x + Math.cos(angle) * 11, y + 17, z + Math.sin(angle) * 11]
    beam([x, y + 13, z], end, 0.65, 'iron')
    beam([x, y + 7, z], end, 0.18, 'dark')
    beam(end, [end[0], y + 6, end[2]], 0.07, 'dark')
    add(new T.TorusGeometry(0.7, 0.12, 5, 12, Math.PI * 1.5), 'iron', [end[0], y + 5.5, end[2]])
  }
  // A broad city slope with many streets, rather than three narrow rings of houses.
  cyl([0, 3, 0], 74, 76, 6, 'stone', 128)
  cyl([0, 12, 0], 55, 71, 12, 'stone', 128)
  cyl([0, 24.5, 0], 32, 54, 13, 'stone', 128)
  cyl([0, 33, 0], 18, 31, 4, 'stone', 96)
  for (const [r, y] of [
    [74, 6],
    [55, 18],
    [32, 31],
  ]) {
    ring([0, y + 0.15, 0], r + 1, r - 1, 'trim')
    ring([0, y + 0.22, 0], r - 1, r - 5.5, 'water')
  }
  // Staggered neighborhoods leave eight radial canals and a headquarters precinct clear.
  for (const [r, y, count] of [
    [65, 8.6, 58],
    [59, 13.1, 51],
    [47, 21.6, 44],
    [40, 26, 36],
    [26, 33, 23],
    [20, 36, 17],
  ]) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (r % 3) * 0.035
      if (Math.abs(Math.sin(a * 4)) < 0.19) continue
      const x = Math.cos(a) * r,
        z = Math.sin(a) * r
      // Leave an open fountain forecourt so rooftops cannot intersect or hide its plaque.
      if (r <= 26 && z > 12 && Math.abs(x) < 15) continue
      if (x > 15 && z < -13 && z > -44) continue
      if (x < -48 && z > 3 && z < 21) continue
      if (z > 49 && x > -35 && x < 3) continue
      const w = 3.2 + rand() * 1.6,
        d = 3.8 + rand() * 0.8,
        h = 3.5 + rand() * 4
      cyl([x, y - 0.6, z], 3.2, 3.2, 1.2, 'stone', 6)
      house(x, y, z, w, h, d, ['peach', 'pink', 'blue', 'yellow', 'trim'][i % 5], Math.PI / 2 - a)
      if (i % 4 === 0) {
        const front = [x + Math.cos(a) * 2.9, y + 1.9, z + Math.sin(a) * 2.9]
        box(front, [w, 0.18, 1.5], 'roofLight', Math.PI / 2 - a)
      }
    }
  }
  // Wide downhill channels, with raised sidewalls and little crossing bridges.
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const p = (r, y) => [Math.cos(a) * r, y, Math.sin(a) * r]
    for (const [r1, y1, r2, y2] of [
      [18, 35.3, 32, 31.3],
      [32, 31.3, 55, 18.3],
      [55, 18.3, 74, 6.3],
    ]) {
      const start = new T.Vector3(...p(r1, y1)),
        end = new T.Vector3(...p(r2, y2)),
        delta = end.clone().sub(start)
      const q = new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        delta.clone().normalize(),
      )
      const water = new T.BoxGeometry(3.3, delta.length(), 0.18).applyQuaternion(q)
      add(water, 'water', start.clone().add(end).multiplyScalar(0.5).toArray())
      for (const s of [-1, 1]) {
        const off = [-Math.sin(a) * s * 2, 0.35, Math.cos(a) * s * 2]
        beam(
          start.toArray().map((v, k) => v + off[k]),
          end.toArray().map((v, k) => v + off[k]),
          0.45,
          'trim',
        )
      }
    }
    bridge(Math.cos(a) * 61, 13.7, Math.sin(a) * 61, 6, -a)
    bridge(Math.cos(a) * 44, 25.1, Math.sin(a) * 44, 6, -a)
  }
  // Massive numbered water gates around the outer seawall.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.22,
      angle = Math.PI / 2 - a
    const at = (x, y, z) => [
      Math.cos(a) * 74 + x * Math.cos(angle) + z * Math.sin(angle),
      y,
      Math.sin(a) * 74 - x * Math.sin(angle) + z * Math.cos(angle),
    ]
    for (const side of [-1, 1]) box(at(side * 6, 9, 0), [3, 18, 5], 'trim', angle)
    box(at(0, 17, 0), [15, 2, 5], 'stone', angle)
    add(new T.TorusGeometry(5, 0.7, 6, 24, Math.PI), 'trim', at(0, 12, 2.6), [0, angle, 0])
    box(at(0, 8, 2.5), [8, 12, 0.18], 'dark', angle)
    box(at(8, 15, 0), [5, 16, 4], 'trim', angle)
    box(at(8, 15, 2.1), [3.8, 12, 0.1], 'blue', angle)
    const number = new TextGeometry(String(i + 1), { font, size: 5, depth: 0.1, curveSegments: 2 })
    number.translate(-1.5, 0, 0)
    add(number, 'dark', at(8, 12, 2.2), [0, angle, 0])
    for (let j = 0; j < 8; j++) box(at(-6 + j * 2, 18.3, 0), [0.7, 0.8, 5], 'trim', angle)
  }
  // Monumental three-basin fountain: open arches and slender supports reveal water.
  for (const [r, y] of [
    [16, 37],
    [11, 49],
    [6, 60],
  ]) {
    cyl([0, y - 1, 0], r, r + 0.5, 2, 'trim', 64)
    cyl([0, y + 0.1, 0], r - 0.7, r - 0.7, 0.15, 'water', 64)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      cyl([Math.cos(a) * (r - 2), y + 4.8, Math.sin(a) * (r - 2)], 0.35, 0.65, 9, 'trim', 10)
    }
  }
  cyl([0, 44, 0], 2.8, 5, 11, 'stone', 32)
  cyl([0, 55, 0], 1.4, 3, 10, 'stone', 24)
  add(new T.ConeGeometry(2, 9, 12), 'blue', [0, 69, 0])
  // A flat, bracketed plaque keeps every letter supported and outside the curved basin.
  box([0, 39.5, 18.3], [22, 4.5, 0.5], 'trim')
  for (const x of [-11, 11]) box([x, 39.5, 18.6], [0.22, 4.7, 0.18], 'iron')
  for (const y of [37.25, 41.75]) box([0, y, 18.6], [22.2, 0.22, 0.18], 'iron')
  for (const x of [-8, 8]) {
    beam([x, 36, 13], [x, 38.8, 18.3], 0.45, 'iron')
    beam([x, 36.5, 13], [x, 36.5, 18.3], 0.4, 'iron')
  }
  sign('WATER 7', [0, 38.5, 18.61], 2.1)
  // Lower town follows the shoreline in separate blocks with alleys and quays.
  for (const [cx, cz] of [
    [-68, 40],
    [-53, -61],
    [65, -42],
    [42, 73],
  ]) {
    cyl([cx, 1.5, cz], 15, 17, 3, 'stone', 24)
    for (let row = 0; row < 2; row++)
      for (let i = 0; i < 4; i++) {
        house(
          cx + (i - 1.5) * 6,
          3,
          cz + (row - 0.5) * 10,
          4.2,
          5 + rand() * 4,
          4.3,
          ['trim', 'peach', 'yellow', 'blue'][i],
        )
      }
  }
  // Rocky Cape: uneven stone shelves, mooring pier and the arrival approach.
  for (let i = 0; i < 6; i++)
    add(
      new T.DodecahedronGeometry(7 + rand() * 3, 0),
      'stone',
      [-78 + (i % 3) * 5, 1, -2 * Math.floor(i / 3) + 79],
      [0, i, 0],
      [1, 0.4, 1],
    )
  bridge(-65, 3.5, 74, 26, Math.PI / 2)
  box([-78, 1.5, 92], [5, 1, 13], 'wood')
  for (let i = 0; i < 10; i++) box([-78, 2.05, 86 + i * 1.2], [5, 0.08, 0.16], 'trim')
  // Rental quay and market canals: readable fronts, striped awnings and jetties.
  house(-41, 6.3, 61, 7, 5, 6, 'blue')
  sign('BULL RENTAL', [-41, 10.4, 64.2], 0.75)
  box([-41, 5, 67], [13, 0.5, 4], 'wood')
  for (let i = 0; i < 5; i++) {
    house(-31 + i * 6, 8, 58, 4.5, 5 + (i % 3), 5, 'peach')
    for (let j = 0; j < 5; j++)
      box(
        [-31 + i * 6 + (j - 2) * 0.85, 10.5, 61.5],
        [0.85, 0.18, 2.5],
        j % 2 ? 'trim' : 'roofLight',
      )
    for (let j = 0; j < 3; j++)
      box([-32 + i * 6 + j, 8.5, 62.5], [0.8, 0.8, 0.8], j % 2 ? 'gold' : 'leaf')
  }
  // Dock 1 is a full working yard, with an exposed ribbed hull and dry-dock basin.
  box([86, 1.3, 28], [35, 2.6, 34], 'stone')
  box([82, 2.65, 29], [10, 0.1, 24], 'water')
  for (const side of [-1, 1]) box([82 + side * 6, 3.7, 29], [2, 2.2, 27], 'trim')
  house(94, 2.7, 16, 13, 8, 9, 'blue')
  sign('GALLEY-LA', [94, 9, 20.7], 1.1)
  for (let i = 0; i < 14; i++) {
    const t = (i / 13 - 0.5) * 2,
      r = 4.5 * Math.sqrt(Math.max(0.12, 1 - t * t))
    add(
      new T.TorusGeometry(r, 0.2, 6, 16, Math.PI),
      'wood',
      [82, 8.1, 18 + i * 1.7],
      [0, 0, Math.PI],
    )
  }
  beam([82, 3.7, 17], [82, 3.7, 41], 0.6, 'wood')
  for (const side of [-1, 1]) beam([82 + side * 4, 7.7, 21], [82 + side * 4, 7.7, 39], 0.28, 'wood')
  crane(72, 3, 35, 0.3)
  crane(101, 3, 35, Math.PI)
  for (let i = 0; i < 12; i++)
    box(
      [94 + (i % 3) * 1.1, 3 + Math.floor(i / 6) * 0.8, 30 + (Math.floor(i / 3) % 2) * 2],
      [0.8, 0.7, 8],
      'wood',
    )
  sign('DOCK 1', [84, 4.5, 45.2], 1.8)
  // Galley-La: pale crenellated towers, round windows and a five-arch loggia.
  const hx = 33,
    hy = 23,
    hz = -29
  box([hx, hy - 1, hz], [33, 2, 25], 'stone')
  box([hx, hy + 7, hz], [29, 14, 13], 'trim')
  for (const [dx, h, w] of [
    [-11, 24, 7],
    [0, 29, 9],
    [11, 24, 7],
  ]) {
    box([hx + dx, hy + h / 2, hz - 2], [w, h, 8], 'trim')
    for (let i = 0; i < 5; i++)
      box([hx + dx + ((i - 2) * w) / 5, hy + h + 0.6, hz - 2], [w / 9, 1.4, 8], 'trim')
    for (let row = 0; row < 3; row++)
      for (let j = -1; j <= 1; j++) {
        box([hx + dx + j * 1.7, hy + 12 + row * 4, hz + 2.1], [0.8, 2.4, 0.15], 'dark')
        arch(hx + dx + j * 1.7, hy + 11 + row * 4, hz + 2.2, 1, 1.8, 'stone')
      }
  }
  for (let i = -2; i <= 2; i++) {
    const x = hx + i * 5.6
    arch(x, hy, hz + 8, 5, 4.8)
    box([x, hy + 2, hz + 6.6], [2.1, 3.8, 0.1], 'wood')
    porthole(x, hy + 10, hz + 6.65, 1.2)
  }
  box([hx, hy + 7, hz + 8], [30, 0.5, 3.5], 'stone')
  sign('GALLEY-LA', [hx, hy + 23, hz + 2.2], 1.35)
  sign('COMPANY', [hx, hy + 21, hz + 2.2], 0.8)
  for (let i = 0; i < 15; i++)
    box([hx, hy - 5 + i * 0.33, hz + 18 - i * 0.65], [11, 0.4, 0.8], 'trim')
  // Blueno's small bar gets its own arched storefront, stools and canal landing.
  house(-58, 8, 12, 9, 8, 7, 'yellow')
  arch(-58, 8, 15.7, 3.3, 4, 'trim')
  box([-58, 10, 15.6], [2.8, 4, 0.1], 'wood')
  sign('BLUENO', [-58, 14.4, 15.7], 1)
  for (const x of [-61, -55]) porthole(x, 12, 15.7, 0.7)
  box([-58, 11, 17], [10, 0.25, 3], 'roof')
  for (const x of [-61, -55]) cyl([x, 9.2, 17], 0.5, 0.5, 1.4, 'wood', 10)
  // Water elevator: tall lock towers, open chamber, sluice gates and upper aqueduct.
  box([47, 10, 33], [13, 20, 12], 'stone')
  box([47, 20.2, 33], [8, 0.2, 10], 'water')
  for (const x of [40, 54]) {
    box([x, 19, 33], [3, 32, 4], 'trim')
    for (let i = 0; i < 5; i++) box([x, 5 + i * 6, 35.1], [1.3, 2.8, 0.1], 'dark')
  }
  box([47, 34, 33], [18, 2, 5], 'stone')
  for (let i = 0; i < 9; i++) box([43 + i, 16, 38.8], [0.18, 15, 0.2], 'iron')
  bridge(47, 21, 16, 24)
  for (const z of [9, 20]) arch(47, 7, z, 6, 9, 'stone')
  // Franky House: reference-led green front, crescent, crooked blue roof, two arms.
  const fx = -107,
    fz = -53
  cyl([fx, 1.2, fz], 26, 29, 2.4, 'stone', 36)
  box([fx, 9, fz], [15, 14, 12], '#78a578')
  for (let i = 0; i < 10; i++) box([fx, 3 + i * 1.35, fz + 6.08], [15, 0.12, 0.1], '#436f58')
  for (const side of [-1, 1]) {
    gable(fx + side * 10.7, 2.4, fz + 1, 6.8, 9, 9, '#7ea57c', 'wood')
    arch(fx + side * 10.7, 7, fz + 5.6, 2.5, 3, 'trim')
    porthole(fx + side * 10.7, 9.5, fz + 5.75, 1)
    box([fx + side * 10.7, 4, fz + 5.6], [1.6, 3.2, 0.12], 'wood')
    beam([fx + side * 6, 3, fz + 7], [fx + side * 4, 16, fz + 7], 1.1, '#ab759a')
  }
  // Swept, asymmetric roof profile instead of a stock red barrel roof.
  const roofShape = new T.Shape()
    .moveTo(-8, 0)
    .bezierCurveTo(-9, 6, 2, 7, 7, 11)
    .bezierCurveTo(12, 4, 9, 1, 8, 0)
    .closePath()
  add(
    new T.ExtrudeGeometry(roofShape, {
      depth: 13,
      steps: 1,
      bevelEnabled: false,
      curveSegments: 16,
    }),
    '#6e80ba',
    [fx, 16, fz - 6.5],
  )
  for (const x of [-4, 4]) {
    cyl([fx + x, 27 + (x > 0 ? 2 : 0), fz], 1.4, 1.4, 4, 'peach', 14)
    add(new T.ConeGeometry(1.9, 2.5, 14), '#6e80ba', [fx + x, 30.2 + (x > 0 ? 2 : 0), fz])
    porthole(fx + x, 27 + (x > 0 ? 2 : 0), fz + 1.45, 0.45)
  }
  const moon = new T.Shape()
  moon.moveTo(6, 8).bezierCurveTo(-10, 18, -16, -7, -1, -12).bezierCurveTo(-8, -3, -6, 8, 6, 8)
  add(
    new T.ExtrudeGeometry(moon, {
      depth: 0.8,
      bevelEnabled: true,
      bevelSize: 0.15,
      bevelThickness: 0.15,
      bevelSegments: 1,
      curveSegments: 20,
    }),
    'gold',
    [fx + 4, 30, fz - 4],
  )
  for (const side of [-1, 1]) porthole(fx + side * 4.6, 17.5, fz + 6.8, 1.65)
  gable(fx, 2.5, fz + 7, 10, 8, 3, '#ab759a', 'wood')
  for (const side of [-1, 1]) {
    arch(fx + side * 2, 2.5, fz + 8.65, 3.1, 4.5, 'trim')
    box([fx + side * 2, 5, fz + 8.62], [2.6, 5, 0.18], '#548960')
    for (let k = 0; k < 3; k++)
      box([fx + side * 2, 3.5 + k * 1.4, fz + 8.8], [2.6, 0.18, 0.15], 'wood')
  }
  disk(fx, 12, fz + 8.8, 1.5, 'gold')
  const star = new T.Shape()
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? 0.6 : 1.3
    i
      ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      : star.moveTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  star.closePath()
  add(new T.ExtrudeGeometry(star, { depth: 0.12, bevelEnabled: false }), 'dark', [fx, 12, fz + 9])
  box([fx, 15, fz + 9], [19, 3.5, 0.6], 'wood')
  const label = new TextGeometry('FRANKY HOUSE', { font, size: 1.6, depth: 0.12, curveSegments: 3 })
  label.computeBoundingBox()
  label.translate(-label.boundingBox.max.x / 2, 0, 0)
  add(label, 'gold', [fx, 14.4, fz + 9.4])
  const arms = [
    [
      [fx - 13, 5, fz],
      [fx - 24, 7, fz],
      [fx - 23, 18, fz],
      [fx - 31, 21, fz],
    ],
    [
      [fx - 7, 17, fz - 3],
      [fx - 16, 25, fz - 3],
      [fx - 8, 30, fz - 3],
      [fx - 12, 37, fz - 3],
    ],
  ]
  for (const points of arms) {
    for (let i = 0; i < points.length - 1; i++) {
      beam(points[i], points[i + 1], 1.6, '#a47796')
      beam(
        points[i].map((v, k) => v + (k === 2 ? 0.9 : 0)),
        points[i + 1].map((v, k) => v + (k === 2 ? 0.9 : 0)),
        0.25,
        'iron',
      )
    }
    for (const p of points) {
      disk(p[0], p[1], p[2] + 1, 1.4, 'trim')
      disk(p[0], p[1], p[2] + 1.1, 0.65, 'iron')
    }
    const tip = points.at(-1)
    add(
      new T.TorusGeometry(3.1, 0.45, 6, 20, Math.PI * 1.55),
      'iron',
      [tip[0], tip[1] + 2, tip[2] + 1],
      [0, 0, -0.8],
    )
  }
  // Windmill and raised cylindrical water tank beside the house.
  for (const side of [-1, 1])
    beam([fx + 20 + side * 1.8, 2, fz], [fx + 20 + side * 0.5, 25, fz], 0.5, '#a47796')
  for (let i = 0; i < 6; i++) {
    beam([fx + 18.2, 3 + i * 3.5, fz], [fx + 21.8, 6.5 + i * 3.5, fz], 0.22, 'iron')
    beam([fx + 21.8, 3 + i * 3.5, fz], [fx + 18.2, 6.5 + i * 3.5, fz], 0.22, 'iron')
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    beam([fx + 20, 25, fz], [fx + 20 + Math.cos(a) * 7, 25 + Math.sin(a) * 7, fz], 0.35, 'iron')
    add(
      new T.BoxGeometry(1.5, 4, 0.2),
      'trim',
      [fx + 20 + Math.cos(a) * 5.3, 25 + Math.sin(a) * 5.3, fz],
      [0, 0, a - Math.PI / 2],
    )
  }
  disk(fx + 20, 25, fz + 0.3, 1.1, 'iron')
  add(new T.CylinderGeometry(5, 5, 5, 24), 'iron', [fx + 19, 11, fz - 12], [Math.PI / 2, 0, 0])
  for (const x of [fx + 14, fx + 24])
    for (const z of [fz - 15, fz - 9]) beam([x, 2, z], [x, 12, z], 0.4, 'wood')
  for (let i = 0; i < 4; i++) box([fx + 19, 3 + i * 2.5, fz - 8], [13, 0.25, 0.25], 'wood')
  // Underbridge workshop, brick supports, timber landing and the Merry's repair area.
  box([-68, 1.5, -79], [27, 3, 21], 'stone')
  house(-68, 3, -82, 12, 6, 8, 'stone')
  bridge(-68, 14, -78, 33, Math.PI / 2)
  for (const x of [-80, -56]) box([x, 7, -78], [3, 14, 5], 'stone')
  box([-68, 3, -68], [15, 0.4, 6], 'wood')
  for (let i = 0; i < 5; i++) box([-74 + i * 2.8, 4, -69], [2, 1.6, 2], 'wood')
  // Scrap Island: salvaged hull sections, timber piles, workshop and slipway.
  cyl([62, 1.5, -94], 23, 26, 3, 'stone', 36)
  house(59, 3, -101, 13, 7, 9, 'blue')
  sign("TOM'S WORKERS", [59, 9, -96.4], 1)
  crane(73, 3, -93, 2)
  for (let i = 0; i < 28; i++) {
    const x = 47 + rand() * 27,
      z = -109 + rand() * 27
    box(
      [x, 3.4 + rand() * 2, z],
      [2 + rand() * 4, 0.4, 1 + rand() * 4],
      i % 2 ? 'iron' : 'wood',
      rand() * 3,
    )
  }
  for (let i = 0; i < 7; i++)
    add(
      new T.TorusGeometry(4, 0.2, 5, 12, Math.PI),
      'wood',
      [63, 7, -92 + i * 1.5],
      [0, 0, Math.PI],
    )
  // Rocketman workshop: open-front shed with a distinct prototype nose inside.
  box([105, 1.5, -36], [27, 3, 23], 'stone')
  for (const side of [-1, 1]) box([105 + side * 9, 8, -36], [1, 10, 17], 'stone')
  box([105, 8, -44], [19, 10, 1], 'stone')
  const shedRoof = new T.CylinderGeometry(10, 10, 19, 16, 1, false, 0, Math.PI)
  shedRoof.rotateZ(Math.PI / 2)
  shedRoof.rotateY(Math.PI / 2)
  add(shedRoof, 'roof', [105, 13, -36])
  add(new T.CylinderGeometry(2.4, 2.4, 9, 16), 'iron', [105, 6, -34], [Math.PI / 2, 0, 0])
  add(new T.ConeGeometry(2.4, 4, 16), 'iron', [105, 6, -27.5], [Math.PI / 2, 0, 0])
  for (const side of [-1, 1]) box([105 + side * 1.7, 6.8, -26], [0.7, 0.7, 0.2], 'gold')
  sign('ROCKETMAN', [105, 12, -26.3], 1.1)
  // Blue Station: long arched facade, blue vaulted roof, central clock and platforms.
  box([9, 1.1, 91], [44, 2.2, 23], 'stone')
  for (let i = -4; i <= 4; i++) {
    arch(9 + i * 4.5, 2.3, 85, 3.7, 5.2, 'trim')
    box([9 + i * 4.5, 5, 83], [3.4, 5.5, 0.3], 'dark')
  }
  const stationRoof = new T.CylinderGeometry(7, 7, 44, 20, 1, false, 0, Math.PI)
  stationRoof.rotateZ(Math.PI / 2)
  add(stationRoof, 'blue', [9, 8, 83])
  gable(9, 2.3, 86, 7, 11, 4, 'trim', 'blue')
  porthole(9, 11.5, 88.2, 1.6)
  box([9, 11.9, 88.4], [0.12, 1, 0.12], 'dark')
  box([9.4, 11.5, 88.4], [0.9, 0.12, 0.12], 'dark')
  sign('BLUE STATION', [9, 7.8, 88.3], 0.8)
  for (const z of [91, 99])
    for (let i = 0; i < 12; i++) cyl([-13 + i * 4, 2.8, z], 0.13, 0.17, 1.2, 'iron', 6)
  // The same arc-length rail drives each train carriage at runtime.
  const rail = new T.CatmullRomCurve3(layout.railPoints.map((p) => new T.Vector3(...p)))
  rail.arcLengthDivisions = 1600
  rail.updateArcLengths()
  const sleepers = Math.ceil(rail.getLength() / 1.2)
  for (let i = 0; i < sleepers; i++) {
    const t = i / (sleepers - 1),
      p = rail.getPointAt(t),
      d = rail.getTangentAt(t),
      a = Math.atan2(d.x, d.z)
    box([p.x, p.y - 0.6, p.z], [3.8, 0.14, 0.28], 'wood', a)
    for (const s of [-1, 1])
      box(
        [p.x + Math.cos(a) * s * 1.4, p.y - 0.45, p.z - Math.sin(a) * s * 1.4],
        [0.13, 0.18, 1.35],
        'iron',
        a,
      )
  }
  // Shift Station sits away from the city, with its own platform and signal mast.
  cyl([137, 1, 86], 14, 16, 2, 'stone', 32)
  house(137, 2, 86, 12, 7, 7, 'peach')
  sign('SHIFT STATION', [137, 7, 89.7], 0.9)
  cyl([145, 10, 83], 1.8, 2.4, 18, 'trim', 20)
  cyl([145, 19, 83], 2.7, 2.7, 1, 'roof', 20)
  box([130, 8, 88], [0.3, 12, 0.3], 'iron')
  box([132, 13, 88], [4, 0.5, 0.3], 'roof')
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2,
      x = Math.cos(a) * 79,
      z = Math.sin(a) * 79
    cyl([x, 4.5, z], 0.22, 0.3, 4, 'wood', 6)
    add(new T.IcosahedronGeometry(1.8, 0), 'leaf', [x, 7, z])
  }
}
