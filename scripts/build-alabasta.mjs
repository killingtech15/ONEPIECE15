// Original geometry, composed from the anime references in docs/ART-DIRECTION.md.
// Coordinates use Three.js Y-up. Layout is intentionally compressed as a diorama.
import * as T from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { mkdir, writeFile } from 'node:fs/promises'

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((v) => {
      this.result = v
      this.onloadend?.()
    })
  }
}
const scene = new T.Scene()
const palette = {
  chalk: '#f5edd5',
  cream: '#e3d3af',
  mint: '#7bbba5',
  rose: '#bf767c',
  gold: '#e2b64d',
  goldShade: '#af7e39',
  blue: '#86acb6',
  purple: '#a0a1bb',
  green: '#a9bb77',
  sand: '#e4c18c',
  ochre: '#d2a36f',
  rock: '#bb815d',
  rockLight: '#d4a179',
  rockDark: '#a96e52',
  dark: '#3b5964',
  wood: '#70513d',
  leaf: '#527e61',
  leafLight: '#769a69',
  water: '#62b3af',
  red: '#b65a43',
}
const batches = new Map(Object.keys(palette).map((k) => [k, []]))
let seed = 15015
const rand = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return seed / 4294967296
}
function add(geometry, color, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  const m = new T.Matrix4().compose(
    new T.Vector3(...p),
    new T.Quaternion().setFromEuler(new T.Euler(...r)),
    new T.Vector3(...s),
  )
  geometry.applyMatrix4(m)
  const g = geometry.index ? geometry.toNonIndexed() : geometry
  if (!g.getAttribute('uv'))
    g.setAttribute(
      'uv',
      new T.BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2),
    )
  batches.get(color).push(g)
}
const box = (p, s, c, r = [0, 0, 0]) => add(new T.BoxGeometry(...s), c, p, r)
const cyl = (p, rt, rb, h, c, n = 24) => add(new T.CylinderGeometry(rt, rb, h, n), c, p)
const sphere = (p, s, c) => add(new T.SphereGeometry(1, 16, 10), c, p, [0, 0, 0], s)
function arch(x, y, z, w, h, c, depth = 0.06) {
  const sh = new T.Shape()
  sh.moveTo(-w / 2, 0)
  sh.lineTo(w / 2, 0)
  sh.lineTo(w / 2, h * 0.6)
  sh.quadraticCurveTo(w * 0.42, h * 0.87, 0, h)
  sh.quadraticCurveTo(-w * 0.42, h * 0.87, -w / 2, h * 0.6)
  sh.closePath()
  add(new T.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 5 }), c, [x, y, z])
}
function dome(x, y, z, r, c) {
  const pts = [
    [0.93, 0],
    [1, 0.15],
    [1.07, 0.4],
    [1, 0.7],
    [0.81, 1.02],
    [0.52, 1.28],
    [0.16, 1.5],
    [0, 1.68],
  ].map(([a, b]) => new T.Vector2(a * r, b * r))
  add(new T.LatheGeometry(pts, 24), c, [x, y, z])
  cyl([x, y + 0.06, z], r * 1.01, r * 1.01, 0.15, 'goldShade')
  cyl([x, y + r * 1.83, z], 0.025, 0.06, r * 0.42, 'gold', 8)
  sphere([x, y + r * 1.7, z], [0.09, 0.09, 0.09], 'gold')
}
function tower(x, z, y = 8, h = 5, r = 0.55, c = 'gold') {
  cyl([x, y + h * 0.5, z], r * 0.83, r, h, 'chalk')
  for (const d of [0.15, 0.58, 0.83]) cyl([x, y + h * d, z], r * 1.12, r * 1.12, 0.18, 'mint')
  cyl([x, y + h, z], r * 1.3, r * 1.1, 0.25, 'chalk')
  dome(x, y + h + 0.12, z, r * 1.06, c)
  arch(x, y + h * 0.63, z + r * 0.87, 0.3, h * 0.2, 'dark')
}
function palms(x, z, y = 2, scale = 1) {
  cyl([x, y + 1.6 * scale, z], 0.12 * scale, 0.23 * scale, 3.2 * scale, 'wood', 8)
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7
    const g = new T.BufferGeometry()
    const verts = []
    for (let j = 0; j < 5; j++) {
      const t = j / 4,
        tn = (j + 1) / 4
      const point = (u, side) => [
        Math.cos(a) * u * 2.3 * scale - Math.sin(a) * Math.sin(u * Math.PI) * 0.34 * side * scale,
        Math.sin(u * Math.PI) * 0.65 * scale - u * 0.5 * scale,
        Math.sin(a) * u * 2.3 * scale + Math.cos(a) * Math.sin(u * Math.PI) * 0.34 * side * scale,
      ]
      if (j < 4)
        verts.push(
          ...point(t, -1),
          ...point(t, 1),
          ...point(tn, 1),
          ...point(t, -1),
          ...point(tn, 1),
          ...point(tn, -1),
        )
    }
    g.setAttribute('position', new T.Float32BufferAttribute(verts, 3))
    g.computeVertexNormals()
    add(g, i % 2 ? 'leaf' : 'leafLight', [x, y + 3.2 * scale, z])
  }
}

