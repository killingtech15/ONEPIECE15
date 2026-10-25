import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as T from 'three'
import layout from './sabaody-layout.json' with { type: 'json' }
import { MeasuredIslandCamera } from './MeasuredIslandCamera'

export function SabaodyCamera(props: { selected: number | null; reduced: boolean }) {
  return <MeasuredIslandCamera {...props} layout={layout} />
}

export default function Sabaody({
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
  const { scene: source } = useGLTF('/models/sabaody.glb')
  const { gl } = useThree()
  const { scene, ship } = useMemo(() => {
    const scene = source.clone(true),
      ship = new T.Group(),
      moving: T.Object3D[] = []
    ship.name = 'Sabaody Sunny motion'
    scene.traverse((o) => {
      if (!(o instanceof T.Mesh)) return
      if (o.name.startsWith('ship-')) moving.push(o)
      else o.layers.enable(1)
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats)
        if (m.map) m.map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    })
    moving.forEach((o) => ship.add(o))
    scene.add(ship)
    return { scene, ship }
  }, [source, gl])
  useEffect(() => {
    scene.traverse((o) => {
      if (o.name.startsWith('room-')) o.visible = selected === 5
      if (o.name.startsWith('shell-auction')) o.visible = selected !== 5
    })
  }, [scene, selected])
  useEffect(onReady, [onReady])
  const time = useRef(0)
  useFrame((_, dt) => {
    if (!reduced) time.current += Math.min(dt, 0.05)
    ship.position.y = reduced ? 0 : Math.sin(time.current * 0.7) * 0.08
  })
  return (
    <group>
      <primitive object={scene} dispose={null} />
      <Bubbles reduced={reduced} quiet={quiet} />
      <BubbleWheel reduced={reduced} />
    </group>
  )
}

function Bubbles({ reduced, quiet }: { reduced: boolean; quiet: boolean }) {
  const mesh = useRef<T.InstancedMesh>(null!),
    time = useRef(0)
  const dummy = useMemo(() => new T.Object3D(), [])
  const material = useMemo(
    () =>
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: T.FrontSide,
        uniforms: { strength: { value: 1 } },
        vertexShader: `varying vec3 vNormal;varying vec3 vEye;
    void main(){vec4 p=modelViewMatrix*instanceMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*mat3(instanceMatrix)*normal);vEye=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
        fragmentShader: `varying vec3 vNormal;varying vec3 vEye;uniform float strength;
    void main(){vec3 n=normalize(vNormal);float edge=pow(1.-abs(dot(n,normalize(vEye))),2.8);
    vec3 iridescent=.68+.28*cos(vec3(0.,2.1,4.2)+n.y*5.+n.x*3.);
    float glint=pow(max(0.,dot(n,normalize(vec3(-.5,.65,.6)))),38.);
    gl_FragColor=vec4(mix(iridescent,vec3(1.),glint),(.018+edge*.42+glint*.55)*strength);
    #include <colorspace_fragment>
    }`,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  useFrame((_, dt) => {
    if (!reduced) time.current += Math.min(dt, 0.05)
    material.uniforms.strength.value = quiet ? 0.35 : 1
    for (let i = 0; i < 48; i++) {
      const g = layout.groves[(i * 13) % 79],
        phase = (i * 0.618033 + time.current * 0.012) % 1
      dummy.position.set(
        g.x + Math.sin(i * 3 + time.current * 0.07) * 17,
        13 + phase * 133,
        g.z + Math.cos(i * 5 + time.current * 0.06) * 19,
      )
      dummy.scale.setScalar((1.5 + (i % 5) * 0.8) * Math.min(1, phase * 14, (1 - phase) * 14))
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    // Three tethered rental bubbles enclose the authored seats at the landing.
    for (let i = 0; i < 3; i++) {
      dummy.position.set(130 + i * 7, 15, -75)
      dummy.scale.setScalar(4.5)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(48 + i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, 51]}
      material={material}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 16, 10]} />
    </instancedMesh>
  )
}

function BubbleWheel({ reduced }: { reduced: boolean }) {
  const wheel = useRef<T.Group>(null!),
    pods = useRef<T.InstancedMesh>(null!),
    bases = useRef<T.InstancedMesh>(null!),
    seats = useRef<T.InstancedMesh>(null!),
    time = useRef(0)
  const dummy = useMemo(() => new T.Object3D(), [])
  const spokes = useMemo(() => Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6), [])
  const geometry = useMemo(() => {
    const parts: T.BufferGeometry[] = [
      new T.TorusGeometry(15, 0.3, 6, 64),
      new T.TorusGeometry(26, 0.3, 6, 64),
    ]
    for (const a of spokes) {
      const g = new T.CylinderGeometry(0.14, 0.14, 26, 6)
      g.rotateZ(a - Math.PI / 2)
      g.translate(Math.cos(a) * 13, Math.sin(a) * 13, 0)
      parts.push(g)
    }
    const merged = mergeGeometries(parts)
    parts.forEach((g) => g.dispose())
    return merged
  }, [spokes])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => {
    for (let i = 0; i < 12; i++) {
      bases.current.setColorAt(i, new T.Color(i % 2 ? '#e6c578' : '#cf95aa'))
      pods.current.setColorAt(i, new T.Color(i % 2 ? '#c6ead5' : '#eadce8'))
    }
  }, [])
  useFrame((_, dt) => {
    if (!reduced) time.current += Math.min(dt, 0.05)
    const angle = reduced ? 0 : time.current * 0.035
    wheel.current.rotation.z = angle
    for (let i = 0; i < 12; i++) {
      const a = spokes[i] + angle,
        x = Math.cos(a) * 26,
        y = Math.sin(a) * 26
      dummy.position.set(x, y, 0)
      dummy.updateMatrix()
      pods.current.setMatrixAt(i, dummy.matrix)
      dummy.position.y = y - 2
      dummy.updateMatrix()
      bases.current.setMatrixAt(i, dummy.matrix)
      dummy.position.y = y - 1.3
      dummy.updateMatrix()
      seats.current.setMatrixAt(i, dummy.matrix)
    }
    pods.current.instanceMatrix.needsUpdate = true
    bases.current.instanceMatrix.needsUpdate = true
    seats.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group name="Sabaody wheel" position={[23, 50, -184]}>
      <group ref={wheel}>
        <mesh geometry={geometry}>
          <meshBasicMaterial color="#6f9ba0" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.6, 2.6, 2, 20]} />
          <meshBasicMaterial color="#d9b76c" />
        </mesh>
      </group>
      <instancedMesh
        name="Level bubble gondolas"
        ref={pods}
        args={[undefined, undefined, 12]}
        frustumCulled={false}
      >
        <sphereGeometry args={[3.2, 14, 10]} />
        <meshBasicMaterial color="white" transparent opacity={0.18} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={bases} args={[undefined, undefined, 12]} frustumCulled={false}>
        <cylinderGeometry args={[2.4, 1.7, 0.7, 12]} />
        <meshBasicMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={seats} args={[undefined, undefined, 12]} frustumCulled={false}>
        <boxGeometry args={[2.6, 0.6, 1.7]} />
        <meshBasicMaterial color="#f0e7cd" />
      </instancedMesh>
    </group>
  )
}
