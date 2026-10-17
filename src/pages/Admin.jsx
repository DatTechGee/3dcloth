import { useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import { fmt, SHIRT_TYPES, COLOR_OPTIONS, PRINT_LOCATIONS, PRINT_SIZES, SIZES } from '../pricing.js'
import { PRODUCTS } from '../catalog.js'
import { blankCoupon } from '../coupons.js'
import ShirtSVG from '../components/ShirtSVG.jsx'
import Logo from '../components/Logo.jsx'
import Icon from '../components/Icon.jsx'

// ---------------------------------------------------------------------------
// Admin console — data-driven light UI (its own interface language).
// Grouped sidebar: Store · Content · Sales · Operations.
// ---------------------------------------------------------------------------

const NAV = [
  { group: 'Overview', items: [['dashboard', 'Dashboard', 'grid']] },
  {
    group: 'Store', items: [
      ['products', 'Products', 'tag'],
      ['pricing', 'Pricing', 'coin'],
    ],
  },
  {
    group: 'Content', items: [
      ['homepage', 'Homepage', 'home'],
      ['announcements', 'Announcements', 'megaphone'],
      ['drops', 'Drops', 'spark'],
    ],
  },
  {
    group: 'Sales', items: [
      ['orders', 'Orders', 'bag'],
      ['coupons', 'Coupons', 'ticket'],
      ['customers', 'Customers', 'users'],
    ],
  },
  {
    group: 'Operations', items: [
      ['production', 'Production board', 'layers'],
      ['audit', 'Audit log', 'list'],
      ['settings', 'Settings', 'settings'],
    ],
  },
]

const ORDER_STATUSES = ['received', 'paid', 'design-approved', 'in-production', 'ready', 'shipped', 'delivered', 'cancelled', 'refunded']

const fmtDate = (ts) => new Date(ts).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Stat({ label, value, sub, accent }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={accent ? { color: accent } : undefined}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  )
}

