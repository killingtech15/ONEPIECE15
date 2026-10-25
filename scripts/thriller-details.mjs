// Original nautical and environmental detail, informed by the inspected anime stills.
import * as T from 'three'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'

function rope(add, points, radius = 0.14, color = '#766b65', segments = 12) {
  const anchor = new T.Vector3(...points[0])
  const curve = new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p).sub(anchor)))
  add(new T.TubeGeometry(curve, segments, radius, 5, false), color, anchor.toArray())
}

export function buildSails({ add, box, cyl, beam, layer, font }) {
  layer('static')
  const sail = (x, y, z, w, h, emblem = false) => {
    const bow = w * 0.055
    const point = (u, v) => {
      const bottom = v < -0.48
      const notch = bottom && [3, 8, 17, 21].includes(Math.round((u + 0.5) * 24)) ? h * 0.075 : 0
      return [
        u * w,
        v * h + Math.cos(u * Math.PI) * (v < 0 ? h * 0.065 : -h * 0.025) + notch,
        Math.cos(u * Math.PI) * bow,
      ]
    }
    const g = new T.PlaneGeometry(w, h, 24, 12),
      p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setXYZ(i, ...point(p.getX(i) / w, p.getY(i) / h))
    g.computeVertexNormals()
    // Thin cloth has both faces; there is no invisible sail on the return journey.
    const back = g.clone(),
      indices = back.index.array
    for (let i = 0; i < indices.length; i += 3)
      [indices[i], indices[i + 2]] = [indices[i + 2], indices[i]]
    back.translate(0, 0, -0.13)
    back.computeVertexNormals()
    add(g, emblem ? '#373345' : '#c8bcad', [x, y, z])
    add(back, emblem ? '#373345' : '#b8afa3', [x, y, z])
    beam([x - w / 2 - 3, y + h / 2, z], [x + w / 2 + 3, y + h / 2, z], 0.7, 'wood')
    // Curved panel seams and hems follow the same cloth surface as the lettering.
    for (let j = 1; j < 12; j++) {
      const u = j / 12 - 0.5,
        points = []
      for (let k = 0; k <= 6; k++) {
        const p = point(u, k / 6 - 0.5)
        points.push([x + p[0], y + p[1], z + p[2] + 0.16])
      }
      rope(add, points, 0.065, emblem ? '#57505d' : '#918779', 6)
    }
    for (const v of [-0.5, 0.5]) {
      const points = []
      for (let j = 0; j <= 24; j++) {
        const p = point(j / 24 - 0.5, v)
        points.push([x + p[0], y + p[1], z + p[2] + 0.2])
      }
      rope(add, points, 0.1, emblem ? '#756976' : '#aa9882', 24)
    }
    const conform = (geo, color, depth = 0.27) => {
      const a = geo.attributes.position
      for (let i = 0; i < a.count; i++)
        a.setZ(i, a.getZ(i) + Math.cos((a.getX(i) / w) * Math.PI) * bow + depth)
      geo.computeVertexNormals()
      add(geo, color, [x, y, z])
    }
    const ink = (shape, color, depth = 0.27) =>
      conform(
        new T.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false, curveSegments: 10 }),
        color,
        depth,
      )
    if (emblem) {
      // Curved bat wings, horned skull and a toothy grin, authored as relief geometry.
      for (const s of [-1, 1]) {
        const wing = new T.Shape()
          .moveTo(s * 6, 5)
          .quadraticCurveTo(s * 14, 19, s * 39, 17)
          .quadraticCurveTo(s * 25, 7, s * 39, -14)
          .quadraticCurveTo(s * 25, -3, s * 24, -18)
          .quadraticCurveTo(s * 17, -8, s * 13, -18)
          .quadraticCurveTo(s * 10, -4, s * 6, -5)
          .closePath()
        ink(wing, '#d1c5b7')
        const horn = new T.Shape()
          .moveTo(s * 4, 6)
          .quadraticCurveTo(s * 12, 7, s * 7, 18)
          .quadraticCurveTo(s * 7, 11, s * 2, 11)
          .closePath()
        ink(horn, '#d1c5b7')
      }
      const skull = new T.Shape().absellipse(0, 2, 7, 8, 0, Math.PI * 2, false, 0)
      ink(skull, '#d1c5b7', 0.38)
      for (const s of [-1, 1]) {
        const eye = new T.Shape()
          .moveTo(s * 0.7, 4)
          .quadraticCurveTo(s * 5, 8, s * 5, 3)
          .quadraticCurveTo(s * 4, -1, s * 0.7, 4)
          .closePath()
        ink(eye, '#373345', 0.55)
      }
      const jaw = new T.Shape()
        .moveTo(-6, -4)
        .quadraticCurveTo(0, -9, 6, -4)
        .lineTo(5, -8)
        .quadraticCurveTo(0, -12, -5, -8)
        .closePath()
      ink(jaw, '#d1c5b7')
      for (let j = -3; j <= 3; j++) {
        const line = new T.Shape()
          .moveTo(j * 1.35 - 0.1, -5.5)
          .lineTo(j * 1.35 + 0.1, -5.5)
          .lineTo(j * 1.35 + 0.1, -9)
          .lineTo(j * 1.35 - 0.1, -9)
          .closePath()
        ink(line, '#373345', 0.55)
      }
      for (const s of [-1, 0, 1])
        ink(
          new T.Shape()
            .moveTo(s * 2 - 1, -9)
            .lineTo(s * 2 + 1, -9)
            .lineTo(s * 2, -15)
            .closePath(),
          '#d1c5b7',
        )
    } else if (w > 60 && h > 35) {
      for (const [word, yy] of [
        ['THRILLER', 3],
        ['BARK', -7],
      ]) {
        const text = new TextGeometry(word, {
          font,
          size: w * 0.084,
          depth: 0.07,
          curveSegments: 2,
          bevelEnabled: false,
        })
        text.computeBoundingBox()
        text.translate(-text.boundingBox.max.x / 2, yy, 0)
        conform(text, '#49434a', 0.4)
      }
    }
    // A few repaired cloth panels, avoiding the identifying center graphics.
    for (const [u, v] of [
      [-0.4, 0.25],
      [0.39, -0.25],
    ]) {
      const p = point(u, v)
      const patch = new T.PlaneGeometry(w * 0.055, h * 0.12, 2, 2)
      patch.translate(p[0], p[1], 0)
      conform(patch, emblem ? '#514858' : '#aea18e', 0.23)
      for (const s of [-1, 1]) {
        const p1 = point(u + s * 0.027, v - 0.06),
          p2 = point(u + s * 0.027, v + 0.06)
        rope(
          add,
          [
            [x + p1[0], y + p1[1], z + p1[2] + 0.4],
            [x + p2[0], y + p2[1], z + p2[2] + 0.4],
          ],
          0.075,
          '#72685d',
          1,
        )
      }
    }
    for (const s of [-1, 1])
      rope(
        add,
        [
          [x + s * w * 0.48, y + h * 0.5, z],
          [x + s * w * 0.53, y, z + 1],
          [x + s * w * 0.35, y - h * 0.64, z],
        ],
        0.15,
        '#796b57',
        10,
      )
  }
  const crow = (x, y, z, r) => {
    cyl([x, y, z], r, r, 1, 'wood', 20)
    for (let j = 0; j < 16; j++) {
      const a = (j * Math.PI) / 8
      cyl([x + Math.sin(a) * r, y + 1.4, z + Math.cos(a) * r], 0.13, 0.13, 2.8, 'iron', 5)
    }
    add(new T.TorusGeometry(r, 0.2, 5, 32), 'iron', [x, y + 2.8, z], [Math.PI / 2, 0, 0])
  }
  const pennant = (x, y, z, w) => {
    const shape = new T.Shape()
      .moveTo(0, 0)
      .quadraticCurveTo(w * 0.35, 3, w, 0)
      .lineTo(w * 0.7, -2)
      .lineTo(w, -4)
      .quadraticCurveTo(w * 0.3, -2, 0, -5)
      .closePath()
    const g = new T.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: false, curveSegments: 6 })
    add(g, '#363341', [x, y, z])
  }
  cyl([0, 165, -50], 2.3, 4, 110, 'wood', 20)
  sail(0, 161, -50, 112, 57, true)
  sail(0, 203, -50, 65, 25)
  crow(0, 119, -50, 6.5)
  pennant(0, 219, -50, 16)
  for (const s of [-1, 1]) {
    cyl([s * 139, 82, -46], 2, 3.5, 164, 'wood', 16)
    crow(s * 139, 88, -46, 6)
    sail(s * 139, 103, -46, 70, 42)
    sail(s * 139, 140, -46, 54, 28)
    pennant(s * 139, 164, -46, 13)
    for (const zz of [-76, 76])
      rope(
        add,
        [
          [s * 139, 157, -46],
          [s * 143, 75, (zz - 46) / 2],
          [s * 139, 14, zz],
        ],
        0.22,
        '#776b5e',
        16,
      )
    rope(
      add,
      [
        [0, 211, -50],
        [s * 30, 105, -110],
        [s * 51, 14, -150],
      ],
      0.22,
      '#776b5e',
      18,
    )
    // Ratlines beside each mast, separated from the central mansion silhouettes.
    for (let yy = 20; yy < 82; yy += 4)
      beam([s * 139 - 3, yy, -42], [s * 139 + 3, yy, -42], 0.13, 'wood')
    for (const xx of [-3, 3]) beam([s * 139 + xx, 16, -42], [s * 139 + xx, 86, -42], 0.15, 'iron')
  }
}

