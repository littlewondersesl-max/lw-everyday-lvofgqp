/**
 * The indoor hall. Physics axes are used as-is: +X down the hall, +Y to the
 * thrower's left, +Z up. The camera sits behind the ledge and looks down the room.
 * Flight samples come from the server; this view only interpolates them.
 */

import * as THREE from 'three'
import { HALL, LANES, LIMITS, releaseHeight } from '../sim/constants'
import { dyeById, dyeUnit } from '../sim/dyes'
import { applyOps, type SheetStep } from '../sim/geometry'
import { stockById } from '../sim/stock'
import type { PublicFlight } from '../sim/room'
import { deriveShape } from '../sim/shape'

export interface HallAim {
  height: number
  pitch: number
  yaw: number
  speed: number
  lifted: boolean
}

export interface HallSeatView {
  index: number
  name: string
  color: string
  paper: string
  dye: string
  ops: SheetStep[]
  you: boolean
  aim: { height: number; pitch: number; yaw: number } | null
}

export interface HallSnapshot {
  phase: 'fold' | 'aim' | 'fly' | 'results'
  you: number
  seats: HallSeatView[]
  flights: PublicFlight[] | null
  aim: HallAim
  replayToken: number
  stock: string
}

export interface HallHandlers {
  get: () => HallSnapshot
  onAim: (aim: HallAim) => void
  onCinemaDone: () => void
}

const LAYER = 0.0034