// ----- dashboard -----------------------------------------------------------
function Dashboard({ go }) {
  const { orders, coupons, site } = useStore()
  const revenue = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded').reduce((s, o) => s + o.summary.total, 0)
  const units = orders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0)
  const liveCoupons = coupons.filter((c) => c.active).length
  const pending = orders.filter((o) => ['received', 'paid', 'design-approved'].includes(o.status)).length

  return (
    <div>
      <div className="stat-grid">
        <Stat label="Revenue" value={fmt(revenue)} sub={`${orders.length} orders total`} accent="var(--blue)" />
        <Stat label="Units printed" value={units} sub="All time" />
        <Stat label="Needs attention" value={pending} sub="Orders in early stages" accent={pending ? 'var(--warning)' : undefined} />
        <Stat label="Live coupons" value={liveCoupons} sub={`${site.drops?.filter((d) => d.status === 'live').length || 0} live drop`} />
      </div>

      <div className="admin-split">
        <div className="panel">
          <div className="panel-head">
            <h2>Recent orders</h2>
            <button className="button button-sm button-ghost" onClick={() => go('admin-orders')}>View all</button>
          </div>
          {orders.length === 0 && <p className="muted" style={{ padding: 20 }}>No orders yet.</p>}
          {orders.slice(-6).reverse().map((o) => (
            <div className="admin-row" key={o.id}>
              <div>
                <strong className="mono" style={{ fontSize: 12 }}>{o.id}</strong>
                <p className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{o.customer?.name} · {fmtDate(o.placedAt)}</p>
              </div>
              <span className={'chip ' + ({ received: 'info', paid: 'success', 'in-production': 'warn' }[o.status] || 'info')}>{o.status}</span>
              <strong style={{ fontSize: 13 }}>{fmt(o.summary.total)}</strong>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-head"><h2>Quick actions</h2></div>
          <div style={{ padding: 20, display: 'grid', gap: 10 }}>
            <button className="button button-dark" onClick={() => go('admin-coupons')}>Create a coupon</button>
            <button className="button button-ghost" onClick={() => go('admin-announcements')}>Edit announcement bars</button>
            <button className="button button-ghost" onClick={() => go('admin-pricing')}>Adjust pricing</button>
            <button className="button button-ghost" onClick={() => go('admin-production')}>Open production board</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ----- pricing -------------------------------------------------------------
function PricingAdmin() {
  const { pricing, setPricing, toast, logAudit } = useStore()
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(pricing)))

  const patch = (fn) => setDraft((d) => { const next = JSON.parse(JSON.stringify(d)); fn(next); return next })
  const save = () => { setPricing(draft); logAudit('Pricing updated'); toast('Pricing saved — live across the store.') }

  return (
    <div>
      <div className="panel">
        <div className="panel-head"><h2>Base prices per shirt type</h2></div>
        <div className="form-grid">
          {SHIRT_TYPES.map((t) => (
            <div className="field" key={t.id}>
              <label>{t.label}</label>
              <input type="number" value={draft.basePrices[t.id] || 0} onChange={(e) => patch((d) => { d.basePrices[t.id] = Number(e.target.value) })} />
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Colour surcharges (₦)</h2></div>
        <div className="form-grid">
          {COLOR_OPTIONS.map((c) => (
            <div className="field" key={c.id}>
              <label><span className="dot" style={{ background: c.hex, display: 'inline-block', width: 9, height: 9, borderRadius: 99, marginRight: 6 }} />{c.label}</label>
              <input type="number" value={draft.colorSurcharge[c.id] ?? 0} onChange={(e) => patch((d) => { d.colorSurcharge[c.id] = Number(e.target.value) })} />
            </div>
          ))}
        </div>
      </div>

      <div className="admin-split">
        <div className="panel">
          <div className="panel-head"><h2>Size surcharges (₦)</h2></div>
          {SIZES.map((s) => (
            <div className="admin-row" key={s}>
              <strong style={{ fontSize: 13 }}>{s}</strong>
              <input type="number" style={{ width: 110 }} value={draft.sizeSurcharge[s] ?? 0} onChange={(e) => patch((d) => { d.sizeSurcharge[s] = Number(e.target.value) })} />
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-head"><h2>Print fees (₦)</h2></div>
          <p className="muted" style={{ padding: '14px 20px 0', fontSize: 12 }}>By location</p>
          {PRINT_LOCATIONS.map((l) => (
            <div className="admin-row" key={l.id}>
              <strong style={{ fontSize: 13 }}>{l.label}</strong>
              <input type="number" style={{ width: 110 }} value={draft.printLocationFee[l.id] ?? 0} onChange={(e) => patch((d) => { d.printLocationFee[l.id] = Number(e.target.value) })} />
            </div>
          ))}
          <p className="muted" style={{ padding: '14px 20px 0', fontSize: 12 }}>By size</p>
          {PRINT_SIZES.map((s) => (
            <div className="admin-row" key={s.id}>
              <strong style={{ fontSize: 13 }}>{s.label}</strong>
              <input type="number" style={{ width: 110 }} value={draft.printSizeFee[s.id] ?? 0} onChange={(e) => patch((d) => { d.printSizeFee[s.id] = Number(e.target.value) })} />
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Quantity discounts</h2></div>
        {draft.quantityDiscounts.map((t, i) => (
          <div className="admin-row" key={i}>
            <strong style={{ fontSize: 13 }}>{t.minimum}+ shirts</strong>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" style={{ width: 90 }} value={t.percent} onChange={(e) => patch((d) => { d.quantityDiscounts[i].percent = Number(e.target.value) })} />%
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Delivery zones (₦)</h2></div>
        {draft.deliveryZones.map((z, i) => (
          <div className="admin-row" key={z.id}>
            <div>
              <strong style={{ fontSize: 13 }}>{z.label}</strong>
              <p className="muted" style={{ fontSize: 11.5 }}>{z.eta}</p>
            </div>
            <input type="number" style={{ width: 110 }} value={z.fee} onChange={(e) => patch((d) => { d.deliveryZones[i].fee = Number(e.target.value) })} />
          </div>
        ))}
        <div className="admin-row">
          <strong style={{ fontSize: 13 }}>Free delivery over (₦)</strong>
          <input type="number" style={{ width: 130 }} value={draft.freeDeliveryOver} onChange={(e) => patch((d) => { d.freeDeliveryOver = Number(e.target.value) })} />
        </div>
      </div>

      <div style={{ position: 'sticky', bottom: 0, background: 'var(--admin-bg)', padding: '14px 0', display: 'flex', gap: 10 }}>
        <button className="button button-blue" onClick={save}>Save pricing</button>
        <button className="button button-ghost" onClick={() => setDraft(JSON.parse(JSON.stringify(pricing)))}>Discard changes</button>
      </div>
    </div>
  )
}

// ----- coupons -------------------------------------------------------------
function CouponsAdmin() {
  const { coupons, setCoupons, toast, logAudit } = useStore()
  const [editing, setEditing] = useState(null)

  const saveCoupon = (c) => {
    if (!c.code.trim()) { toast('Coupon code is required.', 'error'); return }
    const code = c.code.trim().toUpperCase()
    setCoupons((prev) => {
      const exists = prev.some((x) => x.code === code && x !== c)
      const next = prev.some((x) => x.code === (c._orig || code))
        ? prev.map((x) => (x.code === (c._orig || code) ? { ...c, code, uses: x.uses } : x))
        : [...prev, { ...c, code, uses: 0 }]
      return exists && !c._orig ? prev : next
    })
    logAudit(`Coupon ${code} saved`)
    toast(`Coupon ${code} is live.`)
    setEditing(null)
  }

  const remove = (code) => {
    setCoupons((prev) => prev.filter((c) => c.code !== code))
    logAudit(`Coupon ${code} deleted`)
    toast(`Coupon ${code} deleted.`, 'info')
  }

  const toggle = (code) => {
    setCoupons((prev) => prev.map((c) => (c.code === code ? { ...c, active: !c.active } : c)))
    logAudit(`Coupon ${code} toggled`)
  }

  return (
    <div>
      <div className="panel-head" style={{ marginBottom: 16 }}>
        <h2>{coupons.length} coupons</h2>
        <button className="button button-blue button-sm" onClick={() => setEditing({ ...blankCoupon() })}>+ New coupon</button>
      </div>

      <div className="coupon-admin-grid">
        {coupons.map((c) => (
          <div className="coupon-card" key={c.code}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p className="coupon-code">{c.code}</p>
              <label className="switch">
                <input type="checkbox" checked={c.active} onChange={() => toggle(c.code)} />
                <i />
              </label>
            </div>
            <p className="coupon-desc">{c.description || (c.type === 'percentage' ? `${c.value}% off` : `${fmt(c.value)} off`)}</p>
            <div className="coupon-facts">
              <span className="chip">{c.type}</span>
              {c.minOrder > 0 && <span className="chip">Min {fmt(c.minOrder)}</span>}
              {c.minQuantity > 0 && <span className="chip">{c.minQuantity}+ shirts</span>}
              {c.firstOrderOnly && <span className="chip blue">First order</span>}
              {c.maxUses > 0 && <span className="chip">{Math.max(0, c.maxUses - c.uses)} left</span>}
              {c.expiresAt && <span className="chip warn">Ends {new Date(c.expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span>}
              {c.combinable && <span className="chip">Combinable</span>}
            </div>
            <div className="coupon-foot">
              <span className="coupon-uses">{c.uses} uses</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="button button-sm button-ghost" onClick={() => setEditing({ ...c, _orig: c.code })}>Edit</button>
                <button className="button button-sm button-ghost" style={{ color: 'var(--error)' }} onClick={() => remove(c.code)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && <CouponEditor coupon={editing} onSave={saveCoupon} onClose={() => setEditing(null)} />}
    </div>
  )
}

function CouponEditor({ coupon, onSave, onClose }) {
  const [c, setC] = useState(coupon)
  const set = (key, value) => setC((x) => ({ ...x, [key]: value }))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" size={17} /></button>
        <div style={{ padding: '36px 32px' }}>
          <p className="eyebrow">Coupon editor</p>
          <h2 className="display" style={{ fontSize: 34, marginBottom: 20 }}>{c.code || 'New coupon'}</h2>

          <div className="form-grid">
            <div className="field"><label>Code</label><input value={c.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="SUMMER20" /></div>
            <div className="field">
              <label>Type</label>
              <select value={c.type} onChange={(e) => set('type', e.target.value)}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
                <option value="free-delivery">Free delivery</option>
              </select>
            </div>
            {c.type !== 'free-delivery' && (
              <div className="field"><label>{c.type === 'percentage' ? 'Value (%)' : 'Value (₦)'}</label><input type="number" value={c.value} onChange={(e) => set('value', Number(e.target.value))} /></div>
            )}
            <div className="field"><label>Min order (₦)</label><input type="number" value={c.minOrder} onChange={(e) => set('minOrder', Number(e.target.value))} /></div>
            <div className="field"><label>Min quantity</label><input type="number" value={c.minQuantity} onChange={(e) => set('minQuantity', Number(e.target.value))} /></div>
            <div className="field"><label>Max total uses (0 = ∞)</label><input type="number" value={c.maxUses} onChange={(e) => set('maxUses', Number(e.target.value))} /></div>
            <div className="field"><label>Per-customer uses (0 = ∞)</label><input type="number" value={c.maxUsesPerCustomer} onChange={(e) => set('maxUsesPerCustomer', Number(e.target.value))} /></div>
            <div className="field"><label>Expires at</label><input type="date" value={c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : ''} onChange={(e) => set('expiresAt', e.target.value ? new Date(e.target.value).getTime() : 0)} /></div>
            <div className="field"><label>Starts at</label><input type="date" value={c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 10) : ''} onChange={(e) => set('startsAt', e.target.value ? new Date(e.target.value).getTime() : 0)} /></div>
            <div className="field" style={{ gridColumn: '1/-1' }}><label>Description</label><input value={c.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="10% off your first custom tee" /></div>
          </div>

          <div style={{ display: 'grid', gap: 10, margin: '18px 0' }}>
            {[
              ['firstOrderOnly', 'First-order customers only'],
              ['combinable', 'Combinable with other offers'],
            ].map(([key, label]) => (
              <label className="checkbox-row" key={key}>
                <input type="checkbox" checked={Boolean(c[key])} onChange={(e) => set(key, e.target.checked)} /> {label}
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="button button-blue" onClick={() => onSave(c)}>Save coupon</button>
            <button className="button button-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ----- announcements -------------------------------------------------------
function AnnouncementsAdmin() {
  const { site, setSite, toast, logAudit } = useStore()
  const bars = site.announcements || []

  const update = (next) => { setSite({ ...site, announcements: next }); logAudit('Announcements updated'); toast('Announcement bars updated.') }
  const patchBar = (i, key, value) => update(bars.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)))

  return (
    <div>
      <div className="panel-head" style={{ marginBottom: 16 }}>
        <h2>Announcement bars</h2>
        <button className="button button-blue button-sm" onClick={() => update([...bars, { id: Math.random().toString(36).slice(2, 7), text: 'New announcement', tone: 'info', active: true }])}>+ Add bar</button>
      </div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>These rotate at the very top of every customer page — no code changes needed.</p>

      {bars.map((b, i) => (
        <div className="panel" key={b.id || i}>
          <div className="admin-row">
            <div style={{ flex: 1 }}>
              <input value={b.text} onChange={(e) => patchBar(i, 'text', e.target.value)} placeholder="Announcement text" style={{ width: '100%' }} />
            </div>
            <select value={b.tone || 'info'} onChange={(e) => patchBar(i, 'tone', e.target.value)} style={{ width: 130 }}>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="dark">Dark</option>
            </select>
            <label className="switch">
              <input type="checkbox" checked={b.active !== false} onChange={(e) => patchBar(i, 'active', e.target.checked)} />
              <i />
            </label>
            <button className="button button-sm button-ghost" style={{ color: 'var(--error)' }} onClick={() => update(bars.filter((_, idx) => idx !== i))}>Remove</button>
          </div>
        </div>
      ))}
      {bars.length === 0 && <p className="muted">No announcement bars — the top of the site stays clean.</p>}
    </div>
  )
}

// ----- homepage sections ---------------------------------------------------
function HomepageAdmin() {
  const { site, setSite, toast, logAudit } = useStore()
  const sections = site.homepageSections || []

  const toggle = (id) => {
    setSite({ ...site, homepageSections: sections.map((s) => (s.id === id ? { ...s, active: !s.active } : s)) })
    logAudit(`Homepage section "${id}" toggled`)
    toast('Homepage updated.')
  }
  const reorder = (i, dir) => {
    const next = [...sections]
    const to = i + dir
    if (to < 0 || to >= next.length) return
    ;[next[i], next[to]] = [next[to], next[i]]
    setSite({ ...site, homepageSections: next })
    toast('Section order updated.', 'info')
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-head"><h2>Homepage sections</h2></div>
        {sections.map((s, i) => (
          <div className="admin-row" key={s.id}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{String(i + 1).padStart(2, '0')}</span>
              <strong style={{ fontSize: 13.5 }}>{s.label || s.id}</strong>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="button button-sm button-ghost" onClick={() => reorder(i, -1)} aria-label="Move up">↑</button>
              <button className="button button-sm button-ghost" onClick={() => reorder(i, 1)} aria-label="Move down">↓</button>
              <label className="switch">
                <input type="checkbox" checked={s.active !== false} onChange={() => toggle(s.id)} />
                <i />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ----- drops ----------------------------------------------------------------
function DropsAdmin() {
  const { site, setSite, toast, logAudit } = useStore()
  const drops = site.drops || []

  const update = (next) => { setSite({ ...site, drops: next }); logAudit('Drops updated'); toast('Drops updated.') }
  const patch = (i, key, value) => update(drops.map((d, idx) => (idx === i ? { ...d, [key]: value } : d)))

  return (
    <div>
      <div className="panel-head" style={{ marginBottom: 16 }}>
        <h2>Drops</h2>
        <button className="button button-blue button-sm" onClick={() => update([...drops, { id: Math.random().toString(36).slice(2, 7), number: `DROP ${String(drops.length + 1).padStart(2, '0')}`, name: 'New Drop', blurb: 'Coming soon.', status: 'scheduled', startsAt: Date.now() + 7 * 864e5, endsAt: Date.now() + 21 * 864e5 }])}>+ New drop</button>
      </div>
      {drops.map((d, i) => (
        <div className="panel" key={d.id}>
          <div className="form-grid">
            <div className="field"><label>Number</label><input value={d.number || ''} onChange={(e) => patch(i, 'number', e.target.value)} /></div>
            <div className="field"><label>Name</label><input value={d.name || ''} onChange={(e) => patch(i, 'name', e.target.value)} /></div>
            <div className="field">
              <label>Status</label>
              <select value={d.status} onChange={(e) => patch(i, 'status', e.target.value)}>
                <option value="live">Live</option>
                <option value="scheduled">Scheduled</option>
                <option value="ended">Ended</option>
              </select>
            </div>
            <div className="field"><label>Ends at</label><input type="datetime-local" value={d.endsAt ? new Date(d.endsAt - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : ''} onChange={(e) => patch(i, 'endsAt', e.target.value ? new Date(e.target.value).getTime() : 0)} /></div>
            <div className="field" style={{ gridColumn: '1/-1' }}><label>Blurb</label><input value={d.blurb || ''} onChange={(e) => patch(i, 'blurb', e.target.value)} /></div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="button button-sm button-ghost" style={{ color: 'var(--error)' }} onClick={() => update(drops.filter((_, idx) => idx !== i))}>Delete drop</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ----- orders / production -------------------------------------------------
function OrdersAdmin({ board }) {
  const { orders, updateOrderStatus, toast } = useStore()
  const [filter, setFilter] = useState('all')
  const list = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  if (board) {
    const lanes = ['received', 'paid', 'design-approved', 'in-production', 'ready', 'shipped']
    return (
      <div className="production-board">
        {lanes.map((lane) => {
          const laneOrders = orders.filter((o) => o.status === lane)
          return (
            <div className="prod-lane" key={lane}>
              <p className="prod-lane-head">{lane.replace(/-/g, ' ')} <span>{laneOrders.length}</span></p>
              {laneOrders.map((o) => (
                <div className="prod-card" key={o.id}>
                  <strong className="mono" style={{ fontSize: 11.5 }}>{o.id}</strong>
                  <p className="muted" style={{ fontSize: 11.5 }}>{o.customer?.name}</p>
                  <p style={{ fontSize: 12 }}>{o.items.length} item{o.items.length > 1 ? 's' : ''} · {fmt(o.summary.total)}</p>
                  {o.items[0]?.designApproved && <span className="chip success"><Icon name="shield" size={10} /> Approved</span>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {lanes.filter((l) => l !== lane).slice(0, 2).map((l) => (
                      <button key={l} className="button button-sm button-ghost" onClick={() => updateOrderStatus(o.id, l)}>→ {l.split('-')[0]}</button>
                    ))}
                  </div>
                </div>
              ))}
              {laneOrders.length === 0 && <p className="muted" style={{ fontSize: 11.5, padding: 10 }}>Empty</p>}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="template-tabs" style={{ marginBottom: 18 }}>
        {['all', ...ORDER_STATUSES].map((s) => (
          <button key={s} className={'template-tab' + (filter === s ? ' active' : '')} onClick={() => setFilter(s)}>{s.replace(/-/g, ' ')}</button>
        ))}
      </div>
      {list.length === 0 && <p className="muted">No orders with this status.</p>}
      {list.slice().reverse().map((o) => (
        <div className="panel" key={o.id}>
          <div className="admin-row">
            <div>
              <strong className="mono" style={{ fontSize: 13 }}>{o.id}</strong>
              <p className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                {o.customer?.name} · {o.customer?.phone} · {fmtDate(o.placedAt)}
              </p>
              <p className="muted" style={{ fontSize: 12 }}>
                {o.customer?.address}{o.customer?.city ? `, ${o.customer.city}` : ''} · {o.payment}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={'chip ' + ({ received: 'info', paid: 'success', 'in-production': 'warn' }[o.status] || 'info')}>{o.status}</span>
              <p style={{ fontWeight: 700, marginTop: 6 }}>{fmt(o.summary.total)}</p>
              {o.payment === 'delivery' && o.status === 'received' && (
                <button className="button button-sm button-dark" style={{ marginTop: 8 }} onClick={() => { updateOrderStatus(o.id, 'paid'); toast(`${o.id} — cash collected & verified.`) }}>
                  Verify cash on delivery
                </button>
              )}
            </div>
          </div>
          <div className="order-items" style={{ marginTop: 12 }}>
            {o.items.map((it) => (
              <div className="order-item" key={it.id}>
                <div className="oi-thumb" style={{ background: COLOR_OPTIONS.find((c) => c.id === it.color)?.hex || '#eee', width: 54, height: 54 }}>
                  <ShirtSVG color={it.color} design={it.design} showDesign={Boolean(it.design)} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 13 }}>{it.name}</strong>
                  <p className="muted" style={{ fontSize: 11.5 }}>{it.size} · ×{it.quantity}{it.designApproved ? ' · approved' : ''}</p>
                </div>
                <strong style={{ fontSize: 13 }}>{fmt(it.lineTotal)}</strong>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {ORDER_STATUSES.filter((s) => s !== o.status).map((s) => (
              <button key={s} className="button button-sm button-ghost" onClick={() => updateOrderStatus(o.id, s)}>Set {s.replace(/-/g, ' ')}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ----- customers -----------------------------------------------------------
function CustomersAdmin() {
  const { orders } = useStore()
  const customers = useMemo(() => {
    const map = new Map()
    orders.forEach((o) => {
      const key = o.customer?.email || o.customer?.name || 'Guest'
      const prev = map.get(key) || { name: o.customer?.name, email: o.customer?.email, orders: 0, spent: 0 }
      prev.orders += 1
      prev.spent += o.summary.total
      map.set(key, prev)
    })
    return [...map.values()].sort((a, b) => b.spent - a.spent)
  }, [orders])

  return (
    <div className="panel">
      <div className="panel-head"><h2>{customers.length} customers</h2></div>
      {customers.map((c, i) => (
        <div className="admin-row" key={c.email || i}>
          <div>
            <strong style={{ fontSize: 13.5 }}>{c.name || 'Guest'}</strong>
            <p className="muted" style={{ fontSize: 12 }}>{c.email}</p>
          </div>
          <span className="muted" style={{ fontSize: 12.5 }}>{c.orders} order{c.orders > 1 ? 's' : ''}</span>
          <strong style={{ fontSize: 13 }}>{fmt(c.spent)}</strong>
        </div>
      ))}
      {customers.length === 0 && <p className="muted" style={{ padding: 20 }}>No customers yet.</p>}
    </div>
  )
}

// ----- products ------------------------------------------------------------
function ProductsAdmin() {
  const { toast } = useStore()
  return (
    <div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Catalogue read-only in this build — pricing is fully editable in the Pricing tab.</p>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {PRODUCTS.map((p) => (
          <div className="panel" key={p.id} style={{ padding: 18 }}>
            <div style={{ height: 110, background: p.colorId === 'black' ? '#151515' : '#ece3d2', display: 'grid', placeItems: 'center', marginBottom: 12 }}>
              <ShirtSVG color={p.colorId} design={null} />
            </div>
            <strong style={{ fontSize: 14 }}>{p.name}</strong>
            <p className="muted" style={{ fontSize: 12, margin: '4px 0 10px' }}>{p.fabric} · {p.fit}</p>
            <button className="button button-sm button-ghost" onClick={() => toast('Catalogue editing arrives with the inventory module.', 'info')}>Edit product</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ----- audit / settings ----------------------------------------------------
function AuditAdmin() {
  const { audit } = useStore()
  return (
    <div className="panel">
      <div className="panel-head"><h2>Audit log</h2></div>
      {audit.length === 0 && <p className="muted" style={{ padding: 20 }}>No activity recorded yet.</p>}
      {audit.slice().reverse().map((a, i) => (
        <div className="admin-row" key={i}>
          <div>
            <strong style={{ fontSize: 13 }}>{a.action}</strong>
            <p className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{a.by || 'Admin'}</p>
          </div>
          <span className="mono muted" style={{ fontSize: 10.5 }}>{fmtDate(a.at)}</span>
        </div>
      ))}
    </div>
  )
}

function SettingsAdmin() {
  const { resetAll, toast, logAudit } = useStore()
  return (
    <div className="panel" style={{ maxWidth: 620 }}>
      <div className="panel-head"><h2>Settings</h2></div>
      <div style={{ padding: 22 }}>
        <p style={{ fontSize: 13.5, marginBottom: 8 }}><strong>Store mode</strong></p>
        <p className="muted" style={{ fontSize: 13, marginBottom: 22 }}>This demo runs entirely on-device — cart, orders, coupons and content persist to localStorage.</p>
        <button className="button button-ghost" style={{ color: 'var(--error)' }} onClick={() => { resetAll(); logAudit('All data reset to defaults'); toast('Store reset to factory defaults.', 'info') }}>
          Reset all data to defaults
        </button>
      </div>
    </div>
  )
}

// ----- shell ----------------------------------------------------------------
export default function Admin({ go, param }) {
  const { isAdmin, setIsAdmin, toast } = useStore()
  const [pass, setPass] = useState('')
  const [section, setSection] = useState(param || 'dashboard')

  if (!isAdmin) {
    return (
      <main>
        <div className="nf">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (pass.toLowerCase() === 'admin') { setIsAdmin(true); toast('Welcome to the console.') }
              else toast('Wrong passcode — hint: "admin".', 'error')
            }}
          >
            <div className="nf-art"><ShirtSVG color="charcoal" design={{ text: 'ADMN', color: '#2563eb', font: 'mono' }} /></div>
            <p className="eyebrow">Staff only</p>
            <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}>Admin console</h1>
            <p className="muted" style={{ margin: '14px auto 24px', maxWidth: 380 }}>Enter the staff passcode. (Demo hint: “admin”.)</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Passcode" type="password" style={{ maxWidth: 220 }} />
              <button className="button button-blue" type="submit">Enter</button>
            </div>
          </form>
        </div>
      </main>
    )
  }

  const goSection = (id) => { setSection(id); window.location.hash = `admin:${id}` }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Logo variant="mark" theme="light" size={30} />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span className="display" style={{ fontSize: 17 }}>CREATIVE MODE</span>
            <span className="mono" style={{ fontSize: 8, letterSpacing: '0.18em', color: 'var(--muted)' }}>CONSOLE</span>
          </span>
        </div>
        {NAV.map((g) => (
          <div className="admin-nav-group" key={g.group}>
            <p className="admin-nav-title">{g.group}</p>
            {g.items.map(([id, label, ico]) => (
              <button key={id} className={section === id ? 'active' : ''} onClick={() => goSection(id)}>
                <Icon name={ico} size={15} /> {label}
              </button>
            ))}
          </div>
        ))}
        <div style={{ marginTop: 'auto', padding: 16, display: 'grid', gap: 8 }}>
          <button className="button button-sm button-ghost" onClick={() => go('home')}>← Back to store</button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <h1>{NAV.flatMap((g) => g.items).find(([id]) => id === section)?.[1] || 'Dashboard'}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="chip success">● Live</span>
          </div>
        </header>
        <div className="admin-content">
          {section === 'dashboard' && <Dashboard go={goSection} />}
          {section === 'products' && <ProductsAdmin />}
          {section === 'pricing' && <PricingAdmin />}
          {section === 'homepage' && <HomepageAdmin />}
          {section === 'announcements' && <AnnouncementsAdmin />}
          {section === 'drops' && <DropsAdmin />}
          {section === 'orders' && <OrdersAdmin />}
          {section === 'coupons' && <CouponsAdmin />}
          {section === 'customers' && <CustomersAdmin />}
          {section === 'production' && <OrdersAdmin board />}
          {section === 'audit' && <AuditAdmin />}
          {section === 'settings' && <SettingsAdmin />}
        </div>
      </div>
    </div>
  )
}
