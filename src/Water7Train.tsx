import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as T from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { carriageOffsets, createWater7Rail, sampleRail } from './water7-rail'

function carriageGeometry(kind: number) {
  const parts: T.BufferGeometry[] = []
  const add = (
    geo: T.BufferGeometry,
    color: string,
    x: number,
    y: number,
    z: number,
    rotation = new T.Euler(),
  ) => {
    geo.applyMatrix4(
      new T.Matrix4().compose(
        new T.Vector3(x, y, z),
        new T.Quaternion().setFromEuler(rotation),
        new T.Vector3(1, 1, 1),
      ),
    )
    const g = geo.index ? geo.toNonIndexed() : geo
    g.deleteAttribute('uv')
    const base = new T.Color(color),
      normals = g.getAttribute('normal')
    const colors = new Float32Array(g.getAttribute('position').count * 3)
    const sun = new T.Vector3(-0.5, 1, 0.6).normalize(),
      n = new T.Vector3()
    for (let i = 0; i < normals.count; i++) {
      const shade = 0.65 + 0.35 * Math.max(0, n.fromBufferAttribute(normals, i).dot(sun))
      colors.set([base.r * shade, base.g * shade, base.b * shade], i * 3)
    }
    g.setAttribute('color', new T.BufferAttribute(colors, 3))
    parts.push(g)
  }
  const box = (x: number, y: number, z: number, w: number, h: number, d: number, c: string) =>
    add(new T.BoxGeometry(w, h, d), c, x, y, z)
  const green = '#34775e',
    dark = '#233c3f',
    brass = '#d9bb69',
    red = '#a34a3c',
    cream = '#eee0b2'
  box(0, 0.5, 0, 2.9, 0.55, kind === 0 ? 6.4 : kind === 1 ? 4.4 : 7.2, red)
  if (kind === 0) {
    add(
      new T.CylinderGeometry(1.15, 1.15, 4, 18),
      green,
      0,
      1.9,
      0.6,
      new T.Euler(Math.PI / 2, 0, 0),
    )
    for (const z of [-0.9, 0.8, 2.4]) add(new T.TorusGeometry(1.16, 0.09, 6, 18), brass, 0, 1.9, z)
    add(new T.CylinderGeometry(1, 1, 0.12, 18), dark, 0, 1.9, 2.65, new T.Euler(Math.PI / 2, 0, 0))
    add(
      new T.CylinderGeometry(0.34, 0.34, 0.25, 12),
      brass,
      0,
      2.8,
      2.8,
      new T.Euler(Math.PI / 2, 0, 0),
    )
    add(new T.CylinderGeometry(0.55, 0.34, 1.6, 12), dark, 0, 3.4, 1.4)
    add(new T.CylinderGeometry(0.65, 0.65, 0.18, 12), brass, 0, 4.2, 1.4)
    box(0, 2, -2, 2.8, 3, 1.7, green)
    box(0, 3.6, -2, 3.3, 0.3, 2.1, dark)
    for (const x of [-1, 1]) {
      box(x * 1.42, 2.5, -2, 0.06, 1.3, 1.1, '#a5c9c6')
      box(x * 1.5, 1, -0.3, 0.12, 0.12, 4, brass)
    }
    for (let i = 0; i < 7; i++) box((i - 3) * 0.43, 0.55, 3.35, 0.12, 1.1, 0.8, brass)
  } else if (kind === 1) {
    box(0, 1.6, 0, 2.8, 1.8, 4, green)
    box(0, 2.6, 0, 2.6, 0.3, 3.8, dark)
    for (let i = 0; i < 9; i++)
      add(
        new T.IcosahedronGeometry(0.45, 0),
        dark,
        ((i % 3) - 1) * 0.65,
        2.7,
        Math.floor(i / 3) - 1,
      )
    for (const x of [-1, 1]) box(x * 1.42, 1.65, 0, 0.04, 0.8, 2.9, brass)
  } else {
    box(0, 2, 0, 2.9, 2.8, 6.8, cream)
    box(0, 1, 0, 3, 0.6, 7, green)
    const roof = new T.CylinderGeometry(1.65, 1.65, 7.3, 14, 1, false, 0, Math.PI)
    roof.rotateZ(Math.PI / 2)
    roof.rotateY(Math.PI / 2)
    add(roof, dark, 0, 3.4, 0)
    for (const side of [-1, 1])
      for (let i = 0; i < 5; i++) {
        box(side * 1.48, 2.3, (i - 2) * 1.15, 0.05, 1.45, 0.8, green)
        box(side * 1.52, 2.4, (i - 2) * 1.15, 0.05, 1.1, 0.6, '#6e9c9e')
        box(side * 1.55, 2.4, (i - 2) * 1.15, 0.04, 0.08, 0.65, cream)
      }
    for (const z of [-3.43, 3.43]) box(0, 2, z, 1, 2, 0.04, green)
  }
  const result = mergeGeometries(parts)
  parts.forEach((g) => g.dispose())
  return result
}

