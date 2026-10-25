// Original compressed Sabaody interpretation. No extracted game assets.
// --source exports flat colors for the Cycles bake; default exports a quick preview.
import * as T from 'three'
import { buildCity } from './sabaody-city.mjs'
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
  stone: '#eee2c3',
  trim: '#e4d6d1',
  peach: '#e5b398',
  pink: '#d59898',
  blue: '#8cbfc1',
  yellow: '#e7cb87',
  roof: '#6caa8f',
  roofLight: '#cb7251',
  water: '#43aeb5',
  dark: '#284b51',
  wood: '#7e6255',
  iron: '#5a5065',
  leaf: '#7aaf69',
  gold: '#c3a257',
  jade: '#729f77',
  jadeDark: '#4e805f',
  gate: '#8cabb0',
  rock: '#797078',
  grass: '#a4bd72',
}
let activeLayer = 'static'
let orientation = null
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
  if (orientation) {
    const [x, z, a] = orientation
    geo.translate(-x, 0, -z)
    geo.rotateY(a)
    geo.translate(x, 0, z)
  }
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
  const key = `${activeLayer}-district-${Math.floor((p[0] + 300) / 100)}-${Math.floor((p[2] + 300) / 100)}`
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
buildCity({
  orient: (value) => {
    orientation = value
  },
  add,
  box,
  cyl,
  ring,
  sign,
  beam,
  rand,
  font,
  layer: (value) => {
    activeLayer = value
  },
})
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
  forBake ? '.tools/sabaody-source.glb' : 'public/models/sabaody.glb',
  Buffer.from(output),
)
if (!forBake)
  await writeFile(
    'public/models/sabaody-metrics.json',
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