// Broad coastline and sculpted dunes. Rings converge beneath the waterline.
const ring = 112,
  radial = 18,
  vertices = [],
  uv = [],
  indices = []
for (let j = 0; j <= radial; j++)
  for (let i = 0; i <= ring; i++) {
    const a = (i / ring) * Math.PI * 2,
      t = j / radial
    const edge = 1 + 0.055 * Math.sin(a * 5) + 0.035 * Math.sin(a * 9 + 1)
    const x = Math.cos(a) * 43 * t * edge,
      z = Math.sin(a) * 31 * t * edge
    let y = 1.65 + Math.sin(x * 0.19 + z * 0.12) * 0.45 + Math.sin(z * 0.28 - x * 0.08) * 0.35
    y += Math.pow(Math.max(0, Math.sin(x * 0.14 + z * 0.19)), 3) * 1.3
    y = y * (1 - Math.pow(t, 12)) - 0.85 * Math.pow(t, 16)
    vertices.push(x, y, z)
    uv.push(i / ring, j / radial)
    if (j < radial && i < ring) {
      const n = j * (ring + 1) + i
      indices.push(n, n + ring + 1, n + 1, n + 1, n + ring + 1, n + ring + 2)
    }
  }
const terrain = new T.BufferGeometry()
terrain.setAttribute('position', new T.Float32BufferAttribute(vertices, 3))
terrain.setAttribute('uv', new T.Float32BufferAttribute(uv, 2))
terrain.setIndex(indices)
terrain.computeVertexNormals()
add(terrain, 'sand')

// Alubarna's layered escarpment, its top and its surrounding cliff buttresses.
const cx = 6,
  cz = -4
cyl([cx, 4.4, cz], 14.8, 17, 7.2, 'rock', 64)
cyl([cx, 7.95, cz], 14.8, 14.9, 0.25, 'sand', 64)
for (let i = 0; i < 92; i++) {
  const a = (i / 92) * Math.PI * 2,
    r = 15.1 + rand() * 0.7,
    h = 4 + rand() * 3
  if (Math.abs(a - Math.PI / 2) < 0.15) continue
  add(
    new T.CylinderGeometry(0.45 + rand() * 0.35, 0.7 + rand() * 0.5, h, 5),
    ['rock', 'rockLight', 'rockDark'][i % 3],
    [cx + Math.cos(a) * r, 4.5, cz + Math.sin(a) * r],
    [0, a, 0],
    [1, 1, 0.7],
  )
}
// A low perimeter wall with regular parapet blocks and four approach gates.
for (let i = 0; i < 80; i++) {
  const a = (i / 80) * Math.PI * 2
  if (Math.abs(Math.cos(a)) < 0.11 || Math.abs(Math.sin(a)) < 0.11) continue
  const x = cx + Math.cos(a) * 14.25,
    z = cz + Math.sin(a) * 14.25
  box([x, 8.8, z], [1.25, 1.7, 0.45], 'chalk', [0, -a + Math.PI / 2, 0])
  box([x, 9.8, z], [0.5, 0.4, 0.5], 'cream', [0, -a + Math.PI / 2, 0])
}
// Main entrance staircase (southern gate); individually modeled treads.
for (let i = 0; i < 48; i++) {
  const t = i / 48
  box([cx, 1.4 + t * 6.8, 22.5 - t * 12], [3.1, 0.22, 0.31], 'chalk')
}
for (const dx of [-1.8, 1.8]) {
  box([cx + dx, 5.6, 16.5], [0.35, 0.45, 14], 'mint', [Math.atan(6.8 / 12), 0, 0])
  tower(cx + dx, 10.7, 8, 3, 0.48, 'blue')
}
// The royal terrace, ornamented wall and three-dome palace.
box([cx, 10.2, -8.5], [11, 4.4, 7.8], 'chalk')
box([cx, 12.45, -8.5], [11.4, 0.32, 8.15], 'mint')
box([cx, 12.7, -8.5], [11.7, 0.22, 8.3], 'chalk')
for (let i = 0; i < 7; i++) {
  const x = cx - 4.65 + i * 1.55
  box([x, 10.6, -4.52], [1.26, 2.75, 0.07], 'rose')
  box([x - 0.69, 10.6, -4.43], [0.2, 3.4, 0.2], 'mint')
  arch(x, 9.05, -4.41, 0.8, 2.25, 'chalk')
  arch(x, 9.12, -4.32, 0.48, 1.75, 'dark')
}
for (const x of [cx - 5.35, cx + 5.35])
  for (const z of [-4.7, -12.3]) {
    cyl([x, 10.5, z], 0.63, 0.7, 4.9, 'chalk')
    cyl([x, 12.7, z], 0.75, 0.75, 0.4, 'mint')
    for (let k = 0; k < 8; k++) {
      let a = (k / 8) * Math.PI * 2
      box([x + Math.cos(a) * 0.58, 13.05, z + Math.sin(a) * 0.58], [0.25, 0.45, 0.25], 'chalk')
    }
  }
