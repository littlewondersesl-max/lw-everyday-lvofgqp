/**
 * Fixed-step rigid-body flight in still air.
 *
 * Approximations (also summarized in the hall for players):
 * - The folded sheet is rigid and flat. Creases do not flex, and visual
 *   thickness is not part of the mass model.
 * - Still air, density AIR.density. "Air-relative" velocity is the craft's
 *   own velocity; there is no ambient wind.
 * - Lift and drag come from a flat-plate normal force that depends on angle
 *   of attack, blended toward a separated-flow sine-squared law past stall,
 *   plus a small parasitic drag that grows with nose bluntness and asymmetry.
 *   Induced drag uses a lifting-line term and the planform aspect ratio.
 * - That force is applied at a neutral point estimated from the outline:
 *   near mid-chord for a rectangular planform, and farther aft when the
 *   area sits toward the tail (a pointed nose). Past stall the point slides
 *   toward the area centroid. Nose-heavy sheets therefore restore; tail-heavy
 *   or sideways sheets diverge.
 * - A symmetric flat plate trims at zero lift. Folded nose weight is treated
 *   as a small crease-reflex couple (a pure moment, not an extra force) so a
 *   stable, pointed sheet can hold a shallow angle of attack and actually
 *   glide. Lopsided or blunt sheets do not get that couple.
 * - Pitch, roll, and yaw rates are damped in proportion to dynamic pressure.
 *   The damping term is integrated semi-implicitly so the small inertia of
 *   a sheet of paper cannot blow up the fixed timestep. Angular rate is
 *   also clamped; that clamp is a numerical limiter, not a scripted path.
 * - Ground contact is a single convex-outline constraint with Coulomb
 *   friction on the hall floor and the ledge. Planes do not affect each
 *   other's air. No ground effect.
 */

import { AIR, DT, HALL, LIMITS, SAMPLE_HZ, releaseHeight } from './constants'
import type { AeroShape } from './shape'

export interface Launch {
  x: number
  y: number
  z: number
  /** Nose up positive, radians. */
  pitch: number
  /** Positive yaw turns toward +Y (thrower's left). */
  yaw: number
  speed: number
}

export interface FlightTrace {
  t: number
  z: number
  noseX: number
  speed: number
  alpha: number
  pitch: number
  up: number
}

export interface FlightResult {
  /** [t, x, y, z, qx, qy, qz, qw, noseX] at SAMPLE_HZ. */
  samples: number[][]
  distance: number
  duration: number
  tumbled: boolean
  trace?: FlightTrace[]
}

interface Quat {
  x: number
  y: number
  z: number
  w: number
}

interface BodyAero {
  fx: number
  fy: number
  fz: number
  tx: number
  ty: number
  tz: number
  dampX: number
  dampY: number
  dampZ: number
  alpha: number
  speed: number
}

const MAX_TIME = 12
const SAMPLE_EVERY = Math.round(1 / DT / SAMPLE_HZ)

export function clampAim(partial: Partial<Launch>): Launch {
  return {
    x: finite(partial.x, 0.04),
    y: finite(partial.y, 0),
    z: clamp(finite(partial.z, releaseHeight(0.55)), HALL.ledgeHeight + 0.05, HALL.height - 0.3),
    pitch: clamp(finite(partial.pitch, 0.06), LIMITS.minPitch, LIMITS.maxPitch),
    yaw: clamp(finite(partial.yaw, 0), -LIMITS.maxYaw, LIMITS.maxYaw),
    speed: clamp(finite(partial.speed, 6.5), LIMITS.minSpeed, LIMITS.maxSpeed),
  }
}

