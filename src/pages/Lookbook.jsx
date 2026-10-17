import { useState } from 'react'
import { useStore } from '../store.jsx'
import { LOOKS } from '../site.js'
import ShirtSVG from '../components/ShirtSVG.jsx'
import Icon from '../components/Icon.jsx'

export default function Lookbook({ go }) {
  const { toast } = useStore()
  const [hotspot, setHotspot] = useState(null)

  return (
    <main>
      <div className="section" style={{ paddingBottom: 26 }}>
        <p className="eyebrow">The magazine</p>
        <h1 className="display" style={{ fontSize: 'clamp(52px, 8vw, 130px)' }}>Lookbook 01</h1>
        <p className="muted" style={{ marginTop: 14, maxWidth: 480 }}>Large looks, tiny captions, shoppable hotspots. Tap a dot to shop the look.</p>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="lookbook-grid">
          {LOOKS.map((look) => (
            <div
              className="look"
              key={look.id}
              style={{ gridColumn: `span ${look.span}`, minHeight: 460 }}
              onClick={() => setHotspot(look)}
            >
              <div className="look-art"><ShirtSVG color={look.color} design={look.design} /></div>
              {look.hotspot && (
                <button
                  className="hotspot"
                  style={look.hotspot}
                  onClick={(e) => { e.stopPropagation(); setHotspot(look) }}
                  aria-label={`Shop ${look.title}`}
                >+</button>
              )}
              <div className="look-cap">
                <small>{look.caption}</small>
                <p className="display">{look.title}</p>
                <button className="link-btn" style={{ color: 'inherit', marginTop: 8 }} onClick={(e) => { e.stopPropagation(); setHotspot(look) }}>Shop the look →</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hotspot && (
        <div className="modal-backdrop" onClick={() => setHotspot(null)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setHotspot(null)} aria-label="Close"><Icon name="close" size={17} /></button>
            <div className="quick-view">
              <div className="qv-media" style={{ background: hotspot.color === 'cream' ? '#ece3d2' : '#151515' }}>
                <ShirtSVG color={hotspot.color} design={hotspot.design} />
              </div>
              <div className="qv-body">
                <p className="eyebrow">Shop the look</p>
                <h2 className="display" style={{ fontSize: 44 }}>{hotspot.title}</h2>
                <p className="muted" style={{ marginTop: 10 }}>{hotspot.caption}</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 26, flexWrap: 'wrap' }}>
                  <button className="button button-blue" onClick={() => { setHotspot(null); go('studio') }}>Customize this look</button>
                  <button className="button button-ghost" onClick={() => { toast('Look saved — remix it any time.', 'info'); setHotspot(null) }}>Save look</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
