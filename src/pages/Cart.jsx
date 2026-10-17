import { useStore } from '../store.jsx'
import { fmt, COLOR_OPTIONS, PRINT_LOCATIONS, PRINT_SIZES } from '../pricing.js'
import ShirtSVG from '../components/ShirtSVG.jsx'
import OrderSummary from '../components/OrderSummary.jsx'
import Icon from '../components/Icon.jsx'

const label = (list, id) => list.find((x) => x.id === id)?.label || id

export default function Cart({ go }) {
  const { cart, updateQuantity, removeFromCart, summary } = useStore()

  if (cart.length === 0) {
    return (
      <main>
        <div className="nf">
          <div>
            <div className="nf-art"><ShirtSVG color="grey" showDesign={false} /></div>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 7vw, 90px)' }}>Your bag is empty</h1>
            <p className="muted" style={{ margin: '16px auto 30px', maxWidth: 420 }}>
              Design a custom tee in the studio — your coupon applies at checkout, and bulk pricing kicks in automatically.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="button button-blue button-lg" onClick={() => go('studio')}><Icon name="spark" size={15} /> Create your tee</button>
              <button className="button button-lg" onClick={() => go('catalog')}>Shop apparel</button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="section" style={{ paddingBottom: 24 }}>
        <p className="eyebrow">Your selection</p>
        <h1 className="display" style={{ fontSize: 'clamp(44px, 6vw, 88px)' }}>Shopping bag</h1>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="checkout-grid">
          <div>
            {cart.map((item) => (
              <div className="order-card" key={item.id} style={{ display: 'grid', gridTemplateColumns: '100px minmax(0,1fr) auto', gap: 20, alignItems: 'center' }}>
                <div style={{ width: 100, height: 100, background: COLOR_OPTIONS.find((c) => c.id === item.color)?.hex || '#eee', display: 'grid', placeItems: 'center' }}>
                  <ShirtSVG color={item.color} design={item.design} showDesign={Boolean(item.design)} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17 }}>{item.name}</h3>
                  <p className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 6 }}>
                    {COLOR_OPTIONS.find((c) => c.id === item.color)?.label || item.color} · Size {item.size} · {label(PRINT_LOCATIONS, item.printLocation)} print · {label(PRINT_SIZES, item.printSize)}
                  </p>
                  {Object.entries(item.extras || {}).filter(([, on]) => on).map(([key]) => (
                    <span className="chip blue" style={{ marginTop: 8, marginRight: 6 }} key={key}>
                      {key === 'nameEmbroidery' ? 'Stitched name' : key === 'customTag' ? 'Custom tag' : 'Gift wrap'}
                    </span>
                  ))}
                  {item.designApproved && <span className="chip success" style={{ marginTop: 8 }}><Icon name="shield" size={11} /> Design approved</span>}
                  <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>{fmt(item.unitPrice)} each</p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
                  <strong style={{ fontSize: 18 }}>{fmt(item.lineTotal)}</strong>
                  <div className="qty-stepper">
                    <button onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease">−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} aria-label="Increase">+</button>
                  </div>
                  <button className="link-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              </div>
            ))}
            <button className="link-btn" style={{ marginTop: 18 }} onClick={() => go('studio')}>← Add another custom tee</button>
          </div>

          <div>
            <OrderSummary />
            <button className="button button-blue button-lg button-block" style={{ marginTop: 16 }} disabled={summary.quantity === 0} onClick={() => go('checkout')}>
              Proceed to checkout <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
