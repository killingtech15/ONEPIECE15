import * as T from 'three'
import { readFileSync } from 'node:fs'
const L = JSON.parse(readFileSync(new URL('../src/sabaody-layout.json', import.meta.url)))
export function buildCity({ add, box, cyl, beam, rand, layer, font, orient }) {
  const tau = Math.PI * 2,
    bark = '#679e96',
    root = '#719c8b',
    grass = '#a8c97c',
    leaf = ['#81b878', '#6aa67d', '#96c583', '#639b76']
  const text = (s, p, size = 1.5, color = 'dark', rot = 0) => {
    const g = new T.ShapeGeometry(font.generateShapes(s, size), 3)
    g.computeBoundingBox()
    g.translate(-(g.boundingBox.max.x + g.boundingBox.min.x) / 2, 0, 0)
    add(g, color, p, [0, rot, 0])
  }
  const terrain = (geo) => {
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i),
        a = Math.atan2(z, x),
        k = 1 + 0.035 * Math.sin(a * 5) + 0.025 * Math.cos(a * 3)
      p.setX(i, x * k)
      p.setZ(i, z * k)
    }
    geo.computeVertexNormals()
    return geo
  }
  const tube = (points, r, c, n = 14) => {
    const anchor = new T.Vector3(...points[0])
    const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p).sub(anchor)))
    add(new T.TubeGeometry(curve, n, r, 6, false), c, anchor.toArray())
  }
  const arch = (w, h) =>
    new T.Shape()
      .moveTo(-w / 2, 0)
      .lineTo(w / 2, 0)
      .lineTo(w / 2, h * 0.65)
      .quadraticCurveTo(w / 2, h, 0, h)
      .quadraticCurveTo(-w / 2, h, -w / 2, h * 0.65)
      .closePath()
  const slab = (shape, d, c, p, rot = 0) =>
    add(new T.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 5 }), c, p, [
      0,
      rot,
      0,
    ])
  const window = (x, y, z, w, h, rot = 0) => {
    slab(arch(w + 0.5, h + 0.5), 0.12, 'trim', [x, y - 0.2, z], rot)
    slab(arch(w, h), 0.16, 'dark', [x + Math.sin(rot) * 0.18, y, z + Math.cos(rot) * 0.18], rot)
  }
  const dome = (p, r, h, c) =>
    add(new T.SphereGeometry(1, 20, 9, 0, tau, 0, Math.PI / 2), c, p, [0, 0, 0], [r, h, r])
  const gable = (x, y, z, w, h, d, c = 'roof') => {
    slab(
      new T.Shape()
        .moveTo(-w / 2, 0)
        .lineTo(w / 2, 0)
        .lineTo(0, h)
        .closePath(),
      d,
      c,
      [x, y, z - d / 2],
    )
    beam([x - w / 2, y, z + d / 2 + 0.15], [x, y + h, z + d / 2 + 0.15], 0.35, 'trim')
    beam([x + w / 2, y, z + d / 2 + 0.15], [x, y + h, z + d / 2 + 0.15], 0.35, 'trim')
  }
  const lantern = (x, y, z) => {
    cyl([x, y + 2, z], 0.12, 0.17, 4, 'iron', 6)
    box([x, y + 4.4, z], [0.8, 1, 0.8], 'gold')
    add(new T.ConeGeometry(0.7, 0.8, 4), 'iron', [x, y + 5.3, z], [0, Math.PI / 4, 0])
  }
  const steps = (x, y, z, w, n = 8, h = 0.5) => {
    for (let i = 0; i < n; i++)
      box([x, y + ((i + 1) * h) / 2, z - i * 0.9], [w, (i + 1) * h, 0.93], 'stone')
  }
  const shrub = (x, y, z, r = 2) =>
    add(
      new T.IcosahedronGeometry(1, 1),
      leaf[Math.floor(rand() * 4)],
      [x, y, z],
      [0, rand() * 3, 0],
      [r, r * 0.7, r],
    )
  const plaque = (s, x, y, z, w = 15) => {
    box([x, y, z], [w, 3, 0.7], 'wood')
    text(s, [x, y - 0.7, z + 0.4], 1.25, 'trim')
  }
  const town = (x, z, w = 8, h = 9, c = 'stone', roofColor = 'roof') => {
    box([x, 10 + h / 2, z], [w, h, w * 0.8], c)
    box([x, 10 + h, z], [w + 1, 0.6, w * 0.8 + 1], 'trim')
    dome([x, 10 + h + 0.3, z], w * 0.53, w * 0.42, roofColor)
    for (const dx of [-w * 0.28, w * 0.28])
      for (let yy = 12; yy < 9 + h; yy += 4) window(x + dx, yy, z + w * 0.4 + 0.1, 1.2, 2.4)
    window(x, 10, z + w * 0.4 + 0.15, 2.1, 3.7)
    cyl([x, 10 + h + w * 0.42 + 0.9, z], 0.12, 0.12, 1.4, 'gold', 6)
  }
  // Eight separated root platforms retain the zoning diagram's relative positions.
  layer('terrain')
  for (const d of L.districts) {
    const [x, z] = d.center,
      r = d.radius
    add(
      terrain(new T.SphereGeometry(1, 36, 12)),
      root,
      [x, -0.5, z],
      [0, 0, 0],
      [r, 11.5, r * 0.86],
    )
    add(
      terrain(new T.SphereGeometry(1, 36, 8, 0, tau, 0, Math.PI / 2)),
      grass,
      [x, 7, z],
      [0, 0, 0],
      [r * 0.985, 4, r * 0.85],
    )
    for (let j = 0; j < 12; j++) {
      const a = (j * tau) / 12
      const end = [x + Math.cos(a) * (r + 9), -3, z + Math.sin(a) * (r * 0.86 + 9)]
      tube(
        [
          [x + Math.cos(a) * r * 0.65, 8, z + Math.sin(a) * r * 0.58],
          [x + Math.cos(a) * r * 0.94, 5, z + Math.sin(a) * r * 0.81],
          end,
        ],
        2.3,
        root,
        8,
      )
    }
  }
  // Numbered mangroves: separate roots, fluted trunks, splayed branches and layered crowns.
  layer('forest')
  for (const g of L.groves) {
    const { x, z, height: h, radius: r } = g
    const roots = g.hero ? 8 : 4
    cyl([x, 10 + h * 0.48, z], r * 0.62, r, h * 0.96, bark, 12)
    for (let j = 0; j < roots; j++) {
      const a = (j * tau) / roots + 0.2
      const dx = Math.cos(a),
        dz = Math.sin(a)
      tube(
        [
          [x + dx * r * 0.45, 40, z + dz * r * 0.45],
          [x + dx * r * 1.1, 23, z + dz * r * 1.1],
          [x + dx * r * 2.2, 12, z + dz * r * 2.2],
          [x + dx * r * 3.1, 8, z + dz * r * 3.1],
        ],
        r * 0.26,
        root,
        g.hero ? 12 : 5,
      )
    }
    for (let j = 0; j < 5; j++) {
      const a = (j * tau) / 5
      const dx = Math.cos(a),
        dz = Math.sin(a)
      tube(
        [
          [x + dx * r * 0.8, 12, z + dz * r * 0.8],
          [x + dx * r * 0.72, h * 0.5, z + dz * r * 0.72],
          [x + dx * r * 0.5, h * 0.85, z + dz * r * 0.5],
        ],
        r * 0.13,
        '#89b5a5',
        g.hero ? 6 : 4,
      )
    }
    for (let j = 0; j < 4; j++) {
      const a = (j * tau) / 4 + 0.6
      const dx = Math.cos(a),
        dz = Math.sin(a),
        rr = g.hero ? 23 : 15
      tube(
        [
          [x, h * 0.71, z],
          [x + dx * rr * 0.5, h * 0.91, z + dz * rr * 0.5],
          [x + dx * rr, h + 8, z + dz * rr],
        ],
        r * 0.36,
        bark,
        5,
      )
      add(
        new T.IcosahedronGeometry(1, 1),
        leaf[(g.id + j) % 4],
        [x + dx * rr * 0.8, h + 10 + (j % 2) * 5, z + dz * rr * 0.8],
        [0, a, 0],
        [rr, 10, rr * 0.85],
      )
    }
    add(
      new T.SphereGeometry(1, g.hero ? 14 : 12, g.hero ? 9 : 7),
      leaf[g.id % 4],
      [x, h + 18, z],
      [0, 0, 0],
      [g.hero ? 25 : 18, 12, g.hero ? 23 : 17],
    )
    const size = g.hero ? 4 : 1.9
    text(String(g.id).padStart(2, '0'), [x, g.hero ? 45 : 31, z + r * 0.92 + 0.25], size, 'trim')
    text('GR', [x, (g.hero ? 45 : 31) - size * 0.8, z + r * 0.96 + 0.3], size * 0.42, 'trim')
  }
  // Raised bridges across real channels, with repeated posts and individual boards.
  layer('static')
  for (const [a, b] of [
    [0, 1],
    [0, 5],
    [0, 6],
    [0, 7],
    [1, 2],
    [1, 3],
    [1, 7],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
  ]) {
    const A = L.districts[a],
      B = L.districts[b],
      v = new T.Vector3(B.center[0] - A.center[0], 0, B.center[1] - A.center[1]).normalize()
    const from = new T.Vector3(A.center[0], 10, A.center[1]).addScaledVector(v, A.radius * 0.76),
      to = new T.Vector3(B.center[0], 10, B.center[1]).addScaledVector(v, -B.radius * 0.76),
      len = from.distanceTo(to),
      side = new T.Vector3(-v.z, 0, v.x),
      angle = Math.atan2(v.x, v.z)
    for (let t = 0; t <= len; t += 1.5) {
      const p = from.clone().addScaledVector(v, t)
      box([p.x, 10.8, p.z], [6, 0.5, 1.45], 'wood', angle)
      if (Math.round(t / 1.5) % 3 === 0)
        for (const s of [-1, 1]) {
          const q = p.clone().addScaledVector(side, s * 2.7)
          cyl([q.x, 12, q.z], 0.16, 0.2, 3, 'trim', 6)
        }
    }
    for (const s of [-1, 1])
      beam(
        from
          .clone()
          .addScaledVector(side, s * 2.7)
          .add(new T.Vector3(0, 3.4, 0))
          .toArray(),
        to
          .clone()
          .addScaledVector(side, s * 2.7)
          .add(new T.Vector3(0, 3.4, 0))
          .toArray(),
        0.2,
        'trim',
      )
  }
  // Shakky's recognisable stone rotunda, green dome, narrow windows and timber sign.
  const bx = -28,
    bz = 28
  orient([bx, bz, -Math.PI / 3])
  cyl([bx, 19, bz], 13, 13.8, 18, 'stone', 32)
  cyl([bx, 28, bz], 14, 14, 1.2, 'trim', 32)
  cyl([bx, 31, bz], 12.5, 13, 5, 'peach', 32)
  for (let j = 0; j < 14; j++) {
    const a = (j * tau) / 14
    window(bx + Math.sin(a) * 13.85, 12, bz + Math.cos(a) * 13.85, 2.2, 5.8, a)
    window(bx + Math.sin(a) * 12.6, 29, bz + Math.cos(a) * 12.6, 2.1, 2.5, a)
  }
  layer('shell-bar')
  cyl([bx, 33, bz], 10, 12.8, 5, '#6c9b72', 32)
  dome([bx, 35, bz], 14.5, 17, '#7fa675')
  cyl([bx, 51, bz], 0.25, 0.35, 2, 'gold', 8)
  dome([bx, 52, bz], 1.7, 2.7, 'roof')
  layer('static')
  for (const s of [-1, 1]) beam([bx + s * 7, 30, bz + 13], [bx + s * 7, 42, bz + 13], 0.65, 'wood')
  box([bx, 41, bz + 13.7], [24, 6, 1], 'wood')
  text("SHAKKY'S", [bx, 41.7, bz + 14.25], 2, 'trim')
  text('RIP-OFF BAR', [bx, 39.3, bz + 14.25], 1.5, 'trim')
  window(bx, 10, bz + 13.9, 4, 7)
  steps(bx, 8, bz + 19, 8, 4, 0.5)
  for (let row = 0; row < 5; row++) {
    add(
      new T.TorusGeometry(13.5 - row * 0.1, 0.07, 4, 64),
      '#b9b9a1',
      [bx, 14 + row * 2.7, bz],
      [Math.PI / 2, 0, 0],
    )
  }
  for (let j = 0; j < 6; j++) {
    const a = (j * tau) / 6 + 0.3
    const xx = bx + Math.sin(a) * 13.95,
      zz = bz + Math.cos(a) * 13.95
    beam([xx, 25, zz], [xx + 0.6, 16, zz], 0.15, 'leaf')
    for (let k = 0; k < 7; k++)
      add(
        new T.IcosahedronGeometry(0.7, 0),
        'leaf',
        [xx + Math.sin(k) * 0.7, 24 - k * 1.2, zz],
        [0, a, 0],
        [0.8, 1.2, 0.18],
      )
  }
  for (const dx of [-15, 15]) lantern(bx + dx, 10, bz + 12)
  orient(null)
  // Auction house with a deliberately separate roof shell and floor-level room.
  const ax = 0,
    az = 119
  orient([ax, az, (-Math.PI * 70) / 180])
  cyl([ax, 10.5, az], 25, 26, 1, 'stone', 40)
  layer('shell-auction')
  cyl([ax, 21, az], 23, 25, 21, '#83b2ad', 40)
  // Tall central roof, broad eaves, upper timbered pavilion and corner balconies.
  add(
    new T.LatheGeometry(
      [
        [28, 30.5],
        [28, 31.5],
        [26, 33],
        [23, 36],
        [19, 41],
        [15, 45],
        [9, 47.5],
      ].map(([r, y]) => new T.Vector2(r, y)),
      40,
    ),
    '#b89d66',
    [ax, 0, az],
  )
  cyl([ax, 30.8, az], 28.8, 28.8, 1.2, 'gold', 40)
  gable(ax, 47.5, az, 19, 10, 15, 'stone')
  for (const dx of [-7, -3, 3, 7]) {
    beam([dx, 47.5, az + 7.7], [dx > 0 ? dx - 3 : dx + 3, 52, az + 7.7], 0.55, 'wood')
  }
  for (const dx of [-7, -3, 3, 7])
    beam([dx, 47.5, az + 7.6], [dx, 54 - Math.abs(dx) * 0.5, az + 7.6], 0.5, 'wood')
  for (let j = 0; j < 24; j++) {
    const a = (j * tau) / 24
    beam(
      [Math.sin(a) * 27, 31.5, az + Math.cos(a) * 27],
      [Math.sin(a) * 10, 47, az + Math.cos(a) * 10],
      0.16,
      'wood',
    )
  }
  for (const dx of [-23, 23]) {
    cyl([dx, 21, az + 8], 6, 6.8, 10, 'stone', 16)
    dome([dx, 26, az + 8], 7, 7, 'gold')
    for (const u of [-3, 0, 3]) window(dx + u, 19, az + 14, 1.4, 4)
  }
  slab(arch(19, 23), 0.8, 'trim', [0, 10, az + 24])
  slab(arch(9, 14), 1, 'dark', [0, 10, az + 25])
  for (const dx of [-11, -7, 7, 11]) {
    cyl([dx, 17, az + 26], 0.7, 0.9, 14, 'stone', 12)
    cyl([dx, 24, az + 26], 1.2, 1.2, 0.6, 'trim', 12)
  }
  for (const xx of [-7, -3.5, 0, 3.5, 7]) window(xx, 26, az + 25.3, 2, 4)
  for (let j = 0; j < 16; j++) {
    const a = (j * tau) / 16
    window(Math.sin(a) * 24.2, 14, az + Math.cos(a) * 24.2, 2.5, 6, a)
  }
  plaque('HUMAN', 0, 35, az + 24.5, 18)
  for (let j = 0; j < 15; j++) {
    const a = j * 0.8
    add(
      new T.IcosahedronGeometry(1, 1),
      'leaf',
      [Math.sin(a) * 24, 35, az + Math.cos(a) * 24],
      [0, a, 0],
      [2.4, 0.35, 1.5],
    )
  }
  layer('room-auction')
  box([0, 11.4, az], [38, 1, 34], 'wood')
  box([0, 15.5, az - 13], [32, 8, 1], 'pink')
  box([0, 13, az - 9], [29, 3, 7], 'roofLight')
  box([0, 15.6, az - 8], [1.8, 2.4, 1.5], 'gold')
  for (const x of [-13, -8, 8, 13])
    for (let j = 0; j < 4; j++) {
      box([x, 12.6, az + j * 4], [3.5, 1, 2], 'peach')
      box([x, 14, az + j * 4 - 1], [3.5, 3, 0.35], 'roofLight')
    }
  layer('static')
  steps(0, 7, az + 33, 13, 8, 0.5)
  orient(null)
  // Park gateway: two square towers, cylindrical tiers, scalloped marquee and rides.
  const pz = -147
  for (const x of [-18, 18]) {
    box([x, 25, pz], [8, 30, 9], 'stone')
    box([x, 39, pz], [10, 1, 11], 'trim')
    dome([x, 40, pz], 6, 8, x < 0 ? 'pink' : 'blue')
    window(x, 19, pz + 4.8, 2, 12)
    cyl([x, 49, pz], 0.2, 0.3, 3, 'gold', 8)
  }
  cyl([0, 25, pz - 3], 12, 14, 30, 'pink', 32)
  cyl([0, 41, pz - 3], 10, 12, 4, 'trim', 32)
  dome([0, 43, pz - 3], 10, 9, 'pink')
  slab(arch(12, 22), 0.4, 'dark', [0, 10, pz + 12])
  box([0, 34, pz + 12.7], [34, 5, 1], 'trim')
  text('SABAODY PARK', [0, 33, pz + 13.3], 2.6, '#a44d71')
  for (const x of [-18, 18])
    for (const y of [17, 30]) {
      box([x, y, pz + 4.8], [8.3, 0.6, 0.4], 'trim')
    }
  for (let j = 0; j < 7; j++) window(-9 + j * 3, 37, pz + 8.7, 1.2, 2.8)
  for (const x of [-11, 11]) {
    cyl([x, 19, pz + 11], 0.5, 0.6, 18, 'trim', 8)
    dome([x, 29, pz + 11], 3.5, 3, 'blue')
  }
  for (let j = 0; j < 19; j++)
    add(new T.SphereGeometry(0.42, 6, 4), j % 2 ? 'gold' : 'pink', [-17 + j * 1.9, 36.8, pz + 13.4])
  for (let j = 0; j < 10; j++)
    window(
      Math.sin((j * tau) / 10) * 12,
      25,
      pz - 3 + Math.cos((j * tau) / 10) * 12,
      1.4,
      4,
      (j * tau) / 10,
    )
  // Looped bubble coaster rail, authored static: no fake rigid train movement.
  const coaster = new T.CatmullRomCurve3(
    Array.from({ length: 17 }, (_, i) => {
      const a = (i * tau) / 16
      return new T.Vector3(
        10 + Math.cos(a) * 45,
        42 + Math.sin(a * 2) * 14,
        -185 + Math.sin(a) * 27,
      )
    }),
    true,
  )
  add(new T.TubeGeometry(coaster, 140, 0.6, 6, true), 'roofLight', [0, 0, 0])
  for (let i = 0; i < 16; i++) {
    const p = coaster.getPoint(i / 16)
    beam([p.x, 10, p.z], p.toArray(), 0.5, 'trim')
  }
  // Wheel supports are baked; the rotating wheel and level pods are runtime instances.
  for (const z of [-189, -179]) {
    beam([6, 10, z], [23, 50, z], 1, 'blue')
    beam([40, 10, z], [23, 50, z], 1, 'blue')
  }
  // Tourist arcades and rental station, leaving the arrival pier uncluttered.
  for (let i = 0; i < 5; i++) {
    const x = 164 + (i % 3) * 10,
      z = -100 + Math.floor(i / 3) * 15
    town(x, z, 7, 9 + (i % 2) * 3, i % 2 ? 'peach' : 'stone', i % 2 ? 'pink' : 'blue')
    box([x, 14, z + 4.3], [7, 0.45, 3], 'pink')
    for (const dx of [-3, 3]) cyl([x + dx, 12, z + 5], 0.12, 0.14, 4, 'wood', 6)
  }
  plaque('BUBBLE TAXI', 137, 18, -68, 18)
  for (const x of [130, 137, 144]) {
    box([x, 11.5, -75], [4, 1, 2.6], 'wood')
    beam([x - 1.7, 12, -75], [x - 1.7, 15, -75], 0.1, 'gold')
    beam([x + 1.7, 12, -75], [x + 1.7, 15, -75], 0.1, 'gold')
  }
  for (const x of [129, 145]) lantern(x, 10, -65)
  // Sunny pier and separate Grove 42 remembrance pier: no duplicate ship.
  for (const {
    position: [x, z],
  } of L.piers) {
    for (let j = 0; j < 15; j++) box([x, 3.3, z + j * 1.1], [8, 0.65, 1.05], 'wood')
    for (const dx of [-3, 3])
      for (const dz of [0, 7, 14]) cyl([x + dx, 0.8, z + dz], 0.4, 0.5, 7, 'wood', 8)
    for (let j = 0; j < 10; j++) box([x, 3.6 + j * 0.67, z - 1 - j * 0.85], [8, 0.7, 0.88], 'stone')
    for (const dx of [-3, 3]) cyl([x + dx, 4.4, z + 12], 0.3, 0.4, 2, 'iron', 8)
  }
  // Side arm reaches clear anchorage beyond both neighbouring root platforms.
  for (let j = 0; j < 10; j++) box([206 + j * 1.05, 3.3, -48], [1, 0.65, 5], 'wood')
  for (const x of [208, 212, 216])
    for (const z of [-50, -46]) cyl([x, 0.8, z], 0.4, 0.5, 7, 'wood', 8)
  // Shipyards: open hull ribs, scaffold, crane, resin vats and timber supplies.
  town(155, 56, 12, 11, 'stone', 'roofLight')
  plaque('COATING', 155, 19, 62, 14)
  for (const x of [181, 189]) {
    for (const z of [43, 60]) cyl([x, 18, z], 0.45, 0.55, 16, 'wood', 8)
    beam([x, 26, 43], [x, 26, 60], 0.5, 'wood')
  }
  for (let j = 0; j < 9; j++) {
    const z = 47 + j * 1.5
    tube(
      [
        [179, 15, z],
        [181, 11.5, z],
        [185, 10.5, z],
        [189, 11.5, z],
        [191, 15, z],
      ],
      0.35,
      'wood',
      12,
    )
  }
  beam([174, 11, 68], [174, 35, 68], 1, 'iron')
  beam([174, 35, 68], [191, 35, 68], 0.8, 'iron')
  beam([174, 24, 68], [186, 35, 68], 0.5, 'iron')
  beam([191, 35, 68], [191, 17, 68], 0.12, 'iron')
  for (const x of [162, 168]) {
    cyl([x, 12, 66], 2, 2, 4, 'wood', 14)
    dome([x, 14, 66], 1.8, 0.4, 'gold')
  }
  for (let j = 0; j < 5; j++) box([179, 11 + j * 0.5, 71], [16, 0.45, 1.6], 'wood')
  // Illustrative Marine port and hotel town with distinct silhouettes.
  box([35, 22, 235], [38, 24, 19], 'stone')
  box([35, 35, 235], [41, 2, 22], 'trim')
  gable(35, 36, 235, 40, 9, 23, 'blue')
  for (const x of [17, 53]) {
    box([x, 26, 235], [8, 32, 10], 'stone')
    dome([x, 42, 235], 5, 7, 'blue')
    cyl([x, 51, 235], 0.15, 0.2, 5, 'iron', 6)
  }
  for (const x of [22, 29, 35, 41, 48]) for (const y of [15, 24]) window(x, y, 244.8, 2.3, 5)
  plaque('MARINE', 35, 32, 247, 18)
  steps(35, 7, 251, 15, 8, 0.5)
  for (let i = 0; i < 5; i++) {
    const x = -167 + i * 11,
      z = 90 - Math.sin(i * 0.8) * 9
    town(x, z, 10, 12 + (i % 3) * 4, 'stone', i % 2 ? 'pink' : 'blue')
    for (const dx of [-4, 4]) cyl([x + dx, 12, z + 5], 0.3, 0.3, 4, 'trim', 8)
  }
  plaque('HOTEL', -145, 31, 94, 14)
  // Lived-in streets and grove edges; props stay outside the hero forecourts.
  for (let i = 0; i < 6; i++)
    town(
      -149 + (i % 3) * 15,
      -91 + Math.floor(i / 3) * 17,
      8,
      8 + (i % 2) * 4,
      i % 2 ? 'peach' : 'stone',
      i % 2 ? 'roofLight' : 'roof',
    )
  for (const d of L.districts) {
    const [x, z] = d.center
    for (let i = 0; i < 8; i++) {
      const a = (i * tau) / 8
      shrub(x + Math.cos(a) * d.radius * 0.87, 11, z + Math.sin(a) * d.radius * 0.72, 2.1)
      if (i % 2 === 0)
        lantern(x + Math.cos(a) * d.radius * 0.7, 10, z + Math.sin(a) * d.radius * 0.6)
    }
    for (let j = 0; j < 3; j++) {
      const xx = x - 30 + j * 28,
        zz = z + 43
      box([xx, 11.2, zz], [5, 0.5, 1.7], 'wood')
      for (const dx of [-1.8, 1.8]) box([xx + dx, 10.6, zz], [0.3, 1.2, 1.4], 'iron')
      for (let k = 0; k < 8; k++) {
        const fx = xx - 4 + rand() * 3,
          fz = zz + rand() * 3
        cyl([fx, 10.8, fz], 0.05, 0.06, 1.3, 'leaf', 5)
        add(new T.IcosahedronGeometry(0.28, 0), k % 2 ? 'pink' : 'yellow', [fx, 11.5, fz])
      }
    }
  }
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
