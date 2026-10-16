import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Billboard,
  Environment,
  Html,
  MeshTransmissionMaterial,
  PerspectiveCamera,
  Text,
  useGLTF,
} from '@react-three/drei'
import {
  Select,
  Selection,
  SelectiveBloom,
  ChromaticAberration,
  EffectComposer,
  SMAA,
} from '@react-three/postprocessing'
import { ChromaticAberrationEffect } from 'postprocessing'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'
import * as T from 'three'
import gsap from 'gsap'
import { Ocean } from './Ocean'
import { island, places, travel } from './world'
import titleFont from '@fontsource/cinzel/files/cinzel-latin-500-normal.woff?url'

type Props = {
  selected: number | null
  hover: number | null
  reduced: boolean
  rain: boolean
  quality: boolean
  onSelect: (index: number) => void
  onHover: (index: number | null) => void
  onReady: () => void
}

function CameraRig({ selected, reduced }: Pick<Props, 'selected' | 'reduced'>) {
  const rig = useRef<T.Group>(null!)
  const camera = useRef<T.PerspectiveCamera>(null!)
  const animation = useRef<gsap.core.Tween | null>(null)
  const pose = useRef({ x: 76, y: 57, z: 94, lx: -11, ly: 3, lz: 0 })
  const journey = useMemo(
    () =>
      new T.CatmullRomCurve3(
        [
          new T.Vector3(76, 57, 94),
          new T.Vector3(54, 35, 53),
          new T.Vector3(14, 27, 46),
          new T.Vector3(-35, 29, 36),
          new T.Vector3(-58, 29, 2),
          new T.Vector3(18, 36, 72),
        ],
        false,
        'catmullrom',
        0.45,
      ),
    [],
  )
  const focus = useMemo(() => new T.Vector3(), [])
  const point = useMemo(() => new T.Vector3(), [])
  const tangent = useMemo(() => new T.Vector3(), [])
  useEffect(() => {
    animation.current?.kill()
    if (selected !== null) {
      const p = places[selected]
      animation.current = gsap.to(pose.current, {
        x: p.target[0] + p.offset[0],
        y: p.target[1] + p.offset[1],
        z: p.target[2] + p.offset[2],
        lx: p.target[0] - 4,
        ly: p.target[1],
        lz: p.target[2],
        duration: reduced ? 0 : 1.5,
        ease: 'power4.inOut',
      })
    } else {
      const dest = journey.getPointAt(travel.progress)
      animation.current = gsap.to(pose.current, {
        x: dest.x,
        y: dest.y,
        z: dest.z,
        lx: -11 * (1 - travel.progress),
        ly: 4,
        lz: -1,
        duration: reduced ? 0 : 1.25,
        ease: 'power3.inOut',
      })
    }
    return () => {
      animation.current?.kill()
    }
  }, [selected, reduced, journey])
  useFrame((state, dt) => {
    if (selected === null && !animation.current?.isActive()) {
      journey.getPointAt(T.MathUtils.clamp(travel.progress, 0, 1), point)
      journey.getTangentAt(T.MathUtils.clamp(travel.progress, 0, 1), tangent)
      const damp = reduced ? 1 : 1 - Math.exp(-dt * 5)
      const p = pose.current
      p.x = T.MathUtils.lerp(p.x, point.x, damp)
      p.y = T.MathUtils.lerp(p.y, point.y, damp)
      p.z = T.MathUtils.lerp(p.z, point.z, damp)
      p.lx = T.MathUtils.lerp(p.lx, -11 * (1 - travel.progress) + tangent.x * 0.6, damp)
      p.ly = T.MathUtils.lerp(p.ly, 4, damp)
      p.lz = T.MathUtils.lerp(p.lz, -1 + tangent.z * 0.6, damp)
    }
    const p = pose.current
    rig.current.position.set(p.x, p.y, p.z)
    rig.current.updateMatrixWorld()
    focus.set(p.lx, p.ly, p.lz)
    if (!reduced && selected === null) focus.x += state.pointer.x * 0.7
    camera.current.lookAt(focus)
  })
  return (
    <group ref={rig} position={[76, 57, 94]}>
      <PerspectiveCamera ref={camera} makeDefault fov={37} near={0.2} far={420} />
    </group>
  )
}

function Island({ onReady, onSelect }: Pick<Props, 'onReady' | 'onSelect'>) {
  const { scene } = useGLTF(island.meshUrl)
  useEffect(() => {
    scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        const old = o.material as T.MeshBasicMaterial | T.MeshStandardMaterial
        if (!(old instanceof T.MeshBasicMaterial)) {
          o.material = new T.MeshBasicMaterial({
            map: old.emissiveMap ?? old.map,
            side: T.DoubleSide,
          })
        }
      }
    })
    onReady()
  }, [scene, onReady])
  return (
    <primitive
      object={scene}
      onClick={(e: { stopPropagation: () => void }) => {
        e.stopPropagation()
        onSelect(0)
      }}
    />
  )
}