export function mountHall(canvas: HTMLCanvasElement, handlers: HallHandlers) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x1a242b, 1)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a242b)
  scene.fog = new THREE.Fog(0x1a242b, 18, 48)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.08, 90)
  camera.up.set(0, 0, 1)
  camera.position.set(-1.25, 0, HALL.ledgeHeight + 1.55)

  scene.add(new THREE.HemisphereLight(0xd5e2ea, 0x6a5038, 0.72))
  const sun = new THREE.DirectionalLight(0xfff4e4, 1.15)
  sun.position.set(4, -6, HALL.height + 6)
  scene.add(sun)
  const fill = new THREE.DirectionalLight(0xc5d5e2, 0.35)
  fill.position.set(-2, 4, 6)
  scene.add(fill)

  buildRoom(scene)

  const actors = new Map<number, Actor>()
  const qA = new THREE.Quaternion()
  const qB = new THREE.Quaternion()
  const qYaw = new THREE.Quaternion()
  const qPitch = new THREE.Quaternion()
  const yAxis = new THREE.Vector3(0, 1, 0)
  const zAxis = new THREE.Vector3(0, 0, 1)
  const look = new THREE.Vector3(4.2, 0, 0.85)
  const shadowTex = makeShadowTexture()

  let cinemaToken = -1
  let cinemaStart = 0
  let cinemaReported = false
  let dragging = false
  let lastX = 0
  let lastY = 0

  const resize = () => {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  const onDown = (event: PointerEvent) => {
    const snap = handlers.get()
    if (snap.phase !== 'aim' || snap.you < 0) return
    const seat = snap.seats.find((s) => s.you)
    if (!seat) return
    const actor = actors.get(seat.index)
    if (!actor) return
    const rect = canvas.getBoundingClientRect()
    const hit = project(actor.group.position, camera, rect)
    const dx = event.clientX - hit.x
    const dy = event.clientY - hit.y
    if (dx * dx + dy * dy > 120 * 120) return
    dragging = true
    lastX = event.clientX
    lastY = event.clientY
    canvas.setPointerCapture(event.pointerId)
    if (!snap.aim.lifted) {
      handlers.onAim({
        ...snap.aim,
        lifted: true,
        height: Math.max(snap.aim.height, 0.42),
      })
    }
  }
  const onMove = (event: PointerEvent) => {
    if (!dragging) return
    const snap = handlers.get()
    const dx = event.clientX - lastX
    const dy = event.clientY - lastY
    lastX = event.clientX
    lastY = event.clientY
    handlers.onAim({
      ...snap.aim,
      lifted: true,
      yaw: clamp(snap.aim.yaw - dx * 0.0034, -LIMITS.maxYaw, LIMITS.maxYaw),
      height: clamp(snap.aim.height - dy * 0.0048, LIMITS.minHeight, LIMITS.maxHeight),
    })
  }
  const onUp = () => {
    dragging = false
  }
  const onWheel = (event: WheelEvent) => {
    const snap = handlers.get()
    if (snap.phase !== 'aim' || !snap.aim.lifted) return
    event.preventDefault()
    handlers.onAim({
      ...snap.aim,
      pitch: clamp(snap.aim.pitch - event.deltaY * 0.00065, LIMITS.minPitch, LIMITS.maxPitch),
    })
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })

  let frame = 0
  const loop = () => {
    frame = requestAnimationFrame(loop)
    const snap = handlers.get()
    syncActors(snap)
    const now = performance.now()
    if (snap.flights && snap.replayToken !== cinemaToken) {
      cinemaToken = snap.replayToken
      cinemaStart = now
      cinemaReported = false
    }
    let leader = 4
    snap.seats.forEach((seat) => {
      const actor = actors.get(seat.index)
      if (!actor) return
      const flight = snap.flights?.find((f) => f.seat === seat.index) ?? null
      const delay = seat.index * 0.42
      const elapsed = snap.flights ? (now - cinemaStart) / 1000 - delay : -10
      const pose = poseFor(seat, snap, flight, elapsed, qYaw, qPitch, yAxis, zAxis, qA, qB)
      actor.group.position.copy(pose.position)
      actor.group.quaternion.copy(pose.quaternion)
      actor.aim.visible = snap.phase === 'aim' && seat.you && snap.aim.lifted
      actor.hand.visible = pose.hand || (seat.you && snap.phase === 'aim' && snap.aim.lifted && !snap.flights)
      const ground = pose.position.x < 0 ? HALL.ledgeHeight : 0
      actor.shadow.position.set(pose.position.x, pose.position.y, ground + 0.012)
      const lift = Math.max(0, pose.position.z - ground)
      const s = 0.85 + Math.min(1.4, lift) * 0.55
      actor.shadow.scale.set(s, s, 1)
      actor.shadow.material.opacity = Math.max(0.08, 0.38 - lift * 0.12)
      if (pose.noseX > leader) leader = pose.noseX
    })

    const wantX = snap.flights ? clamp(3 + leader * 0.22, 4, 18) : 4.2
    const wantZ = snap.flights ? 0.9 : 0.85
    look.x += (wantX - look.x) * 0.05
    look.z += (wantZ - look.z) * 0.05
    camera.lookAt(look)

    if (snap.flights && !cinemaReported) {
      const end = Math.max(...snap.flights.map((f) => f.seat * 0.42 + f.duration)) + 0.55
      if ((now - cinemaStart) / 1000 > end) {
        cinemaReported = true
        handlers.onCinemaDone()
      }
    }
    renderer.render(scene, camera)
  }
  loop()

  function syncActors(snap: HallSnapshot) {
    const live = new Set(snap.seats.map((s) => s.index))
    for (const [index, actor] of actors) {
      if (!live.has(index)) {
        scene.remove(actor.group)
        scene.remove(actor.shadow)
        disposeActor(actor)
        actors.delete(index)
      }
    }
    for (const seat of snap.seats) {
      const key = JSON.stringify(seat.ops) + '|' + seat.name + '|' + seat.paper + '|' + seat.you + '|' + snap.stock
      let actor = actors.get(seat.index)
      if (!actor || actor.key !== key) {
        if (actor) {
          scene.remove(actor.group)
          scene.remove(actor.shadow)
          disposeActor(actor)
        }
        actor = makeActor(seat, shadowTex, snap.stock)
        actor.key = key
        actors.set(seat.index, actor)
        scene.add(actor.group)
        scene.add(actor.shadow)
      }
    }
  }

  return () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerup', onUp)
    canvas.removeEventListener('pointercancel', onUp)
    canvas.removeEventListener('wheel', onWheel)
    for (const actor of actors.values()) disposeActor(actor)
    shadowTex.dispose()
    renderer.dispose()
  }
}

