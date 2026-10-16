import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import * as T from 'three'

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uAmplitude;
uniform float uSpeed;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vDepth;
vec3 wave(vec2 p, vec2 d, float amplitude, float wavelength, float speed) {
  d = normalize(d);
  float k = 6.283185 / wavelength;
  float f = k * (dot(d, p) - uTime * speed * uSpeed);
  return vec3(d.x * amplitude * cos(f) * .42, amplitude * sin(f), d.y * amplitude * cos(f) * .42);
}
vec3 surface(vec2 p) {
  return vec3(p.x, 0., p.y) + uAmplitude * (
    wave(p, vec2(1.,.4), .18, 7., 1.5) +
    wave(p, vec2(.3,1.), .1, 3.4, .9) +
    wave(p, vec2(-.7,.2), .045, 1.8, .7));
}
void main() {
  vec3 p = surface(position.xz);
  vec3 dx = surface(position.xz + vec2(.05,0.)) - p;
  vec3 dz = surface(position.xz + vec2(0.,.05)) - p;
  vNormal = normalize(cross(dz,dx));
  vec4 world = modelMatrix * vec4(p,1.);
  vWorld = world.xyz;
  vec4 view = viewMatrix * world;
  vDepth = -view.z;
  gl_Position = projectionMatrix * view;
}`
const fragmentShader = /* glsl */ `
uniform sampler2D uDepth;
uniform vec2 uResolution;
uniform float uNear;
uniform float uFar;
uniform float uTime;
uniform float uRain;
uniform vec3 uDeep;
uniform vec3 uShallow;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vDepth;
float viewDepth(float d) { return (uNear*uFar) / (uFar - d*(uFar-uNear)); }
void main() {
  float sceneDepth = viewDepth(texture2D(uDepth, gl_FragCoord.xy/uResolution).r);
  float delta = max(0., sceneDepth-vDepth);
  vec3 deep = uDeep;
  vec3 shallow = uShallow;
  float light = dot(normalize(vNormal), normalize(vec3(-.4,1.,.3)));
  vec3 col = mix(shallow,deep,smoothstep(0.,15.,delta));
  col += (floor(light*5.)/5.-.6)*.09;
  float band = sin(delta*5.5-uTime*1.4)*.5+.5;
  float foam = (1.-smoothstep(.05,1.3,delta))*smoothstep(.28,.75,band);
  col = mix(col,vec3(1.),foam*.86);
  float ripple = sin(vWorld.x*1.7+vWorld.z*.55+uTime*.65)*sin(vWorld.z*1.4-uTime*.5);
  col += smoothstep(.92,1.,ripple)*.11;
  col = mix(col,col*vec3(.79,.88,.97),uRain*.4);
  float fog = smoothstep(110.,260.,vDepth);
  col = mix(col,vec3(.74,.85,.84),fog);
  col = mix(vec3(.85,.84,.76),col,smoothstep(.05,.52,gl_FragCoord.x/uResolution.x));
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

export function Ocean({ reduced, rain }: { reduced: boolean; rain: boolean }) {
  const mesh = useRef<T.Mesh>(null!)
  const { size, gl, camera } = useThree()
  const dpr = gl.getPixelRatio()
  const depth = useFBO(Math.ceil(size.width * dpr), Math.ceil(size.height * dpr), {
    depthBuffer: true,
    samples: 0,
  })
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: 1 },
      uSpeed: { value: 1 },
      uDepth: { value: depth.depthTexture },
      uResolution: { value: new T.Vector2() },
      uNear: { value: 0.1 },
      uFar: { value: 400 },
      uRain: { value: 0 },
      uDeep: { value: new T.Color('#0077b6') },
      uShallow: { value: new T.Color('#58b7bd') },
    }),
    [depth],
  )
  const geo = useMemo(() => new T.PlaneGeometry(600, 600, 220, 220).rotateX(-Math.PI / 2), [])
  useFrame((state, dt) => {
    if (!reduced) uniforms.uTime.value += Math.min(dt, 0.05)
    uniforms.uRain.value = T.MathUtils.damp(uniforms.uRain.value, rain ? 1 : 0, 3, dt)
    uniforms.uNear.value = (camera as T.PerspectiveCamera).near
    uniforms.uFar.value = (camera as T.PerspectiveCamera).far
    uniforms.uResolution.value.set(depth.width, depth.height)
    const previous = gl.getRenderTarget()
    mesh.current.visible = false
    gl.setRenderTarget(depth)
    gl.clear()
    gl.render(state.scene, camera)
    gl.setRenderTarget(previous)
    mesh.current.visible = true
  }, -1)
  return (
    <mesh ref={mesh} geometry={geo} position-y={0}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}
