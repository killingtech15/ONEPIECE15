import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Environment,
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
  markerLayer: HTMLDivElement | null
  onWorldMap: () => void
}

function CameraRig({ selected, reduced }: Pick<Props, 'selected' | 'reduced'>) {
  const size = useThree((state) => state.size)
  const rig = useRef<T.Group>(null!)
  const camera = useRef<T.PerspectiveCamera>(null!)
  const animation = useRef<gsap.core.Tween | null>(null)
  const pose = useRef({ x: 76, y: 57, z: 94, lx: -11, ly: 3, lz: 0, shift: 0, shiftY: 0 })
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
      // Frame each landmark in the space beside the story, at any aspect ratio.
      const panel = document.querySelector('.story')?.getBoundingClientRect()
      const mobile = size.width <= 760
      const reserved = mobile ? 0 : Math.min((panel?.right ?? 0) + 24, size.width * 0.55)
      const bottom = mobile ? size.height - (panel?.top ?? size.height) + 12 : 0
      const halfFov = T.MathUtils.degToRad(37 / 2)
      const availableWidth = Math.max(1, size.width - reserved - 32)
      const fitAngle = Math.atan(
        Math.tan(halfFov) *
          Math.min(
            availableWidth / size.height,
            Math.max(0.2, (size.height - bottom - 110) / size.height),
          ),
      )
      const distance = p.radius / Math.sin(fitAngle)
      const offset = new T.Vector3(...p.offset).normalize().multiplyScalar(distance)
      animation.current = gsap.to(pose.current, {
        x: p.target[0] + offset.x,
        y: p.target[1] + offset.y,
        z: p.target[2] + offset.z,
        lx: p.target[0],
        ly: p.target[1],
        lz: p.target[2],
        shift: reserved / size.width,
        shiftY: mobile ? (bottom - 60) / size.height : 0,
        duration: reduced ? 0 : 1.25,
        ease: 'power2.inOut',
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
        shift: 0,
        shiftY: 0,
        duration: reduced ? 0 : 1.25,
        ease: 'power3.inOut',
      })
    }
    return () => {
      animation.current?.kill()
    }
  }, [selected, reduced, journey, size.width, size.height])
  useFrame((_, dt) => {
    if (selected === null && !animation.current?.isActive()) {
      journey.getPointAt(T.MathUtils.clamp(travel.progress, 0, 1), point)
      journey.getTangentAt(T.MathUtils.clamp(travel.progress, 0, 1), tangent)
      const damp = reduced ? 1 : 1 - Math.exp(-dt * 12)
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
    if (selected === null && size.width <= 760) {
      const scale = Math.max(1, (size.height / size.width) * 0.95)
      rig.current.position.set(
        p.lx + (p.x - p.lx) * scale,
        p.ly + (p.y - p.ly) * scale,
        p.lz + (p.z - p.lz) * scale,
      )
    }
    rig.current.updateMatrixWorld()
    focus.set(p.lx, p.ly, p.lz)
    camera.current.lookAt(focus)
    camera.current.setViewOffset(
      size.width,
      size.height,
      (-p.shift * size.width) / 2,
      (p.shiftY * size.height) / 2,
      size.width,
      size.height,
    )
    camera.current.updateMatrixWorld()
  }, -3)
  return (
    <group ref={rig} position={[76, 57, 94]}>
      <PerspectiveCamera ref={camera} makeDefault fov={37} near={0.2} far={420} />
    </group>
  )
}

function Island({ onReady }: Pick<Props, 'onReady'>) {
  const { scene } = useGLTF(island.meshUrl)
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.layers.enable(1)
        const old = o.material as T.MeshBasicMaterial | T.MeshStandardMaterial
        if (!(old instanceof T.MeshBasicMaterial)) {
          o.material = new T.MeshBasicMaterial({
            map: old.emissiveMap ?? old.map,
            side: T.DoubleSide,
          })
        }
        const map = (o.material as T.MeshBasicMaterial).map
        if (map) {
          map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
          map.minFilter = T.LinearMipmapLinearFilter
          map.magFilter = T.LinearFilter
          map.needsUpdate = true
        }
      }
    })
    onReady()
  }, [scene, onReady, gl])
  return <primitive object={scene} />
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
    group.current.visible = travel.progress <= 0.16
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

