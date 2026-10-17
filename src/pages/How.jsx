import { useStore } from '../store.jsx'
import { HOW_STEPS } from '../catalog.js'
import Icon from '../components/Icon.jsx'

export default function How({ go }) {
  const { coupons } = useStore()
  const live = coupons.filter((c) => c.active)

  return (
    <main>
      <div className="section" style={{ paddingBottom: 30 }}>
        <p className="eyebrow">From idea to your doorstep</p>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 110px)' }}>How it works</h1>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="how-flow" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          {HOW_STEPS.map(([n, title, body]) => (
            <div className="how-step" key={n}>
              <span className="num">{n}</span>
              <p className="display">{title}</p>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="section cream-bg" style={{ maxWidth: 'none' }}>
        <div style={{ maxWidth: 1560, margin: '0 auto' }}>
          <div className="section-head">
            <div>
              <p className="eyebrow">Live promotions</p>
              <h2 className="display">Coupons running now</h2>
            </div>
          </div>
          <div className="coupon-grid">
            {live.map((c) => (
              <div className="coupon-card" key={c.code}>
                <p className="coupon-code">{c.code}</p>
                <p className="coupon-desc">{c.description || (c.type === 'percentage' ? `${c.value}% off` : `₦${c.value.toLocaleString()} off`)}</p>
                <div className="coupon-facts">
                  {c.minOrder > 0 && <span className="chip">Min ₦{c.minOrder.toLocaleString()}</span>}
                  {c.minQuantity > 0 && <span className="chip">{c.minQuantity}+ shirts</span>}
                  {c.firstOrderOnly && <span className="chip blue">First order</span>}
                  {c.maxUses > 0 && <span className="chip">{Math.max(0, c.maxUses - c.uses)} left</span>}
                  {c.expiresAt && <span className="chip warn">Ends {new Date(c.expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span>}
                </div>
                <div className="coupon-foot">
                  <span className="coupon-uses">{c.uses} uses so far</span>
                  <button className="button button-sm button-dark" onClick={() => go('studio')}>Use code <Icon name="arrow" size={12} /></button>
                </div>
              </div>
            ))}
          </div>
          {live.length === 0 && <p className="muted">No live promotions right now — check back soon.</p>}
        </div>
      </section>

      <section className="on-dark" style={{ padding: '90px 4vw', textAlign: 'center' }}>
        <h2 className="display" style={{ fontSize: 'clamp(40px, 6vw, 90px)' }}>Ready when you are.</h2>
        <p style={{ color: 'var(--muted-dark)', marginTop: 14 }}>Apply any coupon at checkout and watch the total drop.</p>
        <button className="button button-blue button-lg" style={{ marginTop: 30 }} onClick={() => go('studio')}>Open the studio <Icon name="arrow" size={15} /></button>
      </section>
    </main>
  )
}
