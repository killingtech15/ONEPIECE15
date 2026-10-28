import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as T from 'three'
import gsap from 'gsap'
import { travel } from './world'
export type CameraLayout = {
  overviewTarget: number[]
  overviewRadius: number
  travelClearance?: number
  travelCorridorZ?: number
  journey: { eye: number[]; look: number[] }[]
  landmarks: { target: number[]; offset: number[]; phoneOffset?: number[]; radius: number }[]
}
// Frame the authored subject in the visible UI-free rectangle, including phone cards.
export function MeasuredIslandCamera({
  selected,
  reduced,
  layout,
}: {
  layout: CameraLayout
  selected: number | null
  reduced: boolean
}) {
  const camera = useRef<T.PerspectiveCamera>(null!)
  const { size } = useThree()
  const pose = useRef({ x: 510, y: 370, z: 690, lx: 0, ly: 55, lz: -65, sx: 0, sy: 0 })
  const animation = useRef<gsap.core.Animation | null>(null)
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
    [layout],
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
      const dock = document.querySelector('.island-dock')?.getBoundingClientRect()
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
        : (dock?.top ?? size.height - 70) - 12
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
          offset = new T.Vector3(...(phone ? (p.phoneOffset ?? p.offset) : p.offset))
            .normalize()
            .multiplyScalar(d)
        animation.current?.kill()
        const destination = {
          x: p.target[0] + offset.x,
          y: p.target[1] + offset.y,
          z: p.target[2] + offset.z,
          lx: p.target[0],
          ly: p.target[1],
          lz: p.target[2],
          sx: (r.left + r.width / 2) / size.width - 0.5,
          sy: 0.5 - (r.top + r.height / 2) / size.height,
        }
        if (layout.travelCorridorZ && !reduced) {
          const safeZ = Math.max(layout.travelCorridorZ, pose.current.z, destination.z)
          animation.current = gsap
            .timeline()
            .to(pose.current, { z: safeZ, duration: 0.3, ease: 'power2.inOut' })
            .to(pose.current, { ...destination, z: safeZ, duration: 0.7, ease: 'power2.inOut' })
            .to(pose.current, { z: destination.z, duration: 0.4, ease: 'power2.inOut' })
        } else if (layout.travelClearance && !reduced) {
          // Enclosing terrain: rise above the crown before crossing the rim.
          const safeY = Math.max(layout.travelClearance, pose.current.y, destination.y)
          animation.current = gsap
            .timeline()
            .to(pose.current, { y: safeY, duration: 0.35, ease: 'power2.inOut' })
            .to(pose.current, { ...destination, y: safeY, duration: 0.75, ease: 'power2.inOut' })
            .to(pose.current, { y: destination.y, duration: 0.45, ease: 'power2.inOut' })
        } else
          animation.current = gsap.to(pose.current, {
            ...destination,
            duration: reduced ? 0 : 1.25,
            ease: 'power2.inOut',
          })
      } else if (layout.travelCorridorZ && !reduced) {
        animation.current?.kill()
        animation.current = gsap.to(pose.current, {
          z: Math.max(layout.travelCorridorZ, pose.current.z),
          duration: 0.35,
          ease: 'power2.inOut',
        })
      } else if (layout.travelClearance && !reduced) {
        const dest = curves.eye.getPoint(T.MathUtils.clamp(travel.progress, 0, 1))
        animation.current?.kill()
        animation.current = gsap.to(pose.current, {
          y: Math.max(layout.travelClearance, pose.current.y, dest.y),
          duration: 0.45,
          ease: 'power2.inOut',
        })
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const selector of ['.story', '.intro', '.scene-controls', '.island-dock']) {
      const e = document.querySelector(selector)
      if (e) observer.observe(e)
    }
    return () => {
      observer.disconnect()
      animation.current?.kill()
    }
  }, [selected, reduced, size.width, size.height, layout, curves])
  useFrame((_, dt) => {
    if (selected === null && !animation.current?.isActive()) {
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
