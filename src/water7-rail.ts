import * as T from 'three'
import layout from './water7-layout.json' with { type: 'json' }

export const carriageOffsets = [0, 6.8, 14.8, 23.4, 32]
export function createWater7Rail() {
  const curve = new T.CatmullRomCurve3(layout.railPoints.map((p) => new T.Vector3(...p)))
  curve.arcLengthDivisions = 1600
  curve.updateArcLengths()
  return curve
}

// Distances are measured along the rail, so trailing carriages reach each bend later.
export function sampleRail(curve: T.CatmullRomCurve3, distance: number, point: T.Vector3) {
  return curve.getPointAt(T.MathUtils.clamp(distance / curve.getLength(), 0, 1), point)
}
