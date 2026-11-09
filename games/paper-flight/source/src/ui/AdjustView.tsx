import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { bendTarget, orbitPose, posePaper, quatOf, withPart, type HingeFrame } from '../sim/adjust'
import type { Dye } from '../sim/dyes'
import { identityAdjust, type AdjustPose, type Paper } from '../sim/geometry'
import { fillPaperShell } from '../view/paperMesh'

interface Props {
  paper: Paper
  dye: Dye
  pose: AdjustPose
  onPose: (pose: AdjustPose) => void
}

export function AdjustView({ paper, dye, pose, onPose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paperRef = useRef(paper)
  const poseRef = useRef(pose)
  const dyeRef = useRef(dye)
  const onPoseRef = useRef(onPose)
  paperRef.current = paper
  poseRef.current = pose
  dyeRef.current = dye
  onPoseRef.current = onPose
  const rebuildRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x241f1b, 1)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x241f1b)
    const camera = new THREE.PerspectiveCamera(38, 1, 0.02, 10)
    camera.up.set(0, 0, 1)
    camera.position.set(-0.26, -0.2, 0.2)
    camera.lookAt(0, 0, 0.015)
    scene.add(new THREE.HemisphereLight(0xf2efe6, 0x3a322c, 0.85))
    const sun = new THREE.DirectionalLight(0xfff6ea, 1.25)
    sun.position.set(0.4, -0.6, 1.2)
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xc5d0dc, 0.4)
    fill.position.set(-0.6, 0.4, 0.5)
    scene.add(fill)
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.16, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }),
    )
    shadow.position.z = -0.16
    scene.add(shadow)
    const group = new THREE.Group()
    const sheets = new THREE.Group()
    group.add(sheets)
    scene.add(group)
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const frames = new Map<number, HingeFrame>()
    let drag: {
      kind: 'flap'
      ply: number
      start: number
      downX: number
      downY: number
      openX: number
      openY: number
      axis: THREE.Vector3
      origin: THREE.Vector3
      radius: THREE.Vector3
    } | {
      kind: 'orbit'
      x: number
      y: number
    } | null = null

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

    const rebuild = () => {
      for (const child of [...sheets.children]) {
        sheets.remove(child)
        const mesh = child as THREE.Mesh
        mesh.geometry?.dispose()
        const material = mesh.material
        if (Array.isArray(material)) material.forEach((item) => item.dispose())
        else material?.dispose()
      }
      frames.clear()
      const current = poseRef.current ?? identityAdjust()
      const angles = new Map(current.parts.map((part) => [part.ply, part.angle]))
      const posed = posePaper(paperRef.current, angles)
      for (const [ply, frame] of posed.frames) frames.set(ply, frame)
      const q = quatOf(current)
      group.position.set(0, 0, 0)
      group.quaternion.set(q.x, q.y, q.z, q.w)
      const positions: number[] = []
      const colors: number[] = []
      fillPaperShell(positions, colors, posed.facets, dyeRef.current)
      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      geom.computeVertexNormals()
      const sheet = new THREE.Mesh(
        geom,
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.86,
          metalness: 0,
          side: THREE.DoubleSide,
        }),
      )
      sheet.raycast = () => {}
      sheets.add(sheet)
      const byPly = new Map<number, typeof posed.facets>()
      for (const facet of posed.facets) {
        const list = byPly.get(facet.ply) ?? []
        list.push(facet)
        byPly.set(facet.ply, list)
      }
      for (const [ply, facets] of byPly) {
        const pickPositions: number[] = []
        for (const facet of facets) {
          const poly = facet.poly
          for (let i = 1; i < poly.length - 1; i++) {
            pickPositions.push(poly[0].x, poly[0].y, poly[0].z, poly[i].x, poly[i].y, poly[i].z, poly[i + 1].x, poly[i + 1].y, poly[i + 1].z)
          }
        }
        const pickGeom = new THREE.BufferGeometry()
        pickGeom.setAttribute('position', new THREE.Float32BufferAttribute(pickPositions, 3))
        const picker = new THREE.Mesh(
          pickGeom,
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
        )
        picker.userData.bend = bendTarget(paperRef.current, ply)
        sheets.add(picker)
      }
      group.updateMatrixWorld(true)
      const center = new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3())
      group.position.copy(center).multiplyScalar(-1)
      group.updateMatrixWorld(true)
    }
    rebuildRef.current = rebuild
    rebuild()

    const ray = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      return raycaster.ray
    }
    const localRadius = (event: PointerEvent, origin: THREE.Vector3, axis: THREE.Vector3) => {
      group.updateMatrixWorld(true)
      const worldAxis = axis.clone().transformDirection(group.matrixWorld).normalize()
      const worldOrigin = origin.clone().applyMatrix4(group.matrixWorld)
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(worldAxis, worldOrigin)
      const hit = ray(event).intersectPlane(plane, new THREE.Vector3())
      if (!hit) return null
      const local = group.worldToLocal(hit)
      const radius = local.sub(origin)
      radius.addScaledVector(axis, -axis.dot(radius))
      if (radius.lengthSq() < 1e-8) return null
      return radius.normalize()
    }

    const down = (event: PointerEvent) => {
      if (event.button !== 0) return
      group.updateMatrixWorld(true)
      camera.updateMatrixWorld(true)
      ray(event)
      const hits = raycaster.intersectObjects(sheets.children, false)
      const bend = hits[0]?.object.userData.bend as number | null | undefined
      const fold = canvas.closest('.fold') as HTMLElement | null
      if (fold) fold.dataset.hot = bend == null ? '' : String(bend)
      if (bend == null) {
        drag = { kind: 'orbit', x: event.clientX, y: event.clientY }
        canvas.setPointerCapture(event.pointerId)
        return
      }
      const frame = frames.get(bend)
      if (!frame) return
      const origin = new THREE.Vector3(frame.a.x, frame.a.y, frame.a.z)
      const axis = new THREE.Vector3(frame.axis.x, frame.axis.y, frame.axis.z).normalize()
      const radius = localRadius(event, origin, axis)
      if (!radius) return
      const start = poseRef.current.parts.find((part) => part.ply === bend)?.angle ?? 0
      const toScreen = (local: THREE.Vector3) => {
        const ndc = local.clone().applyMatrix4(group.matrixWorld).project(camera)
        const rect = canvas.getBoundingClientRect()
        return {
          x: (ndc.x * 0.5 + 0.5) * rect.width + rect.left,
          y: (-ndc.y * 0.5 + 0.5) * rect.height + rect.top,
        }
      }
      const ahead = radius.clone().applyAxisAngle(axis, 1)
      const from = toScreen(origin.clone().add(radius.clone().multiplyScalar(0.04)))
      const toward = toScreen(origin.clone().add(ahead.multiplyScalar(0.04)))
      let openX = toward.x - from.x
      let openY = toward.y - from.y
      const span = Math.hypot(openX, openY) || 1
      openX /= span
      openY /= span
      drag = { kind: 'flap', ply: bend, start, downX: event.clientX, downY: event.clientY, openX, openY, axis, origin, radius }
      canvas.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (!drag) {
        ray(event)
        const hits = raycaster.intersectObjects(sheets.children, false)
        const bend = hits[0]?.object.userData.bend as number | null | undefined
        canvas.style.cursor = bend == null ? 'grab' : 'pointer'
        return
      }
      if (drag.kind === 'orbit') {
        const dx = event.clientX - drag.x
        const dy = event.clientY - drag.y
        drag.x = event.clientX
        drag.y = event.clientY
        if (dx === 0 && dy === 0) return
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).normalize()
        const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize()
        let next = orbitPose(poseRef.current, { x: up.x, y: up.y, z: up.z }, -dx * 0.008)
        next = orbitPose(next, { x: right.x, y: right.y, z: right.z }, -dy * 0.008)
        onPoseRef.current(next)
        return
      }
      const along = (event.clientX - drag.downX) * drag.openX + (event.clientY - drag.downY) * drag.openY
      onPoseRef.current(withPart(poseRef.current, drag.ply, drag.start + along * 0.012, paperRef.current))
    }
    const up = () => {
      drag = null
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    let frame = 0
    const loop = () => {
      frame = requestAnimationFrame(loop)
      renderer.render(scene, camera)
    }
    loop()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      rebuildRef.current = null
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    rebuildRef.current?.()
  }, [paper, pose, dye])

  return <canvas ref={canvasRef} className="adjust-canvas" />
}
