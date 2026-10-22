// Original rescue-era diorama. Distances are authored, not canonical coordinates.
import * as T from 'three'
import { readFileSync } from 'node:fs'
const layout = JSON.parse(readFileSync(new URL('../src/enies-layout.json', import.meta.url)))

export function buildCity({ add, box, cyl, sign, beam, rand }) {
  const blockout = process.argv.includes('--blockout')
  const keyhole = (w, h) =>
    new T.Shape()
      .moveTo(-w * 0.27, 0)
      .lineTo(w * 0.27, 0)
      .lineTo(w * 0.27, h * 0.46)
      .bezierCurveTo(w * 0.67, h * 0.65, w * 0.57, h, 0, h)
      .bezierCurveTo(-w * 0.57, h, -w * 0.67, h * 0.65, -w * 0.27, h * 0.46)
      .closePath()
  const slab = (shape, depth, c, p) =>
    add(new T.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 }), c, p)
  const rect = (w, h) =>
    new T.Shape()
      .moveTo(-w / 2, 0)
      .lineTo(w / 2, 0)
      .lineTo(w / 2, h)
      .lineTo(-w / 2, h)
      .closePath()
  const openingWall = (x, y, z, w, h, d, ow, oh, c = 'trim') => {
    const shape = rect(w, h)
    shape.holes.push(new T.Path(keyhole(ow, oh).getPoints(24)))
    slab(shape, d, c, [x, y, z - d / 2])
  }
  const window = (x, y, z, w, h) => {
    slab(keyhole(w + 0.5, h + 0.4), 0.16, 'trim', [x, y - 0.2, z])
    slab(keyhole(w, h), 0.18, 'dark', [x, y, z + 0.17])
    box([x, y + h * 0.4, z + 0.4], [0.13, h * 0.75, 0.14], 'gold')
  }
  const panel = (x, y, z, w, h) => {
    box([x, y, z], [w + 0.4, h + 0.4, 0.2], 'gold')
    box([x, y, z + 0.13], [w, h, 0.2], 'jade')
    if (!blockout) {
      for (let row = 0; row < Math.floor(h / 2); row++)
        for (let col = 0; col < Math.floor(w / 2.6); col++) {
          const px = x - w / 2 + 1.3 + col * 2.6,
            py = y - h / 2 + 1 + row * 2
          add(
            new T.PlaneGeometry(0.7, 1.1),
            (row + col) % 3 ? 'jadeDark' : 'leaf',
            [px, py, z + 0.24],
            [0, 0, (row % 2 ? 1 : -1) * 0.5],
          )
        }
    }
  }
  const crenels = (x, y, z, w, d) => {
    for (let i = 0; i <= Math.floor(w / 3.2); i++)
      for (const s of [-1, 1])
        box(
          [x - w / 2 + (i * w) / Math.floor(w / 3.2), y, z + (s * d) / 2],
          [1.6, 1.6, 1.2],
          'trim',
        )
    for (let i = 1; i < Math.floor(d / 3.2); i++)
      for (const s of [-1, 1])
        box(
          [x + (s * w) / 2, y, z - d / 2 + (i * d) / Math.floor(d / 3.2)],
          [1.2, 1.6, 1.6],
          'trim',
        )
  }
  const railing = (x, y, z, w) => {
    box([x, y + 1.3, z], [w, 0.22, 0.3], 'trim')
    for (let i = 0; i <= Math.floor(w / 1.2); i++)
      box([x - w / 2 + (i * w) / Math.floor(w / 1.2), y + 0.65, z], [0.18, 1.3, 0.18], 'trim')
  }
  const stairs = (x, y, z, w, n, rise, run) => {
    for (let i = 0; i < n; i++)
      box([x, y + ((i + 1) * rise) / 2, z - i * run], [w, (i + 1) * rise, run + 0.04], 'trim')
  }
  const land = (x, z, rx, rz, top, depth, seed) => {
    const n = 64,
      vertices = [],
      colors = [],
      indices = []
    const color = new T.Color()
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2,
          wobble = 1 + 0.035 * Math.sin(a * 7 + seed) + 0.02 * Math.cos(a * 13)
        const scale = row === 0 ? 1 : row === 1 ? 0.96 : 0.58
        vertices.push(
          x + Math.cos(a) * rx * wobble * scale,
          row === 0 ? top : row === 1 ? top - depth * 0.5 : top - depth,
          z + Math.sin(a) * rz * wobble * scale,
        )
        color.set(row === 0 ? '#b5b39c' : row === 1 ? '#968b74' : '#685f56')
        colors.push(color.r, color.g, color.b)
      }
    for (let row = 0; row < 2; row++)
      for (let i = 0; i < n; i++) {
        const a = row * n + i,
          b = row * n + ((i + 1) % n),
          c = a + n,
          d = b + n
        indices.push(a, b, c, b, d, c)
      }
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3))
    g.setIndex(indices)
    g.computeVertexNormals()
    add(g, 'rock')
    const cap = new T.Shape()
    for (let i = 0; i < n; i++) {
      const a = (-i / n) * Math.PI * 2,
        wobble = 1 + 0.035 * Math.sin(-a * 7 + seed) + 0.02 * Math.cos(a * 13)
      const xx = Math.cos(a) * rx * wobble,
        yy = Math.sin(a) * rz * wobble
      i ? cap.lineTo(xx, yy) : cap.moveTo(xx, yy)
    }
    cap.closePath()
    add(new T.ShapeGeometry(cap), 'grass', [x, top + 0.03, z], [-Math.PI / 2, 0, 0])
    // Distinct vertical rock flutes make the unsupported underside readable.
    if (!blockout)
      for (let i = 0; i < 42; i++) {
        const a = (i / 42) * Math.PI * 2,
          r = 0.96
        cyl(
          [x + Math.cos(a) * rx * r, top - depth * 0.35, z + Math.sin(a) * rz * r],
          1.5,
          1,
          depth * 0.7,
          'stone',
          5,
        )
      }
  }
  const tree = (x, y, z, s = 1) => {
    cyl([x, y + 2 * s, z], 0.3 * s, 0.5 * s, 4 * s, 'wood', 6)
    add(new T.IcosahedronGeometry(2.5 * s, 1), 'leaf', [x, y + 5 * s, z], [0, x, 0], [1, 1.1, 0.85])
  }
  const gate = (x, y, z, w, h) => {
    openingWall(x, y, z, w, h, 5, w * 0.32, h * 0.75)
    openingWall(x, y + 0.7, z + 2.65, w - 3, h - 2, 0.18, w * 0.36, h * 0.77, 'jade')
    for (const s of [-1, 1]) {
      cyl([x + s * (w / 2 - 2), y + h / 2, z], 3.2, 3.2, h + 2, 'trim', 20)
      for (const yy of [2, h * 0.55, h])
        cyl([x + s * (w / 2 - 2), y + yy, z], 3.5, 3.5, 0.6, 'gold', 20)
      window(x + s * w * 0.3, y + 1, z + 2.85, w * 0.065, h * 0.38)
      box([x + s * w * 0.32, y + h + 2.5, z], [4, 4, 4], 'trim')
      add(
        new T.ConeGeometry(3.2, 4, 4),
        'jade',
        [x + s * w * 0.32, y + h + 6, z],
        [0, Math.PI / 4, 0],
      )
    }
    box([x, y + h, z], [w + 1, 0.8, 6], 'trim')
    crenels(x, y + h + 1, z, w, 6)
    for (const s of [-1, 1]) {
      box([x + s * (w * 0.58), y + h * 0.28, z - 1], [w * 0.18, h * 0.56, 7], 'trim')
      panel(x + s * w * 0.58, y + h * 0.3, z + 2.6, w * 0.12, h * 0.32)
    }
  }

  // Separate entrance, town and judicial platform. None fills the surrounding void.
  land(0, 225, 44, 40, 8, 25, 1)
  land(0, 0, 65, 76, 18, 60, 2)
  land(0, -145, 33, 29, 18, 43, 3)
  // Narrow, sloping causeway from the entrance to the central island.
  beam([0, 7, 187], [0, 17, 72], 12, 'stone')
  for (const s of [-1, 1]) beam([s * 5.7, 8.5, 187], [s * 5.7, 18.5, 72], 0.6, 'trim')
  box([0, 18.08, 0], [17, 0.18, 140], 'stone')
  box([0, 18.16, -27], [65, 0.2, 26], 'stone')
  for (const s of [-1, 1])
    for (let z = -27; z < 58; z += 13) {
      box([s * 10, 18.2, z], [1, 0.2, 10], 'trim')
    }
  gate(0, 8, 222, 58, 24)
  gate(0, 18, 65, 54, 26)
  // Station: a modest platform, diamond frieze and green canopy inspired by the overview.
  box([0, 3.2, 269], [50, 3, 12], 'stone')
  box([0, 4.8, 269], [51, 0.45, 13], 'trim')
  for (let x = -22; x <= 22; x += 5.5) {
    cyl([x, 8.8, 268], 0.22, 0.3, 8, 'iron', 8)
  }
  box([0, 13, 268], [52, 0.5, 13], 'jade')
  for (let x = -22; x <= 22; x += 4)
    add(new T.PlaneGeometry(2.5, 2.5), 'gold', [x, 3.5, 275.1], [0, 0, Math.PI / 4])
  sign('DAY STATION', [0, 10.4, 274.9], 1.15)
  for (const s of [-1, 1]) box([s * 2.1, 1.5, 310], [0.22, 0.25, 80], 'iron')
  for (let z = 278; z < 350; z += 3) box([0, 1.22, z], [6, 0.25, 0.7], 'wood')
  stairs(0, 1, 261, 16, 10, 0.7, 0.9)
  // Entry and main island grounds.
  for (const s of [-1, 1])
    for (let i = 0; i < 5; i++) tree(s * (21 + (i % 2) * 7), 8, 200 + i * 11, 0.65)

  // Varied town blocks with a clear central avenue and forecourt.
  if (!blockout)
    for (const side of [-1, 1])
      for (let row = 0; row < 5; row++)
        for (let col = 0; col < 3; col++) {
          const x = side * (21 + col * 14),
            z = 43 - row * 16,
            w = 9 + rand() * 2,
            d = 10 + rand() * 2,
            h = 7 + rand() * 11
          if ((x * x) / 3900 + (z * z) / 4800 > 0.9) continue
          const c = ['peach', 'stone', 'yellow', 'pink'][(row + col) % 4]
          box([x, 18 + h / 2, z], [w, h, d], c)
          box([x, 18 + h + 0.4, z], [w + 0.5, 0.8, d + 0.5], 'stone')
          crenels(x, 18 + h + 1, z, w, d)
          const levels = Math.floor(h / 3)
          for (let level = 0; level < levels; level++)
            for (let k = -1; k <= 1; k++) {
              box([x + k * w * 0.28, 20 + level * 3, z + d / 2 + 0.02], [1, 1.6, 0.08], 'dark')
              box([x + k * w * 0.28, 19 + level * 3, z + d / 2 + 0.15], [1.4, 0.2, 0.35], 'trim')
            }
          box([x, 19.5, z + d / 2 + 0.04], [1.8, 3, 0.1], 'wood')
          if (col === 0) box([x, 21.8, z + d / 2 + 1.5], [w, 0.25, 3], 'roof')
        }

  // Broad courthouse: roof stage, paired side towers and an actual central opening.
  gate(0, 18, -53, 68, 28)
  for (const s of [-1, 1]) box([s * 25, 31, -60], [18, 26, 25], 'trim')
  box([0, 45, -60], [70, 2, 30], 'trim')
  box([0, 46.2, -60], [64, 0.4, 26], 'jade')
  crenels(0, 47.3, -60, 69, 29)
  for (const s of [-1, 1]) {
    cyl([s * 29, 38, -71], 4, 4, 40, 'trim', 20)
    cyl([s * 29, 55, -71], 4.4, 4.4, 1, 'gold', 20)
    add(new T.ConeGeometry(4.4, 6, 6), 'jade', [s * 29, 60, -71])
    window(s * 29, 40, -66.8, 2.8, 8)
    box([s * 29, 49, -66.5], [3, 0.4, 2], 'wood')
  }
  // Extended courthouse drawbridge: distinct deck and hinge axis, clear of the rock edges.
  box([0, 19, -99], [12, 1.4, 48], 'wood')
  for (const s of [-1, 1]) {
    box([s * 5.6, 20.2, -99], [0.35, 1.3, 48], 'iron')
    beam([s * 5.8, 37, -74], [s * 5.8, 20, -121], 0.18, 'iron')
  }
  for (let z = -120; z < -76; z += 2) box([0, 19.75, z], [11.6, 0.12, 0.12], 'iron')

  // Tower of Justice: stepped massing, flanking turrets, inset panels and ornate balconies.
  box([0, 30, -145], [57, 24, 43], 'trim')
  box([0, 51, -145], [43, 20, 34], 'trim')
  box([0, 75, -145], [37, 28, 31], 'trim')
  box([0, 96, -145], [34, 14, 29], 'trim')
  for (const [y, w, d] of [
    [18, 59, 45],
    [42, 59, 45],
    [60, 45, 36],
    [90, 40, 34],
    [104, 37, 32],
  ]) {
    box([0, y, -145], [w, 1, d], 'trim')
    box([0, y + 0.7, -145], [w - 0.7, 0.4, d - 0.7], 'gold')
  }
  panel(0, 30, -123.35, 52, 19)
  window(0, 18, -123.04, 15, 20)
  for (const s of [-1, 1]) {
    cyl([s * 24, 31, -125], 3, 3, 26, 'trim', 20)
    crenels(s * 24, 44.4, -125, 5, 5)
    window(s * 19, 21, -123.03, 3, 10)
    panel(s * 13, 75, -129.24, 8, 25)
    cyl([s * 20, 75, -130], 1.5, 1.5, 29, 'trim', 16)
    for (const y of [62, 89]) cyl([s * 20, y, -130], 1.8, 1.8, 0.5, 'gold', 16)
    stairs(s * 25, 18, -119, 5, 14, 1.55, 0.8)
  }
  panel(0, 75, -129.24, 8, 25)
  panel(0, 52, -127.8, 37, 14)
  for (let x = -15; x <= 15; x += 6) window(x, 43, -127.5, 3, 10)
  window(0, 62, -128.95, 5.5, 15)
  panel(0, 99, -130.34, 29, 6)
  sign('ENIES LOBBY', [0, 93, -130.1], 2)
  for (let x = -12; x <= 12; x += 6) window(x, 90, -130.2, 2.5, 3)
  // Side elevations retain ornament when the route orbits the tower.
  for (const s of [-1, 1]) {
    for (const [y, h, x, d] of [
      [31, 18, 28.6, 39],
      [51, 14, 21.6, 30],
      [75, 24, 18.6, 27],
      [96, 10, 17.1, 25],
    ]) {
      box([s * x, y, -145], [0.18, h + 0.5, d], 'gold')
      box([s * (x + 0.13), y, -145], [0.15, h, d - 0.8], 'jade')
      for (let z = -145 - d / 2 + 3; z < -145 + d / 2; z += 6) {
        box([s * (x + 0.23), y - 1, z], [0.12, h * 0.6, 2], 'dark')
        box([s * (x + 0.3), y - h * 0.3 - 1, z], [0.4, 0.3, 2.8], 'trim')
      }
    }
  }
  box([0, 60.8, -125.4], [44, 1, 9], 'trim')
  railing(0, 61.4, -120.7, 44)
  for (const y of [42, 90]) railing(0, y + 1, -127, 39)
  for (const x of [-20, 20])
    for (const z of [-160, -130]) {
      cyl([x, 92, z], 2.2, 2.2, 7, 'trim', 16)
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2
        box([x + Math.cos(a) * 1.8, 96, z + Math.sin(a) * 1.8], [1, 1, 1], 'trim')
      }
    }
  // Courtyard and passage mouth at the back of the tower island.
  box([0, 18.2, -169], [16, 0.5, 8], 'stone')
  openingWall(0, 2, -172, 13, 16, 7, 6, 12)
  stairs(0, 0, -177, 8, 12, 1.4, -0.6)

  // Underwater-route emergence and supported Bridge of Hesitation.
  for (const z of [-239, -287, -337]) {
    cyl([0, 0, z], 7.5, 8.5, 32, 'trim', 32)
    cyl([0, 15, z], 8.2, 8.2, 1.2, 'gold', 32)
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      box([Math.cos(a) * 7.6, 16.5, z + Math.sin(a) * 7.6], [0.5, 2, 0.5], 'iron')
    }
  }
  window(0, 3, -231, 5, 10)
  for (const z of [-263, -312]) {
    box([0, 14, z], [10, 1.5, 49], 'trim')
    for (const s of [-1, 1]) {
      box([s * 4.8, 16, z], [0.35, 2.5, 49], 'trim')
      // An open supporting arch spans between the cylindrical piers.
      const arc = new T.TorusGeometry(23, 1.1, 6, 32, Math.PI)
      add(arc, 'trim', [s * 4, -4, z], [0, Math.PI / 2, 0], [1, 0.7, 1])
    }
  }
  box([0, 13, -345], [10, 1.5, 16], 'wood')
  for (const s of [-1, 1]) cyl([s * 5.5, 14, -337], 0.8, 0.8, 2, 'iron', 12)

  // Gates: two separate, thick leaves with a shared domed silhouette and central seam.
  for (const s of [-1, 1]) {
    const shape = new T.Shape()
      .moveTo(s * 0.45, -4)
      .lineTo(s * 160, -4)
      .lineTo(s * 160, 120)
    for (let i = 0; i <= 48; i++) {
      const a = ((i / 48) * Math.PI) / 2
      shape.lineTo(s * Math.cos(a) * 160, 120 + Math.sin(a) * 160)
    }
    shape.lineTo(s * 0.45, -4).closePath()
    slab(shape, 8, 'gate', [0, 0, -355])
    // Raised outer border, just enough geometry to hold silhouette at close range.
    const points = []
    for (let i = 0; i <= 48; i++) {
      const a = ((i / 48) * Math.PI) / 2
      points.push(new T.Vector3(s * Math.cos(a) * 151, 120 + Math.sin(a) * 151, -346.6))
    }
    add(new T.TubeGeometry(new T.CatmullRomCurve3(points), 48, 1.2, 6, false), 'iron')
    box([s * 151, 60, -346.5], [2.4, 120, 1.4], 'iron')
    for (let i = 0; i < 22; i++) {
      const a = ((i / 21) * Math.PI) / 2,
        px = s * Math.cos(a) * 142,
        py = 120 + Math.sin(a) * 142
      add(new T.SphereGeometry(1.2, 8, 6), 'iron', [px, py, -346.3], [0, 0, 0], [1, 1, 0.45])
    }
    box([s * 2, 136, -346.3], [0.7, 270, 1], 'iron')
  }
  const emblemZ = -346.6
  for (const [x, y] of [
    [0, 174],
    [-57, 174],
    [57, 174],
    [0, 117],
    [0, 231],
  ])
    add(new T.CylinderGeometry(16, 16, 0.65, 48), 'dark', [x, y, emblemZ], [Math.PI / 2, 0, 0])
  box([0, 174, emblemZ + 0.7], [114, 8, 0.6], 'dark')
  box([0, 174, emblemZ + 0.7], [8, 114, 0.6], 'dark')
  // Reassert the seam through the emblem, preventing the two leaves reading as one slab.
  box([0, 140, -344.7], [0.9, 280, 0.25], 'iron')
  for (const [x, y, z] of layout.flags) cyl([x, y + 4, z], 0.13, 0.18, 8, 'iron', 8)
  if (!blockout) {
    for (const s of [-1, 1])
      for (let i = 0; i < 4; i++) tree(s * (48 - i * 3), 18, 45 - i * 20, 0.8)
    // Forecourt paving and facade relief supply detail without filling public spaces.
    for (let x = -28; x <= 28; x += 7)
      for (let z = -35; z <= -16; z += 6) box([x, 18.31, z], [5.5, 0.04, 4.8], 'trim')
    for (let x = -24; x <= 24; x += 8) box([x, 18.3, -145], [5, 0.1, 5], 'stone')
  }
}
