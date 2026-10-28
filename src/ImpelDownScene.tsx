import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as T from 'three'
import layout from './impel-down-layout.json' with { type: 'json' }
import { MeasuredIslandCamera } from './MeasuredIslandCamera'
import { Ocean } from './Ocean'
import { travel } from './world'

export function ImpelCamera(props: { selected: number | null; reduced: boolean }) {
  return <MeasuredIslandCamera {...props} layout={layout} />
}

export default function ImpelDown({
  selected,
  reduced,
  quiet,
  onReady,
}: {
  selected: number | null
  reduced: boolean
  quiet: boolean
  onReady: () => void
}) {
  const { scene: source } = useGLTF('/models/impel-down.glb'),
    { gl } = useThree()
  const [journeySection, setJourneySection] = useState(travel.progress >= 0.25)
  const mode =
    selected === null ? (journeySection ? 'section' : 'surface') : layout.landmarks[selected].mode
  const { scene, ship } = useMemo(() => {
    const scene = source.clone(true),
      ship = new T.Group(),
      moving: T.Object3D[] = []
    ship.name = 'Marine vessel moored motion'
    scene.traverse((o) => {
      if (!(o instanceof T.Mesh)) return
      if (o.name.startsWith('ship-')) moving.push(o)
      else o.layers.enable(1)
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        if (m.map) m.map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    })
    moving.forEach((o) => ship.add(o))
    scene.add(ship)
    return { scene, ship }
  }, [source, gl])
  useEffect(() => {
    scene.traverse((o) => {
      if (!(o instanceof T.Mesh)) return
      o.visible =
        mode === 'section'
          ? true
          : mode === 'surface'
            ? o.name.startsWith('surface-') || o.name.startsWith('ship-')
            : o.name.startsWith(`floor${mode}-`)
    })
    scene.userData.presentation = mode
  }, [scene, mode])
  useEffect(onReady, [onReady])
  const time = useRef(0)
  useFrame((_, dt) => {
    const section = travel.progress >= 0.25
    if (section !== journeySection) setJourneySection(section)
    if (!reduced && !quiet) time.current += Math.min(dt, 0.05)
    ship.position.y = reduced || quiet ? 0 : Math.sin(time.current * 0.45) * 0.05
  })
  return (
    <>
      <primitive object={scene} dispose={null} />
      <FloorAtmosphere mode={mode} reduced={reduced || quiet} />
      {mode === 'surface' && <Ocean reduced={reduced} rain={false} calm wide depthKey={selected} />}
    </>
  )
}

function FloorAtmosphere({ mode, reduced }: { mode: string; reduced: boolean }) {
  const mesh = useRef<T.InstancedMesh>(null!),
    clock = useRef(0)
  const dummy = useMemo(() => new T.Object3D(), [])
  const snow = mode === '5',
    active = snow || mode === '4'
  useFrame((_, dt) => {
    if (!active) return
    if (!reduced) clock.current += Math.min(dt, 0.05)
    for (let i = 0; i < 36; i++) {
      const a = i * 2.39996,
        r = snow ? 32 + (i % 9) * 8 : 31 + (i % 7) * 1.6
      const phase = (i * 0.731 + clock.current * (snow ? 0.55 : 0.8)) % 16
      dummy.position.set(Math.sin(a) * r, snow ? -266 - phase : -216 + phase, Math.cos(a) * r)
      dummy.scale.setScalar(snow ? 0.45 : 0.3)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, 36]}
      visible={active}
      frustumCulled={false}
      name="Impel floor atmosphere"
    >
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color={snow ? '#e9f3ec' : '#f2ad55'} />
    </instancedMesh>
  )
}
