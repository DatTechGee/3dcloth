import { useStore } from '../store.jsx'
import { fmt } from '../pricing.js'
import { PRODUCTS } from '../catalog.js'
import ShirtSVG from '../components/ShirtSVG.jsx'

const ART = {
  'black-edit': { bg: '#101010', color: 'black', design: { text: 'AFTER\nDARK', color: '#2563eb', font: 'display' } },
  'cream-edit': { bg: '#ece3d2', color: 'cream', design: { text: 'SOFT\nLIFE', color: '#090909', font: 'serif' } },
  street: { bg: '#1a1a1a', color: 'orange', design: { text: 'ABUJA\nSTREETS', color: '#f3ebdd', font: 'display' } },
  'grad-2026': { bg: '#1e2940', color: 'navy', design: { text: 'CLASS\n2026', color: '#f0c65d', font: 'serif' } },
  couples: { bg: '#efe9dd', color: 'white', design: { text: 'MR &\nMRS', color: '#090909', font: 'serif' } },
  corporate: { bg: '#d9d6cd', color: 'grey', design: { text: 'ZURI\nLABS', color: '#090909', font: 'mono' } },
}

export default function Collections({ go, param }) {
  const { site, pricing } = useStore()
  const collections = site.collections || []
  const active = param ? collections.find((c) => c.id === param) : null
  const fromPrice = Math.min(...Object.values(pricing.basePrices))

  if (active) {
    const art = ART[active.id] || ART['black-edit']
    return (
      <main>
        <section className="editorial" style={{ background: art.bg, color: art.color === 'cream' || art.color === 'white' || art.color === 'grey' ? 'var(--jet)' : 'var(--cream)' }}>
          <div className="ed-media" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <ShirtSVG color={art.color} showDesign={false} />
          </div>
          <div className="ed-copy">
            <p className="eyebrow">Collection</p>
            <h2 className="display">{active.name}</h2>
            <p style={{ opacity: 0.7 }}>{active.blurb}</p>
            <button className="button button-blue button-lg" onClick={() => go('studio')}>Customize yours</button>
          </div>
        </section>
        <div className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">In this collection</p>
              <h2 className="display">The garments</h2>
            </div>
          </div>
          <div className="grid-3">
            {PRODUCTS.map((p) => (
              <article className="product-card" key={p.id}>
                <div className="product-media" style={{ background: art.bg }}>
                  <svg className="shirt-art-svg" viewBox="0 0 200 200"><ShirtSVG color={art.color} showDesign={false} /></svg>
                  <div className="product-hover-cta">
                    <button className="button button-light" onClick={() => go('product', p.id)}>3D preview</button>
                    <button className="button button-blue" onClick={() => go('studio')}>Customize</button>
                  </div>
                </div>
                <div className="product-info">
                  <h3>{p.name}</h3>
                  <div className="product-row"><strong>From {fmt(fromPrice)}</strong><span className="muted" style={{ fontSize: 12 }}>{p.fabric}</span></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="section" style={{ paddingBottom: 26 }}>
        <p className="eyebrow">Curated edits</p>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 110px)' }}>Collections</h1>
        <p className="muted" style={{ marginTop: 12, maxWidth: 460 }}>Even one garment can feel like a full wardrobe when the edit is right.</p>
      </div>
      <div className="section" style={{ paddingTop: 0 }}>
        <div className="grid-3">
          {collections.map((c) => {
            const art = ART[c.id] || ART['black-edit']
            return (
              <article className="drop-card" key={c.id} style={{ background: art.bg, color: art.color === 'cream' || art.color === 'white' || art.color === 'grey' ? 'var(--jet)' : 'var(--cream)', minHeight: 380 }} onClick={() => go('collections', c.id)}>
                <div className="shirt-art"><ShirtSVG color={art.color} showDesign={false} /></div>
                <p className="display">{c.name}</p>
                <p style={{ color: 'inherit', opacity: 0.65 }}>{c.blurb}</p>
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}
