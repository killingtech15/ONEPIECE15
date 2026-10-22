import { useEffect, useMemo, useRef } from 'react'
import { addEffect, addAfterEffect, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as T from 'three'
import gsap from 'gsap'
import layout from './enies-layout.json' with { type: 'json' }
import { travel } from './world'

// Frame the authored subject in the visible UI-free rectangle, including phone cards.
export function EniesCamera({ selected, reduced }: { selected: number | null; reduced: boolean }) {
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

export default function EniesAtmosphere({ reduced }: { reduced: boolean }) {
  const gl = useThree((s) => s.gl)
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
  const flags = useRef<T.Group>(null!)
  const material = useMemo(
    () =>
      new T.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        side: T.DoubleSide,
        vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `uniform float time; varying vec2 vUv;
      void main(){float depth=1.-vUv.y;
      float streak=sin(vUv.x*1237.+sin(vUv.x*439.)*3.+sin(vUv.y*12.+time)*.7)*.5+.5;
      float fine=sin(vUv.x*3491.+vUv.y*8.+time*2.)*.5+.5;
      float flow=sin(vUv.y*45.+time*3.+sin(vUv.x*71.)*4.)*.5+.5;
      vec3 c=mix(vec3(.16,.44,.52),vec3(.72,.89,.87),.3+streak*.25+fine*.1+flow*.1);
      c=mix(c,vec3(.025,.095,.12),smoothstep(.25,1.,depth));
      c=mix(c,vec3(.88,.96,.89),smoothstep(.96,1.,vUv.y));gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  useFrame((_, dt) => {
    if (!reduced) material.uniforms.time.value += Math.min(dt, 0.05)
    flags.current.children.forEach((flag, i) => {
      flag.rotation.y = reduced ? 0 : Math.sin(material.uniforms.time.value * 1.2 + i) * 0.13
    })
  })
  return (
    <group>
      <mesh position={[0, -layout.chasmDepth / 2, 0]} material={material}>
        <cylinderGeometry
          args={[layout.chasmRadius, layout.chasmRadius * 0.91, layout.chasmDepth, 160, 1, true]}
        />
      </mesh>
      <mesh position={[0, -layout.chasmDepth, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[layout.chasmRadius, 128]} />
        <meshBasicMaterial color="#092b35" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position-y={0.12}>
        <ringGeometry args={[layout.chasmRadius - 0.5, layout.chasmRadius + 1.3, 160]} />
        <meshBasicMaterial color="#d7efe5" />
      </mesh>
      <group ref={flags}>
        {layout.flags.map(([x, y, z], i) => (
          <group key={i} position={[x, y + 6, z]}>
            <mesh position={[2, 0, 0]}>
              <planeGeometry args={[4, 2.4]} />
              <meshBasicMaterial color="#f4eee0" side={T.DoubleSide} />
            </mesh>
            <mesh position={[2, 0, 0.03]}>
              <planeGeometry args={[1.8, 0.17]} />
              <meshBasicMaterial color="#24484c" side={T.DoubleSide} />
            </mesh>
            <mesh position={[2, 0, 0.04]}>
              <planeGeometry args={[0.17, 1.8]} />
              <meshBasicMaterial color="#24484c" side={T.DoubleSide} />
            </mesh>
            {[
              [2, 0],
              [1.1, 0],
              [2.9, 0],
              [2, 0.9],
              [2, -0.9],
            ].map(([xx, yy], j) => (
              <mesh key={j} position={[xx, yy, 0.05]}>
                <circleGeometry args={[0.24, 12]} />
                <meshBasicMaterial color="#24484c" side={T.DoubleSide} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  )
}
