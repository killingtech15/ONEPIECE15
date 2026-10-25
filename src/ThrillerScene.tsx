import { useEffect, useMemo, useRef } from 'react'
import { addEffect, addAfterEffect, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as T from 'three'
import layout from './thriller-layout.json' with { type: 'json' }
import { MeasuredIslandCamera } from './MeasuredIslandCamera'

export function ThrillerCamera(props: { selected: number | null; reduced: boolean }) {
  return <MeasuredIslandCamera {...props} layout={layout} />
}

export default function ThrillerBark({
  selected,
  reduced,
  clearer,
  onReady,
}: {
  selected: number | null
  reduced: boolean
  clearer: boolean
  onReady: () => void
}) {
  const { scene: source } = useGLTF('/models/thriller-bark.glb')
  const { gl } = useThree()
  const { scene, ship } = useMemo(() => {
    const scene = source.clone(true),
      ship = new T.Group()
    ship.name = 'Sunny motion'
    const moving: T.Object3D[] = []
    scene.traverse((o) => {
      if (!(o instanceof T.Mesh)) return
      if (o.name.startsWith('ship-')) moving.push(o)
      else o.layers.enable(1)
      const materials = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of materials)
        if (m.map) m.map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    })
    moving.forEach((o) => ship.add(o))
    scene.add(ship)
    return { scene, ship }
  }, [source, gl])
  const room = selected === null ? undefined : layout.landmarks[selected].room
  // Selective visibility is instance-local; the cached GLTF remains intact on re-entry.
  useEffect(() => {
    scene.traverse((o) => {
      if (o.name.startsWith('room-')) o.visible = !!room && o.name.startsWith(`room-${room}-`)
      if (o.name.startsWith('shell-')) o.visible = !room || !o.name.startsWith(`shell-${room}-`)
    })
  }, [scene, room])
  useEffect(onReady, [onReady])
  const mist = useMemo(
    () =>
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
        uniforms: { time: { value: 0 }, strength: { value: 0.1 } },
        vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec2 vUv; uniform float time; uniform float strength;
    void main(){vec2 p=(vUv-.5)*2.;float r=length(p);
    float n=.5+.25*sin(p.x*17.+sin(p.y*9.)+time*.12)+.25*sin(p.y*23.-time*.09);
    float a=(1.-smoothstep(.65,1.,r))*smoothstep(.2,.45,r)*n*strength;
    gl_FragColor=vec4(.66,.7,.78,a);
    #include <colorspace_fragment>
    }`,
      }),
    [],
  )
  useEffect(() => () => mist.dispose(), [mist])
  useFrame((_, dt) => {
    if (!reduced) mist.uniforms.time.value += Math.min(dt, 0.05)
    mist.uniforms.strength.value = clearer ? 0.025 : 0.16
    ship.position.y = reduced ? 0 : Math.sin(mist.uniforms.time.value * 0.8) * 0.1
  })
  useEffect(() => {
    if (!import.meta.env.DEV) return
    let last = 0
    const autoReset = gl.info.autoReset
    gl.info.autoReset = false
    const before = addEffect(() => gl.info.reset())
    const after = addAfterEffect(() => {
      if (performance.now() - last < 1000) return
      last = performance.now()
      gl.domElement.dataset.renderStats = JSON.stringify({
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
      })
    })
    return () => {
      before()
      after()
      gl.info.autoReset = autoReset
      delete gl.domElement.dataset.renderStats
    }
  }, [gl])
  return (
    <group>
      <primitive object={scene} dispose={null} />
      <Bats reduced={reduced} />
      {[7, 17].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, y * 0.1]} material={mist}>
          <planeGeometry args={[460, 460]} />
        </mesh>
      ))}
    </group>
  )
}

function Bats({ reduced }: { reduced: boolean }) {
  const wings = useRef<T.InstancedMesh>(null!)
  const bodies = useRef<T.InstancedMesh>(null!)
  const object = useMemo(() => new T.Object3D(), [])
  const shape = useMemo(
    () =>
      new T.Shape()
        .moveTo(0, 0)
        .lineTo(2.1, 0.9)
        .lineTo(1.5, 0.1)
        .lineTo(1.8, -0.45)
        .lineTo(0.8, -0.2)
        .lineTo(0.4, -0.7)
        .closePath(),
    [],
  )
  useFrame(({ clock }) => {
    for (let i = 0; i < 5; i++) {
      const t = (reduced ? 0 : clock.elapsedTime * 0.22) + i * 1.25
      const x = -57 + Math.cos(t) * (12 + i),
        y = 31 + i * 2 + Math.sin(t * 2) * 2,
        z = 25 + Math.sin(t) * (15 + i)
      for (const side of [-1, 1]) {
        object.position.set(x, y, z)
        object.rotation.set(
          0.12,
          -t + (side < 0 ? Math.PI : 0),
          side * (reduced ? 0.15 : Math.sin(t * 12 + i) * 0.45),
        )
        object.scale.set(0.75, 0.75, 0.75)
        object.updateMatrix()
        wings.current.setMatrixAt(i * 2 + (side === 1 ? 1 : 0), object.matrix)
      }
      object.rotation.set(0, -t, 0)
      object.scale.set(0.18, 0.25, 0.65)
      object.updateMatrix()
      bodies.current.setMatrixAt(i, object.matrix)
    }
    wings.current.instanceMatrix.needsUpdate = true
    bodies.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      <instancedMesh ref={wings} args={[undefined, undefined, 10]} frustumCulled={false}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color="#353344" side={T.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={bodies} args={[undefined, undefined, 5]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#353344" />
      </instancedMesh>
    </group>
  )
}