export function buildEnvironmentDetails({ add, box, cyl, beam, rand, layer }) {
  layer('static')
  const barrel = (x, y, z) => {
    cyl([x, y + 1, z], 0.9, 1, 2, 'wood', 10)
    for (const yy of [0.25, 1.65])
      add(new T.TorusGeometry(0.96, 0.09, 5, 10), 'iron', [x, y + yy, z], [Math.PI / 2, 0, 0])
  }
  // Planked landing, mooring hardware, stored supplies and a coiled line.
  for (let j = 0; j < 12; j++) box([-26.5 + j * 1.2, 1.68, 109], [0.07, 0.05, 8.5], '#594b47')
  for (const x of [-26, -14]) {
    cyl([x, 2.2, 111], 0.32, 0.4, 1, 'iron', 8)
    box([x, 2.65, 111], [1.8, 0.2, 0.3], 'iron')
  }
  barrel(-24, 1.7, 106.5)
  barrel(-22, 1.7, 106)
  box([-16, 2.6, 106], [2, 1.8, 2], 'wood')
  beam([-17, 1.7, 107.05], [-15, 3.5, 107.05], 0.12, 'gold')
  for (let j = 0; j < 3; j++)
    add(
      new T.TorusGeometry(0.8 - j * 0.17, 0.08, 5, 18),
      '#9b8b6d',
      [-17, 1.76 + j * 0.08, 110],
      [Math.PI / 2, 0, 0],
    )
  // Distinct aged grave details instead of identical pristine stones.
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 5; col++) {
      const x = 44 + col * 6.6,
        z = 22 + row * 6.5
      if ((row + col) % 3 === 0) {
        beam([x - 0.7, 12.9, z + 0.42], [x - 0.2, 12.4, z + 0.44], 0.08, '#575263')
        beam([x - 0.2, 12.4, z + 0.44], [x - 0.5, 11.6, z + 0.44], 0.08, '#575263')
      }
      if ((row + col) % 4 === 0) {
        box([x, 10.85, z + 1.6], [1.9, 0.15, 2.1], '#49464c')
        add(new T.BoxGeometry(2.2, 0.23, 2.5), 'stone', [x + 1.2, 11.2, z + 1.8], [0, 0.3, 0.5])
      }
      add(
        new T.IcosahedronGeometry(0.65, 0),
        '#646d60',
        [x - 1.3, 10.7, z],
        [0, rand(), 0],
        [1.4, 0.35, 1],
      )
    }
  // Masonry courses and narrow openings face outward from the inner fortifications.
  for (let j = 0; j < 40; j++) {
    const a = (j * Math.PI) / 20
    if (Math.cos(a) > 0.65 && Math.abs(Math.sin(a)) < 0.4) continue
    const x = Math.sin(a) * 99.8,
      z = Math.cos(a) * 91.8
    for (const yy of [12.6, 16.5]) box([x, yy, z], [5.3, 0.15, 0.22], '#746c7d', a)
    if (j % 2 === 0) box([x, 17.5, z], [1.2, 3, 0.24], '#4e4c5b', a)
    for (let k = 0; k < 3; k++) {
      const dx = Math.cos(a) * k * 0.9,
        dz = -Math.sin(a) * k * 0.9
      add(
        new T.IcosahedronGeometry(0.75, 0),
        '#576756',
        [x + dx, 13 + k * 1.3, z + dz],
        [0, k, 0],
        [0.8, 1, 0.35],
      )
    }
  }
  // Weathered outer hull fasteners and chainside mooring rings.
  for (let j = 4; j < 116; j += 2) {
    const a = (j / 120) * Math.PI * 2,
      x = Math.sin(a) * 163.2,
      z = Math.cos(a) * 163.2
    for (const yy of [3, 9]) add(new T.SphereGeometry(0.23, 6, 4), 'iron', [x, yy, z])
    if (j % 8 === 0) add(new T.TorusGeometry(1.8, 0.25, 5, 12), 'iron', [x, 12, z], [0, a, 0])
  }
  // Quietly weathered edge props, preserving the two open event clearings.
  for (const [x, z] of [
    [-69, -39],
    [-61, -66],
    [72, -59],
    [66, -71],
    [-76, 10],
  ]) {
    cyl([x, 11.1, z], 1.4, 1.7, 2.2, 'stone', 8)
    add(new T.CylinderGeometry(0.9, 1, 5, 8), 'stone', [x + 2, 11, z + 2], [0, 0.4, 1.3])
    for (let j = 0; j < 4; j++)
      add(new T.DodecahedronGeometry(0.6 + rand() * 0.5, 0), 'rock', [
        x - 2 + rand() * 4,
        10.7,
        z - 2 + rand() * 4,
      ])
  }
  // Fallen trunks and mushrooms stay beside the carriage road, outside camera corridors.
  for (const [x, z] of [
    [-66, 47],
    [-61, 16],
    [-38, 67],
    [79, -3],
    [48, 64],
  ]) {
    beam([x, 11, z], [x + 5, 11.8, z + 2], 1.1, 'wood')
    beam([x + 2, 11.4, z + 1], [x + 2, 13.7, z - 1], 0.3, 'wood')
    for (let j = 0; j < 4; j++) {
      const xx = x - 2 + j * 0.7,
        zz = z + 3 + Math.sin(j)
      cyl([xx, 10.7, zz], 0.12, 0.15, 1, 'trim', 6)
      add(
        new T.SphereGeometry(0.5, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
        '#8c6876',
        [xx, 11.2, zz],
        [0, 0, 0],
        [1, 0.6, 1],
      )
    }
  }
}
