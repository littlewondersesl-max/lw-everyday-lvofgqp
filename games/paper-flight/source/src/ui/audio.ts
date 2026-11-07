let ctx: AudioContext | null = null

function context(): AudioContext | null {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  return ctx
}

/** A short mechanical flick. No samples, no network. */
export function playFlick() {
  const audio = context()
  if (!audio) return
  if (audio.state === 'suspended') void audio.resume()
  const now = audio.currentTime
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.18), audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length
    data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t)
  }
  const noise = audio.createBufferSource()
  noise.buffer = buffer
  const filter = audio.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(900, now)
  filter.frequency.exponentialRampToValueAtTime(420, now + 0.16)
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
  noise.connect(filter)
  filter.connect(gain)
  gain.connect(audio.destination)
  noise.start(now)
  noise.stop(now + 0.2)

  const tone = audio.createOscillator()
  tone.type = 'triangle'
  const toneGain = audio.createGain()
  tone.frequency.setValueAtTime(240, now)
  tone.frequency.exponentialRampToValueAtTime(90, now + 0.12)
  toneGain.gain.setValueAtTime(0.0001, now)
  toneGain.gain.exponentialRampToValueAtTime(0.05, now + 0.015)
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
  tone.connect(toneGain)
  toneGain.connect(audio.destination)
  tone.start(now)
  tone.stop(now + 0.15)
}
