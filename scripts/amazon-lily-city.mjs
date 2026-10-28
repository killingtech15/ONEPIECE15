// Original reference-led Amazon Lily geometry. Dimensions are diorama units.
import * as T from 'three'
import { readFileSync } from 'node:fs'
const L = JSON.parse(readFileSync('src/amazon-lily-layout.json', 'utf8'))

export function buildCity({ add, box, cyl, ring, beam, rand, layer, orient }) {
  const V = (p) => new T.Vector3(...p)
  const river = new T.CatmullRomCurve3(L.river.map(V)).getPoints(180)
  const riverDistance = (x, z) => Math.min(...river.map((p) => Math.hypot(p.x - x, p.z - z)))
  function ground(x, z) {
    const r = Math.hypot(x, z),
      a = Math.atan2(z, x)
    const edge = 285 + 8 * Math.sin(a * 7) + 5 * Math.cos(a * 11)
    if (r > edge) return -12 - Math.min(8, (r - edge) * 0.6)
    const mountain = (112 + 22 * Math.sin(a * 2 - 0.5)) * Math.exp(-Math.pow((r - 177) / 24, 6))
    let h = 5 + mountain + 2 * Math.sin(x * 0.08) * Math.cos(z * 0.09)
    if (r > 225) h = 5 + 9 * Math.pow(Math.sin(a * 8) + 1, 1.2) + 3 * Math.cos(r * 0.12)
    if (r > edge - 15) h *= Math.max(0, (edge - r) / 15)
    const d = riverDistance(x, z)
    if (d < 15) h = T.MathUtils.lerp(-3, h, T.MathUtils.smoothstep(d, 9, 15))
    if (Math.hypot(x - 90, z - 18) < 30) h = 3
    return h
  }
  const tube = (pts, r, c, n = 24, radial = 7) =>
    add(
      new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(V)), n, r, radial, false),
      c,
      pts[0].map(() => 0),
    )
  const ball = (p, s, c, detail = 1) =>
    add(new T.IcosahedronGeometry(1, detail), c, p, [0, 0, 0], s)
  const oval = (p, s, c) => add(new T.SphereGeometry(1, 16, 10), c, p, [0, 0, 0], s)
  function meshGrid(rows, cols, point, c, p = [0, 0, 0]) {
    const pos = [],
      idx = []
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= cols; i++) pos.push(...point(i / cols, j / rows))
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const k = j * (cols + 1) + i
        idx.push(k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2)
      }
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    add(g, c, p)
  }
  // Continuous hollow mountain and valley, split into spatially cullable tiles.
  layer('terrain')
  for (let tz = -3; tz < 3; tz++)
    for (let tx = -3; tx < 3; tx++) {
      const cx = tx * 100 + 50,
        cz = tz * 100 + 50
      meshGrid(
        14,
        14,
        (u, v) => {
          const x = cx + (u - 0.5) * 100,
            z = cz + (v - 0.5) * 100
          return [x - cx, ground(x, z), z - cz]
        },
        '#d6ae7e',
        [cx, 0, cz],
      )
    }
  // Stratified rock buttresses break the smooth ring without filling the bowl.
  for (let i = 0; i < 110; i++) {
    const a = (i / 110) * Math.PI * 2,
      r = 177 + ((i % 3) - 1) * 14,
      x = Math.cos(a) * r,
      z = Math.sin(a) * r
    if (riverDistance(x, z) < 21) continue
    const h = ground(x, z)
    ball([x, h * 0.48, z], [12 + (i % 4), h * 0.57, 12 + (i % 3)], i % 3 ? '#c49a70' : '#e2b98a', 1)
  }
  // Parapet crowns the valley edge; front breaks provide the elevated reveal.
  layer('architecture')
  for (let i = 0; i < 100; i++) {
    const a = (i / 100) * Math.PI * 2,
      r = 153,
      x = Math.cos(a) * r,
      z = Math.sin(a) * r
    if (riverDistance(x, z) < 20) continue
    const y = ground(x, z) + 2
    box([x, y, z], [10, 3, 2.3], 'stone', -a + Math.PI / 2)
    box([x, y + 2.2, z], [3.2, 1.8, 2.5], 'stone', -a + Math.PI / 2)
  }
  function railing(a, b, c = 'roof') {
    beam([a[0], a[1] + 1.5, a[2]], [b[0], b[1] + 1.5, b[2]], 0.35, c)
    const n = Math.max(1, Math.ceil(V(a).distanceTo(V(b)) / 2))
    for (let i = 0; i <= n; i++) {
      const p = V(a).lerp(V(b), i / n)
      box([p.x, p.y + 0.7, p.z], [0.28, 1.6, 0.28], c)
    }
  }
  function roof(x, y, z, w, d, h, c = 'roof') {
    // Two curved roof slopes, lifted eave corners, ridge caps and tile ribs.
    for (const side of [-1, 1]) {
      const at = (u, v) => [
        (u - 0.5) * w,
        y + h * Math.pow(1 - v, 1.6) + 1.8 * Math.pow(Math.abs(u - 0.5) * 2, 6) * v,
        z + (side * v * d) / 2,
      ]
      meshGrid(
        5,
        8,
        (u, v) => {
          const p = at(side === 1 ? u : 1 - u, v)
          return [p[0], p[1] - y, p[2] - z]
        },
        c,
        [x, y, z],
      )
      // The underside is a separate thin roof surface, never a black backface.
      meshGrid(
        5,
        8,
        (u, v) => {
          const p = at(side === 1 ? 1 - u : u, v)
          return [p[0], p[1] - y - 0.25, p[2] - z]
        },
        '#82798c',
        [x, y, z],
      )
      for (let i = 0; i <= Math.round(w / 3.5); i++) {
        const u = i / Math.round(w / 3.5),
          p = []
        for (let k = 0; k <= 6; k++) {
          const q = at(u, k / 6)
          p.push([x + q[0], q[1] + 0.1, q[2]])
        }
        tube(p, 0.12, '#d59072', 4, 4)
      }
      tube(
        Array.from({ length: 13 }, (_, i) => {
          const p = at(i / 12, 1)
          return [x + p[0], p[1], p[2]]
        }),
        0.35,
        'gold',
        12,
        6,
      )
    }
    beam([x - w * 0.54, y + h, z], [x + w * 0.54, y + h, z], 0.65, 'gold')
    for (const s of [-1, 1])
      tube(
        [
          [x + s * w * 0.48, y + h, z],
          [x + s * w * 0.55, y + h + 1, z],
          [x + s * w * 0.56, y + h + 3, z],
        ],
        0.45,
        'gold',
        8,
      )
  }
  function pavilion(x, y, z, w = 20, d = 13, h = 10, hero = false) {
    box([x, y - 1, z], [w + 3, 2, d + 3], 'stone')
    box([x, y + h / 2, z], [w, h, d], 'stone')
    for (let dx = -w / 2 + 1; dx <= w / 2; dx += w / 4) {
      box([x + dx, y + h / 2, z + d / 2 + 0.3], [0.6, h, 0.6], 'roof')
      if (dx < w / 2 - 1) {
        box([x + dx + w / 8, y + h * 0.57, z + d / 2 + 0.12], [w / 4 - 1, h * 0.54, 0.16], 'dark')
        for (let k = 1; k <= 3; k++)
          box(
            [x + dx + w / 8 + ((k - 2) * w) / 17, y + h * 0.57, z + d / 2 + 0.28],
            [0.18, h * 0.54, 0.2],
            'roof',
          )
        box([x + dx + w / 8, y + h * 0.62, z + d / 2 + 0.3], [w / 4 - 1, 0.22, 0.2], 'roof')
      }
    }
    for (const dx of [-w / 2, w / 2]) box([x + dx, y + h / 2, z], [0.7, h, d], 'roof')
    box([x, y + h - 0.5, z], [w + 1, 0.55, d + 1], 'roof')
    roof(x, y + h, z, w + 7, d + 6, hero ? 5 : 3)
    railing([x - w / 2 - 1, y, z + d / 2 + 1], [x + w / 2 + 1, y, z + d / 2 + 1])
  }
  // Spacious raised palace platform, a long staircase and separated forecourt.
  const [px, py, pz] = L.palace
  layer('terrain')
  ball([px, 51, pz - 26], [51, 56, 18], '#d6a57b', 1)
  layer('architecture')
  box([px, py / 2, pz], [91, py, 34], 'stone')
  box([px, 9, pz + 52], [112, 2, 28], 'stone')
  for (let i = 0; i < 18; i++) box([px, 9 + i * 1.17, pz + 42 - i * 1.5], [24, 2, 2], 'stone')
  pavilion(px, py, pz, 39, 25, 22, true)
  pavilion(px, py + 28, pz - 3, 26, 19, 16, true)
  pavilion(px, py + 51, pz - 5, 17, 15, 11, true)
  for (const s of [-1, 1]) {
    pavilion(px + s * 34, py, pz + 2, 20, 23, 15, true)
    add(new T.CircleGeometry(4, 24), 'dark', [px + s * 34, py - 7, pz + 17.1])
    add(new T.TorusGeometry(4, 0.5, 6, 24), 'roof', [px + s * 34, py - 7, pz + 17.4])
  }
  for (let i = 0; i < 10; i++) box([px - 43 + i * 9, py - 7, pz + 17.2], [1.5, 4, 0.2], 'dark')
  for (const side of [-1, 1]) {
    for (const dz of [42, 58]) {
      const x = px + side * 44,
        z = pz + dz
      box([x, 11, z], [6, 2, 6], 'stone')
      ball([x, 13, z], [3, 2, 3], 'leaf', 1)
      cyl([x - side * 6, 13, z], 0.3, 0.45, 7, 'roof', 8)
      oval([x - side * 6, 16, z], [1, 1.5, 1], 'gold')
    }
  }
  // Wall-mounted galleries with structural brackets, connected lateral walks.
  const galleries = [
    [-115, 65, -67],
    [-122, 91, -82],
    [-95, 113, -110],
    [15, 67, -125],
    [35, 91, -123],
  ]
  for (const [x, y, z] of galleries) {
    layer('terrain')
    ball([x, y * 0.44, z - 15], [15, y * 0.56, 18], '#d7a777', 1)
    layer('architecture')
    pavilion(x, y, z, 22, 12, 9)
    for (const dx of [-9, 0, 9]) {
      beam([x + dx, y - 1, z + 6], [x + dx, y - 18, z - 7], 1.1, 'stone')
      box([x + dx, y - 10, z - 7], [1.2, 19, 1.2], 'stone')
    }
    box([x, y - 1, z - 5], [28, 1.1, 4], 'stone')
    railing([x - 14, y, z - 3], [x + 14, y, z - 3])
  }
  // Original secondary streets. Deliberate clear river margins and broad lanes.
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 7; col++) {
      const x = -113 + col * 22 + (row % 2) * 2,
        z = -24 + row * 24
      if (riverDistance(x, z) < 24 || Math.hypot(x, z) > 128 || x > 50) continue
      const y = Math.max(6, ground(x, z)),
        w = 10 + (col % 3) * 2,
        d = 10 + (row % 2) * 3,
        h = 7 + (col % 3) * 2
      pavilion(x, y, z, w, d, h)
      if ((col + row) % 3 === 0) pavilion(x, y + h + 5, z, w * 0.72, d * 0.75, 5)
      if ((col + row) % 2 === 0) {
        box([x, y + 4, z + d / 2 + 3], [w, 0.5, 4], 'roof')
        for (const dx of [-w / 2, w / 2]) box([x + dx, y + 2, z + d / 2 + 4], [0.4, 4, 0.4], 'wood')
        for (let k = 0; k < 3; k++)
          box(
            [x - w * 0.3 + k * 3, y + 0.9, z + d / 2 + 3],
            [2, 1.5, 1.5],
            ['peach', 'gold', 'jade'][k],
          )
      }
      for (const dx of [-w * 0.4, w * 0.4])
        oval([x + dx, y + 5, z + d / 2 + 0.9], [0.65, 1, 0.65], 'roof')
    }
  // Village threshold in the valley; dimensions are interpretive.
  orient([-85, 87, Math.PI / 3])
  for (const x of [-94, -76]) cyl([x, 13, 87], 0.8, 1, 16, 'roof', 10)
  roof(-85, 21, 87, 27, 12, 4)
  box([-85, 18, 87], [19, 2, 1], 'gold')
  orient(null)
  // Bridges follow actual sampled channel centers, raised above Y=0.
  for (const [x, z, angle] of [
    [-25, 56, Math.PI / 2],
    [59, -32, 0.45],
  ]) {
    const point = (dx, y, dz) => [
      x + dx * Math.cos(angle) - dz * Math.sin(angle),
      y,
      z + dx * Math.sin(angle) + dz * Math.cos(angle),
    ]
    for (let i = 0; i < 16; i++) {
      const v = (i - 7.5) * 2,
        y = 6 + 3 * Math.cos(((v / 16) * Math.PI) / 2)
      box(point(v, y, 0), [2.2, 0.8, 9], 'stone', -angle)
      for (const s of [-1, 1]) {
        box(point(v, y + 1, s * 4.2), [0.5, 2, 0.5], 'roof')
        if (i < 15)
          beam(
            point(v, y + 2, s * 4.2),
            point(v + 2, 6 + 3 * Math.cos((((v + 2) / 16) * Math.PI) / 2) + 2, s * 4.2),
            0.4,
            'roof',
          )
      }
    }
  }
  // Arena: dry rock drop around a raised fighting disk, tiered pale seating.
  const [ax, ay, az] = L.arena
  cyl([ax, 8, az], 21, 23, 12, 'rock', 64)
  cyl([ax, 14.2, az], 21.5, 21.5, 0.8, 'stone', 64)
  ring([ax, 14.65, az], 21.5, 20, 'gold')
  for (let j = 0; j < 5; j++) {
    const ri = 31 + j * 2.5,
      ro = ri + 2.5,
      y = 15 + j * 2.1
    ring([ax, y, az], ro, ri, 'stone')
    const riser = new T.CylinderGeometry(ri, ri, 2.2, 80, 1, true)
    const indices = riser.index.array
    for (let k = 0; k < indices.length; k += 3)
      [indices[k + 1], indices[k + 2]] = [indices[k + 2], indices[k + 1]]
    riser.computeVertexNormals()
    add(riser, 'stone', [ax, y - 1, az])
  }
  add(new T.CylinderGeometry(44, 44, 20, 80, 1, true), 'rock', [ax, 14, az])
  ring([ax, 24.8, az], 45, 42.5, 'stone')
  for (let i = 0; i < 80; i++) {
    const a = (i / 80) * Math.PI * 2
    const r = 24.5 + (i % 3) * 1.6
    add(new T.ConeGeometry(0.6, 5, 5), 'dark', [ax + Math.cos(a) * r, 6, az + Math.sin(a) * r])
    if (i % 2 === 0)
      box([ax + Math.cos(a) * 43.8, 26, az + Math.sin(a) * 43.8], [1, 2.5, 1], 'stone')
  }
  // Access above the drop; royal canopy clearly separated from public seating.
  box([ax, 14, az + 27], [7, 1, 14], 'stone')
  pavilion(ax, 25, az - 39, 19, 11, 9, true)
  box([ax, 26, az - 35], [4, 2, 3], 'roof')
  // Water gate spans the actual carved river opening, never caps the channel.
  const gx = 134,
    gz = -145,
    ga = -Math.PI / 4
  for (const s of [-1, 1]) {
    const x = gx + s * 18 * Math.cos(ga),
      z = gz - s * 18 * Math.sin(ga)
    box([x, 31, z], [10, 62, 14], 'rock', ga)
    pavilion(x, 63, z, 12, 13, 8)
  }
  box([gx, 60, gz], [47, 8, 12], 'rock', ga)
  roof(gx, 64, gz, 52, 18, 5)
  // Nine original sculpted serpents: curved crowns, broad brows, open mouths.
  layer('sculpture')
  for (let i = 0; i < 9; i++) {
    const a = 0.28 + (i / 8) * (Math.PI - 0.56),
      x = Math.cos(a) * 174,
      z = Math.sin(a) * 169
    const y = ground(x, z) + 12,
      high = [2, 4, 6].includes(i),
      lift = high ? 92 : 35
    tube(
      [
        [x * 0.87, y - 21, z * 0.87],
        [x * 1.02, y + lift * 0.55, z * 0.82],
        [x * 1.02, y + lift, z * 0.95],
        [x, y + 22, z + 12],
      ],
      high ? 7 : 5.8,
      '#dce2ce',
      30,
      10,
    )
    oval([x, y + 22, z + 14], [10, 6.2, 12], '#e4e8d5')
    oval([x, y + 19, z + 23], [8.5, 2.4, 7], '#c8d5bd')
    oval([x, y + 20.6, z + 25], [7, 0.35, 3.1], '#738d83')
    for (const s of [-1, 1]) {
      oval([x + s * 7.8, y + 25, z + 18], [2.2, 0.65, 2.3], '#738d83')
      oval([x + s * 7.9, y + 25.2, z + 19], [0.4, 0.6, 0.5], '#738d83')
      add(new T.ConeGeometry(0.7, 3.4, 7), 'stone', [x + s * 4, y + 18.5, z + 26], [Math.PI, 0, 0])
    }
    if (high) ball([x * 0.98, y + lift - 1, z * 0.92], [9, 2.5, 8], 'leaf', 1)
  }
  // Hand-authored vector strokes for 九蛇, attached to the front cliff.
  layer('architecture')
  const glyphs = [
    [
      [
        [2, 10],
        [8, 10],
        [7, 4],
        [3, 0],
      ],
      [
        [4, 14],
        [4, 10],
        [10, 10],
        [10, 1],
        [13, 1],
        [14, 3],
      ],
    ],
    [
      [
        [1, 10],
        [7, 10],
        [7, 5],
        [1, 5],
        [1, 10],
      ],
      [
        [4, 13],
        [4, 1],
      ],
      [
        [0, 1],
        [8, 2],
      ],
      [
        [7, 4],
        [9, 0],
      ],
      [
        [12, 14],
        [13, 12],
      ],
      [
        [10, 10],
        [10, 12],
        [18, 12],
        [18, 10],
      ],
      [
        [12, 9],
        [12, 2],
        [13, 1],
        [18, 1],
        [19, 3],
      ],
      [
        [12, 6],
        [17, 8],
      ],
    ],
  ]
  for (let g = 0; g < 2; g++)
    for (const stroke of glyphs[g]) {
      const points = stroke.map(([x, y]) => [-39 + g * 36 + x * 2.1, 62 + y * 2.1, 205])
      tube(points, 0.95, 'roof', stroke.length * 4, 6)
    }
  // Forest clumps occupy outer shelves; leave the arrival clearing and all views open.
  function tree(x, z, h = 12) {
    const y = ground(x, z)
    if (y < 1 || riverDistance(x, z) < 22) return
    layer('forest')
    cyl([x, y + h * 0.45, z], 0.7, 1.4, h * 0.9, 'wood', 7)
    for (let j = 0; j < 3; j++) {
      const a = j * 2.1,
        xx = x + Math.cos(a) * 3,
        zz = z + Math.sin(a) * 3
      beam([x, y + h * 0.45, z], [xx, y + h * 0.8, zz], 0.6, 'wood')
      ball([xx, y + h, zz], [12, 5.5, 11], j % 2 ? '#498160' : '#659a69', j === 0 ? 1 : 0)
    }
    layer('architecture')
  }
  for (let i = 0; i < 240; i++) {
    const a = rand() * Math.PI * 2,
      r = 226 + rand() * 47,
      x = Math.cos(a) * r,
      z = Math.sin(a) * r
    if (Math.hypot(x + 206, z - 105) < 32) continue
    tree(x, z, 9 + rand() * 9)
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2,
      r = 128
    const x = Math.cos(a) * r,
      z = Math.sin(a) * r
    if (z < -38 || (x > 53 && z < 67) || Math.hypot(x + 85, z - 87) < 32) continue
    tree(x, z, 8 + rand() * 5)
  }
  layer('architecture')
  // Arrival clearing props and a rooted footpath; arrival was by Kuma, not ship.
  for (let i = 0; i < 15; i++) {
    const x = -222 + i * 2.2,
      z = 106 + Math.sin(i * 0.3) * 4
    cyl([x, ground(x, z) + 0.25, z], 2, 2, 0.5, 'stone', 8)
  }
  ball([-211, ground(-211, 94) + 2, 94], [6, 3, 4], 'rock', 1)
  // Kuja waterfront, full vessel and separate yoked animals share layout bounds.
  const [sx, , sz] = L.ship
  box([sx - 31, 5, sz], [8, 2, 48], 'wood')
  for (let i = 0; i < 16; i++) box([sx - 31, 6.1, sz - 22 + i * 3], [8, 0.2, 0.22], 'dark')
  for (const dz of [-20, 0, 20]) cyl([sx - 31, 1, sz + dz], 0.8, 0.9, 10, 'wood', 8)
  beam([sx - 31, 5, sz + 22], [180, 5, -202], 5, 'wood')
  layer('ship')
  // Hull sections: tapered ends, dark planking and swept upper rails.
  meshGrid(
    14,
    40,
    (u, v) => {
      const a = (1 - u) * Math.PI * 2,
        t = v * 2 - 1,
        w = 12 * Math.pow(Math.max(0.02, 1 - t * t), 0.45)
      return [
        Math.cos(a) * w * (0.65 + 0.35 * Math.sin(a * 0.5)),
        3 + Math.sin(a) * 6 + Math.pow(Math.abs(t), 4) * 8,
        t * 37,
      ]
    },
    '#3e4146',
    [sx, 0, sz],
  )
  box([sx, 7, sz], [19, 1, 58], 'wood')
  for (const side of [-1, 1]) {
    for (const y of [2.5, 5, 8])
      tube(
        Array.from({ length: 21 }, (_, i) => {
          const t = i / 10 - 1
          return [
            sx + side * 12 * Math.sqrt(Math.max(0.02, 1 - t * t)),
            y + Math.pow(Math.abs(t), 4) * 8,
            sz + t * 37,
          ]
        }),
        0.48,
        'roof',
        24,
      )
    for (let i = 0; i < 11; i++) {
      const z = sz - 27 + i * 5.2,
        x = sx + side * 12 * Math.sqrt(1 - Math.pow((z - sz) / 38, 2))
      box([x, 6, z], [0.35, 2.7, 3], 'gold')
      box([x + side * 0.22, 6, z], [0.3, 1.6, 1.8], 'dark')
      box([x, 10, z], [0.4, 3, 0.4], 'roof')
    }
    tube(
      Array.from({ length: 21 }, (_, i) => {
        const t = i / 10 - 1
        return [
          sx + side * 12 * Math.sqrt(Math.max(0.02, 1 - t * t)),
          11 + Math.pow(Math.abs(t), 4) * 7,
          sz + t * 37,
        ]
      }),
      0.6,
      'roof',
      24,
    )
  }
  pavilion(sx, 8, sz - 10, 17, 25, 9)
  pavilion(sx, 22, sz - 13, 13, 19, 7)
  // Battened junk sails bow slightly; all seams follow their curved surface.
  for (const [dz, h, w, bottom] of [
    [9, 56, 31, 19],
    [-22, 48, 26, 19],
    [9, 78, 22, 60],
  ]) {
    if (bottom === 19) cyl([sx, h / 2 + 5, sz + dz], 0.45, 0.8, h, 'wood', 10)
    else cyl([sx, 70, sz + dz], 0.3, 0.45, 18, 'wood', 10)
    const sail = (u, v) => [
      sx + (u - 0.5) * w * (0.8 + 0.2 * Math.sin(v * Math.PI)),
      bottom + v * (h - bottom - 2),
      sz + dz + Math.sin(u * Math.PI) * 3 + Math.sin(v * Math.PI) * 1.3,
    ]
    meshGrid(10, 14, (u, v) => sail(1 - u, v).map((n, i) => n - [sx, 0, sz + dz][i]), 'roof', [
      sx,
      0,
      sz + dz,
    ])
    meshGrid(
      10,
      14,
      (u, v) => {
        const p = sail(u, v)
        p[2] -= 0.15
        return p.map((n, i) => n - [sx, 0, sz + dz][i])
      },
      'roof',
      [sx, 0, sz + dz],
    )
    for (let j = 0; j <= 10; j++)
      tube(
        Array.from({ length: 9 }, (_, i) => sail(i / 8, j / 10)),
        0.14,
        'dark',
        8,
        4,
      )
    for (const s of [-1, 1])
      beam([sx, h + 4, sz + dz], [sx + s * 11, 11, sz + dz - 8], 0.13, 'wood')
    if (bottom > 19) continue
    if (dz < 0) {
      for (let g = 0; g < 2; g++)
        for (const stroke of glyphs[g]) {
          tube(
            stroke.map(([x, y]) => [sx - 10 + g * 10 + x * 0.55, 29 + y * 0.65, sz + dz + 4.8]),
            0.3,
            'dark',
            stroke.length * 4,
            5,
          )
        }
      continue
    }
    // Original Kuja-style skull with nine curled serpentine rays.
    oval([sx, 39, sz + dz + 4.7], [2, 2.6, 0.25], 'dark')
    for (const s of [-1, 1]) oval([sx + s * 0.65, 39.5, sz + dz + 5], [0.45, 0.65, 0.2], 'stone')
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2
      tube(
        [
          [sx + Math.cos(a) * 2, 39 + Math.sin(a) * 2, sz + dz + 4.8],
          [sx + Math.cos(a + 0.2) * 5, 39 + Math.sin(a + 0.2) * 5, sz + dz + 4.8],
          [sx + Math.cos(a + 0.7) * 6, 39 + Math.sin(a + 0.7) * 6, sz + dz + 4.8],
        ],
        0.35,
        'dark',
        9,
        5,
      )
    }
  }
  // Towing Yuda are living green forms in front of the hull, not wooden figureheads.
  for (const side of [-1, 1]) {
    const x = sx + side * 7,
      z = sz + 41
    tube(
      [
        [x, 0, z - 3],
        [x, -1, z + 9],
        [x, 4, z + 15],
        [x, 16, z + 13],
        [x, 24, z + 15],
      ],
      2.5,
      'jade',
      24,
      9,
    )
    oval([x, 24, z + 18], [3.4, 2.6, 5], 'jade')
    oval([x, 22.7, z + 21], [2.8, 0.65, 3], 'dark')
    for (const s of [-1, 1]) {
      oval([x + s * 2.8, 25, z + 19], [0.6, 0.75, 1.2], 'gold')
      oval([x + s * 3, 25, z + 19.5], [0.25, 0.5, 0.3], 'dark')
      for (let i = 0; i < 6; i++) ball([x + s * 2, 21 - i * 2, z + 11], [1.4, 2.4, 2], 'iron', 0)
    }
    add(new T.TorusGeometry(2.7, 0.6, 6, 16), 'gold', [x, 18, z + 13], [Math.PI / 2, 0, 0])
    beam([x, 18, z + 13], [sx + side * 10, 11, sz + 31], 0.35, 'gold')
  }
  // Moored pose is static relative to its yoked animals; runtime adds vertical bob only.
  layer('architecture')
}