export default function Water7Train({ reduced }: { reduced: boolean }) {
  const cars = useRef<(T.Group | null)[]>([])
  const axles = useRef<(T.Group | null)[]>([])
  const smoke = useRef<T.InstancedMesh>(null!)
  const connectors = useRef<T.InstancedMesh>(null!)
  const route = useMemo(createWater7Rail, [])
  const geometries = useMemo(
    () => [carriageGeometry(0), carriageGeometry(1), carriageGeometry(2)],
    [],
  )
  const scratch = useMemo(
    () => ({
      front: new T.Vector3(),
      back: new T.Vector3(),
      point: new T.Vector3(),
      a: new T.Vector3(),
      b: new T.Vector3(),
      dummy: new T.Object3D(),
    }),
    [],
  )
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries])
  useFrame(({ clock }) => {
    const length = route.getLength()
    // Let the entire train leave the far horizon before restarting behind the terminal.
    const distance = reduced ? 105 : ((clock.elapsedTime * 5 + 105) % (length + 85)) - 40
    cars.current.forEach((car, i) => {
      if (!car) return
      const d = distance - carriageOffsets[i]
      car.visible = d > 3.5 && d < length - 4
      sampleRail(route, d - 2.2, scratch.back)
      sampleRail(route, d + 2.2, scratch.front)
      sampleRail(route, d, scratch.point)
      car.position.copy(scratch.point)
      car.rotation.y = Math.atan2(
        scratch.front.x - scratch.back.x,
        scratch.front.z - scratch.back.z,
      )
      car.updateMatrixWorld()
    })
    axles.current.forEach((a) => {
      if (a) a.rotation.x = reduced ? 0 : distance / 0.6
    })
    for (let i = 0; i < 4; i++) {
      const a = cars.current[i]!,
        b = cars.current[i + 1]!
      scratch.a.set(0, 0.65, i === 0 ? -3.3 : i === 1 ? -2.3 : -3.7).applyMatrix4(a.matrixWorld)
      scratch.b.set(0, 0.65, i === 0 ? 2.3 : 3.7).applyMatrix4(b.matrixWorld)
      scratch.dummy.position.copy(scratch.a).add(scratch.b).multiplyScalar(0.5)
      scratch.dummy.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        scratch.point.subVectors(scratch.b, scratch.a).normalize(),
      )
      scratch.dummy.scale.set(
        0.12,
        a.visible && b.visible ? scratch.a.distanceTo(scratch.b) : 0,
        0.12,
      )
      scratch.dummy.updateMatrix()
      connectors.current.setMatrixAt(i, scratch.dummy.matrix)
    }
    connectors.current.instanceMatrix.needsUpdate = true
    const engine = cars.current[0]!
    for (let i = 0; i < 10; i++) {
      const age = (clock.elapsedTime * 0.45 + i / 10) % 1
      scratch.dummy.position.set(0, 4.5 + age * 9, 1.4 - age * 10).applyMatrix4(engine.matrixWorld)
      scratch.dummy.quaternion.identity()
      scratch.dummy.scale.setScalar(
        !reduced && engine.visible ? (0.4 + age * 1.8) * Math.sin(age * Math.PI) : 0,
      )
      scratch.dummy.updateMatrix()
      smoke.current.setMatrixAt(i, scratch.dummy.matrix)
    }
    smoke.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      {carriageOffsets.map((_, i) => (
        <group
          key={i}
          ref={(g) => {
            cars.current[i] = g
          }}
        >
          <mesh geometry={geometries[Math.min(i, 2)]}>
            <meshBasicMaterial vertexColors />
          </mesh>
          {[-1, 1].map((end, j) => (
            <group
              key={end}
              position={[0, 0.45, end * (i === 0 ? 1.85 : i === 1 ? 1.3 : 2.4)]}
              ref={(g) => {
                axles.current[i * 2 + j] = g
              }}
            >
              {[-1, 1].map((side) => (
                <group key={side} position={[side * 1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <mesh>
                    <cylinderGeometry args={[0.65, 0.65, 0.22, 12]} />
                    <meshBasicMaterial color="#283b3d" />
                  </mesh>
                  <mesh position={[0, side * -0.14, 0]}>
                    <boxGeometry args={[1, 0.06, 0.12]} />
                    <meshBasicMaterial color="#cbb77d" />
                  </mesh>
                </group>
              ))}
            </group>
          ))}
        </group>
      ))}
      <instancedMesh ref={connectors} args={[undefined, undefined, 4]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#37494a" />
      </instancedMesh>
      <instancedMesh ref={smoke} args={[undefined, undefined, 10]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#e6e7dd" transparent opacity={0.5} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}
