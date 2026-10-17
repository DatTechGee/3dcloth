import { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import ShirtSVG from '../components/ShirtSVG.jsx'
import Icon from '../components/Icon.jsx'

function Countdown({ target }) {
  const [left, setLeft] = useState(Math.max(0, target - Date.now()))
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000)
    return () => clearInterval(t)
  }, [target])
  const d = Math.floor(left / 86400000)
  const h = Math.floor((left % 86400000) / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  const s = Math.floor((left % 60000) / 1000)
  const pad = (n) => String(n).padStart(2, '0')
  return (
    <div className="countdown">
      <div className="cd-cell"><strong>{pad(d)}</strong><span>Days</span></div>
      <div className="cd-cell"><strong>{pad(h)}</strong><span>Hours</span></div>
      <div className="cd-cell"><strong>{pad(m)}</strong><span>Mins</span></div>
      <div className="cd-cell"><strong>{pad(s)}</strong><span>Secs</span></div>
    </div>
  )
}

const DROP_ART = [
  { color: 'black', design: { text: 'AFTER\nDARK', color: '#2563eb', font: 'display' } },
  { color: 'charcoal', design: { text: 'MIDNIGHT\nRUN', color: '#f59e0b', font: 'mono' } },
  { color: 'navy', design: { text: 'BLUE\nHOUR', color: '#fafaf7', font: 'serif' } },
  { color: 'black', design: { text: 'NO\nSLEEP', color: '#dc2626', font: 'display' } },
]

export default function Drops({ go }) {
  const { site } = useStore()
  const drops = site.drops || []
  const live = drops.find((d) => d.status === 'live') || drops[0]
  const upcoming = drops.filter((d) => d !== live)

  return (
    <main>
      {live && (
        <section className="drop-hero">
          <p className="eyebrow" style={{ color: 'var(--muted-dark)' }}>{live.number} · <span style={{ color: 'var(--success)' }}>● LIVE NOW</span></p>
          <h1 className="display">{live.name}</h1>
          <p style={{ color: 'var(--muted-dark)', marginTop: 18, maxWidth: 440 }}>{live.blurb}</p>
          {live.endsAt && <Countdown target={live.endsAt} />}
          <button className="button button-blue button-lg" style={{ marginTop: 36 }} onClick={() => go('studio')}>
            Customize from this drop <Icon name="arrow" size={15} />
          </button>

          <div className="grid-4" style={{ marginTop: 60 }}>
            {DROP_ART.map((a, i) => (
              <article className="drop-card" key={i} style={{ background: 'rgba(243,235,221,0.05)', color: 'var(--cream)', minHeight: 320 }} onClick={() => go('studio')}>
                <span className="drop-num">0{i + 1} —</span>
                {i === 0 && <span className="chip blue drop-badge">LIVE</span>}
                <div className="shirt-art"><ShirtSVG color={a.color} design={a.design} /></div>
                <p className="display">{a.design.text.split('\n')[0]}</p>
                <p style={{ color: 'var(--muted-dark)' }}>Limited run · customize yours</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Set your alarm</p>
              <h2 className="display">Upcoming drops</h2>
            </div>
          </div>
          {upcoming.map((d) => (
            <div className="promo-list-item" key={d.id}>
              <div>
                <strong className="mono" style={{ fontSize: 13 }}>{d.number} — {d.name}</strong>
                <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>{d.blurb}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="chip info">Starts {d.startsAt ? new Date(d.startsAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'soon'}</span>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  )
}
