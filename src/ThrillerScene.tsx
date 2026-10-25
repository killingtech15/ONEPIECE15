import { useEffect, useMemo, useRef } from 'react'
import { addEffect, addAfterEffect, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, useGLTF } from '@react-three/drei'
import * as T from 'three'
import gsap from 'gsap'
import layout from './thriller-layout.json' with { type: 'json' }
import { travel } from './world'

// Frame the authored subject in the visible UI-free rectangle, including phone cards.
export function ThrillerCamera({
  selected,
  reduced,
}: {
  selected: number | null
  reduced: boolean
}) {
  const camera = useRef<T.PerspectiveCamera>(null!)
  const { size } = useThree()
  const pose = useRef({ x: 510, y: 370, z: 690, lx: 0, ly: 55, lz: -65, sx: 0, sy: 0 })
  const animation = useRef<gsap.core.Tween | null>(null)
  const measured = useRef({ left: 0, top: 0, width: 1, height: 1 })
  const curves = useMemo(
    () => ({
      eye: new T.CatmullRomCurve3(
        layout.journey.map((p) => new T.Vector3(...p.eye)),
        false,
        'catmullrom',
        0.35,
      ),
      look: new T.CatmullRomCurve3(
        layout.journey.map((p) => new T.Vector3(...p.look)),
        false,
        'catmullrom',
        0.35,
      ),
    }),
    [],
  )
  const eye = useMemo(() => new T.Vector3(), []),
    look = useMemo(() => new T.Vector3(), []),
    overviewEye = useMemo(() => new T.Vector3(), []),
    overviewLook = useMemo(() => new T.Vector3(...layout.overviewTarget), [])
  useEffect(() => {
    const phone = size.width <= 760
    const measure = () => {
      const story = document.querySelector('.story')?.getBoundingClientRect()
      const intro = document.querySelector('.intro')?.getBoundingClientRect()
      const controls = document.querySelector('.scene-controls')?.getBoundingClientRect()
      const left = phone
        ? 14
        : selected !== null
          ? (story?.right ?? 430) + 24
          : Math.min(510, size.width * 0.38)
      const top = phone ? (selected !== null ? 76 : (intro?.bottom ?? 240) + 12) : 100
      const bottom = phone
        ? selected !== null
          ? (story?.top ?? size.height) - 12
          : (controls?.top ?? size.height) - 12
        : size.height - 70
      measured.current = {
        left,
        top,
        width: Math.max(60, size.width - left - (phone ? 14 : 24)),
        height: Math.max(80, bottom - top),
      }
      if (selected !== null) {
        const p = layout.landmarks[selected],
          r = measured.current
        const angle = Math.atan(
          (Math.tan(T.MathUtils.degToRad(18.5)) * Math.min(r.width, r.height)) / size.height,
        )
        const d = p.radius / Math.sin(angle),
          offset = new T.Vector3(...p.offset).normalize().multiplyScalar(d)
        animation.current?.kill()
        animation.current = gsap.to(pose.current, {
          x: p.target[0] + offset.x,
          y: p.target[1] + offset.y,
          z: p.target[2] + offset.z,
          lx: p.target[0],
          ly: p.target[1],
          lz: p.target[2],
          sx: (r.left + r.width / 2) / size.width - 0.5,
          sy: 0.5 - (r.top + r.height / 2) / size.height,
          duration: reduced ? 0 : 1.25,
          ease: 'power2.inOut',
        })
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const selector of ['.story', '.intro', '.scene-controls']) {
      const e = document.querySelector(selector)
      if (e) observer.observe(e)
    }
    return () => {
      observer.disconnect()
      animation.current?.kill()
    }
  }, [selected, reduced, size.width, size.height])
  useFrame((_, dt) => {
    if (selected === null) {
      const t = T.MathUtils.clamp(travel.progress, 0, 1)
      curves.eye.getPoint(t, eye)
      curves.look.getPoint(t, look)
      const phone = size.width <= 760,
        r = measured.current
      const overviewWeight = 1 - T.MathUtils.smoothstep(t, 0.12, 0.3)
      if (phone) eye.sub(look).multiplyScalar(1.65).add(look)
      if (overviewWeight > 0) {
        const a = Math.atan(
          (Math.tan(T.MathUtils.degToRad(18.5)) * Math.min(r.width, r.height)) / size.height,
        )
        overviewEye
          .copy(eye)
          .sub(overviewLook)
          .normalize()
          .multiplyScalar(layout.overviewRadius / Math.sin(a))
          .add(overviewLook)
        eye.lerp(overviewEye, overviewWeight)
        look.lerp(overviewLook, overviewWeight)
      }
      const blend = reduced ? 1 : 1 - Math.exp(-dt * 5),
        p = pose.current
      p.x = T.MathUtils.lerp(p.x, eye.x, blend)
      p.y = T.MathUtils.lerp(p.y, eye.y, blend)
      p.z = T.MathUtils.lerp(p.z, eye.z, blend)
      p.lx = T.MathUtils.lerp(p.lx, look.x, blend)
      p.ly = T.MathUtils.lerp(p.ly, look.y, blend)
      p.lz = T.MathUtils.lerp(p.lz, look.z, blend)
      p.sx = T.MathUtils.lerp(
        p.sx,
        overviewWeight * ((r.left + r.width / 2) / size.width - 0.5),
        blend,
      )
      p.sy = T.MathUtils.lerp(
        p.sy,
        overviewWeight * (0.5 - (r.top + r.height / 2) / size.height),
        blend,
      )
    }
    const p = pose.current,
      c = camera.current
    c.position.set(p.x, p.y, p.z)
    c.lookAt(p.lx, p.ly, p.lz)
    c.setViewOffset(
      size.width,
      size.height,
      -p.sx * size.width,
      p.sy * size.height,
      size.width,
      size.height,
    )
    c.updateMatrixWorld()
  }, -3)
  return <PerspectiveCamera ref={camera} makeDefault fov={37} near={2} far={9000} />
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
