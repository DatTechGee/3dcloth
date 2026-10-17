import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { fmt, COLOR_OPTIONS, SIZES } from '../pricing.js'
import { PRODUCTS } from '../catalog.js'
import ShirtSVG from '../components/ShirtSVG.jsx'
import Icon from '../components/Icon.jsx'

const SORTS = [
  ['featured', 'Featured'],
  ['new', 'New in'],
  ['price-asc', 'Price: low → high'],
  ['price-desc', 'Price: high → low'],
  ['rating', 'Top rated'],
]

const TABS = [
  ['all', 'Shop all'],
  ['new', 'New in'],
  ['trending', 'Trending'],
  ['bestsellers', 'Best sellers'],
  ['deals', 'Deals'],
]

export default function Catalog({ go }) {
  const { pricing, wishlist, toggleWishlist, toast, coupons, markViewed } = useStore()
  const [tab, setTab] = useState('all')
  const [colorFilter, setColorFilter] = useState('all')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [maxPrice, setMaxPrice] = useState(30000)
  const [sort, setSort] = useState('featured')
  const [quickView, setQuickView] = useState(null)
  const [mobileFilters, setMobileFilters] = useState(false)

  const dealCode = coupons.find((c) => c.active && c.type === 'percentage')

  const base = pricing.basePrices['classic-tee']
  const list = useMemo(() => {
    let items = PRODUCTS.map((p) => ({ ...p, price: pricing.basePrices[p.id] }))
    if (tab === 'bestsellers') items = items.filter((p) => p.bestseller)
    if (tab === 'trending') items = items.filter((p) => p.badge === 'TRENDING' || p.bestseller)
    if (tab === 'new') items = items.filter((p) => p.badge === 'NEW' || true)
    if (tab === 'deals' && dealCode) items = items.map((p) => ({ ...p, dealPrice: Math.round(p.price * (1 - dealCode.value / 100)) }))
    items = items.filter((p) => p.price <= maxPrice)
    const by = {
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      new: (a, b) => (b.badge === 'NEW') - (a.badge === 'NEW'),
    }
    if (by[sort]) items = [...items].sort(by[sort])
    return items
  }, [tab, maxPrice, sort, pricing, dealCode])

  const filterPanel = (
    <div>
      <p className="eyebrow">Colour</p>
      <div className="swatch-row" style={{ marginBottom: 24 }}>
        <button className={'swatch-btn' + (colorFilter === 'all' ? ' active' : '')} onClick={() => setColorFilter('all')}>All</button>
        {COLOR_OPTIONS.slice(0, 6).map((c) => (
          <button key={c.id} className={'swatch-btn' + (colorFilter === c.id ? ' active' : '')} onClick={() => setColorFilter(c.id)}>
            <span className="dot" style={{ background: c.hex }} /> {c.label}
          </button>
        ))}
      </div>
      <p className="eyebrow">Size</p>
      <div className="size-row" style={{ marginBottom: 24 }}>
        <button className={'size-btn' + (sizeFilter === 'all' ? ' active' : '')} onClick={() => setSizeFilter('all')}>All</button>
        {SIZES.map((s) => (
          <button key={s} className={'size-btn' + (sizeFilter === s ? ' active' : '')} onClick={() => setSizeFilter(s)}>{s}</button>
        ))}
      </div>
      <p className="eyebrow">Max base price — {fmt(maxPrice)}</p>
      <input type="range" min={base} max={30000} step={500} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--blue)' }} />
    </div>
  )

  return (
    <main>
      <div className="section" style={{ paddingBottom: 30 }}>
        <p className="eyebrow">The collection</p>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 110px)' }}>Shop all</h1>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="template-tabs" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TABS.map(([id, label]) => (
              <button key={id} className={'template-tab' + (tab === id ? ' active' : '')} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="button button-ghost button-sm" onClick={() => setMobileFilters(true)} style={{ display: 'var(--filter-toggle, inline-flex)' }}>
              <Icon name="settings" size={13} /> Filters
            </button>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ border: '1px solid var(--line)', background: '#fff', padding: '9px 12px', fontSize: 12 }}>
              {SORTS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 30 }}>
          <div className="grid-3">
            {list.map((p) => {
              const wished = wishlist.some((w) => w.id === p.id)
              return (
                <article className="product-card" key={p.id}>
                  <div className="product-media" style={{ background: p.colorId === 'black' ? '#151515' : p.colorId === 'cream' ? '#ece3d2' : '#e9eaf0' }}>
                    <div className="product-badges">
                      {p.badge && <span className="chip on-media">{p.badge}</span>}
                      {p.dealPrice && dealCode && <span className="chip blue">−{dealCode.value}% with {dealCode.code}</span>}
                    </div>
                    <div className="product-actions always">
                      <button className={'wish-btn' + (wished ? ' active' : '')} onClick={() => { toggleWishlist({ id: p.id, name: p.name, price: p.price, colorId: p.colorId }); toast(wished ? 'Removed from wishlist.' : 'Saved to wishlist.', 'info') }} aria-label="Wishlist">
                        <Icon name="heart" size={16} />
                      </button>
                      <button className="wish-btn" onClick={() => setQuickView(p)} aria-label="Quick view"><Icon name="eye" size={16} /></button>
                    </div>
                    <svg className="shirt-art-svg" viewBox="0 0 200 200" aria-hidden="true">
                      <ShirtSVG color={p.colorId} garment={p.kind || 'tee'} showDesign={false} />
                    </svg>
                    <div className="product-hover-cta">
                      <button className="button button-light" onClick={() => { markViewed({ id: p.id, name: p.name }); go('product', p.id) }}>3D preview</button>
                      <button className="button button-blue" onClick={() => go('studio')}>Customize</button>
                    </div>
                  </div>
                  <div className="product-info">
                    <span className="product-sub">{p.fabric}</span>
                    <h3>{p.name}</h3>
                    <div className="product-row">
                      <div>
                        <strong>{p.dealPrice ? fmt(p.dealPrice) : fmt(p.price)}</strong>
                        {p.dealPrice && <span className="muted" style={{ textDecoration: 'line-through', marginLeft: 8, fontSize: 13 }}>{fmt(p.price)}</span>}
                      </div>
                      <span className="stars">★ {p.rating} <span className="muted">({p.reviews})</span></span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
          {list.length === 0 && (
            <div className="empty-state">
              <h2 className="display" style={{ fontSize: 40 }}>Nothing matches</h2>
              <p className="muted">Try widening your filters — or design something fully custom in the studio.</p>
              <button className="button button-blue" onClick={() => go('studio')}>Open the studio</button>
            </div>
          )}
        </div>
      </div>

      {/* desktop filters column removed in favour of drawer — shown inline on large screens via modal */}
      {mobileFilters && (
        <div className="modal-backdrop" onClick={() => setMobileFilters(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setMobileFilters(false)} aria-label="Close filters"><Icon name="close" size={17} /></button>
            <div style={{ padding: '38px 30px' }}>
              <p className="eyebrow">Refine</p>
              <h2 className="display" style={{ fontSize: 38, marginBottom: 22 }}>Filters</h2>
              {filterPanel}
              <button className="button button-blue button-block" style={{ marginTop: 20 }} onClick={() => setMobileFilters(false)}>Show {list.length} results</button>
            </div>
          </div>
        </div>
      )}

      {quickView && (
        <div className="modal-backdrop" onClick={() => setQuickView(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setQuickView(null)} aria-label="Close quick view"><Icon name="close" size={17} /></button>
            <div className="quick-view">
              <div className="qv-media" style={{ background: quickView.colorId === 'black' ? '#151515' : '#ece3d2' }}>
                <ShirtSVG color={quickView.colorId} garment={quickView.kind || 'tee'} showDesign={false} />
              </div>
              <div className="qv-body">
                <span className="product-sub">{quickView.fabric} · {quickView.fit}</span>
                <h2 className="display" style={{ fontSize: 40, margin: '10px 0' }}>{quickView.name}</h2>
                <p className="muted" style={{ fontSize: 14 }}>{quickView.tagline}</p>
                <p style={{ fontSize: 24, margin: '18px 0' }}>{fmt(quickView.price)}</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button className="button button-blue" style={{ flex: 1 }} onClick={() => { setQuickView(null); go('studio') }}>Customize</button>
                  <button className="button button-ghost" onClick={() => { setQuickView(null); go('product', quickView.id) }}>View in 3D</button>
                </div>
                <p className="stars" style={{ marginTop: 18 }}>★★★★★ {quickView.rating} from {quickView.reviews} reviews</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
