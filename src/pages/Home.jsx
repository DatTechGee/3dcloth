import { lazy, Suspense } from 'react'
import { useStore } from '../store.jsx'
import { PRODUCTS } from '../catalog.js'
import { COLOR_OPTIONS } from '../pricing.js'
import { OCCASIONS } from '../site.js'
import ShirtSVG from '../components/ShirtSVG.jsx'
import Icon from '../components/Icon.jsx'

const ShirtStage = lazy(() => import('../three/ShirtStage.jsx'))
const sectionOn = (site, id) => site.homepageSections?.find((s) => s.id === id)?.active !== false

const garments = [
  { label: 'Jet black', color: 'black', detail: 'Heavyweight / 240gsm', accent: '#2563eb' },
  { label: 'Soft cream', color: 'cream', detail: 'Premium cotton / 180gsm', accent: '#f26332' },
  { label: 'Deep navy', color: 'navy', detail: 'Piqué cotton / relaxed', accent: '#f0c65d' },
]

export default function Home({ go }) {
  const { site } = useStore()
  const liveDrop = site.drops?.find((drop) => drop.status === 'live')

  return (
    <main className="home">
      {sectionOn(site, 'hero') && (
        <section className="home-hero">
          <div className="home-hero-copy">
            <div className="home-kicker"><span /> CREATIVE MODE / 01</div>
            <h1 className="display">Made<br /><em>by you.</em></h1>
            <p className="home-hero-lede">
              Custom clothing without the guesswork. Build your shirt in 3D,
              see every surface, then order it exactly as designed.
            </p>
            <div className="home-actions">
              <button className="button button-blue button-lg" onClick={() => go('studio')}>
                Start creating <Icon name="arrow" size={16} />
              </button>
              <button className="home-text-link" onClick={() => go('catalog')}>Shop ready-made <Icon name="arrow" size={14} /></button>
            </div>
            <div className="home-proof">
              <span><b>01</b> Design in 3D</span>
              <span><b>02</b> Approve the proof</span>
              <span><b>03</b> We print in Abuja</span>
            </div>
          </div>
          <div className="home-hero-visual">
            <div className="home-visual-note">TURN IT<br />YOUR WAY</div>
            <Suspense fallback={<div className="loading-screen">Preparing your garment…</div>}>
              <ShirtStage
                color="cream"
                frontDesign={{ text: 'CM', color: '#090909', font: 'display' }}
                backDesign={{ text: 'MAKE\nYOUR MARK', color: '#f26332', font: 'display' }}
                printLocation="all"
                printSize="medium"
                autoRotate
                view="front"
              />
            </Suspense>
            <div className="home-visual-meta"><span className="home-dot" /> LIVE 3D PREVIEW <span>360°</span></div>
          </div>
        </section>
      )}

      <div className="home-marquee" aria-hidden="true">
        <div>DESIGN YOUR FIT <span>✦</span> FRONT / BACK / SLEEVES <span>✦</span> PRINTED IN ABUJA <span>✦</span> DESIGN YOUR FIT <span>✦</span></div>
      </div>

      {sectionOn(site, 'drop') && (
        <section className="home-section home-featured">
          <div className="home-section-heading">
            <div>
              <p className="eyebrow">The essentials</p>
              <h2 className="display">Start with<br /><em>something good.</em></h2>
            </div>
            <div className="home-heading-side">
              <p>Clean blanks. Premium fabric. Ready for your next idea.</p>
              <button className="button button-dark button-sm" onClick={() => go('catalog')}>View all garments <Icon name="arrow" size={13} /></button>
            </div>
          </div>
          <div className="home-garment-grid">
            {garments.map((garment, index) => (
              <article className="home-garment-card" key={garment.color} onClick={() => go('product', PRODUCTS[index % PRODUCTS.length].id)}>
                <div className="home-garment-media" style={{ background: `linear-gradient(145deg, ${garment.accent} 0%, ${COLOR_OPTIONS.find((item) => item.id === garment.color)?.hex || '#111'} 46%, #090909 100%)` }}>
                  <span className="home-card-index">0{index + 1}</span>
                  <ShirtSVG color={garment.color} showDesign={false} />
                  <span className="home-card-arrow"><Icon name="arrow" size={17} /></span>
                </div>
                <div className="home-garment-info">
                  <div><h3>{garment.label}</h3><p>{garment.detail}</p></div>
                  <span className="home-swatch" style={{ background: COLOR_OPTIONS.find((item) => item.id === garment.color)?.hex }} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {sectionOn(site, 'showcase') && (
        <section className="home-studio">
          <div className="home-studio-visual">
            <div className="home-studio-grid" />
            <Suspense fallback={<div className="loading-screen">Preparing your garment…</div>}>
              <ShirtStage
                color="black"
                frontDesign={{ text: 'YOUR\nIDEA', color: '#f3ebdd', font: 'display' }}
                backDesign={{ text: 'CREATIVE\nMODE', color: '#2563eb', font: 'mono' }}
                printLocation="all"
                printSize="large"
                autoRotate
                view="front"
              />
            </Suspense>
            <span className="home-studio-label">FRONT</span>
            <span className="home-studio-label right">BACK / SLEEVE / FRONT</span>
          </div>
          <div className="home-studio-copy">
            <p className="eyebrow">The design studio</p>
            <h2 className="display">Every side<br /><em>is yours.</em></h2>
            <p>Move around the garment before you spend a naira. Place artwork on the front, back, or either sleeve and see the print as it will be made.</p>
            <div className="home-view-list">
              {['Front placement', 'Back placement', 'Left + right sleeve', 'Live print proof'].map((item, index) => (
                <span key={item}><b>0{index + 1}</b>{item}</span>
              ))}
            </div>
            <button className="button button-blue button-lg" onClick={() => go('studio')}>Open the 3D studio <Icon name="arrow" size={16} /></button>
          </div>
        </section>
      )}

      {sectionOn(site, 'occasion') && (
        <section className="home-section home-occasions">
          <div className="home-section-heading">
            <div><p className="eyebrow">Made for the moment</p><h2 className="display">What are you<br /><em>making?</em></h2></div>
            <p className="home-heading-side">One tool for every kind of group, gift, memory, and movement.</p>
          </div>
          <div className="home-occasion-grid">
            {OCCASIONS.slice(0, 6).map((occasion, index) => (
              <button className="home-occasion" key={occasion.id} onClick={() => go('templates', occasion.id)}>
                <span className="home-occasion-number">0{index + 1}</span>
                <span className="home-occasion-art"><ShirtSVG color={['black', 'cream', 'navy', 'orange'][index % 4]} showDesign={false} /></span>
                <strong>{occasion.label}</strong><Icon name="arrow" size={14} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="home-final">
        <div><p className="eyebrow">No ordinary uniforms</p><h2 className="display">Put your<br /><em>name on it.</em></h2></div>
        <div className="home-final-side">
          <p>From one perfect tee to a full team run, Creative Mode makes custom clothing feel simple.</p>
          <button className="button button-blue button-lg" onClick={() => go('studio')}>Create your piece <Icon name="arrow" size={16} /></button>
          {liveDrop && <span className="home-live">{liveDrop.number} / {liveDrop.name} IS LIVE</span>}
        </div>
      </section>
    </main>
  )
}
