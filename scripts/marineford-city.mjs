import * as T from 'three'
import layout from '../src/marineford-layout.json' with { type: 'json' }
import { buildFleet } from './marineford-fleet.mjs'

// Original prewar diorama. All dimensions and unshown connecting streets are authored.
export function buildCity(api) {
  const { add, box, cyl, beam, rand, layer, orient } = api
  const stone = '#e3e9de',
    trim = '#f5f0dc',
    mortar = '#a4b5b4',
    roof = '#356773',
    red = '#99464a',
    dark = '#243f51',
    gold = '#bf9a51'
  function grid(n, m, fn, c, reverse = false) {
    const p = [],
      idx = []
    for (let j = 0; j <= m; j++) for (let i = 0; i <= n; i++) p.push(...fn(i / n, j / m))
    for (let j = 0; j < m; j++)
      for (let i = 0; i < n; i++) {
        const a = j * (n + 1) + i
        idx.push(a, a + 1, a + n + 2, a, a + n + 2, a + n + 1)
      }
    const g = new T.BufferGeometry()
    if (reverse)
      for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]]
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    add(g, c)
  }
  function tube(points, r, c, segments = 16) {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...p)),
      false,
      'catmullrom',
      0.25,
    )
    add(
      new T.TubeGeometry(curve, segments, r, 5, false),
      c,
      points[0].map(() => 0),
    )
  }
  function slab(shape, y, h, c) {
    const g = new T.ExtrudeGeometry(shape, { depth: h, steps: 1, bevelEnabled: false })
    g.rotateX(-Math.PI / 2)
    add(g, c, [0, y, 0])
  }
  function arc(r, thick, y, h, start, end, c, cz = 0) {
    const shape = new T.Shape(),
      n = Math.ceil((end - start) * 20)
    for (let i = 0; i <= n; i++) {
      const a = start + ((end - start) * i) / n
      const x = Math.sin(a) * r,
        z = cz + Math.cos(a) * r
      i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)
    }
    for (let i = n; i >= 0; i--) {
      const a = start + ((end - start) * i) / n
      shape.lineTo(Math.sin(a) * (r - thick), -cz - Math.cos(a) * (r - thick))
    }
    shape.closePath()
    slab(shape, y, h, c)
  }
  function arch(x, y, z, w, h, c = dark) {
    const s = new T.Shape()
    s.moveTo(-w / 2, 0)
    s.lineTo(w / 2, 0)
    s.lineTo(w / 2, h - w / 2)
    s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false)
    s.closePath()
    add(new T.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: false, curveSegments: 8 }), c, [
      x,
      y,
      z,
    ])
  }
  function rail(x, y, z, w, c = red) {
    for (let dx = -w / 2; dx <= w / 2 + 0.1; dx += 4) box([x + dx, y + 2, z], [0.65, 4, 0.65], c)
    for (const dy of [1, 3.8]) box([x, y + dy, z], [w, 0.55, 0.65], c)
  }
  function stairs(x, y, z, w, h, length, n = 16) {
    for (let i = 0; i < n; i++) {
      const rise = (h * (i + 1)) / n
      box([x, y + rise / 2, z - (length * (i + 0.5)) / n], [w, rise, length / n + 0.1], trim)
    }
    for (const s of [-1, 1])
      beam(
        [x + s * (w / 2 + 0.7), y + 2, z],
        [x + s * (w / 2 + 0.7), y + h + 2, z - length],
        1.2,
        mortar,
      )
  }
  function pagoda(x, y, z, w, d, h, detail = true) {
    // Four curved roof faces with raised corners and an actual overhanging eave.
    const corners = [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [w / 2, d / 2],
      [-w / 2, d / 2],
    ]
    for (let k = 0; k < 4; k++) {
      const a = corners[k],
        b = corners[(k + 1) % 4]
      const at = (u, v) => {
        const f = 1 - v * 0.88,
          xx = (a[0] * (1 - u) + b[0] * u) * f,
          zz = (a[1] * (1 - u) + b[1] * u) * f
        return [x + xx, y + h * v ** 0.65 + Math.abs(u * 2 - 1) ** 5 * (1 - v) ** 4 * 2.8, z + zz]
      }
      grid(detail ? 14 : 4, 5, (u, v) => at(1 - u, v), roof)
      tube(
        Array.from({ length: 15 }, (_, i) => at(i / 14, 0)),
        0.5,
        '#6e9192',
        14,
      )
      if (detail)
        for (let i = 1; i < 14; i++)
          tube(
            Array.from({ length: 6 }, (_, j) => at(i / 14, j / 5)),
            0.16,
            '#629098',
            6,
          )
    }
    box([x, y - 0.5, z], [w * 0.94, 1, d * 0.94], dark)
    box([x, y + h, z], [w * 0.14, 1.2, d * 0.14], roof)
  }
  function flag(x, y, z, s = 1) {
    cyl([x, y + 9 * s, z], 0.25 * s, 0.35 * s, 18 * s, '#6a6559', 8)
    const point = (u, v) => [
      x + u * 11 * s,
      y + (17 - v * 6) * s,
      z + Math.sin(u * 4 + v) * 0.7 * s,
    ]
    grid(8, 3, point, trim, true)
    grid(
      8,
      3,
      (u, v) => {
        const p = point(u, v)
        p[2] -= 0.2 * s
        return p
      },
      trim,
    )
    for (const side of [-1, 1])
      tube(
        Array.from({ length: 9 }, (_, i) => {
          const u = 0.53 + ((side * i) / 8) * 0.24,
            v = 0.55 - Math.sin((i / 8) * Math.PI) * 0.2,
            p = point(u, v)
          p[2] += 0.2
          return p
        }),
        0.22 * s,
        dark,
        10,
      )
  }
  function cannon(x, y, z, a, large = false) {
    orient([x, z, a])
    const s = large ? 1.35 : 1
    cyl([x, y + 0.7, z], 4 * s, 4.7 * s, 1.4, mortar, 16)
    box([x, y + 2.2, z], [5 * s, 3, 5.5 * s], dark)
    for (const dx of [-3, 3])
      add(
        new T.CylinderGeometry(1.6 * s, 1.6 * s, 0.9 * s, 12),
        gold,
        [x + dx * s, y + 2, z],
        [0, 0, Math.PI / 2],
      )
    add(
      new T.CylinderGeometry(1.5 * s, 2.1 * s, 9 * s, 12),
      dark,
      [x, y + 4 * s, z + 3 * s],
      [Math.PI / 2 + 0.12, 0, 0],
    )
    add(new T.TorusGeometry(1.5 * s, 0.25 * s, 5, 12), mortar, [x, y + 4.55 * s, z + 7.5 * s])
    add(new T.CircleGeometry(1.25 * s, 12), '#182b32', [x, y + 4.55 * s, z + 7.56 * s])
    orient(null)
  }
  // A single continuous crescent; the inlet is genuinely open geometry.
  layer('ground')
  const shape = new T.Shape(),
    start = 0.28,
    end = Math.PI * 2 - 0.28
  for (let i = 0; i <= 120; i++) {
    const a = start + ((end - start) * i) / 120,
      x = Math.sin(a) * layout.outerRadius,
      z = Math.cos(a) * layout.outerRadius
    i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)
  }
  for (let i = 120; i >= 0; i--) {
    const a = 0.56 + ((Math.PI * 2 - 1.12) * i) / 120
    shape.lineTo(Math.sin(a) * layout.bay.radius, -layout.bay.z - Math.cos(a) * layout.bay.radius)
  }
  shape.closePath()
  slab(shape, -9, 23, stone)
  layer('wall')
  arc(310, 5, 14, 4, start, end, trim)
  arc(310, 2, 2, 2, start, end, mortar)
  arc(310, 2, 10, 1, start, end, mortar)
  arc(155, 5, 14, 4, 0.56, Math.PI * 2 - 0.56, trim, 130)
  arc(151, 2, 3, 2, 0.56, Math.PI * 2 - 0.56, mortar, 130)
  // Deliberate cannon spacing keeps long uninterrupted seawall silhouettes.
  for (let i = 0; i < 23; i++) {
    const a = 0.62 + ((Math.PI * 2 - 1.24) * i) / 22
    cannon(Math.sin(a) * 160, 14, 130 + Math.cos(a) * 160, a + Math.PI, i % 4 === 0)
  }
  for (let i = 0; i < 30; i++) {
    const a = 0.33 + ((Math.PI * 2 - 0.66) * i) / 29
    cannon(Math.sin(a) * 299, 14, Math.cos(a) * 299, a)
  }
  for (let i = 0; i < 180; i++) {
    const a = 0.3 + (Math.PI * 2 - 0.6) * rand(),
      r = 310.12,
      y = -4 + rand() * 17
    box([Math.sin(a) * r, y, Math.cos(a) * r], [2 + rand() * 3, 0.55, 0.3], mortar, a)
  }
  // Clear forecourt, connected retaining terraces and axial stairs.
  layer('terrace')
  box([0, 14.5, -65], [258, 1, 82], '#ebe8d8')
  for (let x = -120; x <= 120; x += 20) box([x, 15.04, -65], [0.18, 0.04, 82], mortar)
  for (let z = -95; z <= -25; z += 14) box([0, 15.05, z], [258, 0.04, 0.16], mortar)
  box([0, 25, -139], [104, 22, 68], stone)
  box([0, 36.5, -139], [109, 1.5, 72], trim)
  for (const x of [-51, 51]) {
    cyl([x, 25, -108], 11, 12, 22, stone, 32)
    // Each corner's ring uses translated local geometry rather than a detached ornament.
    const g = new T.RingGeometry(9, 11, 32)
    g.rotateX(-Math.PI / 2)
    add(g, trim, [x, 37, -108])
  }
  // Recessed entrance and rear stair reach the headquarters landing.
  arch(0, 15, -104.8, 11, 15)
  arch(0, 15, -104.2, 8, 12, '#53616a')
  for (const s of [-1, 1]) stairs(s * 66, 14, -87, 16, 23, 61, 24)
  box([0, 38, -187], [150, 4, 44], stone)
  stairs(32, 38, -124, 10, 14, 26, 18)
  box([16, 51.5, -150], [42, 1, 6], trim)
  // Headquarters: tapered white fortress base, red galleries, graduated teal roofs.
  layer('hq')
  // Custom rectangular frustum avoids diamond-shaped default cylinder footprints.
  const v = []
  const lo = [
      [-89, -53],
      [89, -53],
      [89, 53],
      [-89, 53],
    ],
    hi = [
      [-72, -43],
      [72, -43],
      [72, 43],
      [-72, 43],
    ]
  for (let k = 0; k < 4; k++) {
    const j = (k + 1) % 4
    v.push(
      ...[lo[j], lo[k], hi[j], lo[k], hi[k], hi[j]].flatMap((p, i) => [
        p[0],
        i === 2 || i === 4 || i === 5 ? 112 : 14,
        -205 + p[1],
      ]),
    )
  }
  const fg = new T.BufferGeometry()
  fg.setAttribute('position', new T.Float32BufferAttribute(v, 3))
  fg.computeVertexNormals()
  add(fg, stone, [0, 0, 0])
  box([0, 112, -205], [145, 2, 88], trim)
  for (const x of [-73, -49, 49, 73]) {
    box([x, 50, -149], [7, 27, 9], mortar)
    box([x, 65, -153], [7, 4, 9], trim)
  }
  arch(0, 52, -151.3, 16, 29, trim)
  arch(0, 53, -150.8, 12, 25, dark)
  for (let x = -65; x <= 65; x += 13) arch(x, 101, -159.9, 2.2, 4.4, dark)
  for (let i = 0; i < 75; i++) {
    const y = 43 + rand() * 64,
      x = (rand() - 0.5) * 150,
      z = -152 - ((y - 38) / 74) * 10 + 0.25
    if (Math.abs(x) < 63 && y > 66 && y < 98) continue
    box([x, y, z], [2 + rand() * 3, 0.6, 0.3], mortar)
  }
  // Hand-drawn Marine gull and kanji strokes follow the sloping facade plane.
  const stroke = (pts, w = 1) =>
    tube(
      pts.map(([x, y]) => [x, y, -152 - ((y - 38) / 74) * 10 + 0.8]),
      w,
      dark,
      Math.max(6, pts.length * 3),
    )
  for (const s of [-1, 1])
    stroke(
      [
        [0, 80],
        [s * 5, 91],
        [s * 10, 94],
        [s * 15, 88],
        [s * 14, 79],
        [s * 9, 84],
        [s * 5, 82],
      ],
      1.7,
    )
  stroke(
    [
      [-11, 78],
      [11, 78],
    ],
    0.8,
  )
  // 海 (water radical and 毎) and 軍 (cover, 車) as original dimensional calligraphy.
  for (const pts of [
    [
      [-61, 94],
      [-57, 91],
    ],
    [
      [-62, 85],
      [-58, 82],
    ],
    [
      [-62, 72],
      [-55, 80],
    ],
    [
      [-49, 98],
      [-54, 91],
    ],
    [
      [-51, 93],
      [-29, 93],
    ],
    [
      [-49, 90],
      [-52, 71],
      [-31, 71],
      [-28, 89],
      [-49, 90],
    ],
    [
      [-55, 81],
      [-25, 81],
    ],
    [
      [-42, 90],
      [-45, 71],
    ],
    [
      [-39, 87],
      [-36, 84],
    ],
    [
      [-42, 78],
      [-38, 75],
    ],
    [
      [-55, 69],
      [-26, 69],
    ],
  ])
    stroke(pts, 1.25)
  for (const pts of [
    [
      [29, 96],
      [29, 92],
    ],
    [
      [29, 95],
      [59, 95],
      [57, 90],
    ],
    [
      [33, 90],
      [55, 90],
    ],
    [
      [32, 86],
      [55, 86],
      [55, 73],
      [32, 73],
      [32, 86],
    ],
    [
      [32, 80],
      [55, 80],
    ],
    [
      [27, 69],
      [60, 69],
    ],
    [
      [43, 92],
      [43, 64],
    ],
  ])
    stroke(pts, 1.25)
  for (const [y, w, d, h] of [
    [114, 135, 80, 22],
    [140, 102, 65, 23],
    [165, 76, 51, 21],
    [189, 52, 36, 18],
  ]) {
    box([0, y + h / 2, -205], [w, h, d], stone)
    const front = -205 + d / 2 + 0.3
    for (let x = -w / 2 + 9; x < w / 2 - 5; x += 14) {
      arch(x, y + 4, front, 9, h - 6, roof)
      arch(x, y + 5, front + 0.4, 6, h - 9, '#9ebbb8')
    }
    for (const s of [-1, 1]) box([(s * w) / 2, y + h / 2, front], [1.1, h, 1], red)
    box([0, y + 1, -205], [w + 8, 2, d + 7], trim)
    rail(0, y + 2, front + 3, w + 6)
    pagoda(0, y + h, -205, w + 18, d + 17, 11)
  }
  pagoda(0, 218, -205, 32, 26, 12)
  for (const [y, z, w, h] of [
    [135, -155, 31, 12],
    [184, -170, 23, 10],
    [214, -184, 18, 9],
  ]) {
    const gable = new T.Shape()
    gable.moveTo(-w / 2, 0)
    gable.quadraticCurveTo(-w * 0.24, h * 0.15, 0, h)
    gable.quadraticCurveTo(w * 0.24, h * 0.15, w / 2, 0)
    gable.closePath()
    add(
      new T.ExtrudeGeometry(gable, { depth: 1.2, bevelEnabled: false, curveSegments: 10 }),
      trim,
      [0, y, z],
    )
    tube(
      [
        [-w / 2, y, z + 1.3],
        [-w * 0.24, y + h * 0.25, z + 1.3],
        [0, y + h, z + 1.3],
        [w * 0.24, y + h * 0.25, z + 1.3],
        [w / 2, y, z + 1.3],
      ],
      0.9,
      roof,
      24,
    )
    arch(0, y, z + 1.4, w * 0.33, h * 0.62, red)
  }
  box([0, 178, -177], [21, 7, 1], gold)
  api.sign('JUSTICE', [0, 176, -176.4], 2.8)
  for (const x of [-76, 76]) {
    cyl([x, 112, -166], 4, 6, 30, stone, 12)
    pagoda(x, 127, -166, 13, 13, 8, false)
  }
  // Four rocky pillars, each carrying a physically grounded lookout pavilion.
  layer('pinnacle')
  for (const [x, z, h] of layout.pinnacles) {
    const rings = [
        { y: 14, r: 31 },
        { y: 24, r: 29 },
        { y: h * 0.35, r: 21 },
        { y: h * 0.56, r: 20 },
        { y: h * 0.72, r: 14 },
        { y: h * 0.91, r: 13 },
        { y: h, r: 11 },
      ],
      pos = [],
      idx = [],
      n = 18
    for (let j = 0; j < rings.length; j++)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2,
          f = 1 + 0.18 * Math.sin(i * 3.1 + j * 0.6) + 0.08 * Math.cos(i * 2.3 - j)
        pos.push(x + Math.sin(a) * rings[j].r * f, rings[j].y, z + Math.cos(a) * rings[j].r * f)
      }
    for (let j = 0; j < rings.length - 1; j++)
      for (let i = 0; i < n; i++) {
        const a = j * n + i,
          b = j * n + ((i + 1) % n)
        idx.push(a, b, b + n, a, b + n, a + n)
      }
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    add(g, '#c0c0b0', [0, 0, 0])
    cyl([x, h, z], 11, 11, 2, trim, 14)
    for (let i = 0; i < 33; i++) {
      const a = i * 2.399,
        yy = 19 + ((i % 11) * (h - 25)) / 11
      const j = rings.findIndex((r) => r.y > yy),
        lo = rings[Math.max(0, j - 1)],
        hi = rings[Math.max(1, j)],
        t = (yy - lo.y) / (hi.y - lo.y),
        r = (lo.r + (hi.r - lo.r) * t) * 0.94
      add(
        new T.IcosahedronGeometry(1, 0),
        i % 4 === 0 ? '#8fa48d' : '#b1b6a9',
        [x + Math.sin(a) * r, yy, z + Math.cos(a) * r],
        [0, a, 0],
        [4, 7, 4],
      )
    }
    for (const dx of [-7, 7])
      for (const dz of [-7, 7]) box([x + dx, h + 6, z + dz], [1.1, 12, 1.1], red)
    rail(x, h + 1, z + 8, 16)
    rail(x, h + 1, z - 8, 16)
    pagoda(x, h + 13, z, 25, 25, 11, false)
    flag(x + 2, h + 25, z, 1.2)
  }
  // Scaffold: small open timber construction above the fortified terrace.
  layer('scaffold')
  const [sx, sy, sz] = layout.scaffold
  box([sx, sy + 20, sz], [29, 1.5, 20], '#b89a6b')
  for (let x = -14; x <= 14; x += 7) box([x, sy + 20.9, sz], [6.7, 0.25, 19], '#c9ad7e')
  for (const x of [-12, 0, 12])
    for (const z of [-8, 8]) {
      box([x, sy + 10, sz + z], [1.4, 20, 1.4], '#67594e')
      for (const y of [4, 12, 19]) box([x, sy + y, sz + z + 1], [2.1, 1, 0.5], dark)
    }
  for (const z of [-8, 8])
    for (const x of [-12, 0]) {
      beam([x, sy + 2, sz + z], [x + 12, sy + 18, sz + z], 1, '#786756')
      beam([x + 12, sy + 2, sz + z], [x, sy + 18, sz + z], 1, '#786756')
    }
  for (const x of [-12, 12]) {
    beam([x, sy + 2, sz - 8], [x, sy + 18, sz + 8], 1, '#786756')
    beam([x, sy + 2, sz + 8], [x, sy + 18, sz - 8], 1, '#786756')
  }
  rail(0, sy + 21, sz - 10, 29, '#7d6b55')
  // Stair lies in the rear approach, not across the visible braced front.
  for (let i = 0; i < 20; i++)
    box([0, sy + i + 1, sz - 10 - (19 - i) * 0.9], [5.5, 0.65, 1], '#b59b76')
  for (const x of [-3, 3]) beam([x, sy + 1, sz - 28], [x, sy + 21, sz - 10], 0.7, '#6a5b4c')
  for (const x of [-3, 3]) beam([x, sy + 4, sz - 28], [x, sy + 24, sz - 10], 0.4, '#6a5b4c')
  // Three ornate chairs on the lower platform; architectural representation, no characters.
  box([0, 23, -96], [39, 16, 15], stone)
  stairs(0, 15, -79, 36, 16, 10, 16)
  for (const x of [-12, 0, 12]) {
    box([x, 34, -96], [6, 1.3, 5], gold)
    box([x, 38.6, -98], [6.5, 9, 1.3], gold)
    arch(x, 35.4, -97.2, 5.5, 9, gold)
    arch(x, 35.8, -96.7, 4, 7.6, '#645074')
    for (const dx of [-2.7, 2.7]) {
      box([x + dx, 33, -94], [0.6, 4, 0.6], gold)
      box([x + dx, 36, -95], [0.7, 0.7, 5], gold)
      tube(
        [
          [x + dx, 41, -96.3],
          [x + dx * 1.3, 43, -96.3],
          [x + dx * 0.7, 44, -96.3],
        ],
        0.28,
        gold,
        8,
      )
    }
  }
  // Town streets are intentionally interrupted by stairs, trees and forecourts.
  function house(x, y, z, w, d, h, variant) {
    box([x, y + h / 2, z], [w, h, d], variant % 3 === 0 ? '#d5cfc0' : stone)
    box([x, y + 0.7, z], [w + 1, 1.4, d + 1], mortar)
    const s = new T.Shape()
    s.moveTo(-w / 2 - 1, 0)
    s.lineTo(w / 2 + 1, 0)
    s.lineTo(0, h * 0.42)
    s.closePath()
    add(
      new T.ExtrudeGeometry(s, { depth: d + 2, bevelEnabled: false }),
      variant % 4 === 0 ? '#866360' : '#aa6660',
      [x, y + h, z - d / 2 - 1],
    )
    box([x, y + h + h * 0.42, z], [0.6, 0.7, d + 3], trim)
    const f = z + d / 2 + 0.2
    arch(x, y, f, 3, 5.4, dark)
    for (const xx of [-w * 0.28, w * 0.28])
      for (let yy = 6; yy < h - 1; yy += 5) {
        arch(x + xx, y + yy, f, 2.5, 3.7, roof)
        box([x + xx, y + yy, f + 0.5], [3, 0.4, 0.8], trim)
      }
    if (variant % 3 === 0) {
      box([x, y + 6, f + 1.7], [w * 0.8, 0.7, 3], trim)
      rail(x, y + 6.4, f + 3, w * 0.8, red)
    }
    box([x + w * 0.3, y + h + 3, z - d * 0.2], [2.3, 7, 2.3], mortar)
  }
  layer('town')
  for (const s of [-1, 1]) {
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 4; col++) {
        const x = s * (118 + col * 24 + (row % 2) * 7),
          z = -40 - row * 27
        if (layout.pinnacles.some((p) => Math.hypot(x - p[0], z - p[1]) < 37)) continue
        const y = 14 + Math.max(0, row - 1) * 3
        const padHeight = Math.max(2, y - 14)
        box([x, y - padHeight / 2, z], [23, padHeight, 25], stone)
        house(x, y, z, 13 + rand() * 4, 12 + rand() * 5, 12 + rand() * 6, row + col)
      }
    stairs(s * 104, 14, -40, 9, 9, 45, 18)
    // Circular bastion and adjoining stair define the town's boundary.
    cyl([s * 107, 25, -153], 18, 20, 22, stone, 32)
    const g = new T.RingGeometry(15, 18, 32)
    g.rotateX(-Math.PI / 2)
    add(g, trim, [s * 107, 36.1, -153])
    cannon(s * 107, 36, -153, 0, true)
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2
      arch(s * 107 + Math.sin(a) * 18, 23, -153 + Math.cos(a) * 18, 2, 5, dark)
    }
    for (let i = 0; i < 12; i++) {
      const a = 0.85 + i * 0.14,
        x = s * (238 + Math.sin(i) * 9),
        z = -185 + i * 27
      if (Math.hypot(x, z) > 292) continue
      cyl([x, 18, z], 0.6, 1.2, 8, '#756b54', 6)
      for (const [dx, dy, dz] of [
        [0, 0, 0],
        [3, -1, 1],
        [-2, -1, -2],
      ])
        add(
          new T.IcosahedronGeometry(5, 1),
          '#6d9986',
          [x + dx, 23 + dy, z + dz],
          [0, a, 0],
          [1, 1.2, 1],
        )
    }
  }
  // Quay is on the outside coast, clear of the full flagship sail envelope.
  layer('quay')
  box([315, 13, 50], [14, 3, 82], stone)
  box([302, 14, 50], [16, 2, 12], trim)
  for (const z of [17, 41, 65, 89]) {
    cyl([315, 16, z], 1.3, 2, 4, dark, 10)
    cyl([315, 1, z], 2, 3, 22, mortar, 10)
  }
  for (let i = 0; i < 8; i++) {
    const x = 311 + (i % 2) * 5,
      z = 23 + Math.floor(i / 2) * 13
    box([x, 17, z], [3.8, 4, 4.5], '#a18a66')
    for (const dx of [-1.4, 1.4]) box([x + dx, 17, z + 2.3], [0.35, 4, 0.2], dark)
  }
  beam([322, 14, 55], [336, 10, 55], 2.5, '#a18a66')
  for (const s of [-1, 1]) flag(s * 95, 18, 273, 1.5)
  buildFleet({ ...api, grid, tube, flag })
}