interface Actor {
  key: string
  group: THREE.Group
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  aim: THREE.Mesh
  hand: THREE.Group
}

function makeActor(seat: HallSeatView, shadowTex: THREE.Texture, stock: string): Actor {
  const shape = deriveShape(applyOps(seat.ops, stockById(stock)))
  const group = new THREE.Group()
  const positions: number[] = []
  const colors: number[] = []
  for (const facet of shape.facets) {
    const z = 0.001 + facet.layer * LAYER
    const dye = dyeById(seat.dye)
    const rgb = dyeUnit(facet.faceUp > 0 ? dye.paper : dye.back, facet.layer, facet.faceUp > 0)
    const poly = facet.poly
    for (let i = 1; i < poly.length - 1; i++) {
      push(positions, colors, poly[0], z, rgb)
      push(positions, colors, poly[i], z, rgb)
      push(positions, colors, poly[i + 1], z, rgb)
    }
  }
  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geom.computeVertexNormals()
  const mesh = new THREE.Mesh(
    geom,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  )
  group.add(mesh)

  const edges: number[] = []
  for (const facet of shape.facets) {
    const z = 0.0016 + facet.layer * LAYER
    for (let i = 0; i < facet.poly.length; i++) {
      const a = facet.poly[i]
      const b = facet.poly[(i + 1) % facet.poly.length]
      edges.push(a.x, a.y, z, b.x, b.y, z)
    }
  }
  for (const crease of shape.creases) {
    const z = 0.004 + LAYER
    edges.push(crease.a.x, crease.a.y, z, crease.b.x, crease.b.y, z)
  }
  const lineGeom = new THREE.BufferGeometry()
  lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(edges, 3))
  group.add(new THREE.LineSegments(lineGeom, new THREE.LineBasicMaterial({ color: seat.color })))

  const hand = buildHand()
  group.add(hand)

  const aim = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.006, 0.006),
    new THREE.MeshBasicMaterial({ color: seat.color }),
  )
  aim.position.set(Math.max(0.15, shape.xLead) + 0.55, 0, 0.02)
  aim.visible = false
  group.add(aim)

  const label = makeLabel(seat.name + (seat.you ? '  ·  you' : ''), seat.color, seat.you)
  label.position.set(0, 0, 0.14)
  group.add(label)

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.28),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, color: 0x000000 }),
  )
  return { key: '', group, shadow, aim, hand }
}

function disposeActor(actor: Actor) {
  actor.group.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    mesh.geometry?.dispose?.()
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
    else mat?.dispose?.()
  })
  actor.shadow.geometry.dispose()
  actor.shadow.material.dispose()
}

interface Pose {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  noseX: number
  hand: boolean
  handPull: number
}