export function simulateFlight(
  shape: AeroShape,
  launch: Launch,
  options?: { trace?: boolean; aero?: boolean; unclamped?: boolean },
): FlightResult {
  const aim = options?.unclamped
    ? {
        x: finite(launch.x, 0),
        y: finite(launch.y, 0),
        z: finite(launch.z, 1.4),
        pitch: finite(launch.pitch, 0),
        yaw: finite(launch.yaw, 0),
        speed: Math.max(0, finite(launch.speed, 0)),
      }
    : clampAim(launch)
  const aeroOn = options?.aero !== false
  const q = quatYawPitch(aim.yaw, aim.pitch)
  const nose0 = bodyX(q)
  const state = {
    px: aim.x,
    py: aim.y,
    pz: aim.z,
    vx: nose0.x * aim.speed,
    vy: nose0.y * aim.speed,
    vz: nose0.z * aim.speed,
    qx: q.x,
    qy: q.y,
    qz: q.z,
    qw: q.w,
    wx: 0,
    wy: 0,
    wz: 0,
  }

  const samples: number[][] = []
  const trace: FlightTrace[] = []
  let tumbled = false
  let settle = 0
  let t = 0
  let steps = 0
  let distance = noseExtent(state, shape)
  const traceEvery = Math.round(0.05 / DT)

  const pushSample = () => {
    const noseX = noseExtent(state, shape)
    samples.push([
      round4(t),
      state.px,
      state.py,
      state.pz,
      state.qx,
      state.qy,
      state.qz,
      state.qw,
      noseX,
    ])
    distance = noseX
  }
  pushSample()

  const maxSteps = Math.ceil(MAX_TIME / DT)
  while (steps < maxSteps) {
    const qNow = { x: state.qx, y: state.qy, z: state.qz, w: state.qw }
    const body = aeroOn
      ? aeroForces(qNow, state.vx, state.vy, state.vz, shape)
      : zeroAero(state.vx, state.vy, state.vz)
    const fw = rotateBody(qNow, body.fx, body.fy, body.fz)
    const ax = fw.x / shape.mass
    const ay = fw.y / shape.mass
    const az = fw.z / shape.mass - AIR.gravity

    const { xx, yy, zz } = shape.inertia
    const mx = body.tx + (yy - zz) * state.wy * state.wz
    const my = body.ty + (zz - xx) * state.wz * state.wx
    const mz = body.tz + (xx - yy) * state.wx * state.wy
    const wx = clamp((state.wx + DT * (mx / xx)) / (1 + DT * (body.dampX / xx)), -25, 25)
    const wy = clamp((state.wy + DT * (my / yy)) / (1 + DT * (body.dampY / yy)), -25, 25)
    const wz = clamp((state.wz + DT * (mz / zz)) / (1 + DT * (body.dampZ / zz)), -25, 25)
    state.wx = wx
    state.wy = wy
    state.wz = wz

    const qn = integrateQuat(qNow, wx, wy, wz, DT)
    state.qx = qn.x
    state.qy = qn.y
    state.qz = qn.z
    state.qw = qn.w

    state.vx += ax * DT
    state.vy += ay * DT
    state.vz += az * DT
    const sp = Math.hypot(state.vx, state.vy, state.vz)
    if (sp > 28) {
      const s = 28 / sp
      state.vx *= s
      state.vy *= s
      state.vz *= s
    }
    state.px += state.vx * DT
    state.py += state.vy * DT
    state.pz += state.vz * DT

    const contact = collide(state, shape)
    t += DT
    steps++

    if (!Number.isFinite(state.px) || !Number.isFinite(state.qw)) {
      tumbled = true
      break
    }

    const up = bodyZ(qn).z
    const airborne = minHullZ(state, shape) > 0.25
    if (airborne && (up < 0.32 || Math.hypot(wx, wy, wz) > 14)) tumbled = true

    if (contact) {
      const horiz = Math.hypot(state.vx, state.vy)
      const rate = Math.hypot(state.wx, state.wy, state.wz)
      if (horiz < 0.16 && Math.abs(state.vz) < 0.25 && rate < 1.1) settle++
      else settle = 0
    } else settle = 0

    if (steps % SAMPLE_EVERY === 0) pushSample()
    if (options?.trace && steps % traceEvery === 0) {
      const nose = bodyX(qn)
      trace.push({
        t,
        z: state.pz,
        noseX: noseExtent(state, shape),
        speed: Math.hypot(state.vx, state.vy, state.vz),
        alpha: body.alpha,
        pitch: Math.asin(clamp(nose.z, -1, 1)),
        up,
      })
    }

    if (settle > 18) break
    if (state.px > HALL.length + 0.5 && contact) break
  }

  if (samples[samples.length - 1][0] < t - 1e-6) pushSample()
  distance = samples[samples.length - 1][8]

  return {
    samples,
    distance,
    duration: t,
    tumbled,
    trace: options?.trace ? trace : undefined,
  }
}

function zeroAero(vx: number, vy: number, vz: number): BodyAero {
  return {
    fx: 0, fy: 0, fz: 0, tx: 0, ty: 0, tz: 0,
    dampX: 0, dampY: 0, dampZ: 0,
    alpha: 0,
    speed: Math.hypot(vx, vy, vz),
  }
}

