import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as T from 'three'
import layout from './amazon-lily-layout.json' with { type: 'json' }
import { MeasuredIslandCamera } from './MeasuredIslandCamera'

export function AmazonCamera(props: { selected: number | null; reduced: boolean }) {
  return <MeasuredIslandCamera {...props} layout={layout} />
}

export default function AmazonLily({
  reduced,
  quiet,
  onReady,
}: {
  reduced: boolean
  quiet: boolean
  onReady: () => void
}) {
  const { scene: source } = useGLTF('/models/amazon-lily.glb')
  const { gl } = useThree()
  const { scene, ship } = useMemo(() => {
    const scene = source.clone(true),
      ship = new T.Group(),
      moving: T.Object3D[] = []
    ship.name = 'Perfume Yuda moored motion'
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
  useEffect(onReady, [onReady])
  const time = useRef(0)
  useFrame((_, dt) => {
    if (!reduced && !quiet) time.current += Math.min(dt, 0.05)
    ship.position.y = reduced || quiet ? 0 : Math.sin(time.current * 0.45) * 0.06
  })
  return <primitive object={scene} dispose={null} />
}