for (let i = 0; i < 22; i++) box([cx - 5.2 + i * 0.5, 13.03, -4.55], [0.23, 0.5, 0.35], 'chalk')
box([cx, 14.2, -9.4], [6.9, 3, 4.5], 'chalk')
box([cx, 15.75, -9.4], [7.3, 0.2, 4.7], 'mint')
for (let i = 0; i < 9; i++) arch(cx - 3 + i * 0.75, 13.5, -7.12, 0.33, 1.15, 'dark')
for (let i = 0; i < 18; i++) box([cx - 3.4 + i * 0.4, 15.97, -7.14], [0.18, 0.35, 0.28], 'chalk')
cyl([cx, 16.4, -9.5], 1.85, 1.85, 1.1, 'chalk')
dome(cx, 16.95, -9.5, 1.9, 'gold')
for (const x of [cx - 2.65, cx + 2.65]) {
  cyl([x, 16.1, -9.5], 1.1, 1.1, 0.9, 'chalk')
  dome(x, 16.55, -9.5, 1.13, 'gold')
}
tower(cx - 4.5, -11, 12.8, 7, 0.35, 'chalk')
// Palace staircase & courtyard garden.
for (let i = 0; i < 26; i++) box([cx, 8.1 + i * 0.175, -0.4 - i * 0.145], [2.1, 0.18, 0.2], 'chalk')
for (const dx of [-3.8, 3.8]) {
  box([cx + dx, 13, -7.6], [1.5, 0.12, 2.1], 'leaf')
  palms(cx + dx, -7.6, 13, 0.55)
}
// A densely composed town: roads remain open and landmarks retain breathing room.
for (let i = 0; i < 135; i++) {
  const a = rand() * Math.PI * 2,
    r = 4.5 + rand() * 8.8,
    x = cx + Math.cos(a) * r,
    z = cz + Math.sin(a) * r
  if (z < -3 && Math.abs(x - cx) < 6.3) continue
  if (Math.abs(x - cx) < 2 && z > -0.5) continue
  if (Math.hypot(x + 1, z - 3) < 2.3) continue
  const w = 0.75 + rand() * 0.85,
    d = 0.7 + rand() * 1.0,
    h = 1 + rand() * 2.0
  const wall = i % 4 === 0 ? 'cream' : 'chalk'
  box([x, 8 + h / 2, z], [w, h, d], wall)
  box([x, 8 + h, z], [w + 0.15, 0.14, d + 0.15], i % 3 ? 'mint' : 'rose')
  for (let k = 0; k < 2; k++)
    arch(x - w * 0.25 + k * w * 0.5, 8.4, z + d * 0.5 + 0.02, w * 0.21, 0.65, 'dark')
  if (i % 3 !== 0) {
    cyl([x, 8 + h + 0.15, z], w * 0.48, w * 0.48, 0.25, wall)
    dome(x, 8 + h + 0.28, z, w * 0.5, ['blue', 'green', 'gold', 'purple', 'rose'][i % 5])
  } else {
    for (let k = 0; k < 3; k++)
      box([x - w * 0.4 + k * w * 0.4, 8 + h + 0.22, z + d * 0.5], [0.12, 0.25, 0.15], wall)
  }
  if (i % 14 === 0) tower(x + w * 0.7, z, 8, 4 + rand() * 2, 0.25, 'green')
}
// Alubarna clock tower. Clock hands and numerals are geometry, not a stock icon.
const tx = -1,
  tz = 3