function poseFor(
  seat: HallSeatView,
  snap: HallSnapshot,
  flight: PublicFlight | null,
  elapsed: number,
  qYaw: THREE.Quaternion,
  qPitch: THREE.Quaternion,
  yAxis: THREE.Vector3,
  zAxis: THREE.Vector3,
  qA: THREE.Quaternion,
  qB: THREE.Quaternion,
): Pose {
  const lane = LANES[seat.index] ?? 0
  const restZ = HALL.ledgeHeight + 0.03
  const live = seat.you ? snap.aim : null
  const hold =
    live?.lifted === true
      ? { x: -0.08, y: lane, z: releaseHeight(live.height), pitch: live.pitch, yaw: live.yaw }
      : { x: -0.55, y: lane, z: restZ, pitch: 0, yaw: 0 }
  const launch = seat.aim
    ? { x: 0.06, y: lane, z: releaseHeight(seat.aim.height), pitch: seat.aim.pitch, yaw: seat.aim.yaw }
    : hold

  if (!flight || elapsed < -0.46) {
    return {
      position: new THREE.Vector3(hold.x, hold.y, hold.z),
      quaternion: aimQuat(hold.yaw, hold.pitch, qYaw, qPitch, yAxis, zAxis),
      noseX: hold.x,
      hand: false,
      handPull: 0,
    }
  }
  if (elapsed < 0) {
    const u = (elapsed + 0.46) / 0.46
    const amount = (u < 0.55 ? u / 0.55 : 1 - (u - 0.55) / 0.45) * 0.15
    const q = aimQuat(launch.yaw, launch.pitch + amount * 0.35, qYaw, qPitch, yAxis, zAxis)
    const position = new THREE.Vector3(launch.x, launch.y, launch.z)
    position.addScaledVector(new THREE.Vector3(-1, 0, 0).applyQuaternion(q), amount)
    return { position, quaternion: q, noseX: position.x, hand: true, handPull: amount }
  }
  const samples = flight.samples
  let i = 0
  while (i < samples.length - 2 && samples[i + 1][0] < elapsed) i++
  const a = samples[i]
  const b = samples[Math.min(i + 1, samples.length - 1)]
  const span = Math.max(0.0001, b[0] - a[0])
  const t = clamp((elapsed - a[0]) / span, 0, 1)
  qA.set(a[4], a[5], a[6], a[7])
  qB.set(b[4], b[5], b[6], b[7])
  return {
    position: new THREE.Vector3(
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
      a[3] + (b[3] - a[3]) * t,
    ),
    quaternion: qA.slerp(qB, t),
    noseX: a[8] + (b[8] - a[8]) * t,
    hand: false,
    handPull: 0,
  }
}

function aimQuat(
  yaw: number,
  pitch: number,
  qYaw: THREE.Quaternion,
  qPitch: THREE.Quaternion,
  yAxis: THREE.Vector3,
  zAxis: THREE.Vector3,
) {
  qPitch.setFromAxisAngle(yAxis, -pitch)
  qYaw.setFromAxisAngle(zAxis, yaw)
  return qYaw.clone().multiply(qPitch)
}

function buildHand() {
  const group = new THREE.Group()
  const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x3c332c, roughness: 0.78 })
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xc6ab96, roughness: 0.72 })
  const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.22, 4, 10), sleeveMat)
  sleeve.rotation.z = Math.PI / 2
  sleeve.position.x = -0.12
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.062, 0.028), skinMat)
  palm.position.set(0.02, 0, -0.01)
  group.add(sleeve, palm)
  group.visible = false
  return group
}