/** Numbers that explain why a shape glides or drops. Used by tests and the tuner. */
export function aeroProfile(shape: AeroShape) {
  const chord = Math.max(shape.xLead - shape.xTrail, 0.012)
  const fCent = clamp((shape.xLead - shape.planformCentroid.x) / chord, 0.12, 0.88)
  const sweepiness = clamp((fCent - 0.46) / 0.18, 0, 1)
  const fNeutral = (1 - sweepiness) * 0.5 + sweepiness * Math.min(0.68, fCent + 0.02)
  const xCp = shape.xLead - fNeutral * chord
  const noseHeavy = clamp(-shape.planformCentroid.x / chord, 0, 0.4)
  const symmetry = clamp(1 - shape.asymmetry / 0.09, 0, 1)
  const pointed = clamp(1 - shape.bluntness, 0, 1)
  // Pure couple from crease reflex: only a stable, pointed, nose-heavy sheet
  // gets a nose-up moment at zero lift. Sized from the fold, then left to the integrator.
  const stable = xCp < -0.003
  const cm0 = stable ? 0.15 * noseHeavy * pointed * symmetry : 0
  const cd0 = 0.016 + 0.075 * shape.bluntness * shape.bluntness + 0.2 * shape.asymmetry
  const clTrim = stable && cm0 > 0 ? (cm0 * chord) / -xCp : 0
  return { chord, fCent, fNeutral, xCp, noseHeavy, cm0, cd0, clTrim, stable }
}

function aeroForces(q: Quat, vx: number, vy: number, vz: number, shape: AeroShape): BodyAero {
  const vb = rotateWorld(q, vx, vy, vz)
  const speed = Math.hypot(vb.x, vb.y, vb.z)
  if (speed < 0.04) {
    return { fx: 0, fy: 0, fz: 0, tx: 0, ty: 0, tz: 0, dampX: 0, dampY: 0, dampZ: 0, alpha: 0, speed }
  }
  // sinA > 0 when air meets the underside (velocity toward body -Z).
  const sinA = clamp(-vb.z / speed, -1, 1)
  const forward = clamp(vb.x / speed, -1, 1)
  const absSin = Math.abs(sinA)
  const sep = smoothstep(0.16, 0.55, absSin)
  const ar = shape.aspect
  const liftSlope = (2 * Math.PI) / (1 + 2 / ar)
  const forwardGate = clamp(forward, 0, 1)
  const cnAttached = liftSlope * sinA * Math.sqrt(Math.max(0, 1 - sinA * sinA)) * forwardGate
  const cnSeparated = 1.15 * sinA * absSin
  const CN = (1 - sep) * cnAttached + sep * cnSeparated

  const profile = aeroProfile(shape)
  const qDyn = 0.5 * AIR.density * speed * speed
  const S = shape.planformArea
  const vhx = vb.x / speed
  const vhy = vb.y / speed
  const vhz = vb.z / speed
  const oswald = Math.max(0.4, 0.88 - 0.45 * shape.asymmetry - 0.2 * shape.bluntness)
  const cdi = (cnAttached * cnAttached) / (Math.PI * ar * oswald)
  const tangential = profile.cd0 + cdi
  const fx = -tangential * qDyn * S * vhx
  const fy = -tangential * qDyn * S * vhy
  const fz = CN * qDyn * S - tangential * qDyn * S * vhz

  const fCp = (1 - sep) * profile.fNeutral + sep * profile.fCent
  const xCp = shape.xLead - fCp * profile.chord
  const yCp = shape.planformCentroid.y
  // cm0 is a pure couple (nose up when positive). It does not add a force,
  // so a stable sheet can trim at positive lift instead of weathervaning to zero.
  const couple = profile.cm0 * qDyn * S * profile.chord
  const tx = yCp * fz
  const ty = -xCp * fz - couple
  const tz = xCp * fy - yCp * fx

  const scale = 0.3 * AIR.density * speed * S
  const alpha = Math.asin(clamp(sinA, -1, 1))
  return {
    fx, fy, fz, tx, ty, tz,
    dampX: scale * shape.span * shape.span * 0.42,
    dampY: scale * profile.chord * profile.chord * 1.05,
    dampZ: scale * shape.span * shape.span * 0.28,
    alpha,
    speed,
  }
}

