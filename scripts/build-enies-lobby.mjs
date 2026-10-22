// Original compressed Enies Lobby interpretation. No extracted game assets.
// --source exports flat colors for the Cycles bake; default exports a quick preview.
import * as T from 'three'
import { buildCity } from './enies-city.mjs'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then((v) => {
      this.result = v
      this.onloadend?.()
    })
  }
}
const font = new FontLoader().parse(
  JSON.parse(
    await readFile('node_modules/three/examples/fonts/helvetiker_regular.typeface.json', 'utf8'),
  ),
)
const forBake = process.argv.includes('--source')
const palette = {
  stone: '#c3ba9d',
  trim: '#f5f0dd',
  peach: '#e5b398',
  pink: '#d59898',
  blue: '#8cbfc1',
  yellow: '#e7cb87',
  roof: '#a95240',
  roofLight: '#cb7251',
  water: '#43aeb5',
  dark: '#284b55',
  wood: '#79604d',
  iron: '#587b80',
  leaf: '#83a56a',
  gold: '#c3a257',
  jade: '#729f77',
  jadeDark: '#4e805f',
  gate: '#8cabb0',
  rock: '#8e8876',
  grass: '#a0b67e',
}
const batches = new Map(),
  light = new T.Vector3(-0.5, 1, 0.6).normalize()
let seed = 717
const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
function add(geo, c, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  geo.applyMatrix4(
    new T.Matrix4().compose(
      new T.Vector3(...p),
      new T.Quaternion().setFromEuler(new T.Euler(...r)),
      new T.Vector3(...s),
    ),
  )
  const g = geo.index ? geo.toNonIndexed() : geo
  g.deleteAttribute('uv')
  const n = g.getAttribute('normal'),
    pos = g.getAttribute('position'),
    col = new Float32Array(pos.count * 3),
    base = new T.Color(palette[c] ?? c),
    normal = new T.Vector3()
  for (let i = 0; i < pos.count; i++) {
    normal.fromBufferAttribute(n, i)
    const shade = forBake ? 1 : 0.68 + 0.32 * Math.max(0, normal.dot(light))
    col[i * 3] = base.r * shade
    col[i * 3 + 1] = base.g * shade
    col[i * 3 + 2] = base.b * shade
  }
  g.setAttribute('color', new T.BufferAttribute(col, 3))
  const key = `district-${Math.floor((p[0] + 80) / 64)}-${Math.floor((p[2] + 80) / 64)}`
  if (!batches.has(key)) batches.set(key, [])
  batches.get(key).push(g)
}
const box = (p, s, c, r = 0) => add(new T.BoxGeometry(...s), c, p, [0, r, 0])
const cyl = (p, a, b, h, c, n = 32) => add(new T.CylinderGeometry(a, b, h, n), c, p)
const ring = (p, ro, ri, c) => add(new T.RingGeometry(ri, ro, 80), c, p, [-Math.PI / 2, 0, 0])
const sign = (str, p, size = 1.2) => {
  const g = new TextGeometry(str, {
    font,
    size,
    depth: 0.04,
    curveSegments: 2,
    bevelEnabled: false,
  })
  g.computeBoundingBox()
  g.translate(-g.boundingBox.max.x / 2, 0, 0)
  add(g, 'dark', p)
}
function beam(a, b, width, c) {
  const d = new T.Vector3(...b).sub(new T.Vector3(...a))
  const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize())
  const g = new T.BoxGeometry(width, d.length(), width)
  g.applyQuaternion(q)
  add(
    g,
    c,
    a.map((v, i) => (v + b[i]) / 2),
  )
}
function house(x, y, z, w, h, d, c, angle = 0) {
  const at = (xx, yy, zz) => [
    x + xx * Math.cos(angle) + zz * Math.sin(angle),
    y + yy,
    z - xx * Math.sin(angle) + zz * Math.cos(angle),
  ]
  box(at(0, h / 2, 0), [w, h, d], c, angle)
  box(at(0, 0.18, 0), [w + 0.15, 0.36, d + 0.15], 'stone', angle)
  box(at(0, h, 0), [w + 0.35, 0.25, d + 0.35], 'trim', angle)
  const roof = new T.CylinderGeometry(d * 0.58, d * 0.58, w + 0.4, 12, 1, false, 0, Math.PI)
  roof.rotateZ(Math.PI / 2)
  add(roof, 'roof', at(0, h + 0.15, 0), [0, angle, 0])
  for (let level = 0; level < Math.floor(h / 1.7); level++)
    for (let k = 0; k < 2; k++) {
      const xx = (k - 0.5) * w * 0.48,
        yy = 1 + level * 1.7
      box(at(xx, yy, d / 2 + 0.025), [w * 0.22, 0.8, 0.06], 'dark', angle)
      box(at(xx, yy - 0.5, d / 2 + 0.1), [w * 0.3, 0.12, 0.22], 'trim', angle)
      box(at(xx, yy, d / 2 + 0.07), [0.06, 0.85, 0.05], 'trim', angle)
    }
  box(at(0, 0.65, d / 2 + 0.04), [0.65, 1.3, 0.09], 'wood', angle)
  if (rand() > 0.55) box(at(w * 0.25, h + 1.2, -d * 0.2), [0.45, 1.2, 0.5], 'stone', angle)
}
function bridge(x, y, z, length, angle = 0) {
  box([x, y, z], [3, 0.4, length], 'stone', angle)
  for (const side of [-1, 1])
    for (let i = 0; i < 6; i++) {
      const xx = side * 1.35,
        zz = (i / 5 - 0.5) * length
      const px = x + xx * Math.cos(angle) + zz * Math.sin(angle),
        pz = z - xx * Math.sin(angle) + zz * Math.cos(angle)
      cyl([px, y + 0.7, pz], 0.09, 0.12, 1.4, 'trim', 6)
    }
  for (const side of [-1, 1])
    box(
      [x + side * 1.35 * Math.cos(angle), y + 1.35, z - side * 1.35 * Math.sin(angle)],
      [0.16, 0.16, length],
      'trim',
      angle,
    )
}
buildCity({ add, box, cyl, ring, sign, beam, house, bridge, rand, font })
const scene = new T.Scene()
let triangles = 0
for (const [name, geos] of batches) {
  const geometry = mergeGeometries(geos)
  triangles += geometry.attributes.position.count / 3
  geometry.computeBoundingSphere()
  const mesh = new T.Mesh(geometry, new T.MeshBasicMaterial({ vertexColors: true }))
  mesh.name = name
  scene.add(mesh)
}
await mkdir(forBake ? '.tools' : 'public/models', { recursive: true })
const output = await new GLTFExporter().parseAsync(scene, { binary: true })
await writeFile(
  forBake ? '.tools/enies-lobby-source.glb' : 'public/models/enies-lobby.glb',
  Buffer.from(output),
)
if (!forBake)
  await writeFile(
    'public/models/enies-lobby-metrics.json',
    JSON.stringify(
      {
        triangles,
        districtMeshes: scene.children.length,
        bytes: output.byteLength,
        lighting: 'Offline vertex directional lighting; not a Cycles texture bake',
      },
      null,
      2,
    ),
  )
console.log(
  JSON.stringify({ triangles, districts: scene.children.length, bytes: output.byteLength }),
)
