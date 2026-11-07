import { useEffect, useRef, useState } from 'react'
import { HALL, LIMITS, releaseHeight } from '../sim/constants'
import type { AimInput, PublicFlight, PublicRoom } from '../sim/room'
import { mountHall, type HallAim, type HallSnapshot } from '../view/hallScene'
import { playFlick } from './audio'

interface Props {
  room: PublicRoom
  onThrow: (aim: AimInput) => void
  onNewRound: () => void
}

export function HallView({ room, onThrow, onNewRound }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [aim, setAim] = useState<HallAim>({
    height: 0.55,
    pitch: (2 * Math.PI) / 180,
    yaw: 0,
    speed: 5.6,
    lifted: false,
  })
  const [board, setBoard] = useState(false)
  const [replay, setReplay] = useState(0)
  const snap = useRef<HallSnapshot>({
    phase: room.phase,
    you: room.you,
    seats: [],
    flights: room.flights,
    aim,
    replayToken: 0,
    stock: room.stock,
  })

  snap.current = {
    phase: room.phase,
    you: room.you,
    seats: room.seats.map((s) => ({
      index: s.index,
      name: s.name,
      color: s.color,
      paper: s.paper,
      dye: s.dye,
      ops: s.ops,
      you: s.you,
      aim: s.aim,
    })),
    flights: room.flights,
    aim,
    replayToken: replay + (room.flights ? room.round * 10 : 0),
    stock: room.stock,
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return mountHall(canvas, {
      get: () => snap.current,
      onAim: setAim,
      onCinemaDone: () => setBoard(true),
    })
  }, [])

  const flightKey = room.flights?.map((f) => f.distance.toFixed(3)).join('|') ?? ''
  useEffect(() => {
    setBoard(false)
  }, [room.round, flightKey])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (room.phase !== 'aim') return
      if (event.key === 'ArrowUp') setAim((a) => ({ ...a, lifted: true, pitch: clamp(a.pitch + 0.02, LIMITS.minPitch, LIMITS.maxPitch) }))
      else if (event.key === 'ArrowDown') setAim((a) => ({ ...a, lifted: true, pitch: clamp(a.pitch - 0.02, LIMITS.minPitch, LIMITS.maxPitch) }))
      else if (event.key === 'ArrowLeft') setAim((a) => ({ ...a, lifted: true, yaw: clamp(a.yaw + 0.02, -LIMITS.maxYaw, LIMITS.maxYaw) }))
      else if (event.key === 'ArrowRight') setAim((a) => ({ ...a, lifted: true, yaw: clamp(a.yaw - 0.02, -LIMITS.maxYaw, LIMITS.maxYaw) }))
      else if (event.key === 'PageUp') setAim((a) => ({ ...a, lifted: true, height: clamp(a.height + 0.04, LIMITS.minHeight, LIMITS.maxHeight) }))
      else if (event.key === 'PageDown') setAim((a) => ({ ...a, lifted: true, height: clamp(a.height - 0.04, LIMITS.minHeight, LIMITS.maxHeight) }))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [room.phase])

  const me = room.seats.find((s) => s.you)
  const showAim = room.phase === 'aim' && me && !me.waiting
  const ranked = [...(room.flights ?? [])].sort((a, b) => b.distance - a.distance || a.seat - b.seat)

  return (
    <div className="hall">
      <canvas ref={canvasRef} className="hall-canvas" />
      {showAim && (
        <>
          <div className="aim-readout">
            <span>Above the platform</span>
            <strong>{aim.height.toFixed(2)} m</strong>
            <span>{aim.lifted ? 'In hand' : 'On the deck'}</span>
            <span>Release {releaseHeight(aim.height).toFixed(2)} m over the floor</span>
            <span>{aim.lifted ? pitchLabel(aim.pitch) : 'Level on the deck'}</span>
            <span>{aim.lifted ? yawLabel(aim.yaw) : 'Aimed down the hall'}</span>
            <p>
              {aim.lifted
                ? 'Drag to change height above the deck and yaw. Scroll to pitch the nose.'
                : `Deck is ${HALL.ledgeHeight.toFixed(0)} m up, the start of the upper third. Click your sheet to lift it.`}
            </p>
          </div>
          <label className="power">
            <span>Power</span>
            <input
              type="range"
              min={LIMITS.minSpeed}
              max={LIMITS.maxSpeed}
              step={0.05}
              value={aim.speed}
              aria-label="Launch speed"
              onChange={(event) => setAim((a) => ({ ...a, speed: Number(event.target.value) }))}
            />
            <strong>{aim.speed.toFixed(1)}</strong>
            <em>m/s</em>
            <button
              type="button"
              className="throw"
              onClick={() => {
                playFlick()
                onThrow({ height: aim.height, pitch: aim.pitch, yaw: aim.yaw, speed: aim.speed })
              }}
            >
              Throw
            </button>
          </label>
        </>
      )}
      {me?.waiting && <div className="wait-note">You have this seat for the next round.</div>}
      {board && room.flights && (
        <section className="results">
          <h2>{headline(ranked, room)}</h2>
          <ol>
            {ranked.map((flight, index) => {
              const seat = room.seats[flight.seat]
              return (
                <li key={flight.seat}>
                  <span className="place">{index + 1}</span>
                  <i style={{ background: seat?.paper, boxShadow: `inset 0 0 0 1.5px ${seat?.color ?? '#1c1915'}` }} />
                  <span className="who">{seat?.name}{seat?.you ? ' (you)' : ''}</span>
                  <span className="dist">{flight.distance.toFixed(1)} m</span>
                  <span className="how">{flight.tumbled ? 'tumbled' : 'flew'}</span>
                </li>
              )
            })}
          </ol>
          <div className="result-actions">
            <button
              type="button"
              onClick={() => {
                setBoard(false)
                setReplay((n) => n + 1)
              }}
            >
              Replay
            </button>
            <button type="button" className="primary" onClick={onNewRound}>
              New round
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function headline(ranked: PublicFlight[], room: PublicRoom) {
  if (!ranked.length) return 'No flights yet'
  const best = ranked[0]
  const second = ranked[1]
  const seat = room.seats[best.seat]
  if (second && Math.abs(best.distance - second.distance) < 0.05) return 'A near tie on the floor'
  const who = seat?.you ? 'You land' : `${seat?.name ?? 'Someone'} lands`
  return `${who} farthest, ${best.distance.toFixed(1)} m`
}

function pitchLabel(pitch: number) {
  const deg = Math.round((pitch * 180) / Math.PI)
  if (Math.abs(deg) < 1) return 'Nose straight'
  return deg > 0 ? `Nose up ${deg}°` : `Nose down ${-deg}°`
}

function yawLabel(yaw: number) {
  const deg = Math.round((yaw * 180) / Math.PI)
  if (Math.abs(deg) < 1) return 'Aimed down the hall'
  return deg > 0 ? `Yaw left ${deg}°` : `Yaw right ${-deg}°`
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}
