import { useStore } from '../store.jsx'
import { fmt, COLOR_OPTIONS } from '../pricing.js'
import ShirtSVG from '../components/ShirtSVG.jsx'
import Icon from '../components/Icon.jsx'

const STATUS_FLOW = [
  { id: 'received', label: 'Received', ico: 'bag' },
  { id: 'paid', label: 'Payment confirmed', ico: 'check' },
  { id: 'design-approved', label: 'Design approved', ico: 'shield' },
  { id: 'in-production', label: 'In production', ico: 'layers' },
  { id: 'ready', label: 'Quality checked', ico: 'check' },
  { id: 'shipped', label: 'Out for delivery', ico: 'truck' },
  { id: 'delivered', label: 'Delivered', ico: 'check' },
]

const stepIndex = (status) => {
  const map = {
    received: 0, paid: 1, 'design-approved': 2, 'in-production': 3,
    quality: 4, ready: 4, shipped: 5, out: 5, delivered: 6, completed: 6,
  }
  return map[status] ?? 0
}

const STATUS_STYLE = {
  received: 'info', paid: 'success', 'design-approved': 'success',
  'in-production': 'warn', quality: 'warn', ready: 'warn',
  shipped: 'info', out: 'info', delivered: 'success', completed: 'success',
  cancelled: 'danger', 'on-hold': 'danger', refunded: 'danger',
}

export default function Orders({ go }) {
  const { orders, toast, markViewed } = useStore()

  if (orders.length === 0) {
    return (
      <main>
        <div className="nf">
          <div>
            <div className="nf-art"><ShirtSVG color="grey" showDesign={false} /></div>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 7vw, 90px)' }}>No orders yet</h1>
            <p className="muted" style={{ margin: '16px auto 30px', maxWidth: 420 }}>
              When you place an order, its production journey — from design approval to your doorstep — shows up right here.
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
        <p className="eyebrow">Track every stitch</p>
        <h1 className="display" style={{ fontSize: 'clamp(44px, 6vw, 88px)' }}>Your orders</h1>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        {orders.slice().reverse().map((order) => {
          const idx = stepIndex(order.status)
          return (
            <article className="order-card" key={order.id}>
              <div className="order-head">
                <div>
                  <span className="order-id">ORDER {order.id}</span>
                  <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    Placed {new Date(order.placedAt).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <span className={'chip ' + (STATUS_STYLE[order.status] || 'info')}>{order.status.replace(/-/g, ' ')}</span>
                  <strong style={{ fontSize: 18 }}>{fmt(order.summary.total)}</strong>
                </div>
              </div>

              {/* progress timeline */}
              <div className="order-timeline">
                {STATUS_FLOW.map((step, i) => (
                  <div key={step.id} className={'timeline-step' + (i <= idx ? ' done' : '')}>
                    <span className="tl-dot" />
                    <span className="tl-label">{step.label}</span>
                  </div>
                ))}
              </div>

              {/* items */}
              <div className="order-items">
                {order.items.map((item) => (
                  <div className="order-item" key={item.id}>
                    <div className="oi-thumb" style={{ background: COLOR_OPTIONS.find((c) => c.id === item.color)?.hex || '#eee' }}>
                      <ShirtSVG color={item.color} design={item.design} showDesign={Boolean(item.design)} />
                    </div>
                    <div>
                      <strong>{item.name}</strong>
                      <p className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                        {item.size} · {COLOR_OPTIONS.find((c) => c.id === item.color)?.label || item.color} · ×{item.quantity}
                      </p>
                      {item.designApproved && <span className="chip success" style={{ marginTop: 6 }}><Icon name="shield" size={11} /> Approved artwork</span>}
                    </div>
                    <strong>{fmt(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>

              {/* activity log */}
              {order.activity?.length > 0 && (
                <div className="order-activity">
                  <p className="eyebrow" style={{ marginBottom: 10 }}>Activity</p>
                  {order.activity.slice().reverse().slice(0, 4).map((a, i) => (
                    <div className="activity-row" key={i}>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', minWidth: 110 }}>
                        {new Date(a.at).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ fontSize: 12.5 }}>{a.note}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="order-foot">
                <button className="button button-sm button-ghost" onClick={() => { markViewed(order.items[0]); go('studio') }}>
                  <Icon name="rotate" size={13} /> Reorder this design
                </button>
                <button className="button button-sm button-ghost" onClick={() => toast('Support: WhatsApp 0800 CREATIVE MODE — we reply in minutes.', 'info')}> 
                  Get help <Icon name="arrow" size={12} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
