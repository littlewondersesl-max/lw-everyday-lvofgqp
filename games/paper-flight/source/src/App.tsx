import { useEffect, useMemo, useRef, useState } from 'react'
import type { AimInput, PublicRoom } from './sim/room'
import type { FoldOp, SheetStep } from './sim/geometry'
import { stockById } from './sim/stock'
import { DYES, dyeById } from './sim/dyes'
import { applySolo, openSolo, shouldTrySocket, type SoloSession } from './solo'
import { FoldView } from './ui/FoldView'
import { HallView } from './ui/HallView'
import { Book } from './ui/Book'

type Status = 'connecting' | 'live' | 'closed'
type LinkMode = 'pending' | 'solo' | 'net'

export function App() {
  const [status, setStatus] = useState<Status>('connecting')
  const [mode, setMode] = useState<LinkMode>('pending')
  const [room, setRoom] = useState<PublicRoom | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [model, setModel] = useState(false)
  const [bookOpen, setBookOpen] = useState(false)
  const [bookPage, setBookPage] = useState(0)
  const [practice, setPractice] = useState<{ id: number; op: FoldOp } | null>(null)
  const [localOps, setLocalOps] = useState<SheetStep[] | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const soloRef = useRef<SoloSession | null>(null)
  const modeRef = useRef<LinkMode>('pending')
  const practiceSeq = useRef(0)

  useEffect(() => {
    let stopped = false
    let welcomed = false
    let retry = 0
    let socket: WebSocket | null = null

    const startSolo = () => {
      if (stopped || welcomed || soloRef.current) return
      try {
        socket?.close()
      } catch {
        /* already closed */
      }
      const name = sessionStorage.getItem('pip-name') || 'Guest'
      const opened = openSolo(name)
      if ('error' in opened) {
        setError(opened.error)
        return
      }
      soloRef.current = opened
      modeRef.current = 'solo'
      setMode('solo')
      setStatus('live')
      setError(null)
      setRoom(opened.view)
    }

    const connect = () => {
      if (stopped || welcomed || soloRef.current) return
      const params = new URLSearchParams(location.search)
      const roomCode = (params.get('room') || '').toUpperCase()
      const token = sessionStorage.getItem('pip-token') || ''
      const name = sessionStorage.getItem('pip-name') || 'Guest'
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      // Optional. GitHub Pages has no WebSocket server; if this does not open, the page plays solo.
      try {
        socket = new WebSocket(`${proto}://${location.host}/ws`)
      } catch {
        startSolo()
        return
      }
      wsRef.current = socket
      socket.onopen = () => {
        retry = 0
        socket?.send(JSON.stringify({ type: 'hello', room: roomCode || undefined, token, name }))
      }
      socket.onmessage = (event) => {
        if (soloRef.current) {
          socket?.close()
          return
        }
        const msg = JSON.parse(String(event.data)) as {
          type: string
          room?: string
          token?: string
          state?: PublicRoom
          message?: string
        }
        if (msg.type === 'welcome' && msg.room && msg.token) {
          welcomed = true
          modeRef.current = 'net'
          setMode('net')
          sessionStorage.setItem('pip-token', msg.token)
          const url = new URL(location.href)
          url.searchParams.set('room', msg.room)
          history.replaceState(null, '', url)
          setStatus('live')
          setError(null)
        } else if (msg.type === 'state' && msg.state) {
          setRoom(msg.state)
          setStatus('live')
        } else if (msg.type === 'error' && msg.message) {
          setError(msg.message)
        }
      }
      socket.onclose = () => {
        if (stopped || soloRef.current) return
        if (!welcomed) {
          startSolo()
          return
        }
        setStatus('closed')
        retry += 1
        window.setTimeout(connect, Math.min(4000, 350 * retry))
      }
    }

    if (!shouldTrySocket(location)) {
      startSolo()
      return () => {
        stopped = true
      }
    }
    const giveUp = window.setTimeout(() => {
      if (!welcomed) startSolo()
    }, 1200)
    connect()
    return () => {
      stopped = true
      window.clearTimeout(giveUp)
      socket?.close()
    }
  }, [])

  const me = room?.seats.find((s) => s.you) ?? null
  const serverKey = JSON.stringify(me?.ops ?? [])
  useEffect(() => {
    if (!localOps) return
    if (JSON.stringify(localOps) === serverKey) setLocalOps(null)
  }, [serverKey, localOps])

  const ops = localOps ?? me?.ops ?? []
  const step = !room || room.phase === 'fold' ? 0 : room.phase === 'aim' ? 1 : 2
  const hall = room && room.phase !== 'fold'

  function send(payload: unknown) {
    const session = soloRef.current
    if (session && modeRef.current === 'solo') {
      setRoom(applySolo(session, payload as Record<string, unknown>))
      return
    }
    const socket = wsRef.current
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload))
  }

  const link = useMemo(() => (room && mode === 'net' ? `${location.origin}${location.pathname}?room=${room.code}` : ''), [room, mode])

  return (
    <div className={hall ? 'app hall-mode' : 'app fold-mode'} data-mode={mode}>
      <header>
        <a className="site-back" href="../../index.html">
          Back to Little Wonders
        </a>
        <div className="brand">
          <span>Pip</span>
          <small>Farthest landing wins</small>
        </div>
        <ol className="crumbs">
          {['Fold', 'Aim', 'Flight'].map((label, index) => (
            <li key={label} className={index === step ? 'on' : index < step ? 'done' : ''}>
              {label}
            </li>
          ))}
        </ol>
        <div className="seats">
          {room?.seats.map((seat) => (
            <div key={seat.index} className={seat.you ? 'seat you' : 'seat'}>
              <i
                style={{ background: seat.paper, boxShadow: `inset 0 0 0 1.5px ${seat.color}` }}
                title={`${seat.dyeName} paper`}
              />
              <em>{seat.name}{seat.you ? ' (you)' : ''}</em>
              <span>{seat.kind === 'bot' ? 'bot' : seat.connected ? 'here' : 'away'}</span>
            </div>
          ))}
        </div>
        <div className="room-chip">
          {mode === 'solo' && (
            <strong className="solo-mark" title="Solo: you and three bots. This page is not a shared room.">
              Solo
            </strong>
          )}
          {mode === 'net' && room && (
            <>
              <button type="button" className="linkish" onClick={() => rename(send)}>
                {me?.name ?? 'Guest'}
              </button>
              <strong>{room.code}</strong>
              <button
                type="button"
                onClick={() => {
                  const text = link
                  if (navigator.clipboard?.writeText) {
                    void navigator.clipboard.writeText(text).then(() => {
                      setCopied(true)
                      window.setTimeout(() => setCopied(false), 1600)
                    })
                  } else {
                    window.prompt('Share this link', text)
                  }
                }}
              >
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </>
          )}
          {mode === 'solo' && (
            <button type="button" className="linkish" onClick={() => rename(send)}>
              {me?.name ?? 'Guest'}
            </button>
          )}
          <button type="button" className="linkish" onClick={() => setModel(true)}>
            Model
          </button>
        </div>
      </header>
      <main>
        {!room && (
          <div className="gate">
            <p>{status === 'closed' ? 'Reconnecting to the hall…' : 'Opening the hall…'}</p>
          </div>
        )}
        {room && room.phase === 'fold' && me && (
          <FoldView
            ops={ops}
            stock={stockById(room.stock)}
            dye={dyeById(me.dye)}
            dyes={DYES}
            taken={room.seats.filter((seat) => seat.dye !== me.dye).map((seat) => seat.dye)}
            onDye={(id) => send({ type: 'color', color: id })}
            onStock={(id) => send({ type: 'stock', stock: id })}
            onNewSheet={(id) => send({ type: 'newSheet', stock: id })}
            practice={practice}
            onOps={(next) => {
              setLocalOps(next)
              send({ type: 'folds', ops: next })
            }}
            onDone={() => send({ type: 'ready' })}
          />
        )}
        {room && room.phase !== 'fold' && (
          <HallView
            room={room}
            onThrow={(aim: AimInput) => send({ type: 'throw', aim })}
            onNewRound={() => send({ type: 'newRound' })}
          />
        )}
        {room && (
          <>
            <button type="button" className="book-tab" aria-haspopup="dialog" onClick={() => setBookOpen(true)}>
              <span className="book-glyph" aria-hidden="true" />
              Book
            </button>
            <Book
              open={bookOpen}
              page={bookPage}
              dye={dyeById(me?.dye)}
              canPractice={room.phase === 'fold'}
              onPage={setBookPage}
              onClose={() => setBookOpen(false)}
              onPlace={(op) => {
                practiceSeq.current += 1
                setPractice({ id: practiceSeq.current, op })
                setBookOpen(false)
              }}
            />
          </>
        )}
        {error && (
          <div className="gate error">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('pip-token')
                const url = new URL(location.href)
                url.searchParams.delete('room')
                location.href = url.toString()
              }}
            >
              Open a new hall
            </button>
          </div>
        )}
      </main>
      {model && (
        <div className="modal" onClick={() => setModel(false)}>
          <article onClick={(event) => event.stopPropagation()}>
            <h2>How the flight is approximated</h2>
            <p>
              This is a fixed-step rigid-body model, not a claim that a real sheet of paper would match it fold for fold.
            </p>
            <ul>
              <li>The sheet is letter paper at 80 g/m². A fold reflects the marked side across the crease and stacks it. By default that is the smaller side. Area of paper is kept; overlapping layers are the same paper twice.</li>
              <li>The hall air is still. Density is 1.20 kg/m³ and gravity is 9.81 m/s². Drag and lift use the craft’s own speed, so a moving sheet feels air even with no wind.</li>
              <li>Lift and drag follow a flat-plate angle of attack, with an aspect-ratio lift slope, parasite drag from how blunt the nose is, and induced drag. Past stall the plate law takes over and the sheet drops.</li>
              <li>Force acts at a neutral point estimated from the outline. Nose-heavy, pointed, symmetric folds also get a small crease-reflex couple so they can hold a shallow angle and glide. Lopsided or blunt folds do not.</li>
              <li>The paper is rigid. It does not flex, flutter, or cushion itself on the floor. Planes do not disturb each other’s air. Thickness on screen is exaggerated so the layers stay readable.</li>
            </ul>
            <button type="button" onClick={() => setModel(false)}>
              Back to the sheet
            </button>
          </article>
        </div>
      )}
    </div>
  )
}

function rename(send: (payload: unknown) => void) {
  const next = window.prompt('Name on the ledge', sessionStorage.getItem('pip-name') || 'Guest')
  if (!next) return
  sessionStorage.setItem('pip-name', next.slice(0, 16))
  send({ type: 'rename', name: next })
}
