// Original reference-informed diorama; authored distances, not a canonical survey.
import * as T from 'three'
import { buildSails, buildEnvironmentDetails } from './thriller-details.mjs'
import { readFileSync } from 'node:fs'
const L = JSON.parse(readFileSync(new URL('../src/thriller-layout.json', import.meta.url)))

export function buildCity({ add, box, cyl, beam, sign, rand, layer, font }) {
  const detailed = !process.argv.includes('--blockout')
  const tube = (points, radius, color, segments = 20) => {
    const anchor = new T.Vector3(...points[0])
    const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p).sub(anchor)))
    add(new T.TubeGeometry(curve, segments, radius, 6, false), color, anchor.toArray())
  }
  const arch = (w, h) =>
    new T.Shape()
      .moveTo(-w / 2, 0)
      .lineTo(w / 2, 0)
      .lineTo(w / 2, h * 0.65)
      .quadraticCurveTo(w / 2, h * 0.85, 0, h)
      .quadraticCurveTo(-w / 2, h * 0.85, -w / 2, h * 0.65)
      .closePath()
  const slab = (shape, d, color, p, rotation = [0, 0, 0]) =>
    add(
      new T.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 8 }),
      color,
      p,
      rotation,
    )
  const window = (x, y, z, w, h, color = 'dark') => {
    slab(arch(w + 0.5, h + 0.5), 0.16, 'trim', [x, y - 0.15, z])
    slab(arch(w, h), 0.18, color, [x, y, z + 0.18])
    box([x, y + h * 0.43, z + 0.42], [0.16, h * 0.8, 0.15], 'iron')
    box([x, y + h * 0.45, z + 0.42], [w, 0.14, 0.15], 'iron')
  }
  const gable = (x, y, z, w, h, d, color = 'roof') => {
    slab(
      new T.Shape()
        .moveTo(-w / 2, 0)
        .lineTo(w / 2, 0)
        .lineTo(0, h)
        .closePath(),
      d,
      color,
      [x, y, z - d / 2],
    )
    beam([x - w / 2, y, z + d / 2 + 0.1], [x, y + h, z + d / 2 + 0.1], 0.45, 'trim')
    beam([x + w / 2, y, z + d / 2 + 0.1], [x, y + h, z + d / 2 + 0.1], 0.45, 'trim')
  }
  const tower = (x, y, z, r, h, roof = 10) => {
    cyl([x, y + h / 2, z], r, r * 1.1, h, 'stone', 16)
    for (const yy of [y + 1, y + h * 0.5, y + h])
      cyl([x, yy, z], r * 1.14, r * 1.14, 0.65, 'trim', 16)
    add(new T.ConeGeometry(r * 1.35, roof, 16), 'roof', [x, y + h + roof / 2, z])
    beam([x, y + h + roof, z], [x, y + h + roof + 2.5, z], 0.22, 'iron')
    window(x, y + h * 0.58, z + r + 0.05, r * 0.85, h * 0.23)
  }
  const railing = (x, y, z, w, color = 'iron') => {
    box([x, y + 1.2, z], [w, 0.17, 0.18], color)
    for (let xx = -w / 2; xx <= w / 2; xx += 1.3)
      box([x + xx, y + 0.6, z], [0.12, 1.2, 0.12], color)
  }
  const steps = (x, y, z, w, n = 8, rise = 0.5, run = 0.8) => {
    for (let i = 0; i < n; i++)
      box([x, y + ((i + 1) * rise) / 2, z - i * run], [w, (i + 1) * rise, run + 0.03], 'stone')
  }
  const tree = (x, y, z, size = 1, bare = false) => {
    const h = (5 + rand() * 3) * size
    const top = [x + size * 0.7, y + h, z]
    tube([[x, y, z], [x - size * 0.5, y + h * 0.4, z + size * 0.3], top], size * 0.4, 'wood', 6)
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI * 2) / 3
      tube(
        [
          [x, y + size * 0.7, z],
          [x + Math.cos(a) * size, y + 0.25, z + Math.sin(a) * size],
          [x + Math.cos(a) * size * 2, y + 0.12, z + Math.sin(a) * size * 2],
        ],
        size * 0.15,
        'wood',
        4,
      )
    }
    for (let j = 0; j < 3; j++) {
      const a = rand() * Math.PI * 2,
        end = [
          top[0] + Math.cos(a) * 3 * size,
          top[1] + (j - 1) * 1.5 * size,
          top[2] + Math.sin(a) * 3 * size,
        ]
      beam([x, y + h * 0.55, z], end, size * 0.32, 'wood')
      if (bare)
        beam(
          end,
          [end[0] + Math.cos(a) * size, end[1] + 2 * size, end[2] + Math.sin(a) * size],
          size * 0.12,
          'wood',
        )
      else add(new T.IcosahedronGeometry(2.6 * size, 1), 'leaf', end, [0, rand(), 0], [1, 1.2, 0.9])
    }
  }
  const lamp = (x, y, z) => {
    cyl([x, y + 1.6, z], 0.12, 0.2, 3.2, 'iron', 6)
    box([x, y + 3.35, z], [0.8, 1, 0.8], 'gold')
    add(new T.ConeGeometry(0.7, 0.5, 4), 'roof', [x, y + 4.1, z], [0, Math.PI / 4, 0])
  }
  const coffin = (x, y, z, scale = 1) => {
    const shape = new T.Shape()
      .moveTo(-0.7, 0)
      .lineTo(0.7, 0)
      .lineTo(1, 2.5)
      .lineTo(0.65, 3.4)
      .lineTo(-0.65, 3.4)
      .lineTo(-1, 2.5)
      .closePath()
    const g = new T.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: false })
    g.scale(scale, scale, scale)
    add(g, '#6c3d54', [x, y, z])
    box([x, y + 2.2 * scale, z + 0.65 * scale], [0.15 * scale, 1.4 * scale, 0.1], 'gold')
    box([x, y + 2.5 * scale, z + 0.66 * scale], [0.85 * scale, 0.14 * scale, 0.1], 'gold')
  }
  const room = (key, x, y, z, w, d, h, color = 'stone') => {
    layer(`room-${key}`)
    box([x, y + 0.2, z], [w, 0.7, d], 'wood')
    box([x, y + h / 2, z - d / 2], [w, h, 0.7], color)
    box([x - w / 2, y + h / 2, z], [0.7, h, d], color)
    box([x + w / 2, y + h / 2, z], [0.7, h, d], color)
    for (let yy = 1; yy < h; yy += 2)
      box([x, y + yy, z - d / 2 + 0.4], [w - 0.5, 0.07, 0.06], 'iron')
  }

  // Outer timber hull: a real enclosed water annulus with an open mouth at the bow.
  const R = L.outerRadius
  for (let i = 3; i < 118; i++) {
    const a = (i / 120) * Math.PI * 2,
      x = Math.sin(a) * R,
      z = Math.cos(a) * R
    box([x, 5, z], [8.5, 18, 6], 'wood', a)
    for (const yy of [-1, 4, 9, 13]) box([x, yy, z], [8.6, 0.3, 6.3], 'iron', a)
    if (i % 3 === 0) {
      box([x, 6, z], [1.2, 18.5, 7], 'gold', a)
      add(
        new T.TorusGeometry(1.2, 0.23, 5, 12),
        'iron',
        [Math.sin(a) * (R + 3.15), 6, Math.cos(a) * (R + 3.15)],
        [0, a, 0],
      )
    }
  }
  for (const s of [-1, 1]) tower(s * 27, 0, 157, 3.5, 20, 4)
  tube(
    [
      [-25, 21, 159],
      [-16, 26, 161],
      [-6, 25, 162],
      [0, 22, 162],
      [6, 25, 162],
      [16, 26, 161],
      [25, 21, 159],
    ],
    2.1,
    '#a35a73',
  )
  tube(
    [
      [-25, 0.5, 159],
      [-15, -1, 162],
      [0, -2, 163],
      [15, -1, 162],
      [25, 0.5, 159],
    ],
    2.2,
    '#a35a73',
  )
  for (let x = -21; x <= 21; x += 6) {
    box([x, 20.5 + 2 * Math.sin((Math.abs(x) / 22) * Math.PI), 160], [5.5, 5, 3.7], 'trim')
    box([x, 1, 161], [5.5, 4, 3.7], 'trim')
  }

  // The central land is separate from the hull, not a filled-in cylinder of ocean.
  add(
    new T.CylinderGeometry(1, 1.05, 19, 80),
    'rock',
    [0, 0.5, 0],
    [0, 0, 0],
    [L.landRadius[0], 1, L.landRadius[1]],
  )
  add(new T.CylinderGeometry(1, 1, 0.4, 80), 'grass', [0, 10, 0], [0, 0, 0], [100, 1, 92])
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    if (Math.abs(Math.sin(a)) < 0.3 && Math.cos(a) > 0.5) continue
    const x = Math.sin(a) * 98,
      z = Math.cos(a) * 90,
      h = 8 + rand() * 5
    box([x, 10 + h / 2, z], [9, h, 3], 'stone', a)
    for (const dx of [-2.6, 0, 2.6])
      box([x + Math.cos(a) * dx, 10 + h + 0.6, z - Math.sin(a) * dx], [1.5, 1.2, 3.2], 'stone', a)
    if (i % 9 === 0) {
      cyl([x, 16, z], 5, 5.5, 16, 'stone', 12)
      for (let j = 0; j < 8; j++) {
        const aa = (j / 8) * Math.PI * 2
        box([x + Math.sin(aa) * 4.5, 24.5, z + Math.cos(aa) * 4.5], [1.8, 2, 1.8], 'stone')
      }
    }
  }
  // Broken landing and stepped access, with a clear route to the mansion.
  steps(-20, 0, 102, 13, 14, 0.7, 1)
  box([-20, 1, 109], [15, 1.3, 9], 'wood')
  for (const x of [-27, -13]) for (const z of [106, 112]) cyl([x, -1, z], 0.45, 0.6, 7, 'wood', 8)
  for (let i = 0; i < 15; i++)
    add(
      new T.DodecahedronGeometry(1 + rand() * 2, 0),
      'stone',
      [-34 + rand() * 29, 10.8, 77 + rand() * 10],
      [rand(), rand(), 0],
      [1, 0.6, 1],
    )
  const path = new T.CatmullRomCurve3([
    new T.Vector3(-20, 10.3, 83),
    new T.Vector3(-47, 10.3, 63),
    new T.Vector3(-52, 10.3, 37),
    new T.Vector3(-34, 10.3, 19),
    new T.Vector3(0, 10.3, 44),
  ])
  const roadVertices = [],
    roadIndices = []
  for (let i = 0; i <= 64; i++) {
    const p = path.getPoint(i / 64),
      t = path.getTangent(i / 64).normalize()
    for (const sign of [1, -1])
      roadVertices.push(p.x + sign * t.z * 3.4, 10.4, p.z - sign * t.x * 3.4)
    if (i < 64) {
      const a = i * 2
      roadIndices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const road = new T.BufferGeometry()
  road.setAttribute('position', new T.Float32BufferAttribute(roadVertices, 3))
  road.setIndex(roadIndices)
  road.computeVertexNormals()
  add(road, '#a5988c')

  const [mx, my, mz] = L.manor
  box([mx, my + 13, mz], [58, 26, 32], 'stone')
  for (const yy of [my + 1, my + 12, my + 25]) box([mx, yy, mz], [60, 0.7, 34], 'trim')
  for (const x of [-26, -19, -12, 12, 19, 26])
    for (const yy of [14, 25]) window(x, yy, mz + 16.1, 3.4, 6)
  for (const x of [-29, 29])
    for (const z of [mz - 16, mz + 16]) tower(x, my, z, 3.6, z > mz ? 32 : 28, 13)
  slab(arch(9, 22), 0.4, 'trim', [0, my, 38.2])
  slab(arch(7, 20), 0.4, '#543e52', [0, my, 38.65])
  box([0, 20, 39.1], [0.2, 19, 0.2], 'gold')
  for (const x of [-5.8, 5.8]) box([x, 22, 39], [1.1, 24, 2.5], 'trim')
  gable(0, 34, 38.3, 16, 10, 3, 'stone')
  window(0, 35, 40, 3, 4)
  steps(0, 10, 46, 12, 7, 0.4, 0.9)
  layer('shell-lab')
  gable(0, 36, 22, 62, 13, 34)
  for (const x of [-20, -10, 10, 20]) {
    gable(x, 39, 35, 7, 6, 4, 'stone')
    window(x, 39, 37.2, 3, 4)
  }
  tower(0, 36, 17, 5.2, 27, 17)
  layer('static')
  // Top-floor laboratory furnished independently of its removable roof.
  room('lab', 0, 36, 22, 26, 23, 11, '#7b9290')
  box([0, 38, 23], [7, 0.7, 3.4], 'trim')
  for (const x of [-2.5, 2.5]) for (const z of [22, 24]) box([x, 37, z], [0.4, 2, 0.4], 'iron')
  for (const x of [-10, 10]) {
    box([x, 37.3, 17], [3, 2.6, 8], 'wood')
    for (let j = 0; j < 4; j++) cyl([x, 39, 14 + j * 2], 0.4, 0.4, 1.1, j % 2 ? 'gold' : 'jade', 8)
  }
  for (const x of [-8, -3]) coffin(x, 36, 11.5, 1.5)
  for (const x of [-5, -1])
    tube(
      [
        [x, 46, 12],
        [x + 0.2, 43, 12],
        [x, 41, 12],
      ],
      0.12,
      'iron',
      8,
    )
  steps(9, 36, 29, 4, 10, 0.8, 0.8)
  window(0, 39, 10.9, 4, 6, '#b3bfc2')
  cyl([5, 40, 25], 0.25, 0.25, 7, 'iron', 8)
  box([5, 42.5, 25], [1, 1.6, 0.8], 'gold')
  layer('static')

  // Elevated Wonder Garden: broad enough for trees, with a visibly supported span.
  box([0, 24, -12], [25, 2, 36], 'stone')
  for (const x of [-11, 11]) {
    box([x, 26, -12], [1.4, 3, 36], 'trim')
    for (const z of [-26, -12, 2]) cyl([x, 17, z], 1.6, 2, 14, 'stone', 10)
  }
  for (const x of [-7, 7]) for (const z of [-22, -7]) tree(x, 25, z, 0.65, false)
  for (const z of [-20, -4]) cyl([10, 28, z], 0.8, 0.9, 6, 'stone', 12)
  add(new T.TorusGeometry(8, 1, 6, 24, Math.PI), 'leaf', [10, 31, -12], [0, Math.PI / 2, 0])
  for (let i = 0; i < 5; i++) {
    const a = (i / 4) * Math.PI
    add(new T.SphereGeometry(0.75, 8, 6), '#e1cf76', [
      11.3,
      31 + Math.sin(a) * 8,
      -12 + Math.cos(a) * 8,
    ])
  }
  for (const z of [-22, -2]) {
    slab(arch(3, 6), 0.35, z < -10 ? '#965375' : '#b6a4b9', [6, 25, z], [0, Math.PI / 2, 0])
    box([5, 25.4, z], [2, 0.7, 2], 'wood')
  }

  // The separate, cylindrical mast mansion, with ring balconies and satellite towers.
  const [tx, ty, tz] = L.mast
  cyl([tx, ty + 34, tz], 20, 20, 68, 'stone', 40)
  for (const y of [12, 37, 66, 79]) {
    cyl([0, y, -50], 21, 21, 1.4, 'trim', 40)
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2
      cyl([Math.sin(a) * 20, y + 1, Math.cos(a) * 20 - 50], 0.12, 0.12, 2, 'iron', 5)
    }
    add(new T.TorusGeometry(20, 0.18, 5, 64), 'iron', [0, y + 2, -50], [Math.PI / 2, 0, 0])
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2,
      x = Math.sin(a) * 20.15,
      z = Math.cos(a) * 20.15 - 50
    add(new T.CircleGeometry(2.2, 16), 'dark', [x, 69, z], [0, a, 0])
    add(
      new T.TorusGeometry(2.4, 0.22, 5, 16),
      'trim',
      [x * 1.005, 69, (z + 50) * 1.005 - 50],
      [0, a, 0],
    )
    for (const y of [18, 42]) {
      const geo = new T.ExtrudeGeometry(arch(3.6, 13), { depth: 0.15, bevelEnabled: false })
      add(geo, 'dark', [Math.sin(a) * 20.3, y, Math.cos(a) * 20.3 - 50], [0, a, 0])
      box([Math.sin(a) * 20.5, y + 6, Math.cos(a) * 20.5 - 50], [0.18, 12, 0.18], 'trim')
    }
  }
  cyl([0, 83, -50], 12, 21, 8, 'roof', 40)
  cyl([0, 112, -50], 4.5, 11, 52, 'wood', 24)
  for (const s of [-1, 1]) {
    box([s * 22, 48, -50], [9, 1.2, 6], 'stone')
    railing(s * 22, 48.5, -46.8, 9)
    if (s < 0) {
      tower(-36, 49, -50, 9, 15, 6)
    }
  }
  // Large wheel and red balcony drapery distinguish the mast from the front mansion.
  add(new T.TorusGeometry(10, 0.7, 6, 32), 'iron', [-23, 72, -30], [0, 0.15, 0])
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    beam([-23, 72, -30], [-23 + Math.cos(a) * 10, 72 + Math.sin(a) * 10, -30], 0.4, 'iron')
  }
  box([0, 48, -27.5], [8, 14, 0.5], '#824f68')
  window(0, 44, -27.1, 5, 10)
  gable(0, 59, -27, 12, 5, 3, 'trim')
  // Perona's round annex; the shell disappears only for its authored cutaway.
  layer('shell-perona')
  cyl([35, 56, -50], 12, 12, 16, 'stone', 24)
  for (const x of [29, 35, 41]) window(x, 51, -50 + Math.sqrt(144 - (x - 35) ** 2) + 0.25, 2.6, 7)
  cyl([35, 49, -50], 12.5, 12.5, 0.6, 'trim', 24)
  add(
    new T.SphereGeometry(12, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    'roof',
    [35, 64, -50],
    [0, 0, 0],
    [1, 0.65, 1],
  )
  layer('room-perona')
  room('perona', 35, 48, -50, 22, 20, 13, '#c4b0ca')
  for (const x of [26, 30, 40, 44]) {
    window(x, 51, -59.5, 2.1, 7)
    box([x, 54, -59], [0.18, 11, 0.2], 'gold')
  }
  box([30, 49, -52], [7, 2, 9], '#be7491')
  box([30, 50.2, -52], [6.4, 0.7, 8.5], 'trim')
  for (const x of [26.5, 33.5])
    for (const z of [-56, -47.5]) cyl([x, 54, z], 0.17, 0.2, 11, 'gold', 8)
  box([30, 59.5, -52], [8, 0.7, 10], '#8a6b98')
  for (const x of [26.7, 33.3]) box([x, 56, -54.7], [0.3, 7, 3.5], '#bca6cf')
  box([41, 50, -47], [4, 2.5, 3], '#78517e')
  box([41, 52, -48.5], [4, 5, 1], '#78517e')
  cyl([40, 50, -54], 2, 2, 0.6, 'gold', 14)
  cyl([40, 49, -54], 0.3, 0.4, 2, 'wood', 8)
  for (const x of [27, 44]) {
    add(new T.SphereGeometry(0.9, 10, 8), 'pink', [x, 50, -57])
    for (const s of [-1, 1]) add(new T.SphereGeometry(0.35, 8, 6), 'pink', [x + s * 0.7, 50.6, -57])
  }
  layer('static')

  // Oars' freezer: chamber plus a stylized, restrained giant seen only in cutaway.
  layer('shell-freezer')
  cyl([-35, 26, -50], 15, 16, 32, 'stone', 24)
  for (const x of [-42, -35, -28]) window(x, 14, -50 + Math.sqrt(256 - (x + 35) ** 2) + 0.2, 3, 12)
  add(
    new T.SphereGeometry(15, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    'roof',
    [-35, 42, -50],
    [0, 0, 0],
    [1, 0.65, 1],
  )
  room('freezer', -35, 10, -50, 28, 26, 30, '#9baebe')
  for (let i = 0; i < 12; i++)
    add(
      new T.ConeGeometry(0.4 + rand(), 3 + rand() * 5, 5),
      '#b9d0d7',
      [-48 + rand() * 26, 39, -62 + rand() * 4],
      [Math.PI, 0, 0],
    )
  add(new T.SphereGeometry(7, 16, 10), '#a7a3a2', [-35, 23, -53], [0, 0, 0], [1, 1.35, 0.6])
  add(new T.SphereGeometry(4.4, 16, 10), '#b7aba2', [-35, 34, -53], [0, 0, 0], [1, 1.05, 0.85])
  for (const s of [-1, 1]) {
    tube(
      [
        [-35 + s * 3, 36, -53],
        [-35 + s * 5.4, 40, -53],
        [-35 + s * 5, 43, -53],
      ],
      0.65,
      'trim',
      12,
    )
    tube(
      [
        [-35 + s * 6, 28, -53],
        [-35 + s * 10, 23, -51],
        [-35 + s * 9, 17, -49],
      ],
      1.8,
      '#a7a3a2',
      10,
    )
    add(new T.SphereGeometry(2, 10, 7), '#a7a3a2', [-35 + s * 9, 16, -49], [0, 0, 0], [1, 1.2, 0.8])
    beam([-35 + s * 3.5, 18, -53], [-35 + s * 4.5, 11, -50], 3.4, '#746c78')
    add(
      new T.SphereGeometry(0.8, 10, 6),
      'dark',
      [-35 + s * 1.6, 34.8, -49.6],
      [0, 0, s * 0.18],
      [1, 0.5, 0.2],
    )
    beam([-35 + s * 0.9, 35.6, -49.4], [-35 + s * 2.4, 35.9, -49.8], 0.35, '#6e7078')
    tube(
      [
        [-35 + s * 11, 31, -62],
        [-35 + s * 7, 26, -47],
        [-35 - s * 5, 18, -46],
      ],
      0.3,
      'iron',
      14,
    )
  }
  add(new T.SphereGeometry(1, 16, 10), 'dark', [-35, 32.3, -49.1], [0, 0, 0], [2.8, 1.6, 0.25])
  for (const s of [-1, 1])
    add(new T.ConeGeometry(0.52, 2.3, 5), 'trim', [-35 + s * 2.6, 33, -48.8], [0, 0, -s * 0.25])
  for (let j = -2; j <= 2; j++)
    for (const upper of [false, true])
      add(
        new T.ConeGeometry(0.28, 0.8, 4),
        'trim',
        [-35 + j * 0.7, upper ? 33.1 : 31.3, -48.8],
        [upper ? Math.PI : 0, 0, 0],
      )
  // Broad shoulder plates, a stitched belly and icicles identify the restrained giant.
  for (const s of [-1, 1]) {
    add(
      new T.SphereGeometry(3.2, 12, 8),
      '#686775',
      [-35 + s * 5.9, 29, -53],
      [0, 0, s * 0.4],
      [1, 0.65, 1],
    )
    for (let j = 0; j < 3; j++)
      add(
        new T.ConeGeometry(0.3, 1.6, 5),
        '#b9d0d7',
        [-35 + s * (4.7 + j), 28.3, -50.7],
        [Math.PI, 0, 0],
      )
  }
  tube(
    [
      [-41, 21, -49.3],
      [-35, 20.2, -48.7],
      [-29, 22, -49.3],
    ],
    0.12,
    '#65616b',
    12,
  )
  for (let j = -4; j <= 4; j++)
    beam([-35 + j * 1.2, 19.7, -48.7], [-35 + j * 1.2, 21, -48.7], 0.1, '#65616b')
  for (let j = 0; j < 7; j++) {
    const a = (j / 6) * Math.PI
    add(
      new T.ConeGeometry(0.6, 2, 5),
      '#736d7f',
      [-35 + Math.cos(a) * 3.8, 37.4 + Math.sin(a), -53],
      [0, 0, a - Math.PI / 2],
    )
  }
  for (const s of [-1, 1]) {
    const line = new T.CatmullRomCurve3(
      [
        [-35 + s * 11, 31, -61],
        [-35 + s * 7, 27, -47],
        [-35 - s * 5, 18, -46],
      ].map((p) => new T.Vector3(...p)),
    )
    for (let j = 0; j < 25; j++) {
      const t = j / 24,
        g = new T.TorusGeometry(0.65, 0.16, 5, 9)
      g.scale(0.65, 1.25, 1)
      if (j % 2) g.rotateY(Math.PI / 2)
      g.applyQuaternion(
        new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), line.getTangent(t)),
      )
      add(g, 'iron', line.getPoint(t).toArray())
    }
  }
  box([-35, 14, -38.5], [27, 1, 3], 'stone')
  railing(-35, 14.5, -37, 27)
  layer('static')

  // Chapel annex with a complete small aisle, altar, pews and organ pipes.
  layer('shell-chapel')
  box([40, 17, -21], [23, 14, 27], 'stone')
  gable(40, 24, -21, 26, 10, 30)
  window(40, 11, -7.3, 5, 9)
  tower(51, 10, -31, 3.5, 18, 8)
  room('chapel', 40, 10, -21, 22, 26, 14)
  box([40, 10.67, -20], [4, 0.15, 24], '#9c4b64')
  for (const s of [-1, 1])
    for (let i = 0; i < 5; i++) {
      box([40 + s * 7, 11, -29 + i * 4], [6, 1.1, 1.5], 'wood')
      box([40 + s * 7, 12, -29.5 + i * 4], [6, 3, 0.4], 'wood')
      lamp(40 + s * 3, 10, -29 + i * 4)
    }
  box([40, 11, -31], [8, 2, 3], 'trim')
  box([40, 13, -31], [7, 0.5, 3], 'gold')
  for (const s of [-1, 1])
    for (let j = 0; j < 6; j++)
      cyl([40 + s * (5 + j), 15 + j * 0.5, -32], 0.3, 0.3, 7 + j, 'gold', 8)
  box([40, 20, -33], [0.4, 7, 0.4], 'gold')
  box([40, 21, -33], [4, 0.4, 0.4], 'gold')
  layer('static')

  // Cemetery, mausoleum and quiet battle sectors are distinct from the forest paths.
  box([58, 10.3, 33], [35, 0.5, 31], '#899078')
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 5; col++) {
      const x = 44 + col * 6.6,
        z = 22 + row * 6.5
      add(
        new T.BoxGeometry(2.3, 2.8, 0.65),
        'stone',
        [x, 11.6, z],
        [0, rand() * 0.3 - 0.15, rand() * 0.1 - 0.05],
      )
      add(
        new T.SphereGeometry(1.15, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        'stone',
        [x, 13, z],
        [0, 0, 0],
        [1, 0.65, 0.3],
      )
      box([x, 10.5, z + 1.5], [2.8, 0.25, 3], 'rock')
      box([x, 12, z + 0.36], [0.12, 1.2, 0.12], 'dark')
      box([x, 12.3, z + 0.37], [0.7, 0.12, 0.12], 'dark')
    }
  box([70, 15, 11], [12, 10, 10], 'stone')
  gable(70, 20, 11, 14, 5, 12)
  window(70, 10, 16.2, 4, 7)
  for (const [x, z, r] of [
    [54, -51, 24],
    [-56, -48, 20],
  ]) {
    cyl([x, 10.3, z], r, r, 0.3, '#a3968e', 32)
    for (let j = 0; j < 11; j++) {
      const a = (j / 11) * Math.PI * 2
      add(
        new T.DodecahedronGeometry(1.3 + rand(), 0),
        'stone',
        [x + Math.cos(a) * (r - 2), 11, z + Math.sin(a) * (r - 2)],
        [rand(), rand(), 0],
        [1, 0.55, 1],
      )
    }
  }
  if (detailed)
    for (let i = 0; i < 145; i++) {
      const a = rand() * Math.PI * 2,
        r = 32 + rand() * 56,
        x = Math.sin(a) * r,
        z = Math.cos(a) * r * 0.91
      if (
        (x > 23 && x < 64 && z > -38 && z < 12) ||
        (Math.abs(x) < 35 && z > -37 && z < 48) ||
        (Math.abs(x) < 54 && z < -25 && z > -75) ||
        (x > 36 && z > 8 && z < 53) ||
        Math.hypot(x + 56, z + 48) < 23 ||
        Math.hypot(x - 54, z + 51) < 28
      )
        continue
      if (path.getPoints(40).some((p) => Math.hypot(p.x - x, p.z - z) < 6)) continue
      tree(x, 10, z, 1 + rand() * 0.5, i % 4 === 0)
    }
  for (const [x, z] of [
    [-60, 55],
    [-52, 23],
    [36, 55],
    [-37, -3],
    [68, -13],
  ])
    tree(x, 10, z, 1.7, true)
  for (const [x, z] of [
    [-26, 81],
    [-45, 65],
    [-56, 39],
    [-35, 29],
    [-10, 45],
    [10, 45],
    [45, 15],
  ])
    lamp(x, 10, z)

  // Wrought-iron cemetery entrance and fences, based on the cemetery approach.
  for (const s of [-1, 1]) {
    cyl([58 + s * 6, 14, 50], 0.6, 0.8, 8, 'iron', 8)
    add(new T.SphereGeometry(0.9, 8, 6), 'iron', [58 + s * 6, 18.4, 50])
    for (let j = 0; j < 10; j++) {
      const x = 58 + s * (7 + j * 1.2)
      beam([x, 10, 50], [x, 16, 50], 0.18, 'iron')
      add(new T.ConeGeometry(0.3, 0.8, 4), 'iron', [x, 16.4, 50])
    }
    box([58 + s * 12.5, 13, 50], [14, 0.2, 0.2], 'iron')
    box([58 + s * 12.5, 15.5, 50], [14, 0.2, 0.2], 'iron')
  }
  tube(
    [
      [52, 17, 50],
      [55, 20, 50],
      [61, 20, 50],
      [64, 17, 50],
    ],
    0.3,
    'iron',
  )
  // Parked, original carriage silhouette. No character/animal model is implied.
  box([-51, 12.4, 43], [5.2, 1, 7], 'wood')
  box([-51, 15, 43], [4.7, 4.7, 6], '#884b73')
  add(
    new T.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    '#6c4267',
    [-51, 17.4, 43],
    [0, 0, 0],
    [2.7, 2, 3.6],
  )
  for (const s of [-1, 1])
    for (const z of [40.8, 45.5]) {
      add(
        new T.TorusGeometry(1.35, 0.24, 6, 18),
        'wood',
        [-51 + s * 3, 11.4, z],
        [0, Math.PI / 2, 0],
      )
      for (let a = 0; a < Math.PI; a += Math.PI / 4)
        beam(
          [-51 + s * 3, 11.4 + Math.cos(a) * 1.25, z + Math.sin(a) * 1.25],
          [-51 + s * 3, 11.4 - Math.cos(a) * 1.25, z - Math.sin(a) * 1.25],
          0.13,
          'gold',
        )
    }
  window(-51, 13, 46.1, 2.8, 3.2)
  lamp(-54, 12, 46)
  // Four suspended chains; neighboring links alternate planes along a sagging curve.
  for (const a of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) {
    const end = new T.Vector3(Math.sin(a) * 153, 14, Math.cos(a) * 153)
    const curve = new T.QuadraticBezierCurve3(
      new T.Vector3(0, 106, -50),
      new T.Vector3(end.x * 0.5, 38, (end.z - 50) * 0.5),
      end,
    )
    for (let j = 0; j < 64; j++) {
      const t = j / 63,
        p = curve.getPoint(t),
        q = new T.Quaternion().setFromUnitVectors(
          new T.Vector3(0, 1, 0),
          curve.getTangent(t).normalize(),
        )
      const g = new T.TorusGeometry(1.1, 0.28, 5, 10)
      g.scale(0.68, 1.25, 1)
      if (j % 2) g.rotateY(Math.PI / 2)
      g.applyQuaternion(q)
      add(g, 'iron', p.toArray())
    }
  }
  buildSails({ add, box, cyl, beam, rand, layer, font })
  buildEnvironmentDetails({ add, box, cyl, beam, rand, layer })

  // Sunny is a separate animated group in the runtime, excluded from static water depth.
  layer('ship-sunny')
  const [sx, sy, sz] = L.sunny
  const hull = new T.SphereGeometry(1, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
  add(hull, '#985247', [sx, 1, sz], [0, 0, 0], [3.6, 3.1, 7])
  add(new T.CircleGeometry(1, 32), '#d8b87d', [sx, 1.15, sz], [-Math.PI / 2, 0, 0], [3.5, 7, 1])
  for (const x of [-3.2, 3.2]) box([sx + x, 1.8, sz], [0.22, 1.3, 9], 'trim')
  for (const z of [-5, 4.6]) box([sx, 1.8, sz + z], [6, 1.3, 0.25], 'trim')
  box([sx, 2.6, sz - 3.5], [5, 3, 3.2], 'trim')
  gable(sx, 4.1, sz - 3.5, 5.7, 1.6, 4, '#b75240')
  cyl([sx, 8, sz], 0.18, 0.25, 15, 'wood', 10)
  for (const yy of [8, 13.8]) beam([sx - 4, yy, sz], [sx + 4, yy, sz], 0.17, 'wood')
  const cloth = new T.CylinderGeometry(4.2, 4.2, 5.5, 18, 1, true, -0.7, 1.4)
  cloth.rotateY(0)
  const clothBack = cloth.clone()
  for (let j = 0; j < clothBack.index.array.length; j += 3) {
    const a = clothBack.index.array
    ;[a[j], a[j + 2]] = [a[j + 2], a[j]]
  }
  clothBack.translate(0, 0, -0.05)
  clothBack.computeVertexNormals()
  add(clothBack, 'trim', [sx, 10.8, sz + 0.7])
  add(cloth, 'trim', [sx, 10.8, sz + 0.7], [0, 0, 0])
  add(new T.CircleGeometry(0.8, 16), 'dark', [sx, 11.1, sz + 5.05])
  add(new T.CircleGeometry(0.64, 16), 'trim', [sx, 11.1, sz + 5.09])
  for (const side of [-1, 1])
    add(new T.CircleGeometry(0.15, 10), 'dark', [sx + side * 0.24, 11.2, sz + 5.12])
  box([sx, 11.7, sz + 5.13], [1.9, 0.25, 0.12], 'gold')
  cyl([sx, 4.5, sz - 5.3], 0.14, 0.2, 7, 'wood', 8)
  for (const side of [-1, 1]) {
    tube(
      [
        [sx, 14, sz],
        [sx + side * 2, 7, sz + 2],
        [sx + side * 3, 2, sz + 4.5],
      ],
      0.055,
      'iron',
      8,
    )
    tube(
      [
        [sx, 14, sz],
        [sx + side * 2, 7, sz - 2],
        [sx + side * 3, 2, sz - 4.5],
      ],
      0.055,
      'iron',
      8,
    )
    for (let j = 0; j < 6; j++)
      box([sx + side * 3.2, 1.8, sz - 4 + j * 1.6], [0.12, 1.3, 0.12], 'wood')
    for (const zz of [-4.2, -2.8]) {
      add(
        new T.CircleGeometry(0.38, 12),
        'dark',
        [sx + side * 2.52, 2.7, sz + zz],
        [0, (side * Math.PI) / 2, 0],
      )
      add(
        new T.TorusGeometry(0.4, 0.06, 5, 12),
        'gold',
        [sx + side * 2.55, 2.7, sz + zz],
        [0, (side * Math.PI) / 2, 0],
      )
    }
  }
  // Lion figurehead, mane rays, eyes and muzzle on the bow.
  for (let j = 0; j < 12; j++) {
    const a = (j / 12) * Math.PI * 2
    add(
      new T.ConeGeometry(0.55, 1.7, 5),
      'gold',
      [sx + Math.cos(a) * 1.8, 2.7 + Math.sin(a) * 1.8, sz + 6.6],
      [0, 0, a - Math.PI / 2],
    )
  }
  add(new T.SphereGeometry(1.45, 16, 10), '#eac772', [sx, 2.7, sz + 6.8], [0, 0, 0], [1, 1, 0.6])
  for (const s of [-1, 1]) {
    add(new T.SphereGeometry(0.16, 8, 6), 'dark', [sx + s * 0.5, 3, sz + 7.6])
    add(new T.SphereGeometry(0.44, 10, 6), 'trim', [sx + s * 0.35, 2.4, sz + 7.6])
  }
  add(new T.SphereGeometry(0.23, 8, 6), 'dark', [sx, 2.6, sz + 7.9])
  // Stern Coup de Burst nozzle and aft lawn/palm accents.
  add(new T.CylinderGeometry(1.25, 1.25, 0.5, 16), 'iron', [sx, 1.6, sz - 6.4], [Math.PI / 2, 0, 0])
  box([sx + 1.2, 1.3, sz + 3], [2.6, 0.2, 3], 'leaf')
  for (const x of [-2, 2]) {
    beam([sx + x, 2, sz - 3], [sx + x + 0.3, 6, sz - 3], 0.15, 'wood')
    for (let j = 0; j < 4; j++) {
      const a = (j / 4) * Math.PI * 2
      beam(
        [sx + x + 0.3, 6, sz - 3],
        [sx + x + 0.3 + Math.cos(a) * 1.8, 5.7, sz - 3 + Math.sin(a) * 1.8],
        0.25,
        'leaf',
      )
    }
  }
  layer('static')
}
