import { SHEET } from '../src/sim/constants'
import { ARCHETYPES } from '../src/sim/bots'
import { applyOps, blankSheet, materialArea, type FoldOp } from '../src/sim/geometry'
import { deriveShape } from '../src/sim/shape'
import { aeroProfile, simulateFlight } from '../src/sim/flight'

const top = SHEET.height / 2
const side = SHEET.width / 2
function line(x0: number, y0: number, x1: number, y1: number, sideChoice: 1 | -1 = 1): FoldOp {
  return { angle: Math.atan2(y1 - y0, x1 - x0), ax: (x0 + x1) / 2, ay: (y0 + y1) / 2, side: sideChoice }
}
const extra: Record<string, FoldOp[]> = {
  corners: [line(0, top, -side, top - side), line(0, top, side, top - side)],
  strip: [{ angle: 0, ax: 0, ay: top - 0.045, side: 1 }],
  stripCorners: [
    { angle: 0, ax: 0, ay: top - 0.05, side: 1 },
    line(-side, top - 0.05, -0.02, top - 0.11),
    line(side, top - 0.05, 0.02, top - 0.11),
  ],
  deepNose: [
    line(0, top, -side, top - side),
    line(0, top, side, top - side),
    { angle: 0, ax: 0, ay: top - 0.07, side: 1 },
  ],
  wide: [
    { angle: 0, ax: 0, ay: top - 0.055, side: 1 },
    line(-side * 0.15, top - 0.055, -side, top - 0.12),
    line(side * 0.15, top - 0.055, side, top - 0.12),
  ],
}

const blank = deriveShape(blankSheet())
console.log('blank mass', blank.mass.toFixed(5), 'plan', blank.planformArea.toFixed(4), 'blunt', blank.bluntness.toFixed(2), 'AR', blank.aspect.toFixed(2))

function report(name: string, ops: FoldOp[], aim: { height: number; pitch: number; yaw: number; speed: number }) {
  const paper = applyOps(ops)
  const shape = deriveShape(paper)
  const prof = aeroProfile(shape)
  const flight = simulateFlight(shape, { x: 0.04, y: 0, ...aim }, { trace: true, aero: true })
  const ballistic = simulateFlight(shape, { x: 0.04, y: 0, ...aim }, { aero: false })
  console.log(
    `\n${name} folds=${ops.length} mass=${shape.mass.toFixed(5)} plan=${shape.planformArea.toFixed(4)} layers=${shape.meanLayers.toFixed(2)} AR=${shape.aspect.toFixed(2)} blunt=${shape.bluntness.toFixed(2)} asym=${shape.asymmetry.toFixed(2)} chord=${shape.chord.toFixed(3)} span=${shape.span.toFixed(3)}`,
  )
  console.log(
    `  lead=${shape.xLead.toFixed(3)} cent=${shape.planformCentroid.x.toFixed(3)} xCp=${prof.xCp.toFixed(4)} noseH=${prof.noseHeavy.toFixed(3)} cm0=${prof.cm0.toFixed(4)} clTrim=${prof.clTrim.toFixed(3)} stable=${prof.stable} cd0=${prof.cd0.toFixed(3)} areaOk=${(materialArea(paper) / (0.2159 * 0.2794)).toFixed(4)}`,
  )
  console.log(
    `  dist=${flight.distance.toFixed(2)} t=${flight.duration.toFixed(2)} tumble=${flight.tumbled} ballistic=${ballistic.distance.toFixed(2)} bt=${ballistic.duration.toFixed(2)}`,
  )
  const tr = flight.trace ?? []
  for (const p of tr.filter((_, i) => i % 4 === 0)) {
    console.log(
      `   t=${p.t.toFixed(2)} z=${p.z.toFixed(2)} x=${p.noseX.toFixed(2)} v=${p.speed.toFixed(2)} a=${((p.alpha * 180) / Math.PI).toFixed(1)} pitch=${((p.pitch * 180) / Math.PI).toFixed(1)} up=${p.up.toFixed(2)}`,
    )
  }
}

extra.tighter = [
  line(0, top, -side, top - side),
  line(0, top, side, top - side),
  line(0, top - 0.028, -side, top - side - 0.028),
  line(0, top - 0.028, side, top - side - 0.028),
]
extra.tighter2 = [
  ...extra.tighter,
  line(0, top - 0.05, -side, top - side - 0.05),
  line(0, top - 0.05, side, top - side - 0.05),
]

const speeds = [3.4, 4.2, 5.2, 6.5, 8]
for (const [name, ops] of Object.entries(extra)) {
  for (const speed of speeds) {
    const paper = applyOps(ops)
    const shape = deriveShape(paper)
    const prof = aeroProfile(shape)
    const flight = simulateFlight(shape, {
      x: 0.04, y: 0, z: 1.42, pitch: (2.5 * Math.PI) / 180, yaw: 0, speed,
    })
    if (speed === 4.2) {
      console.log(
        `${name} blunt=${shape.bluntness.toFixed(2)} AR=${shape.aspect.toFixed(2)} stable=${prof.stable} clTrim=${prof.clTrim.toFixed(2)} cd0=${prof.cd0.toFixed(3)} xCp=${prof.xCp.toFixed(3)} asym=${shape.asymmetry.toFixed(2)}`,
      )
    }
    console.log(`  v=${speed.toFixed(1)} dist=${flight.distance.toFixed(2)} t=${flight.duration.toFixed(2)} tumble=${flight.tumbled}`)
  }
}

const sheet = deriveShape(blankSheet())
const drop = simulateFlight(sheet, { x: 0.04, y: 0, z: 1.6, pitch: 0, yaw: 0, speed: 3 }, { trace: true })
console.log('\nslow sheet', drop.distance.toFixed(2), 'tumble', drop.tumbled, 'dur', drop.duration.toFixed(2))