function collide(
  state: {
    px: number
    py: number
    pz: number
    vx: number
    vy: number
    vz: number
    wx: number
    wy: number
    wz: number
    qx: number
    qy: number
    qz: number
    qw: number
  },
  shape: AeroShape,
): boolean {
  const q = { x: state.qx, y: state.qy, z: state.qz, w: state.qw }
  let hitFloor = false
  let penZ = 0
  let penX = 0
  let penY = 0
  for (const h of shape.hull) {
    const w = rotateBody(q, h.x, h.y, 0)
    const x = state.px + w.x
    const y = state.py + w.y
    const z = state.pz + w.z
    const floor = x < HALL.ledgeFront ? HALL.ledgeHeight : 0
    const dz = floor + 0.004 - z
    if (dz > penZ) penZ = dz
    if (x > HALL.length) penX = Math.max(penX, x - HALL.length)
    if (x < HALL.ledgeBack) penX = Math.min(penX, x - HALL.ledgeBack)
    if (y > HALL.halfWidth) penY = Math.max(penY, y - HALL.halfWidth)
    if (y < -HALL.halfWidth) penY = Math.min(penY, y + HALL.halfWidth)
    if (z > HALL.height) penZ = Math.min(penZ, -(z - HALL.height))
  }
  if (penZ > 0) {
    state.pz += penZ
    hitFloor = true
    if (state.vz < 0) state.vz *= -0.04
  } else if (penZ < 0) {
    state.pz += penZ
    if (state.vz > 0) state.vz *= -0.04
  }
  if (penX !== 0) {
    state.px -= penX
    if (penX > 0 && state.vx > 0) state.vx *= -0.05
    if (penX < 0 && state.vx < 0) state.vx *= -0.05
    hitFloor = true
  }
  if (penY !== 0) {
    state.py -= penY
    if (penY > 0 && state.vy > 0) state.vy *= -0.08
    if (penY < 0 && state.vy < 0) state.vy *= -0.08
  }
  if (hitFloor) {
    const horiz = Math.hypot(state.vx, state.vy)
    // Firm paper-on-wood catch. A hot landing still slides, but the score
    // is mostly the distance flown, not a long skid.
    const drop = 1.35 * AIR.gravity * DT
    if (horiz <= drop) {
      state.vx = 0
      state.vy = 0
    } else {
      const s = (horiz - drop) / horiz
      state.vx *= s
      state.vy *= s
    }
    const wd = Math.exp(-DT / 0.09)
    state.wx *= wd
    state.wy *= wd
    state.wz *= wd
  }
  return hitFloor
}

function noseExtent(
  state: { px: number; py: number; pz: number; qx: number; qy: number; qz: number; qw: number },
  shape: AeroShape,
): number {
  const q = { x: state.qx, y: state.qy, z: state.qz, w: state.qw }
  let maxX = -Infinity
  for (const h of shape.hull) {
    const w = rotateBody(q, h.x, h.y, 0)
    const x = state.px + w.x
    if (x > maxX) maxX = x
  }
  return maxX
}

function minHullZ(
  state: { px: number; py: number; pz: number; qx: number; qy: number; qz: number; qw: number },
  shape: AeroShape,
): number {
  const q = { x: state.qx, y: state.qy, z: state.qz, w: state.qw }
  let minZ = Infinity
  for (const h of shape.hull) {
    const w = rotateBody(q, h.x, h.y, 0)
    const z = state.pz + w.z
    if (z < minZ) minZ = z
  }
  return minZ
}

function quatYawPitch(yaw: number, pitch: number): Quat {
  const qPitch = axisAngle(0, 1, 0, -pitch)
  const qYaw = axisAngle(0, 0, 1, yaw)
  return mul(qYaw, qPitch)
}

function axisAngle(x: number, y: number, z: number, angle: number): Quat {
  const h = angle * 0.5
  const s = Math.sin(h)
  return { x: x * s, y: y * s, z: z * s, w: Math.cos(h) }
}

function mul(a: Quat, b: Quat): Quat {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  }
}

function normalize(q: Quat): Quat {
  const n = Math.hypot(q.x, q.y, q.z, q.w) || 1
  return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n }
}

function integrateQuat(q: Quat, wx: number, wy: number, wz: number, dt: number): Quat {
  const ang = Math.hypot(wx, wy, wz) * dt
  if (ang < 1e-10) return q
  const s = Math.sin(ang * 0.5) / Math.hypot(wx, wy, wz)
  const dq = { x: wx * s, y: wy * s, z: wz * s, w: Math.cos(ang * 0.5) }
  return normalize(mul(q, dq))
}

export function bodyX(q: Quat): { x: number; y: number; z: number } {
  return rotateBody(q, 1, 0, 0)
}

export function bodyZ(q: Quat): { x: number; y: number; z: number } {
  return rotateBody(q, 0, 0, 1)
}

function rotateBody(q: Quat, x: number, y: number, z: number): { x: number; y: number; z: number } {
  const ix = q.w * x + q.y * z - q.z * y
  const iy = q.w * y + q.z * x - q.x * z
  const iz = q.w * z + q.x * y - q.y * x
  const iw = -q.x * x - q.y * y - q.z * z
  return {
    x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
    y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
    z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x,
  }
}

function rotateWorld(q: Quat, x: number, y: number, z: number): { x: number; y: number; z: number } {
  const ix = q.w * x - q.y * z + q.z * y
  const iy = q.w * y - q.z * x + q.x * z
  const iz = q.w * z - q.x * y + q.y * x
  const iw = q.x * x + q.y * y + q.z * z
  return {
    x: ix * q.w + iw * q.x + iy * q.z - iz * q.y,
    y: iy * q.w + iw * q.y + iz * q.x - ix * q.z,
    z: iz * q.w + iw * q.z + ix * q.y - iy * q.x,
  }
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function finite(v: number | undefined, fallback: number) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function round4(v: number) {
  return Math.round(v * 10000) / 10000
}
