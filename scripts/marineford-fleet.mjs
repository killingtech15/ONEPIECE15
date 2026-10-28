import * as T from 'three'
import layout from '../src/marineford-layout.json' with { type: 'json' }

// One original Marine vessel family, with explicitly reduced geometry offshore.
export function buildFleet({ add, box, cyl, beam, layer, orient, grid, tube, flag }) {
  function vessel(x, z, scale, detail, heading = 0) {
    orient([x, z, heading])
    const p = (a, b, c) => [x + a * scale, b * scale, z + c * scale]
    const cbox = (a, b, c, w, h, d, col) => box(p(a, b, c), [w * scale, h * scale, d * scale], col)
    const seg = detail === 2 ? 24 : detail === 1 ? 12 : 8
    grid(
      seg,
      detail === 2 ? 10 : 5,
      (u, v) => {
        const t = u * 2 - 1,
          a = v * Math.PI
        return p(
          Math.cos(a) * 14 * Math.sqrt(Math.max(0.005, 1 - t * t)),
          9 - Math.sin(a) * 13 + Math.abs(t) ** 4 * 5,
          t * 35,
        )
      },
      '#436575',
    )
    // Closed deck follows the hull's tapered planform.
    grid(
      seg,
      1,
      (u, v) => {
        // +Z along u and +X along v produce an upward-facing deck.
        const t = u * 2 - 1
        return p(
          (v * 2 - 1) * 13.8 * Math.sqrt(Math.max(0.005, 1 - t * t)),
          9.05 + Math.abs(t) ** 4 * 5,
          t * 35,
        )
      },
      '#bea475',
    )
    for (const s of [-1, 1]) {
      tube(
        Array.from({ length: seg + 1 }, (_, i) => {
          const t = (i / seg) * 2 - 1
          return p(
            s * 14 * Math.sqrt(Math.max(0.005, 1 - t * t)),
            10 + Math.abs(t) ** 4 * 5,
            t * 35,
          )
        }),
        0.55 * scale,
        '#d2bd86',
        seg,
      )
      if (detail > 0)
        for (let j = -4; j <= 4; j++) {
          const a = s * 13 * Math.sqrt(1 - (j / 5.8) ** 2)
          cbox(a, 6, j * 6, 1, 3.4, 3.6, '#c6ba9b')
          cbox(a + s * 0.55, 6, j * 6, 0.5, 2.1, 2.3, '#243b4b')
          add(
            new T.CylinderGeometry(0.55 * scale, 0.8 * scale, 3 * scale, 8),
            '#263d4b',
            p(a + s * 1.5, 6, j * 6),
            [0, 0, Math.PI / 2],
          )
        }
      if (detail === 2)
        for (let i = -12; i <= 12; i++) {
          const t = i / 13,
            a = s * 13.5 * Math.sqrt(1 - t * t)
          beam(
            p(a, 10 + Math.abs(t) ** 4 * 5, t * 32),
            p(a, 12.5 + Math.abs(t) ** 4 * 5, t * 32),
            0.18 * scale,
            '#c3ba9e',
          )
        }
    }
    cbox(0, 13, -23, 18, 9, 16, '#e5dfc7')
    cbox(0, 18, -23, 21, 1.5, 19, '#477282')
    for (const a of [-6, 0, 6]) cbox(a, 14, -14.8, 3, 3, 0.4, '#244a5e')
    if (detail > 0) {
      for (let i = -12; i <= 12; i++)
        cbox(0, 9.4, i * 2.4, 26 * Math.sqrt(1 - (i / 14) ** 2), 0.15, 0.16, '#8b795c')
      for (const s of [-1, 1])
        for (const y of [2, 5])
          tube(
            Array.from({ length: 13 }, (_, i) => {
              const t = i / 6 - 1
              return p(
                s * 13 * Math.sqrt(Math.max(0.005, 1 - t * t)),
                y + Math.abs(t) ** 4 * 8,
                t * 34,
              )
            }),
            0.2 * scale,
            '#9cb1ac',
            12,
          )
    }
    for (const [dz, h, w] of [
      [13, 68, 37],
      [-15, 57, 30],
    ]) {
      cyl(p(0, h / 2 + 4, dz), 0.6 * scale, scale, h * scale, '#75674e', 8)
      for (const [top, bottom, width] of [
        [h - 2, h - 20, w],
        [h - 25, h - 40, w * 0.9],
      ]) {
        const sail = (u, v) =>
          p(
            (u - 0.5) * width,
            top - v * (top - bottom) - Math.sin(u * Math.PI) * 1.7,
            dz + Math.sin(u * Math.PI) * Math.sin(v * Math.PI * 0.8) * 3,
          )
        const columns = detail === 2 ? 12 : 6,
          rows = detail === 2 ? 7 : 3,
          thickness = 0.14 * scale
        // Keep both cloth sides on identical quad diagonals. Reversing the
        // parameter mirrored the triangulation and made coarse bowed sails
        // intersect their back faces, producing black squares in the bake.
        grid(columns, rows, sail, '#f0ead7', true)
        grid(
          columns,
          rows,
          (u, v) => {
            const a = sail(u, v)
            a[2] -= thickness
            return a
          },
          '#e5e0cd',
        )
        // Close the four thin edges with outward-facing strips.
        for (const side of [0, 1])
          grid(
            rows,
            1,
            (u, v) => {
              const a = sail(side, u)
              a[2] -= thickness * v
              return a
            },
            '#e5e0cd',
            side === 0,
          )
        for (const edge of [0, 1])
          grid(
            columns,
            1,
            (u, v) => {
              const a = sail(u, edge)
              a[2] -= thickness * v
              return a
            },
            '#e5e0cd',
            edge === 1,
          )
        beam(p(-width * 0.56, top, dz), p(width * 0.56, top, dz), 0.6 * scale, '#77684e')
        for (const s of [-1, 1])
          tube(
            Array.from({ length: 9 }, (_, i) => {
              const a = sail(0.5 + ((s * i) / 8) * 0.23, 0.53 - Math.sin((i / 8) * Math.PI) * 0.13)
              a[2] += 0.22 * scale
              return a
            }),
            0.38 * scale,
            '#345b7a',
            8,
          )
        if (detail === 2)
          for (let i = 0; i <= 6; i++)
            tube(
              Array.from({ length: 6 }, (_, j) => sail(i / 6, j / 5)),
              0.075 * scale,
              '#b3a68b',
              5,
            )
      }
      if (detail > 0) {
        cyl(p(0, h - 18, dz), 3.2 * scale, 3.2 * scale, scale, '#9c9279', 12)
        for (const s of [-1, 1])
          for (const d of [-7, 7]) beam(p(0, h, dz), p(s * 12, 11, dz + d), 0.14 * scale, '#766c59')
        if (detail === 2)
          for (let i = 0; i < 16; i++)
            beam(p(-1, 13 + i * 2.4, dz - 1), p(1, 13 + i * 2.4, dz - 1), 0.15 * scale, '#796e59')
      }
    }
    beam(p(0, 14, 34), p(0, 20, 46), 0.7 * scale, '#b9ae8c')
    for (const s of [-1, 1]) beam(p(0, 20, 46), p(s * 10, 11, 22), 0.16 * scale, '#75684d')
    orient(null)
  }
  layer('ship')
  vessel(layout.ship[0], layout.ship[2], 1, 2)
  layer('fleet')
  // Spaced offshore rows use reduced detail; audit full envelopes after export.
  for (const side of [-1, 1])
    for (let row = 0; row < 2; row++)
      for (let i = 0; i < 6; i++) {
        const x = side * (400 + row * 110),
          z = -245 + i * 105 + (row % 2) * 35
        vessel(x, z, row === 0 ? 0.72 : 0.58, row === 0 ? 1 : 0, side * 0.12)
      }
  layer('static')
}