function ArcTitle({ reduced }: { reduced: boolean }) {
  const { camera, viewport, size } = useThree()
  const group = useRef<T.Group>(null!)
  const titleRect = useRef({ left: 80, top: 220, height: 110 })
  useEffect(() => {
    const r = document.querySelector('.title-space')?.getBoundingClientRect()
    if (r) titleRect.current = { left: r.left, top: r.top, height: r.height }
  }, [size.width, size.height])
  const material = useMemo(() => {
    const noise = new SimplexNoise({ random: () => 0.73821 })
    const pixels = new Uint8Array(64 * 64 * 4)
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 64; x++) {
        const p = (y * 64 + x) * 4,
          n = (noise.noise(x * 0.16, y * 0.16) + 1) * 127
        pixels[p] = pixels[p + 1] = pixels[p + 2] = n
        pixels[p + 3] = 255
      }
    const tex = new T.DataTexture(pixels, 64, 64)
    tex.needsUpdate = true
    tex.magFilter = T.LinearFilter
    return new T.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uNoise: { value: tex },
        uColor: { value: new T.Color('#183f45') },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform sampler2D uNoise; uniform float uProgress; uniform vec3 uColor; varying vec2 vUv;
        void main(){float n=texture2D(uNoise,vUv).r;float threshold=vUv.x*.55+n*.45;
        if(threshold>uProgress)discard;gl_FragColor=vec4(uColor,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`,
    })
  }, [])
  useEffect(() => {
    const tween = gsap.to(material.uniforms.uProgress, {
      value: 1.1,
      duration: reduced ? 0 : 2.2,
      delay: reduced ? 0 : 0.4,
      ease: 'power2.out',
    })
    return () => {
      tween.kill()
    }
  }, [material, reduced])
  useEffect(
    () => () => {
      material.uniforms.uNoise.value.dispose()
      material.dispose()
    },
    [material],
  )
  // Geometry stays in the atlas margin while its ink is revealed by the shader.
  useFrame(() => {
    const distance = 35
    const h = 2 * Math.tan(T.MathUtils.degToRad((camera as T.PerspectiveCamera).fov / 2)) * distance
    const w = h * viewport.aspect
    const r = titleRect.current
    group.current.position
      .set(
        (r.left / size.width - 0.5) * w,
        (0.5 - (r.top + r.height * 0.5) / size.height) * h,
        -distance,
      )
      .applyMatrix4(camera.matrixWorld)
    group.current.quaternion.copy(camera.quaternion)
    group.current.scale.setScalar(w / size.width)
    group.current.visible = travel.progress < 0.18
  })
  return (
    <group ref={group}>
      <Text
        font={titleFont}
        fontSize={Math.min(80, Math.max(46, size.width * 0.058))}
        letterSpacing={0.01}
        anchorX="left"
        anchorY="middle"
        material={material}
        renderOrder={10}
      >
        ALABASTA
      </Text>
    </group>
  )
}

function Marker({
  index,
  selected,
  hover,
  onSelect,
  onHover,
}: Pick<Props, 'selected' | 'hover' | 'onSelect' | 'onHover'> & { index: number }) {
  const p = island.incidents[index].localPosition
  return (
    <Html position={[p.x, p.y + 1.4, p.z]} center occlude zIndexRange={[20, 0]}>
      <button
        className={`map-marker ${hover === index ? 'is-hovered' : ''} ${selected === index ? 'is-selected' : ''}`}
        aria-label={`Explore ${places[index].name}`}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(index)
        }}
        onPointerEnter={() => onHover(index)}
        onPointerLeave={() => onHover(null)}
        onFocus={() => onHover(index)}
        onBlur={() => onHover(null)}
      >
        <span className="marker-number">0{index + 1}</span>
        <span className="marker-label">{places[index].name}</span>
      </button>
    </Html>
  )
}

function PalaceFlags({ active, reduced }: { active: boolean; reduced: boolean }) {
  const flags = useRef<T.Group>(null!)
  useFrame(({ clock }) => {
    flags.current.children.forEach((o, i) => {
      o.rotation.y = reduced ? 0 : Math.sin(clock.elapsedTime * (active ? 4 : 1.7) + i) * 0.24
    })
  })
  return (
    <group>
      {[-4, 4].map((x) => (
        <mesh key={x} position={[6 + x, 15, -4.8]}>
          <cylinderGeometry args={[0.035, 0.035, 4, 8]} />
          <meshBasicMaterial color="#8f7654" />
        </mesh>
      ))}
      <group ref={flags}>
        {[-4, 4].map((x) => (
          <group key={x} position={[6 + x, 16.6, -4.8]}>
            <mesh position={[0.6, 0, 0]}>
              <planeGeometry args={[1.2, 0.65, 4, 2]} />
              <meshBasicMaterial color="#b66068" side={T.DoubleSide} />
            </mesh>
            <mesh position={[0.6, 0, 0.012]}>
              <circleGeometry args={[0.17, 12]} />
              <meshBasicMaterial color="#edd8a1" side={T.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function Falcon({ active, reduced }: { active: boolean; reduced: boolean }) {
  const ref = useRef<T.Group>(null!)
  useFrame(({ clock }) => {
    const t = reduced ? 0 : clock.elapsedTime * (active ? 0.8 : 0.2)
    ref.current.position.set(
      -1 + Math.cos(t) * 3.5,
      18 + Math.sin(t * 2) * 0.3,
      3 + Math.sin(t) * 3.5,
    )
    ref.current.rotation.y = -t
    ref.current.rotation.z = reduced ? 0 : Math.sin(t * 3) * 0.12
  })
  return (
    <group ref={ref}>
      <mesh rotation={[0, 0, -0.12]} position={[-0.45, 0, 0]}>
        <boxGeometry args={[1, 0.065, 0.2]} />
        <meshBasicMaterial color="#3e5358" />
      </mesh>
      <mesh rotation={[0, 0, 0.12]} position={[0.45, 0, 0]}>
        <boxGeometry args={[1, 0.065, 0.2]} />
        <meshBasicMaterial color="#3e5358" />
      </mesh>
      <mesh>
        <coneGeometry args={[0.12, 0.7, 4]} />
        <meshBasicMaterial color="#e6d7b8" />
      </mesh>
    </group>
  )
}

function Sand({ active, reduced }: { active: boolean; reduced: boolean }) {
  const ref = useRef<T.Points>(null!)
  const positions = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 270 }, (_, i) => {
          const n = Math.floor(i / 3),
            a = n * 2.39996
          return i % 3 === 0
            ? Math.cos(a) * (1 + n * 0.025)
            : i % 3 === 1
              ? n * 0.055
              : Math.sin(a) * (1 + n * 0.025)
        }),
      ),
    [],
  )
  useFrame((_, dt) => {
    if (!reduced) ref.current.rotation.y += dt * (active ? 1.7 : 0.15)
  })
  return (
    <points ref={ref} position={[-24, 2, -4]} visible={active && !reduced}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e9c993" size={0.13} transparent opacity={0.7} depthWrite={false} />
    </points>
  )
}

function Ship({ active, reduced }: { active: boolean; reduced: boolean }) {
  const group = useRef<T.Group>(null!)
  useFrame(({ clock }, dt) => {
    group.current.position.y = 0.7 + (reduced ? 0 : Math.sin(clock.elapsedTime * 1.2) * 0.13)
    group.current.rotation.y = T.MathUtils.damp(
      group.current.rotation.y,
      active ? -0.55 : 0.15,
      3,
      dt,
    )
    group.current.rotation.z = reduced ? 0 : Math.sin(clock.elapsedTime * 0.8) * 0.035
  })
  return (
    <group ref={group} position={[16, 0.7, 31]} scale={0.8}>
      <mesh scale={[1, 0.7, 2.1]}>
        <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshBasicMaterial color="#8f593b" side={T.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1, 2.1, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshBasicMaterial color="#dbb57f" side={T.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 4, 8]} />
        <meshBasicMaterial color="#72503c" />
      </mesh>
      <mesh position={[0, 2.7, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 1.8, 24, 1, true, -0.65, 1.3]} />
        <meshBasicMaterial color="#f6efd9" side={T.DoubleSide} />
      </mesh>
      <mesh position={[0, 3.75, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 2.5, 8]} />
        <meshBasicMaterial color="#765940" />
      </mesh>
      <mesh position={[0, 0.8, 1.9]}>
        <sphereGeometry args={[0.35, 12, 8]} />
        <meshBasicMaterial color="#eee4cd" />
      </mesh>
      <mesh position={[0, 1.1, -0.7]}>
        <boxGeometry args={[1, 0.8, 0.9]} />
        <meshBasicMaterial color="#e9d4a8" />
      </mesh>
      <mesh position={[0, 1.55, -0.7]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.8, 0.8, 0.15, 4]} />
        <meshBasicMaterial color="#b8593b" />
      </mesh>
    </group>
  )
}

function Rain({ rain, reduced }: { rain: boolean; reduced: boolean }) {
  const ref = useRef<T.LineSegments>(null!)
  const positions = useMemo(() => {
    const a = []
    for (let i = 0; i < 700; i++) {
      const x = Math.sin(i * 43.1) * 43,
        y = (i * 0.731) % 34,
        z = Math.cos(i * 79.3) * 32
      a.push(x, y, z, x - 0.1, y + 0.9, z)
    }
    return new Float32Array(a)
  }, [])
  useFrame(({ clock }) => {
    ref.current.position.y = reduced ? 0 : -((clock.elapsedTime * 13) % 12)
  })
  return (
    <lineSegments ref={ref} visible={rain && !reduced}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#d9eef0" transparent opacity={0.45} depthWrite={false} />
    </lineSegments>
  )
}

function LogPose({ reduced }: { reduced: boolean }) {
  const needle = useRef<T.Group>(null!)
  useFrame(({ clock }) => {
    needle.current.rotation.z = reduced ? -0.4 : Math.sin(clock.elapsedTime * 0.9) * 0.25 - 0.4
  })
  return (
    <group position={[27, 4, 20]} rotation={[0.3, 0, -0.2]} scale={1.3}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.17, 10, 40]} />
        <meshStandardMaterial color="#a97d39" metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.12, 32, 24]} />
        <MeshTransmissionMaterial
          transmission={1}
          ior={1.52}
          thickness={2.5}
          roughness={0.05}
          chromaticAberration={0.1}
          resolution={128}
          samples={4}
          backside={false}
        />
      </mesh>
      <group ref={needle}>
        <Select enabled>
          <mesh position={[0, 0.35, 0]}>
            <coneGeometry args={[0.13, 1.5, 4]} />
            <meshBasicMaterial color={new T.Color(2, 0.4, 0.06)} toneMapped={false} />
          </mesh>
        </Select>
      </group>
      <mesh position={[0, -1.15, 0]}>
        <cylinderGeometry args={[1.2, 0.9, 0.35, 32]} />
        <meshStandardMaterial color="#946631" metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh position={[0, -0.83, 0]}>
        <cylinderGeometry args={[0.88, 0.88, 0.06, 32]} />
        <meshBasicMaterial color="#e7d9b0" />
      </mesh>
      <mesh position={[0, -1.4, 0]}>
        <boxGeometry args={[1.35, 0.2, 3.4]} />
        <meshStandardMaterial color="#584032" roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh
          key={i}
          position={[Math.cos((i * Math.PI) / 4) * 0.72, -0.78, Math.sin((i * Math.PI) / 4) * 0.72]}
          rotation={[0, (-i * Math.PI) / 4, 0]}
        >
          <boxGeometry args={[0.16, 0.02, 0.035]} />
          <meshBasicMaterial color="#644c36" />
        </mesh>
      ))}
    </group>
  )
}

function Effects({
  reduced,
  quality,
  light,
}: Pick<Props, 'reduced' | 'quality'> & { light: { current: T.DirectionalLight | null } }) {
  const aberration = useRef<ChromaticAberrationEffect>(null)
  useFrame(() => {
    aberration.current?.offset.setScalar(
      reduced ? 0 : Math.min(Math.abs(travel.velocity) * 0.000009, 0.00045),
    )
  })
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <SelectiveBloom
        lights={[light]}
        luminanceThreshold={0.8}
        intensity={quality ? 1.5 : 0.3}
        mipmapBlur
        ignoreBackground
      />
      <ChromaticAberration
        ref={aberration}
        offset={new T.Vector2(0, 0)}
        radialModulation
        modulationOffset={0.4}
      />
      <SMAA />
    </EffectComposer>
  )
}

export default function Scene(props: Props) {
  const { selected, hover, reduced, rain, onSelect, onHover, onReady, quality } = props
  const sunlight = useRef<T.DirectionalLight>(null!)
  return (
    <Selection>
      <color attach="background" args={['#bcd8db']} />
      <fog attach="fog" args={['#bcd8db', 145, 300]} />
      <CameraRig selected={selected} reduced={reduced} />
      <ambientLight intensity={1.5} />
      <directionalLight ref={sunlight} position={[-30, 60, 20]} intensity={2} />
      <Environment
        files="/environment/city.hdr"
        environmentIntensity={0.5}
        environmentRotation={[0, 1, 0]}
      />
      <Island onReady={onReady} onSelect={onSelect} />
      <Ocean reduced={reduced} rain={rain} />
      {selected === null && <ArcTitle reduced={reduced} />}
      {places.map((_, index) => (
        <Marker
          key={index}
          index={index}
          selected={selected}
          hover={hover}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
      <PalaceFlags active={hover === 0 || selected === 0} reduced={reduced} />
      <Falcon active={hover === 1 || selected === 1} reduced={reduced} />
      <Sand active={hover === 2 || selected === 2} reduced={reduced} />
      <Ship active={hover === 3 || selected === 3} reduced={reduced} />
      <Rain rain={rain} reduced={reduced} />
      <LogPose reduced={reduced} />
      <Effects reduced={reduced} quality={quality} light={sunlight} />
    </Selection>
  )
}
