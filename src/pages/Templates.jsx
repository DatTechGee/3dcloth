import { useState } from 'react'
import { useStore } from '../store.jsx'
import { DESIGN_TEMPLATES, OCCASIONS } from '../site.js'
import ShirtSVG from '../components/ShirtSVG.jsx'
import Icon from '../components/Icon.jsx'

export default function Templates({ go, param }) {
  const { toast, saveDesign } = useStore()
  const [tab, setTab] = useState(param || 'all')
  const list = tab === 'all' ? DESIGN_TEMPLATES : DESIGN_TEMPLATES.filter((t) => t.occasion === tab)

  return (
    <main>
      <div className="section" style={{ paddingBottom: 26 }}>
        <p className="eyebrow">Don’t start from scratch</p>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 110px)' }}>Templates</h1>
        <p className="muted" style={{ marginTop: 12, maxWidth: 480 }}>
          Pick a design, remix the text, colour and placement — make it unmistakably yours in the 3D studio.
        </p>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="template-tabs">
          {[['all', 'All'], ...OCCASIONS.map((o) => [o.id, o.label])].map(([id, label]) => (
            <button key={id} className={'template-tab' + (tab === id ? ' active' : '')} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        <div className="grid-4">
          {list.map((t) => (
            <article className="template-card" key={t.id}>
              <div className="tpl-media"><ShirtSVG color={t.color} design={{ text: t.text, color: t.textColor, font: t.font }} /></div>
              <div style={{ padding: '14px 16px' }}>
                <strong style={{ fontSize: 14 }}>{t.title}</strong>
                <p className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{OCCASIONS.find((o) => o.id === t.occasion)?.label || t.occasion}</p>
              </div>
              <div className="tpl-actions">
                <button onClick={() => go('studio', `tpl:${t.id}`)}>Remix</button>
                <button onClick={() => { saveDesign({ name: t.title, color: t.color, elements: [], thumbnail: { text: t.text, color: t.textColor, font: t.font } }); toast(`“${t.title}” saved to your designs.`, 'info') }}>
                  <Icon name="heart" size={12} /> Save
                </button>
              </div>
            </article>
          ))}
        </div>

        {list.length === 0 && (
          <div className="empty-state">
            <h2 className="display" style={{ fontSize: 40 }}>Nothing here yet</h2>
            <p className="muted">This occasion’s drop is coming soon — start blank in the studio for now.</p>
            <button className="button button-blue" onClick={() => go('studio')}>Open the studio</button>
          </div>
        )}
      </div>
    </main>
  )
}
