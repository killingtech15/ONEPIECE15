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
uniform float uHoleRadius;
uniform vec2 uFogRange;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSkyColor;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vDepth;
float viewDepth(float d) { return (uNear*uFar) / (uFar - d*(uFar-uNear)); }
void main() {
  if(uHoleRadius > 0. && length(vWorld.xz) < uHoleRadius) discard;
  float sceneDepth = viewDepth(texture2D(uDepth, gl_FragCoord.xy/uResolution).r);
  float delta = max(0., sceneDepth-vDepth);
  vec3 deep = uDeep;
  vec3 shallow = uShallow;
  float light = dot(normalize(vNormal), normalize(vec3(-.4,1.,.3)));
  vec3 col = mix(shallow,deep,smoothstep(0.,15.,delta));
  col += (light-.6)*.055;
  float band = sin(delta*5.5-uTime*1.4)*.5+.5;
  float foam = (1.-smoothstep(.05,1.3,delta))*smoothstep(.28,.75,band);
  col = mix(col,vec3(1.),foam*.55);
  float ripplePhase = vWorld.x*.55+vWorld.z*.9+sin(vWorld.x*.18-vWorld.z*.25)*2.+uTime*.65;
  float ripple = sin(ripplePhase);
  float rippleVisibility = 1.-smoothstep(.5,3.,fwidth(ripplePhase));
  col += smoothstep(.91,1.,ripple)*.018*rippleVisibility;
  col = mix(col,col*vec3(.79,.88,.97),uRain*.4);
  float fog = smoothstep(uFogRange.x,uFogRange.y,vDepth);
  col = mix(vec3(.85,.84,.76),col,smoothstep(.05,.52,gl_FragCoord.x/uResolution.x));
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  // The clear background is display-referred: blend after tone mapping to
  // avoid a hard band where the water reaches the camera's far clip plane.
  gl_FragColor.rgb = mix(gl_FragColor.rgb,uSkyColor,fog);
}`

export function Ocean({
  reduced,
  rain,
  wide = false,
  holeRadius = 0,
  haunted = false,
  depthKey = null,
}: {
  reduced: boolean
  rain: boolean
  wide?: boolean
  holeRadius?: number
  haunted?: boolean
  depthKey?: number | null
}) {
  const mesh = useRef<T.Mesh>(null!)
  const { size, gl, camera } = useThree()
  const depthWidth = Math.min(1600, Math.ceil(size.width * gl.getPixelRatio()))
  const depth = useFBO(depthWidth, Math.ceil((depthWidth * size.height) / size.width), {
    depthBuffer: true,
    samples: 0,
    type: T.UnsignedByteType,
  })
  const previousView = useRef(new T.Matrix4())
  const previousProjection = useRef(new T.Matrix4())
  const previousSize = useRef('')
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
      uHoleRadius: { value: holeRadius },
      uFogRange: {
        value: new T.Vector2(
          holeRadius ? 3500 : wide ? 800 : 100,
          holeRadius ? 8000 : wide ? 1700 : 210,
        ),
      },
      uDeep: { value: new T.Color(haunted ? '#273e59' : '#0077b6') },
      uShallow: { value: new T.Color(haunted ? '#687d8e' : '#58b7bd') },
      uSkyColor: {
        value: haunted
          ? new T.Vector3(155 / 255, 165 / 255, 182 / 255)
          : new T.Vector3(188 / 255, 216 / 255, 219 / 255),
      },
    }),
    [depth, wide, holeRadius, haunted],
  )
  const geo = useMemo(
    () =>
      new T.PlaneGeometry(
        holeRadius || haunted ? 9000 : wide ? 2400 : 1000,
        holeRadius || haunted ? 9000 : wide ? 2400 : 1000,
        144,
        144,
      ).rotateX(-Math.PI / 2),
    [wide, holeRadius, haunted],
  )
  useFrame((state, dt) => {
    // R3F may reconcile the uniforms object when the default camera changes.
    // Update the material actually rendered, rather than a detached memo object.
    const live = (mesh.current.material as T.ShaderMaterial).uniforms
    if (!reduced) live.uTime.value += Math.min(dt, 0.05)
    live.uAmplitude.value = reduced ? 0 : 1
    live.uRain.value = T.MathUtils.damp(live.uRain.value, rain ? 1 : 0, 3, dt)
    live.uNear.value = (camera as T.PerspectiveCamera).near
    live.uFar.value = (camera as T.PerspectiveCamera).far
    live.uDepth.value = depth.depthTexture
    gl.getDrawingBufferSize(live.uResolution.value)
    const dimensions = `${depth.width}:${depth.height}:${depthKey}`
    // Static baked land only. Refresh after the camera, and reuse while idle.
    if (
      !previousView.current.equals(camera.matrixWorld) ||
      !previousProjection.current.equals(camera.projectionMatrix) ||
      previousSize.current !== dimensions
    ) {
      const previous = gl.getRenderTarget()
      const mask = camera.layers.mask
      try {
        camera.layers.set(1)
        gl.setRenderTarget(depth)
        gl.clear()
        gl.render(state.scene, camera)
      } finally {
        camera.layers.mask = mask
        gl.setRenderTarget(previous)
      }
      previousView.current.copy(camera.matrixWorld)
      previousProjection.current.copy(camera.projectionMatrix)
      previousSize.current = dimensions
    }
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
