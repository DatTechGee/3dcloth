import { useState } from 'react'
import { useStore } from '../store.jsx'
import { fmt, COLOR_OPTIONS } from '../pricing.js'
import ShirtSVG from '../components/ShirtSVG.jsx'
import Icon from '../components/Icon.jsx'

const TABS = [
  ['orders', 'Orders'],
  ['designs', 'Saved designs'],
  ['wishlist', 'Wishlist'],
  ['profile', 'Profile'],
]

export default function Account({ go }) {
  const { orders, savedDesigns, removeDesign, wishlist, toggleWishlist, customer, logout, toast, markViewed } = useStore()
  const [tab, setTab] = useState('orders')

  if (!customer) {
    return (
      <main>
        <div className="nf">
          <div>
            <div className="nf-art"><ShirtSVG color="grey" showDesign={false} /></div>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 7vw, 90px)' }}>Your studio account</h1>
            <p className="muted" style={{ margin: '16px auto 30px', maxWidth: 420 }}>
              Sign in to save designs, track orders and keep your wishlist in sync across devices.
            </p>
            <button className="button button-blue button-lg" onClick={() => go('auth')}>Sign in or create account</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="section" style={{ paddingBottom: 24 }}>
        <p className="eyebrow">Welcome back</p>
        <h1 className="display" style={{ fontSize: 'clamp(44px, 6vw, 88px)' }}>{customer.name}</h1>
        <p className="muted" style={{ marginTop: 8 }}>{customer.email}</p>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="template-tabs">
          {TABS.map(([id, label]) => (
            <button key={id} className={'template-tab' + (tab === id ? ' active' : '')} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {tab === 'orders' && (
          orders.length === 0 ? (
            <div className="empty-state">
              <h2 className="display" style={{ fontSize: 40 }}>No orders yet</h2>
              <p className="muted">Your production journey will appear here.</p>
              <button className="button button-blue" onClick={() => go('studio')}>Create your tee</button>
            </div>
          ) : (
            <div>
              {orders.slice().reverse().map((o) => (
                <div className="promo-list-item" key={o.id} onClick={() => go('orders')} style={{ cursor: 'pointer' }}>
                  <div>
                    <strong className="mono" style={{ fontSize: 13 }}>ORDER {o.id}</strong>
                    <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                      {new Date(o.placedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })} · {o.items.length} item{o.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className={'chip ' + ({ received: 'info', paid: 'success', 'in-production': 'warn' }[o.status] || 'info')}>{o.status.replace(/-/g, ' ')}</span>
                    <strong>{fmt(o.summary.total)}</strong>
                  </div>
                </div>
              ))}
              <button className="button button-ghost" style={{ marginTop: 20 }} onClick={() => go('orders')}>View full order timeline <Icon name="arrow" size={13} /></button>
            </div>
          )
        )}

        {tab === 'designs' && (
          savedDesigns.length === 0 ? (
            <div className="empty-state">
              <h2 className="display" style={{ fontSize: 40 }}>Nothing saved yet</h2>
              <p className="muted">Build something in the studio and hit Save — it’ll live here.</p>
              <button className="button button-blue" onClick={() => go('studio')}>Open the studio</button>
            </div>
          ) : (
            <div className="grid-4">
              {savedDesigns.map((d) => (
                <article className="template-card" key={d.id}>
                  <div className="tpl-media" style={{ background: COLOR_OPTIONS.find((c) => c.id === d.color)?.hex }}>
                    <ShirtSVG color={d.color} design={d.thumbnail} showDesign={Boolean(d.thumbnail)} />
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <strong style={{ fontSize: 13.5 }}>{d.name || 'Untitled design'}</strong>
                    <p className="muted" style={{ fontSize: 11, marginTop: 3 }}>
                      Saved {new Date(d.savedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="tpl-actions">
                    <button onClick={() => go('studio', d.elements?.[0] ? `tpl:${d.id}` : undefined)}>Remix</button>
                    <button className="danger" onClick={() => { removeDesign(d.id); toast('Design removed.', 'info') }}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )
        )}

        {tab === 'wishlist' && (
          wishlist.length === 0 ? (
            <div className="empty-state">
              <h2 className="display" style={{ fontSize: 40 }}>Wishlist is empty</h2>
              <p className="muted">Tap the heart on any product to save it for later.</p>
              <button className="button button-blue" onClick={() => go('catalog')}>Shop the collection</button>
            </div>
          ) : (
            <div className="grid-3">
              {wishlist.map((w) => (
                <article className="product-card" key={w.id}>
                  <div className="product-media" style={{ background: COLOR_OPTIONS.find((c) => c.id === w.colorId)?.hex || '#eee' }}>
                    <ShirtSVG color={w.colorId} design={null} />
                    <div className="product-hover-cta">
                      <button className="button button-light" onClick={() => { markViewed(w); go('product', w.id) }}>View</button>
                      <button className="button button-blue" onClick={() => go('studio')}>Customize</button>
                    </div>
                  </div>
                  <div className="product-info">
                    <h3>{w.name}</h3>
                    <div className="product-row">
                      <strong>{fmt(w.price)}</strong>
                      <button className="link-btn" onClick={() => toggleWishlist(w)}>Remove</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        )}

        {tab === 'profile' && (
          <div className="card" style={{ maxWidth: 560, padding: 30 }}>
            <div className="summary-line"><span className="label">Name</span><span>{customer.name}</span></div>
            <div className="summary-line"><span className="label">Email</span><span>{customer.email}</span></div>
            <div className="summary-line"><span className="label">Member since</span><span>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}</span></div>
            <div className="summary-line"><span className="label">Orders</span><span>{orders.length}</span></div>
            <div className="summary-line"><span className="label">Saved designs</span><span>{savedDesigns.length}</span></div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="button button-ghost" onClick={logout}>Sign out</button>
              <button className="button button-ghost" onClick={() => go('auth')}>Login as different user</button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
