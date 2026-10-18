import { test, expect } from '@playwright/test'
import * as T from 'three'
import { carriageOffsets, createWater7Rail, sampleRail } from '../src/water7-rail'

test('each carriage follows the rail through bends with stable coupling gaps', () => {
  const rail = createWater7Rail()
  const front = new T.Vector3(),
    back = new T.Vector3()
  let largestAngleDifference = 0
  for (let head = 45; head < rail.getLength() - 10; head += 2) {
    const poses = carriageOffsets.map((offset) => {
      const position = sampleRail(rail, head - offset, new T.Vector3())
      sampleRail(rail, head - offset - 2.2, back)
      sampleRail(rail, head - offset + 2.2, front)
      return { position, angle: Math.atan2(front.x - back.x, front.z - back.z) }
    })
    for (let i = 0; i < poses.length - 1; i++) {
      const a = poses[i],
        b = poses[i + 1]
      const separation = carriageOffsets[i + 1] - carriageOffsets[i]
      expect(a.position.distanceTo(b.position)).toBeGreaterThan(separation * 0.96)
      expect(a.position.distanceTo(b.position)).toBeLessThanOrEqual(separation + 0.02)
      const hitchA = a.position
        .clone()
        .add(
          new T.Vector3(0, 0, -(i === 0 ? 3.3 : i === 1 ? 2.3 : 3.7)).applyAxisAngle(
            new T.Vector3(0, 1, 0),
            a.angle,
          ),
        )
      const hitchB = b.position
        .clone()
        .add(
          new T.Vector3(0, 0, i === 0 ? 2.3 : 3.7).applyAxisAngle(new T.Vector3(0, 1, 0), b.angle),
        )
      expect(hitchA.distanceTo(hitchB)).toBeLessThan(2.3)
      expect(hitchA.distanceTo(hitchB)).toBeGreaterThan(0.8)
      largestAngleDifference = Math.max(largestAngleDifference, Math.abs(a.angle - b.angle))
    }
  }
  // A rigid block would have identical headings even on a bend.
  expect(largestAngleDifference).toBeGreaterThan(0.15)
})