function buildRoom(scene: THREE.Scene) {
  const wood = new THREE.MeshStandardMaterial({ color: 0xc2a37c, roughness: 0.94 })
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x8d6844, roughness: 0.9 })
  const wall = new THREE.MeshStandardMaterial({ color: 0x24343c, roughness: 0.92 })
  const wallFar = new THREE.MeshStandardMaterial({ color: 0x1c2a32, roughness: 0.95 })
  const trim = new THREE.MeshStandardMaterial({ color: 0x6d5438, roughness: 0.8 })

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALL.length, HALL.halfWidth * 2), wood)
  floor.position.set(HALL.length / 2, 0, 0)
  scene.add(floor)

  for (let m = 0; m <= HALL.length; m++) {
    const major = m % 5 === 0
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(major ? 0.035 : 0.015, HALL.halfWidth * 2 - 0.8, 0.008),
      major ? trim : new THREE.MeshStandardMaterial({ color: 0x9a7b58, roughness: 1 }),
    )
    line.position.set(m, 0, 0.006)
    scene.add(line)
    if (m % 2 === 0) {
      const board = numberBoard(m)
      board.position.set(m, 0, 0.02)
      scene.add(board)
    }
  }

  const ledge = new THREE.Mesh(
    new THREE.BoxGeometry(-HALL.ledgeBack, HALL.halfWidth * 2, HALL.ledgeHeight),
    woodDark,
  )
  ledge.position.set(HALL.ledgeBack / 2, 0, HALL.ledgeHeight / 2)
  scene.add(ledge)
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, HALL.halfWidth * 2, 0.015),
    trim,
  )
  edge.position.set(-0.02, 0, HALL.ledgeHeight + 0.008)
  scene.add(edge)

  for (const y of LANES) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.012),
      new THREE.MeshStandardMaterial({ color: 0xd7c3a4, roughness: 0.7 }),
    )
    stripe.position.set(-0.45, y, HALL.ledgeHeight + 0.008)
    scene.add(stripe)
  }

  const sideH = HALL.height
  const wallSpan = HALL.length - HALL.ledgeBack + 0.6
  const wallCenter = (HALL.ledgeBack - 0.3 + HALL.length) / 2
  const left = new THREE.Mesh(new THREE.BoxGeometry(wallSpan, 0.16, sideH), wall)
  left.position.set(wallCenter, HALL.halfWidth + 0.08, sideH / 2)
  const right = left.clone()
  right.position.y = -HALL.halfWidth - 0.08
  const far = new THREE.Mesh(new THREE.BoxGeometry(0.16, HALL.halfWidth * 2 + 0.4, sideH), wallFar)
  far.position.set(HALL.length + 0.08, 0, sideH / 2)
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(HALL.length + 2, HALL.halfWidth * 2 + 0.4, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x152026, roughness: 1 }),
  )
  ceiling.position.set(HALL.length / 2, 0, HALL.height)
  scene.add(left, right, far, ceiling)

  for (let i = 0; i < 5; i++) {
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.1, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xd5e4ee, emissive: 0xb7c9d4, emissiveIntensity: 0.7, roughness: 0.4 }),
    )
    glow.position.set(2.2 + i * 4.6, (i % 2 === 0 ? 1.4 : -1.4), HALL.height - 0.06)
    scene.add(glow)
  }
}

function numberBoard(meters: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const g = canvas.getContext('2d')!
  g.clearRect(0, 0, 256, 128)
  g.fillStyle = 'rgba(244, 239, 228, 0.88)'
  g.fillRect(28, 18, 200, 92)
  g.fillStyle = '#3a2918'
  g.font = '700 72px Georgia, serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(`${meters}`, 128, 66)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.85),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  )
  // Text runs across the hall (local +Y on screen-left when viewed from behind).
  mesh.rotation.z = -Math.PI / 2
  return mesh
}

function makeLabel(text: string, color: string, you: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = 384
  canvas.height = 96
  const g = canvas.getContext('2d')!
  g.clearRect(0, 0, 384, 96)
  g.fillStyle = you ? color : 'rgba(18, 16, 14, 0.62)'
  roundRect(g, 16, 14, 352, 68, 18)
  g.fill()
  g.fillStyle = '#f6f1e6'
  g.font = '600 34px Georgia, serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 192, 48)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }))
  sprite.scale.set(0.28, 0.07, 1)
  return sprite
}

function makeShadowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const g = canvas.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64)
  grad.addColorStop(0, 'rgba(0,0,0,0.55)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(canvas)
  return tex
}

function push(positions: number[], colors: number[], p: { x: number; y: number }, z: number, rgb: number[]) {
  positions.push(p.x, p.y, z)
  colors.push(rgb[0], rgb[1], rgb[2])
}

function project(pos: THREE.Vector3, camera: THREE.PerspectiveCamera, rect: DOMRect) {
  const v = pos.clone().project(camera)
  return {
    x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
    y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
  }
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}
