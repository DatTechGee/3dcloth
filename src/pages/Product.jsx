import { lazy, Suspense, useState } from 'react'
import { useStore } from '../store.jsx'
import { fmt, COLOR_OPTIONS, SIZES, unitPrice } from '../pricing.js'
import { PRODUCTS, PRODUCT_DETAILS, WHY_LOVE } from '../catalog.js'
import Icon from '../components/Icon.jsx'

const ShirtStage = lazy(() => import('../three/ShirtStage.jsx'))

export default function Product({ go, param }) {
  const { pricing, addToCart, toast, setCartOpen, wishlist, toggleWishlist, markViewed, deliveryZone } = useStore()
  const product = PRODUCTS.find((p) => p.id === param) || PRODUCTS[1]

  const [color, setColor] = useState(product.colorId || 'black')
  const [size, setSize] = useState('M')
  const [view, setView] = useState('front')
  const [autoRotate, setAutoRotate] = useState(true)

  const config = { shirtType: product.id, color, size, printLocation: 'front', printSize: 'medium', extras: {}, name: product.name, category: product.category }
  const price = unitPrice(pricing, config)
  const zone = pricing.deliveryZones.find((z) => z.id === deliveryZone) || pricing.deliveryZones[0]
  const wished = wishlist.some((w) => w.id === product.id)

  const quickAdd = () => {
    addToCart(config, 1)
    toast(`${product.name} (${color} / ${size}) added to your bag.`)
    setCartOpen(true)
  }

  return (
    <main>
      <div className="pdp">
        <div className="pdp-stage">
          <div className="pdp-canvas">
            <Suspense fallback={<div className="loading-screen">Preparing your garment…</div>}>
              <ShirtStage color={color} design={null} printLocation="front" printSize="medium" view={view} autoRotate={autoRotate} />
            </Suspense>
            <span className="chip on-media" style={{ position: 'absolute', top: 18, left: 18 }}>
              <Icon name="rotate" size={12} /> Drag to rotate · pinch to zoom
            </span>
          </div>
          <div className="pdp-controls">
            <div className="view-tabs">
              {['front', 'back', 'left', 'right'].map((v) => (
                <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>{v}</button>
              ))}
            </div>
            <div className="view-tabs">
              <button className={autoRotate ? 'active' : ''} onClick={() => setAutoRotate((a) => !a)}><Icon name="rotate" size={12} /> Auto</button>
              <button onClick={() => go('studio', undefined)}>Open in studio</button>
            </div>
          </div>
        </div>

        <div className="pdp-info">
          <span className="product-sub">{product.badge} · {product.fabric}</span>
          <h1 style={{ marginTop: 10 }}>{product.name}</h1>
          <p className="stars" style={{ marginTop: 10 }}>★★★★★ {product.rating} <span className="muted" style={{ fontSize: 12 }}>({product.reviews} reviews)</span></p>
          <p className="pdp-price">{fmt(price)}</p>
          <p className="muted" style={{ fontSize: 13.5 }}>Custom print from {fmt(pricing.printLocationFee.front)} · bulk discounts from 3 shirts</p>

          <div className="pdp-block">
            <h3>Colour</h3>
            <div className="swatch-row">
              {COLOR_OPTIONS.slice(0, 5).map((c) => (
                <button key={c.id} className={'swatch-btn' + (color === c.id ? ' active' : '')} onClick={() => setColor(c.id)}>
                  <span className="dot" style={{ background: c.hex }} /> {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pdp-block">
            <h3>Size</h3>
            <div className="size-row">
              {SIZES.map((s) => (
                <button key={s} className={'size-btn' + (size === s ? ' active' : '')} onClick={() => setSize(s)}>
                  {s}{pricing.sizeSurcharge[s] ? <sup>+</sup> : ''}
                </button>
              ))}
            </div>
            <button className="link-btn size-guide-link">Size guide — find my size</button>
          </div>

          <div className="pdp-block" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="button button-blue button-lg" style={{ flex: 1, minWidth: 200 }} onClick={() => go('studio')}>
              Customize this tee <Icon name="spark" size={15} />
            </button>
            <button className="button button-lg" onClick={quickAdd}>Add to cart</button>
            <button className="button button-ghost button-lg" onClick={() => { toggleWishlist({ id: product.id, name: product.name, price, colorId: product.colorId }); toast(wished ? 'Removed from wishlist.' : 'Saved to wishlist.', 'info') }} aria-label="Wishlist">
              <Icon name="heart" size={17} />
            </button>
          </div>

          <div className="delivery-note">
            <Icon name="truck" size={18} />
            <span><strong>{zone.label}</strong> — estimated {zone.eta} · {zone.fee ? fmt(zone.fee) : 'Free'}</span>
          </div>

          <div className="pdp-block">
            <h3>Why you’ll love it</h3>
            <ul className="love-list">
              {WHY_LOVE.map((w) => (
                <li key={w}><Icon name="check" size={15} /> {w}</li>
              ))}
            </ul>
          </div>

          <div className="pdp-block">
            <h3>Product details</h3>
            <div className="summary-line"><span className="label">Material</span><span>{PRODUCT_DETAILS.material}</span></div>
            <div className="summary-line"><span className="label">Fit</span><span>{product.fit}</span></div>
            <div className="summary-line"><span className="label">Print method</span><span>{PRODUCT_DETAILS.printMethod}</span></div>
            <div className="summary-line"><span className="label">Care</span><span>{PRODUCT_DETAILS.care}</span></div>
          </div>

          <button className="link-btn" style={{ marginTop: 26 }} onClick={() => markViewed({ id: product.id, name: product.name }) || go('catalog')}>← Back to shop</button>
        </div>
      </div>
    </main>
  )
}
