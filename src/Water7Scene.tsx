import { useEffect, useMemo, useRef } from 'react'
import { addAfterEffect, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as T from 'three'
import Water7Train from './Water7Train'
import layout from './water7-layout.json' with { type: 'json' }
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function FountainFlow({ reduced }: { reduced: boolean }) {
  const geometry = useMemo(() => {
    const streams: T.BufferGeometry[] = []
    for (const [startRadius, top, endRadius, bottom] of [
      [1, 69, 6, 60],
      [3, 60, 11, 49],
      [5, 49, 16, 37],
    ]) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        const at = (r: number, y: number) => new T.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
        const curve = new T.QuadraticBezierCurve3(
          at(startRadius, top),
          at(endRadius, top + 2),
          at(endRadius, bottom),
        )
        streams.push(new T.TubeGeometry(curve, 16, 0.24, 5, false))
      }
    }
    const result = mergeGeometries(streams)
    streams.forEach((g) => g.dispose())
    return result
  }, [])
  const material = useMemo(
    () =>
      new T.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        transparent: true,
        depthWrite: false,
        vertexShader:
          'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: `uniform float time; varying vec2 vUv;
      void main(){float ripple=.5+.5*sin(vUv.x*90.-time*5.);
      gl_FragColor=vec4(mix(vec3(.32,.72,.78),vec3(.85,.98,.96),ripple),.85);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
      }),
    [],
  )
  useFrame((_, dt) => {
    if (!reduced) material.uniforms.time.value += Math.min(dt, 0.05)
  })
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  return <mesh geometry={geometry} material={material} />
}

export default function Water7({
  onReady,
  reduced,
  rain,
}: {
  onReady: () => void
  reduced: boolean
  rain: boolean
}) {
  const { scene } = useGLTF('/models/water7.glb')
  const gl = useThree((s) => s.gl)
  const boat = useRef<T.Group>(null!)
  const water = useRef<T.Group>(null!)
  const swell = useRef<T.Mesh>(null!)
  const sampleTime = useRef(0)
  useEffect(() => {
    scene.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.layers.enable(1)
        const map = (o.material as T.MeshBasicMaterial).map
        if (map) {
          map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
          map.minFilter = T.LinearMipmapLinearFilter
          map.needsUpdate = true
        }
      }
    })
    onReady()
  }, [scene, onReady, gl])
  useEffect(() => {
    if (!import.meta.env.DEV) return
    return addAfterEffect(() => {
      if (performance.now() - sampleTime.current < 1000) return
      sampleTime.current = performance.now()
      gl.domElement.dataset.renderStats = JSON.stringify({
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
      })
    })
  }, [gl])
  useFrame(({ clock }, dt) => {
    const time = reduced ? 0 : clock.elapsedTime
    boat.current.position.y = 6.8 + Math.sin(time * 1.4) * 0.12
    boat.current.position.x = -41 + Math.sin(time * 0.16) * 3
    water.current.children.forEach((o, i) => {
      o.scale.x = 1 + Math.sin(time * 2 + i) * 0.06
    })
    swell.current.position.y = reduced
      ? rain
        ? 3
        : -30
      : T.MathUtils.damp(
          swell.current.position.y,
          rain ? 3 + Math.sin(time * 0.25) * 2 : -30,
          2,
          dt,
        )
  })
  return (
    <group>
      <primitive object={scene} />
      <FountainFlow reduced={reduced} />
      <mesh ref={swell} position={[0, -30, -190]} scale={[230, 28, 8]}>
        <sphereGeometry args={[1, 40, 12]} />
        <meshBasicMaterial color="#609eaa" />
      </mesh>
      <group ref={water}>
        {[0, 1, 2, 3].flatMap((i) =>
          layout.waterfalls.map(([r, y, h]) => (
            <mesh
              key={`${i}-${r}`}
              position={[Math.cos((i * Math.PI) / 2) * r, y, Math.sin((i * Math.PI) / 2) * r]}
              rotation={[0, Math.PI / 2 - (i * Math.PI) / 2, 0]}
            >
              <boxGeometry args={[2.5, h, 0.15]} />
              <meshBasicMaterial
                color={rain ? '#90d5df' : '#b0e4df'}
                transparent
                opacity={0.8}
                depthWrite={false}
              />
            </mesh>
          )),
        )}
        <mesh position={[0, 72, 0]}>
          <cylinderGeometry args={[0.25, 1.1, 5, 12]} />
          <meshBasicMaterial color="#c4f5ee" transparent opacity={0.8} depthWrite={false} />
        </mesh>
      </group>
      <Water7Train reduced={reduced} />
      <group ref={boat} position={[-41, 6.8, 68]}>
        <mesh>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#bf7854" />
        </mesh>
        <mesh position={[0, 0, 2]} scale={[1.2, 0.4, 2]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#527e8c" />
        </mesh>
        <mesh position={[0, 1.1, 0.1]}>
          <sphereGeometry args={[0.5, 10, 8]} />
          <meshStandardMaterial color="#e1c48d" />
        </mesh>
      </group>
    </group>
  )
}