// One DOM layer projects all anchors after the camera updates. No per-marker
// scene raycasts, occlusion toggles, or React renders during camera movement.
function Markers({ markerLayer }: Pick<Props, 'markerLayer'>) {
  const buttons = useMemo(
    () =>
      markerLayer ? Array.from(markerLayer.querySelectorAll<HTMLButtonElement>('.map-marker')) : [],
    [markerLayer],
  )
  const points = useMemo(
    () => [
      ...island.incidents.map(({ localPosition: p }) => new T.Vector3(p.x, p.y + 1.4, p.z)),
      new T.Vector3(16, 1.6, 31),
    ],
    [],
  )
  const projected = useMemo(() => new T.Vector3(), [])
  useFrame(({ camera, size }) => {
    points.forEach((point, i) => {
      const button = buttons[i]
      if (!button) return
      projected.copy(point).project(camera)
      const x = ((projected.x + 1) * size.width) / 2
      const y = ((1 - projected.y) * size.height) / 2
      button.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-100%)`
      button.style.visibility =
        projected.z < -1 || projected.z > 1 || x < 0 || x > size.width || y < 0 || y > size.height
          ? 'hidden'
          : 'visible'
    })
  })
  return null
}

export function MarkerButtons({
  selected,
  hover,
  onSelect,
  onHover,
  onWorldMap,
}: Pick<Props, 'selected' | 'hover' | 'onSelect' | 'onHover' | 'onWorldMap'>) {
  return (
    <>
      {places.map((place, index) => (
        <button
          key={place.name}
          className={`map-marker ${hover === index ? 'is-hovered' : ''} ${selected === index ? 'is-selected' : ''}`}
          aria-label={`Explore ${place.name}`}
          onClick={() => onSelect(index)}
          onPointerEnter={() => onHover(index)}
          onPointerLeave={() => onHover(null)}
          onFocus={() => onHover(index)}
          onBlur={() => onHover(null)}
        >
          <span className="marker-number">0{index + 1}</span>
          <span className="marker-label">{place.name}</span>
        </button>
      ))}
      <button
        className="map-marker merry-marker"
        onClick={onWorldMap}
        aria-label="Board the Going Merry and open the world map"
      >
        <span className="marker-number">⚓</span>
        <span className="marker-label">
          Going Merry <small>OPEN WORLD MAP ↗</small>
        </span>
      </button>
    </>
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

function Sand({
  active,
  reduced,
  position = [-24, 2, -4],
}: {
  active: boolean
  reduced: boolean
  position?: [number, number, number]
}) {
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
    <points ref={ref} position={position} visible={active && !reduced}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e9c993" size={0.13} transparent opacity={0.7} depthWrite={false} />
    </points>
  )
}

function Ship({
  active,
  reduced,
  onWorldMap,
}: {
  active: boolean
  reduced: boolean
  onWorldMap: () => void
}) {
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
    <group
      ref={group}
      position={[16, 0.7, 31]}
      scale={1.15}
      onClick={(e) => {
        e.stopPropagation()
        onWorldMap()
      }}
    >
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
      <mesh position={[0, 0.72, 2.2]} scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.24, 16, 12]} />
        <meshBasicMaterial color="#f6ead3" />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.32, 0.9, 1.88]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.22, 0.09, 8, 20, Math.PI * 1.7]} />
            <meshBasicMaterial color="#bb9363" />
          </mesh>
          <mesh position={[side * 0.2, 0.88, 2.16]}>
            <sphereGeometry args={[0.048, 10, 8]} />
            <meshBasicMaterial color="#352e28" />
          </mesh>
          <mesh position={[side * 0.86, 0.32, -0.1]}>
            <boxGeometry args={[0.08, 0.08, 2.8]} />
            <meshBasicMaterial color="#ece0bd" />
          </mesh>
        </group>
      ))}
      <group position={[0, 2.7, 1.13]}>
        <mesh>
          <circleGeometry args={[0.26, 24]} />
          <meshBasicMaterial color="#313834" side={T.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.2, 0.015]}>
          <boxGeometry args={[0.7, 0.09, 0.025]} />
          <meshBasicMaterial color="#c89e4c" />
        </mesh>
        <mesh position={[0, 0.3, 0.015]}>
          <circleGeometry args={[0.2, 20, 0, Math.PI]} />
          <meshBasicMaterial color="#c89e4c" side={T.DoubleSide} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.1, 0.02, 0.02]}>
            <circleGeometry args={[0.06, 12]} />
            <meshBasicMaterial color="#f6efd9" />
          </mesh>
        ))}
      </group>
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
    for (let i = 0; i < 320; i++) {
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

function LogPose({ reduced, quality }: { reduced: boolean; quality: boolean }) {
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
        {quality ? (
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
        ) : (
          <meshPhysicalMaterial
            color="#d6efeb"
            transparent
            opacity={0.23}
            roughness={0.06}
            metalness={0.1}
            depthWrite={false}
          />
        )}
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
  const { selected, hover, reduced, rain, onReady, quality } = props
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
      <Island onReady={onReady} />
      <Ocean reduced={reduced} rain={rain} />
      {selected === null && <ArcTitle reduced={reduced} />}
      <Markers {...props} />
      <PalaceFlags active={hover === 0 || selected === 0} reduced={reduced} />
      <Falcon active={hover === 1 || selected === 1} reduced={reduced} />
      <Sand active={hover === 2 || selected === 2} reduced={reduced} />
      <Sand active={hover === 5 || selected === 5} reduced={reduced} position={[-22, 2, 12]} />
      <Sand active={hover === 6 || selected === 6} reduced={reduced} position={[19, 2, 21]} />
      <Ship
        active={hover === 4 || selected === 4}
        reduced={reduced}
        onWorldMap={props.onWorldMap}
      />
      <Rain rain={rain} reduced={reduced} />
      <LogPose reduced={reduced} quality={quality} />
      {quality && <Effects reduced={reduced} quality={quality} light={sunlight} />}
    </Selection>
  )
}
