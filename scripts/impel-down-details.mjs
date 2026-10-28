import * as T from 'three'
import L from '../src/impel-down-layout.json' with { type: 'json' }

export function detailPrison({
  add,
  box,
  cyl,
  ring,
  sign,
  beam,
  rand,
  layer,
  orient,
  arcWall,
  cell,
}) {
  const stone = '#7d8993',
    trim = '#b8bdba',
    iron = '#33424d',
    gold = '#cba965'
  const tube = (pts, r, c, n = 16, rs = 5) =>
    add(
      new T.TubeGeometry(
        new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p))),
        n,
        r,
        rs,
        false,
      ),
      c,
    )
  const oval = (p, s, c) => add(new T.SphereGeometry(1, 12, 8), c, p, [0, 0, 0], s)
  function grid(nx, ny, fn, c) {
    const v = []
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const a = fn(i / nx, j / ny),
          b = fn((i + 1) / nx, j / ny),
          d = fn(i / nx, (j + 1) / ny),
          e = fn((i + 1) / nx, (j + 1) / ny)
        v.push(...a, ...b, ...d, ...b, ...e, ...d)
      }
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(v, 3))
    g.computeVertexNormals()
    add(g, c)
  }
  function arch(x, y, z, w, h, c = trim) {
    for (const s of [-1, 1]) box([x + (s * w) / 2, y + (h - w / 2) / 2, z], [2.6, h - w / 2, 4], c)
    for (let i = 0; i < 13; i++) {
      const a = (Math.PI * i) / 12
      add(
        new T.BoxGeometry(w * 0.14, 2.8, 4),
        c,
        [x + (Math.cos(a) * w) / 2, y + h - w / 2 + (Math.sin(a) * w) / 2, z],
        [0, 0, a - Math.PI / 2],
      )
    }
  }
  function railing(a, b, y, c = iron) {
    beam([a[0], y + 3, a[1]], [b[0], y + 3, b[1]], 0.45, c)
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4)
    for (let i = 0; i <= n; i++)
      box(
        [a[0] + ((b[0] - a[0]) * i) / n, y + 1.5, a[1] + ((b[1] - a[1]) * i) / n],
        [0.4, 3, 0.4],
        c,
      )
  }
  function stairs(x, y, z, w, n, rise = 1, run = 1.8) {
    for (let i = 0; i < n; i++)
      box([x, y + ((i + 1) * rise) / 2, z - i * run], [w, (i + 1) * rise, run + 0.05], trim)
  }
  function chain(a, b, size = 1.2, sag = 4) {
    const n = Math.ceil(new T.Vector3(...a).distanceTo(new T.Vector3(...b)) / (size * 1.55))
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const p = a.map((v, k) => v + (b[k] - v) * t - (k === 1 ? Math.sin(t * Math.PI) * sag : 0))
      add(
        new T.TorusGeometry(size, 0.22 * size, 4, 6),
        iron,
        p,
        [0, i % 2 ? Math.PI / 2 : 0, 0],
        [0.72, 1, 1],
      )
    }
  }
  function lamp(x, y, z) {
    box([x, y, z], [1.7, 2.8, 1.7], '#f3ca79')
    for (const d of [-1.5, 1.5]) box([x, y + d, z], [2.2, 0.4, 2.2], iron)
    for (const dx of [-0.9, 0.9]) box([x + dx, y, z], [0.22, 3, 2], iron)
  }
  function rimBlocks(r, y, z0 = 0, full = false) {
    const n = Math.round(r * 0.9)
    for (let i = 0; i < n; i++) {
      const a = (full ? 0 : Math.PI / 2) + ((full ? Math.PI * 2 : Math.PI) * i) / n
      box(
        [Math.sin(a) * r, y, Math.cos(a) * r + z0],
        [(r * (full ? 6.1 : 3)) / n, 1.4, 1.8],
        trim,
        a,
      )
    }
  }
  // Masonry joints, structural ribs, stairs and horizontal ledges support the cut faces.
  for (const f of L.floors) {
    layer('floor' + f.id)
    if (f.id === '55') continue
    for (let y = 4; y < f.h; y += 8) rimBlocks(f.r - 2, f.y + y)
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI / 2 + (Math.PI * i) / 14
      box([Math.sin(a) * (f.r - 2), f.y + f.h / 2, Math.cos(a) * (f.r - 2)], [2, f.h, 2], stone, a)
    }
    rimBlocks(f.r, f.y - 1)
    rimBlocks(f.r, f.y + f.h)
    // Upper wall connects successive shells at the back, leaving the front cut plane open.
    arcWall(
      f.r,
      f.y + f.h,
      Math.max(2, (f.id === '6' ? 62 : f.id === '5' ? 75 : 55) - f.h),
      '#4e6573',
    )
    for (const x of [-f.r * 0.84, f.r * 0.84]) {
      cyl([x, f.y + 2, 0], 3, 4, 4, stone, 12)
      lamp(x, f.y + 5, 0)
    }
    if (!['4', '5'].includes(f.id)) stairs(f.r * 0.75, f.y, 5, 10, 13)
    // Sparse paving, avoiding a coincident full floor cover.
    for (let i = 0; i < 80; i++) {
      const x = (rand() - 0.5) * f.r * 1.65,
        z = (rand() - 0.4) * f.r * 1.25
      if (Math.hypot(x, z) > f.r - 6) continue
      box(
        [x, f.y + 0.08, z],
        [2 + rand() * 6, 0.12, 0.12],
        f.id === '5' ? '#96b9c7' : '#4b626c',
        rand() * 2,
      )
    }
  }
  layer('surface')
  for (let y = 4; y < 47; y += 5) rimBlocks(47.2, y, -8, true)
  for (let y = 59; y < 93; y += 5) rimBlocks(9.3, y, -23, true)
  for (const [x, z, h, r] of [
    [-34, -17, 63, 7],
    [34, -17, 63, 7],
    [-25, -36, 73, 6],
    [25, -36, 73, 6],
  ]) {
    cyl([x, h / 2, z], r, r + 1, h, stone, 16)
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4
      box([x + Math.sin(a) * r, h + 2, z + Math.cos(a) * r], [2.5, 4, 2.5], trim, a)
    }
    for (const y of [h - 8, h - 16]) box([x, y, z + r + 0.1], [1.5, 3, 0.2], iron)
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6
    box([Math.sin(a) * 10, 94, Math.cos(a) * 10 - 23], [3, 5, 3], trim, a)
  }
  for (const x of [-23, 23]) {
    for (let y = 3; y < 49; y += 5)
      for (let dx = -6; dx <= 6; dx += 4) box([x + dx + (y % 2), y, 48.65], [3.7, 0.16, 0.14], iron)
    for (let i = 0; i < 6; i++) box([x - 6 + i * 2.4, 47.5, 49], [0.8, 2.5, 0.8], trim)
  }
  // Crown plaque above the arch: raised red dome, gold uprights and wing flourishes.
  oval([0, 45.6, 53], [5, 3.8, 0.7], '#912d3b')
  tube(
    [
      [-5, 44, 53.8],
      [-3, 49, 53.8],
      [0, 46.5, 53.8],
      [3, 49, 53.8],
      [5, 44, 53.8],
    ],
    0.45,
    gold,
    18,
  )
  box([0, 43, 53.8], [10, 0.9, 0.8], gold)
  for (const s of [-1, 1])
    for (let i = 0; i < 3; i++)
      tube(
        [
          [s * 5, 44, 53.6],
          [s * (7 + i), 46 + i, 53.6],
          [s * (8 + i), 48 + i, 53.6],
        ],
        0.35,
        gold,
        8,
      )
  // The quay is alongside the hull, outside the fortress footprint.
  box([65, 3, 16], [10, 4, 67], stone)
  for (const z of [-12, 10, 34]) {
    cyl([65, 7, z], 1, 1.5, 4, iron, 12)
    cyl([65, -4, z], 2, 3, 10, stone, 12)
  }
  box([57, 4, 12], [10, 2, 13], trim)
  railing([60, -16], [60, 48], 5)
  layer('ship')
  const sx = 93,
    sz = 17
  // Curved hull, planked deck and raised stern. No rectangular floating block.
  grid(
    32,
    12,
    (u, v) => {
      const t = u * 2 - 1,
        a = v * Math.PI
      return [
        sx + Math.cos(a) * 14 * Math.sqrt(Math.max(0.01, 1 - t * t)),
        9 - Math.sin(a) * 13 + Math.pow(Math.abs(t), 4) * 6,
        sz + t * 34,
      ]
    },
    '#456776',
  )
  grid(
    32,
    12,
    (u, v) => {
      const t = 1 - u * 2,
        a = v * Math.PI
      return [
        sx + Math.cos(a) * 13.7 * Math.sqrt(Math.max(0.01, 1 - t * t)),
        8.8 - Math.sin(a) * 12.6 + Math.pow(Math.abs(t), 4) * 6,
        sz + t * 33.8,
      ]
    },
    '#6c523f',
  )
  for (let i = -16; i <= 16; i++) {
    const t = i / 17
    box([sx, 9.05, sz + i * 1.9], [27 * Math.sqrt(Math.max(0.01, 1 - t * t)), 0.65, 1.8], '#b49464')
  }
  for (const s of [-1, 1]) {
    const pts = Array.from({ length: 25 }, (_, i) => {
      const t = i / 12 - 1
      return [
        sx + s * 14 * Math.sqrt(Math.max(0.01, 1 - t * t)),
        11 + Math.abs(t) ** 4 * 6,
        sz + t * 34,
      ]
    })
    tube(pts, 0.6, trim, 30)
    for (let i = -4; i <= 4; i++) {
      const z = sz + i * 6,
        x = sx + s * 13 * Math.sqrt(1 - (i / 6) ** 2)
      box([x, 6, z], [0.8, 3.5, 3.5], trim)
      box([x + s * 0.5, 6, z], [0.6, 2, 2], iron)
      add(new T.CylinderGeometry(0.65, 0.8, 3, 10), iron, [x + s * 1.3, 6, z], [0, 0, Math.PI / 2])
    }
  }
  box([sx, 14, sz - 22], [17, 9, 14], '#d6d6c6')
  box([sx, 19, sz - 22], [20, 1, 17], iron)
  for (const x of [-5, 0, 5]) box([sx + x, 15, sz - 14.8], [2.7, 2.8, 0.3], '#2a495d')
  for (const [dz, h, w] of [
    [14, 68, 35],
    [-15, 57, 29],
  ]) {
    cyl([sx, h / 2 + 4, sz + dz], 0.6, 1, h, 'wood', 10)
    for (const [top, bottom, width] of [
      [h - 3, h - 20, w],
      [h - 24, h - 39, w * 0.9],
    ]) {
      const sail = (u, v) => [
        sx + (u - 0.5) * width,
        top - v * (top - bottom) + Math.sin(u * Math.PI) * -1.6,
        sz + dz + Math.sin(u * Math.PI) * 2.4 * Math.sin(v * Math.PI * 0.8),
      ]
      grid(14, 8, (u, v) => sail(1 - u, v), '#eee4cb')
      grid(
        14,
        8,
        (u, v) => {
          const p = sail(u, v)
          p[2] -= 0.14
          return p
        },
        '#eee4cb',
      )
      beam([sx - width * 0.56, top, sz + dz], [sx + width * 0.56, top, sz + dz], 0.65, 'wood')
      for (let j = 0; j <= 7; j++)
        tube(
          Array.from({ length: 7 }, (_, k) => sail(j / 7, k / 6)),
          0.09,
          '#9b9078',
          8,
          4,
        )
      tube(
        Array.from({ length: 15 }, (_, i) => sail(i / 14, 1)),
        0.13,
        'wood',
        16,
        4,
      )
      // Raised Marine gull follows the bowed cloth face.
      for (const side of [-1, 1])
        tube(
          Array.from({ length: 9 }, (_, i) => {
            const u = 0.5 + ((side * i) / 8) * 0.24,
              p = sail(u, 0.52 - Math.sin((i / 8) * Math.PI) * 0.1)
            p[2] += 0.2
            return p
          }),
          0.38,
          '#375d80',
          12,
          5,
        )
    }
    ring([sx, h - 18, sz + dz], 3.6, 2.5, iron)
    cyl([sx, h - 18.5, sz + dz], 3.4, 3.4, 1, trim, 16)
    for (const s of [-1, 1]) {
      for (const z of [-8, 8]) beam([sx, h, sz + dz], [sx + s * 12, 10, sz + dz + z], 0.12, 'wood')
      for (let y = 13; y < h - 17; y += 2.4)
        beam([sx - 1, y, sz + dz - 0.7], [sx + 1, y, sz + dz - 0.7], 0.16, 'wood')
    }
  }
  tube(
    [
      [sx, 15, sz + 33],
      [sx, 22, sz + 40],
      [sx, 23, sz + 43],
    ],
    0.7,
    trim,
    12,
  )
  for (const s of [-1, 1]) beam([sx, 21, sz + 40], [sx + s * 12, 11, sz + 20], 0.18, 'wood')
  // Level 1: sharp branch clusters and needle grass leave a winding central route.
  layer('floor1')
  for (let i = 0; i < 40; i++) {
    const x = (rand() - 0.5) * 94,
      z = (rand() - 0.4) * 70
    if (Math.abs(x) < 10 || Math.hypot(x, z) > 51) continue
    const h = 10 + rand() * 12
    cyl([x, -45 + h / 2, z], 0.7, 1.4, h, '#563b50', 7)
    for (let j = 0; j < 7; j++) {
      const a = j * 2.4,
        y = -42 + j * 2
      const end = [x + Math.sin(a) * 7, y + 3, z + Math.cos(a) * 7]
      beam([x, y, z], end, 0.6, '#6a354e')
      for (let k = 0; k < 5; k++) {
        const p = [end[0] + Math.sin(a + k) * 2, end[1] + k * 0.3, end[2] + Math.cos(a + k) * 2]
        add(new T.ConeGeometry(0.65, 6, 3), '#af4c65', p, [0.7, 0, a + k])
      }
    }
  }
  for (let i = 0; i < 220; i++) {
    const x = (rand() - 0.5) * 105,
      z = (rand() - 0.4) * 83
    if (Math.abs(x) < 9 || Math.hypot(x, z) > 54) continue
    add(new T.ConeGeometry(0.5, 2 + rand() * 2, 3), '#bc6975', [x, -43.5, z])
  }
  cyl([18, -44.8, 26], 8, 8, 0.25, '#202e3b', 32)
  ring([18, -43.8, 26], 10, 8, trim)
  for (let i = 0; i < 18; i++) {
    const a = (i * Math.PI) / 9
    box([18 + Math.sin(a) * 9, -44, 26 + Math.cos(a) * 9], [2.7, 2, 2], stone, a)
  }
  // Level 2: repeated high vaults, barred beast enclosures and open circulation.
  layer('floor2')
  for (const x of [-43, 43]) {
    cell(x, -100, -10, 22, 32, stone)
    arch(x, -100, -4, 26, 36)
    chain([x - 10, -67, -4], [x + 10, -67, -4], 1, 5)
  }
  for (const z of [-32, 9, 43]) arch(0, -100, z, 51, 42, stone)
  for (const s of [-1, 1]) {
    railing([s * 20, -42], [s * 20, 54], -98)
    for (let i = 0; i < 4; i++) {
      lamp(s * 27, -81, -35 + i * 24)
      box([s * 30, -99, -35 + i * 24], [6, 2, 6], trim)
    }
  }
  // Level 3: dry cracked surface, a grated vent and suspended ventilation fan.
  layer('floor3')
  for (let i = 0; i < 170; i++) {
    const x = (rand() - 0.5) * 150,
      z = (rand() - 0.5) * 140
    if (Math.hypot(x, z) > 85) continue
    const d = 3 + rand() * 4
    beam([x, -154.75, z], [x + d, -154.75, z + d * 0.3], 0.14, '#735d49')
    beam([x + d, -154.75, z + d * 0.3], [x + d * 1.5, -154.75, z - d * 0.5], 0.12, '#735d49')
  }
  cyl([0, -154.8, 0], 22, 22, 0.2, '#3d3c38', 40)
  ring([0, -153.9, 0], 24, 22, trim)
  for (let x = -19; x <= 19; x += 3)
    box([x, -153.4, 0], [0.5, 0.6, Math.sqrt(22 * 22 - x * x) * 2], iron)
  for (const x of [-25, 25]) {
    box([x, -138, 0], [2, 34, 2], iron)
    beam([x, -121, 0], [0, -116, 0], 1, iron)
  }
  cyl([0, -120, 0], 4, 4, 3, iron, 20)
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5
    box([Math.sin(a) * 10, -120, Math.cos(a) * 10], [5, 1, 16], '#8a8c7e', a + 0.3)
  }
  for (const x of [-59, 59]) {
    cell(x, -155, -27, 22, 31, '#a39170')
    chain([x - 10, -122, -24], [x + 10, -122, -24], 1, 3)
  }
  // Level 4: one giant metal pot, fire bed, supported bridges and furnace works.
  layer('floor4')
  const bowl = [
    new T.Vector2(0, 0),
    new T.Vector2(22, 0),
    new T.Vector2(31, 5),
    new T.Vector2(39, 14),
    new T.Vector2(42, 23),
    new T.Vector2(39.7, 23),
    new T.Vector2(37, 15),
    new T.Vector2(28, 7),
    new T.Vector2(0, 7),
  ]
  add(new T.LatheGeometry(bowl, 56), '#3b424c', [0, -217, 0])
  ring([0, -193.8, 0], 42.5, 39.3, '#aea18f')
  cyl([0, -195, 0], 39, 39, 0.4, '#bc3b32', 56)
  for (let i = 0; i < 13; i++) {
    const a = rand() * Math.PI * 2,
      r = rand() * 31
    add(
      new T.TorusGeometry(1 + rand() * 2, 0.18, 4, 14),
      '#dd7a55',
      [Math.sin(a) * r, -194.6, Math.cos(a) * r],
      [Math.PI / 2, 0, 0],
    )
  }
  for (let i = 0; i < 80; i++) {
    const a = (i * Math.PI * 2) / 80,
      r = 32 + rand() * 10,
      h = 3 + rand() * 8
    add(
      new T.ConeGeometry(1.6, h, 5),
      '#de7c39',
      [Math.sin(a) * r, -217 + h / 2, Math.cos(a) * r],
      [0, a, 0.2],
    )
    add(new T.ConeGeometry(0.6, h * 0.6, 4), '#efbc55', [
      Math.sin(a) * r,
      -217 + h * 0.3,
      Math.cos(a) * r,
    ])
  }
  for (const s of [-1, 1]) {
    box([s * 50, -206, 20], [12, 3, 94], stone)
    for (const z of [-17, 19, 55]) box([s * 50, -214, z], [5, 12, 5], stone)
    railing([s * 56, -27], [s * 56, 66], -204.5)
    railing([s * 44, -27], [s * 44, 66], -204.5)
  }
  box([0, -198, 38], [72, 3, 12], stone)
  for (const z of [32, 44]) railing([-36, z], [36, z], -196.5)
  box([0, -198, 22], [12, 3, 27], stone)
  railing([-6, 12], [-6, 32], -196.5)
  railing([6, 12], [6, 32], -196.5)
  for (const s of [-1, 1]) {
    stairs(s * 32, -220, 67, 13, 22, 1, 1.4)
    box([s * 56, -199, -43], [36, 4, 27], stone)
    for (const z of [-51, -36]) box([s * 56, -210, z], [4, 20, 4], stone)
  }
  cell(-56, -197, -54, 20, 23, stone)
  arch(-56, -197, -47, 24, 26)
  sign('WARDEN', [-56, -175, -46], 2)
  box([-56, -195, -39], [15, 2, 5], 'wood')
  lamp(-45, -187, -38)
  cell(65, -201, -43, 19, 35)
  arch(65, -201, -36, 24, 36)
  sign('SECURITY', [65, -174, -35], 2)
  stairs(65, -220, -4, 22, 19, 1, 1.7)
  for (const x of [-82, 82]) {
    tube(
      [
        [x, -218, -20],
        [x, -179, -20],
        [x * 0.85, -173, -35],
      ],
      2.5,
      iron,
      15,
      8,
    )
    for (let y = -214; y < -179; y += 7)
      add(new T.TorusGeometry(2.8, 0.5, 5, 12), trim, [x, y, -20], [Math.PI / 2, 0, 0])
  }
  // Level 5: cylindrical frozen cell towers, chain bridges and snow-heavy conifers.
  layer('floor5')
  for (const [x, z, r, h] of [
    [-69, -37, 17, 49],
    [0, -66, 23, 58],
    [69, -37, 17, 49],
  ]) {
    cyl([x, -295 + h / 2, z], r, r + 2, h, '#a4c8d5', 28)
    for (const dy of [0, 18, 37]) {
      cyl([x, -295 + dy, z], r + 2, r + 2, 1.5, '#e1ebdf', 28)
      for (let i = 0; i < 9; i++) {
        const a = (i * Math.PI * 2) / 9
        const xx = x + Math.sin(a) * (r + 0.1),
          zz = z + Math.cos(a) * (r + 0.1)
        orient([xx, zz, a])
        box([xx, -289 + dy, zz], [2.6, 5, 0.3], '#456579')
        for (const dx of [-0.8, 0, 0.8]) box([xx + dx, -289 + dy, zz + 0.25], [0.2, 5, 0.3], trim)
        orient(null)
      }
    }
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12
      add(
        new T.ConeGeometry(0.7, 3 + rand() * 4, 5),
        '#d0e8e6',
        [x + Math.sin(a) * (r + 1), -297 + h, z + Math.cos(a) * (r + 1)],
        [Math.PI, 0, 0],
      )
    }
  }
  chain([-69, -254, -37], [0, -244, -66], 2.2, 12)
  chain([0, -244, -66], [69, -254, -37], 2.2, 12)
  for (const s of [-1, 1]) {
    const x = s * 34
    box([x, -267, -51], [40, 2, 7], '#c3d7d4', s * -0.4)
    railing([s * 12, -58], [s * 56, -40], -266)
  }
  for (let i = 0; i < 38; i++) {
    const x = (rand() - 0.5) * 210,
      z = (rand() - 0.2) * 105
    if (Math.hypot(x, z) > 112 || Math.abs(x) < 30) continue
    const h = 9 + rand() * 13
    cyl([x, -295 + h / 2, z], 0.4, 1, h, '#718d91', 6)
    for (let j = 0; j < 3; j++) {
      add(new T.ConeGeometry(h * 0.25 - j * 0.7, h * 0.5, 7), '#769da6', [
        x,
        -294 + h * 0.35 + j * h * 0.2,
        z,
      ])
      add(new T.ConeGeometry(h * 0.21 - j * 0.6, h * 0.42, 7), '#d8e6de', [
        x,
        -293 + h * 0.39 + j * h * 0.2,
        z,
      ])
    }
  }
  for (let i = 0; i < 27; i++) {
    const x = (rand() - 0.5) * 195,
      z = (rand() - 0.3) * 150
    if (Math.hypot(x, z) > 115) continue
    oval([x, -295, z], [3 + rand() * 5, 0.8, 3 + rand() * 4], '#e1ebdf')
  }
  // Level 5.5: rough carved pocket, curved sofas, dining tables and a modest cabaret.
  layer('floor55')
  for (let i = 0; i < 23; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 22
    add(
      new T.IcosahedronGeometry(1, 0),
      '#8f7d85',
      [Math.sin(a) * 34, -325, Math.cos(a) * 34],
      [0, a, 0],
      [4, 13, 4],
    )
  }
  box([-44, -339, 0], [27, 3, 12], '#8e8992')
  for (const z of [-7, 7]) box([-44, -331, z], [27, 16, 3], '#777982')
  for (const x of [-54, -43, -32]) {
    orient([x, 0, Math.PI / 2])
    arch(x, -338, 0, 12, 16, '#8f8a8e')
    orient(null)
  }
  for (const [cx, cz] of [
    [-12, -12],
    [14, -11],
  ]) {
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 0.2 + (i * Math.PI * 0.6) / 8
      const x = cx + Math.cos(a) * 8,
        z = cz - Math.sin(a) * 8
      box([x, -334, z], [3.3, 3, 4], '#ce7fa6', -a + Math.PI / 2)
      box([x, -330, z - 1.5], [3.3, 5, 2], '#e6a7c7', -a + Math.PI / 2)
    }
    box([cx, -333, cz + 1], [12, 1, 7], '#e7dbb7')
    for (const x of [-4, 4])
      for (const z of [-1, 3]) box([cx + x, -335.5, cz + z], [0.6, 4, 0.6], 'wood')
    for (let i = 0; i < 5; i++) {
      const x = cx - 4 + i * 2
      cyl([x, -332.3, cz + 1], 0.8, 0.8, 0.15, '#f1e7ca', 12)
      oval([x, -331.8, cz + 1], [0.6, 0.5, 0.5], i % 2 ? '#8da756' : '#c49450')
    }
  }
  box([0, -336, -29], [26, 3, 10], 'wood')
  for (const x of [-13, 13])
    for (let i = 0; i < 5; i++) cyl([x + i * 0.6, -325, -30], 0.65, 0.65, 20, '#ac456d', 8)
  box([0, -314.5, -30], [30, 2, 2], gold)
  sign('NEWKAMA', [0, -319, -28], 2.2)
  tube(
    [
      [-25, -315, -19],
      [0, -310, -24],
      [25, -315, -19],
    ],
    0.14,
    iron,
    20,
  )
  for (let i = 0; i < 11; i++)
    oval(
      [-25 + i * 5, -313 - Math.abs(i - 5) * 0.45, -20],
      [0.7, 0.9, 0.7],
      i % 2 ? '#efc765' : '#df93a6',
    )
  box([25, -334, 10], [10, 7, 15], 'wood')
  for (let i = 0; i < 6; i++)
    cyl([23, -329.6, 5 + i * 2], 0.5, 0.6, 1.8, i % 2 ? '#8ba38a' : '#bd7c62', 8)
  for (let i = 0; i < 4; i++) {
    const x = -18 + i * 10
    cyl([x, -333.5, 14], 3, 3, 1, '#ba8b65', 16)
    cyl([x, -336, 14], 0.45, 0.8, 4, 'wood', 8)
    for (const z of [10, 18]) {
      box([x, -335, z], [3, 1, 3], '#b8899e')
      box([x, -336.5, z], [0.8, 2, 0.8], 'wood')
    }
  }
  // Level 6: tall riveted cages on both sides of an uncluttered central avenue.
  layer('floor6')
  for (const s of [-1, 1])
    for (let i = 0; i < 4; i++) {
      const x = s * (29 + i * 25),
        z = -89 + i * 14
      cell(x, -400, z, 21, 43, '#5d7584')
      arch(x, -400, z + 5, 25, 46, '#8298a2')
      for (let j = 0; j <= 7; j++) {
        const xx = x - 10 + (j * 20) / 7
        box([xx, -379, z + 5.4], [0.9, 42, 1], iron)
        // These are subpixel at the floor overview: keep a readable faceted head,
        // not hundreds of sphere triangles for each tiny fastener.
        for (let k = 0; k < 7; k++) add(new T.IcosahedronGeometry(1,0),trim,
          [xx,-396+k*6,z+6.25],[0,0,0],[.34,.34,.2])
      }
      for (let y = -396; y < -359; y += 6) box([x, y, z + 5.6], [22, 1, 1], iron)
      for (const dx of [-8, 8]) {
        add(new T.TorusGeometry(1, 0.25, 5, 12), iron, [x + dx, -385, z + 6.8])
        chain([x + dx, -385, z + 7], [x + dx, -395, z + 7], 0.65, 0)
      }
    }
  for (const x of [-22, 22])
    for (const z of [-90, -35, 25, 78]) {
      box([x, -378, z], [4, 44, 4], stone)
      box([x, -356, z], [7, 2, 7], trim)
      lamp(x, -380, z + 2.5)
    }
  arch(0, -400, -97, 32, 50, '#8298a2')
  cell(0, -400, -106, 28, 45, '#567181')
  for (let i = 0; i < 15; i++) box([0, -399.7, -94 + i * 14], [35, 0.2, 0.18], '#9aadb1')
  // A continuous rear rock mass encloses the small secret pocket in the section.
  layer('structure')
  arcWall(142, -338, 39, '#586571')
  for (let i = 0; i < 18; i++) {
    const a = Math.PI / 2 + (Math.PI * i) / 17
    add(
      new T.IcosahedronGeometry(1, 0),
      '#65717d',
      [Math.sin(a) * 139, -321, Math.cos(a) * 139],
      [0, a, 0],
      [8, 18, 8],
    )
  }
  // Architectural labels sit on the cut edge; no floating interior islands.
  for (const f of L.floors) {
    layer('floor' + f.id)
    const label = f.id === '55' ? '5.5' : f.id
    box([-f.r + 6, f.y + 5, 3], [12, 8, 1.5], iron)
    sign(label, [-f.r + 6, f.y + 2.5, 4], 4)
  }
  layer('surface')
  box([-50, 0, 18], [35, 0.3, 0.3], trim)
  sign('SEA LEVEL', [-67, 2, 18], 2)
}