box([tx, 10.5, tz], [1.65, 5, 1.65], 'chalk')
box([tx, 12.8, tz], [2, 0.3, 2], 'mint')
box([tx, 13.5, tz], [1.9, 1.2, 1.9], 'cream')
add(
  new T.CylinderGeometry(0.65, 0.65, 0.06, 32),
  'chalk',
  [tx, 13.5, tz + 0.99],
  [Math.PI / 2, 0, 0],
)
add(new T.TorusGeometry(0.67, 0.045, 6, 32), 'goldShade', [tx, 13.5, tz + 1.04])
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2
  box(
    [tx + Math.sin(a) * 0.51, 13.5 + Math.cos(a) * 0.51, tz + 1.05],
    [0.035, 0.11, 0.04],
    'dark',
    [0, 0, -a],
  )
}
box([tx, 13.68, tz + 1.09], [0.035, 0.4, 0.04], 'dark')
box([tx + 0.15, 13.5, tz + 1.09], [0.34, 0.035, 0.04], 'dark')
dome(tx, 14.15, tz, 1.06, 'green')
// A deliberately compressed Rainbase vignette: oasis, pyramid casino, gilded roof.
cyl([-24, 2.35, -4], 6, 6, 0.1, 'water', 48)
box([-24, 2.55, -4], [7.4, 0.45, 7.4], 'cream')
add(new T.ConeGeometry(5.1, 6.1, 4), 'gold', [-24, 5.8, -4], [0, Math.PI / 4, 0])
for (let i = 0; i < 8; i++)
  box([-24, 2.9 + i * 0.65, -0.65 - i * 0.33], [6.9 - i * 0.65, 0.12, 0.12], 'goldShade')
arch(-24, 2.8, -0.28, 1.7, 2.2, 'dark')
// A stylized crocodile ornament on the casino roof.
sphere([-24, 9.2, -4], [1.9, 0.35, 0.55], 'green')
sphere([-24, 9.22, -2.6], [0.65, 0.22, 1.15], 'green')
for (const dx of [-0.4, 0.4]) sphere([-24 + dx, 9.5, -3.15], [0.12, 0.12, 0.13], 'dark')
for (let i = 0; i < 9; i++) {
  const a = (i / 9) * Math.PI * 2
  palms(-24 + Math.cos(a) * 7, -4 + Math.sin(a) * 6, 2, 0.7 + rand() * 0.35)
}
// Coastal houses, pier and palm-lined arrival beach.
for (let i = 0; i < 12; i++) {
  const x = -5 + i * 1.5,
    z = 23 + Math.sin(i) * 1.1,
    h = 0.8 + rand()
  box([x, 1.8 + h / 2, z], [1.15, h, 1.1], 'chalk')
  dome(x, 1.8 + h, z, 0.58, i % 2 ? 'blue' : 'cream')
  arch(x, 1.9, z + 0.56, 0.35, 0.62, 'dark')
}
for (let i = 0; i < 10; i++) box([13.4, 0.8, 24 + i * 0.7], [2.1, 0.18, 0.56], 'wood')
for (const x of [12.5, 14.3])
  for (const z of [25, 27, 29]) cyl([x, 0.6, z], 0.12, 0.12, 1.8, 'wood', 8)
for (let i = 0; i < 22; i++) {
  const a = rand() * Math.PI * 2,
    r = 21 + rand() * 8
  const x = Math.cos(a) * r,
    z = Math.sin(a) * r * 0.78
  if (x < -17 && z < 5) continue
  palms(x, z, 1.85, 0.65 + rand() * 0.5)
}
// A few exposed desert rock formations, retaining open sand around the city.
for (let i = 0; i < 20; i++) {
  const x = -36 + rand() * 70,
    z = -25 + rand() * 12
  if (Math.hypot(x - cx, z - cz) < 19) continue
  add(
    new T.DodecahedronGeometry(1, 0),
    'ochre',
    [x, 2.3, z],
    [rand(), rand(), rand()],
    [1.2 + rand() * 2, 1 + rand() * 2, 0.8 + rand()],
  )
}
let triangles = 0
for (const [name, geos] of batches) {
  if (!geos.length) continue
  const merged = mergeGeometries(geos)
  triangles += merged.getAttribute('position').count / 3
  const material = new T.MeshStandardMaterial({
    color: palette[name],
    roughness: 1,
    side: T.DoubleSide,
  })
  material.name = name
  const mesh = new T.Mesh(merged, material)
  mesh.name = 'Alabasta_' + name
  scene.add(mesh)
}
const output = await new GLTFExporter().parseAsync(scene, { binary: true })
await mkdir('.tools', { recursive: true })
await mkdir('public/models', { recursive: true })
await writeFile('.tools/alabasta-source.glb', Buffer.from(output))
console.log(
  `Built ${Math.round(triangles).toLocaleString()} triangles in ${scene.children.length} material batches.`,
)
