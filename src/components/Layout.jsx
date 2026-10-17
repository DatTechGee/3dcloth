import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store.jsx'
import Icon from './Icon.jsx'
import Logo from './Logo.jsx'
import ShirtSVG from './ShirtSVG.jsx'
import { fmt } from '../pricing.js'
import { PRODUCTS } from '../catalog.js'
import { OCCASIONS, DESIGN_TEMPLATES } from '../site.js'

export function Announcement() {
  const { site } = useStore()
  const [i, setI] = useState(0)
  // Bars may be legacy strings or admin-managed objects { id, text, tone, active }.
  const all = site.announcements || []
  const bars = all.filter((b) => (typeof b === 'string' ? true : b.active !== false))
  const text = (b) => (typeof b === 'string' ? b : b.text)
  const tone = (b) => (typeof b === 'string' ? 'dark' : b.tone || 'dark')
  useEffect(() => {
    if (bars.length < 2) return undefined
    const t = setInterval(() => setI((x) => (x + 1) % bars.length), 5000)
    return () => clearInterval(t)
  }, [bars.length])
  if (bars.length === 0) return null
  const current = bars[i % bars.length]
  return (
    <div className={'announce tone-' + tone(current)}>
      <div className="announce-inner">
        <span>{text(current)}</span>
        {bars.length > 1 && (
          <span className="promo-dots" aria-hidden="true">
            {bars.map((b, x) => (
              <button key={typeof b === 'string' ? x : b.id || x} className={x === i % bars.length ? 'active' : ''} onClick={() => setI(x)} aria-label={`Announcement ${x + 1}`} />
            ))}
          </span>
        )}
      </div>
    </div>
  )
}

const MEGA = {
  SHOP: [
    ['New In', 'shop'], ['Trending', 'shop'], ['T-Shirts', 'catalog'],
    ['Collections', 'collections'], ['Shop by Occasion', 'occasions'], ['Deals', 'how'],
  ],
  CUSTOMIZE: [
    ['Create Your Tee', 'studio'], ['Templates', 'templates'], ['Saved Designs', 'account'],
  ],
  DISCOVER: [
    ['Lookbook', 'lookbook'], ['Drops', 'drops'], ['Journal', 'journal'], ['Customer Styles', 'account'],
  ],
}

function MegaMenu({ onClose }) {
  const { go } = useNav()
  const { site } = useStore()
  return (
    <div className="mega-menu" onMouseLeave={onClose}>
      {Object.entries(MEGA).map(([title, links]) => (
        <div className="mega-col" key={title}>
          <h4>{title}</h4>
          {links.map(([label, page]) => (
            <button key={label} onClick={() => { go(page); onClose() }}>{label}</button>
          ))}
        </div>
      ))}
      <div className="mega-feature">
        <div>
          <span className="chip blue">Live now</span>
          <p className="display" style={{ marginTop: 14 }}>{site.drops?.[0]?.name || 'AFTER DARK'}</p>
          <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{site.drops?.[0]?.blurb}</p>
        </div>
        <button className="button button-dark button-sm" onClick={() => { go('drops'); onClose() }}>Shop the drop</button>
      </div>
    </div>
  )
}

function SearchOverlay({ onClose }) {
  const { go } = useNav()
  const { site } = useStore()
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const results = useMemo(() => {
    if (!query) return null
    return {
      Products: PRODUCTS.filter((p) => (p.name + p.tagline).toLowerCase().includes(query)),
      Occasions: OCCASIONS.filter((o) => o.label.toLowerCase().includes(query)),
      Templates: DESIGN_TEMPLATES.filter((t) => t.title.toLowerCase().includes(query)),
      Collections: (site.collections || []).filter((c) => c.name.toLowerCase().includes(query)),
    }
  }, [query, site.collections])

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, templates, occasions…" aria-label="Search" />
        <div className="search-results">
          {!results && (
            <>
              <p className="search-group">Popular right now</p>
              {['Birthday', 'Couples', 'Soft Life', 'Black edit'].map((s) => (
                <button className="search-item" key={s} onClick={() => { setQ(s) }}>{s}<Icon name="arrow" size={13} /></button>
              ))}
            </>
          )}
          {results && Object.entries(results).map(([group, items]) =>
            items.length > 0 && (
              <div key={group}>
                <p className="search-group">{group}</p>
                {items.map((item) => (
                  <button className="search-item" key={item.id} onClick={() => { go(group === 'Products' ? 'product' : group === 'Templates' ? 'templates' : group === 'Collections' ? 'collections' : 'occasions'); onClose() }}>
                    <span>{item.name || item.label || item.title}</span>
                    <Icon name="arrow" size={13} />
                  </button>
                ))}
              </div>
            ),
          )}
          {results && Object.values(results).every((r) => r.length === 0) && (
            <p className="search-item muted">No results — try “birthday”, “black” or “couples”.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// tiny nav context so nested components can navigate without prop drilling
const NavCtx = { go: null }
export function setNavGo(fn) { NavCtx.go = fn }
function useNav() { return { go: (p, param) => NavCtx.go?.(p, param) } }

export function Header({ page, go }) {
  const { cart, customer, isAdmin, wishlist } = useStore()
  const [scrolled, setScrolled] = useState(false)
  const [mega, setMega] = useState(null)
  const [mobile, setMobile] = useState(false)
  const [search, setSearch] = useState(false)
  const count = cart.reduce((s, i) => s + i.quantity, 0)

  useEffect(() => { setNavGo(go) }, [go])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const darkPage = page === 'studio'
  const transparentHero = !scrolled && ['home', 'drops', 'lookbook'].includes(page) && !darkPage
  const mode = darkPage ? 'mode-dark' : transparentHero ? 'mode-transparent' : 'mode-cream'

  const nav = useMemo(() => [
    ['catalog', 'Shop'],
    ['collections', 'Collections'],
    ['studio', 'Customize'],
    ['templates', 'Templates'],
    ['drops', 'Drops'],
    ['lookbook', 'Lookbook'],
    ['journal', 'Journal'],
  ], [])

  const logoTheme = mode === 'mode-cream' ? 'light' : 'dark'

  return (
    <header className={'site-header ' + mode}>
      <div className="header-inner">
        <button className="brand" onClick={() => go('home')} aria-label="Creative Mode home">
          <Logo variant="full" theme={logoTheme} size={34} />
        </button>

        <div className="mega-wrap">
          <nav className="site-nav" aria-label="Main">
            {nav.map(([id, label]) => (
              <button
                key={id}
                className={page === id ? 'active' : ''}
                onMouseEnter={() => setMega(['catalog', 'studio', 'discover'].includes(id) ? (id === 'catalog' ? 'SHOP' : id === 'studio' ? 'CUSTOMIZE' : 'DISCOVER') : null)}
                onClick={() => go(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          {mega && <MegaMenu onClose={() => setMega(null)} />}
        </div>

        <div className="header-actions">
          <button className="icon-btn" onClick={() => setSearch(true)} aria-label="Search"><Icon name="search" size={19} /></button>
          <button className="icon-btn" onClick={() => go('account', 'wishlist')} aria-label="Wishlist">
            <Icon name="heart" size={19} />
            {wishlist.length > 0 && <span className="count">{wishlist.length}</span>}
          </button>
          <button className="icon-btn" onClick={() => go(customer || isAdmin ? 'account' : 'auth')} aria-label="Account"><Icon name="user" size={19} /></button>
          <button className="icon-btn" onClick={() => go('cart')} aria-label={`Bag, ${count} items`}>
            <Icon name="bag" size={19} />
            {count > 0 && <span className="count">{count}</span>}
          </button>
          <button className="icon-btn menu-toggle" onClick={() => setMobile(true)} aria-label="Menu"><Icon name="menu" size={20} /></button>
        </div>
      </div>

      {mobile && (
        <div className="mobile-nav">
          <button className="close" onClick={() => setMobile(false)}>CLOSE ✕</button>
          {[...nav, ['account', 'Account'], ['cart', `Bag (${count})`], ['orders', 'Orders']].map(([id, label]) => (
            <button key={id} onClick={() => { go(id); setMobile(false) }}>{label}</button>
          ))}
          {isAdmin && <button onClick={() => { go('admin'); setMobile(false) }}>Admin</button>}
        </div>
      )}
      {search && <SearchOverlay onClose={() => setSearch(false)} />}
    </header>
  )
}

export function BottomNav({ page, go }) {
  const { cart } = useStore()
  const count = cart.reduce((s, i) => s + i.quantity, 0)
  const items = [
    ['home', 'Home', 'home'],
    ['catalog', 'Shop', 'bag'],
    ['studio', 'Create', 'plus'],
    ['cart', 'Bag', 'bag'],
    ['account', 'You', 'user'],
  ]
  useEffect(() => {
    document.body.classList.add('has-bottom-nav')
    return () => document.body.classList.remove('has-bottom-nav')
  }, [])
  return (
    <nav className="bottom-nav" aria-label="Mobile">
      {items.map(([id, label, ico]) => (
        <button key={id} className={page === id ? 'active' : ''} onClick={() => go(id)}>
          <Icon name={ico} size={19} />
          {label}
          {id === 'cart' && count > 0 && <span className="count">{count}</span>}
        </button>
      ))}
    </nav>
  )
}

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, summary, removeFromCart, updateQuantity, go } = useCartNav()
  if (!cartOpen) return null
  return (
    <>
      <div className="drawer-backdrop" onClick={() => setCartOpen(false)} />
      <aside className="cart-drawer" aria-label="Shopping bag">
        <div className="cart-drawer-head">
          <p className="display">Your bag ({cart.length})</p>
          <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Close bag"><Icon name="close" size={20} /></button>
        </div>
        <div className="cart-drawer-body">
          {cart.length === 0 && (
            <div className="empty-state" style={{ padding: '50px 10px' }}>
              <div style={{ width: 100, margin: '0 auto 16px', opacity: 0.4 }}><ShirtSVG color="grey" showDesign={false} /></div>
              <p className="muted" style={{ marginBottom: 18 }}>Your bag is empty. Design a tee to get started.</p>
              <button className="button button-blue button-sm" onClick={() => { setCartOpen(false); go('studio') }}>Create your tee</button>
            </div>
          )}
          {cart.map((item) => (
            <div className="drawer-item" key={item.id}>
              <div className="di-thumb"><ShirtSVG color={item.color} design={item.design} showDesign={Boolean(item.design)} /></div>
              <div>
                <h4>{item.name}</h4>
                <p className="di-meta">{item.color} / {item.size} · Qty {item.quantity}</p>
                <div className="qty-stepper" style={{ marginTop: 8 }}>
                  <button onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease">−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} aria-label="Increase">+</button>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                <strong>{fmt(item.lineTotal)}</strong>
                <button className="link-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="cart-drawer-foot">
            <div className="drawer-line"><span className="muted">Subtotal</span><span>{fmt(summary.rawSubtotal)}</span></div>
            {summary.quantityDiscount > 0 && (
              <div className="drawer-line" style={{ color: 'var(--success)' }}><span>Bulk discount</span><span>−{fmt(summary.quantityDiscount)}</span></div>
            )}
            {summary.couponDiscount > 0 && (
              <div className="drawer-line" style={{ color: 'var(--success)' }}><span>Coupon {summary.coupon.code}</span><span>−{fmt(summary.couponDiscount)}</span></div>
            )}
            <div className="drawer-line"><span className="muted">Delivery</span><span>{summary.delivery === 0 ? 'Free' : fmt(summary.delivery)}</span></div>
            <div className="drawer-line total"><span>Total</span><span>{fmt(summary.total)}</span></div>
            <button className="button button-blue button-block" style={{ marginTop: 14 }} onClick={() => { setCartOpen(false); go('cart') }}>
              View bag & checkout
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

function useCartNav() {
  const store = useStore()
  const { go } = useNav()
  return { ...store, go }
}

export function Footer({ go }) {
  const { toast } = useStore()
  const [email, setEmail] = useState('')
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo variant="full" theme="dark" size={42} />
          <p style={{ marginTop: 18 }}>A digital fashion store with a built-in 3D design studio. Designed in Abuja, delivered across Nigeria.</p>
          <div className="footer-newsletter">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for drop alerts" aria-label="Email for drop alerts" />
            <button onClick={() => { if (/^\S+@\S+\.\S+$/.test(email)) { toast('You’re on the list — drop alerts incoming.', 'info'); setEmail('') } else { toast('Enter a valid email address.', 'error') } }}>Join</button>
          </div>
        </div>
        <div>
          <h4>Shop</h4>
          <button onClick={() => go('catalog')}>All apparel</button>
          <button onClick={() => go('collections')}>Collections</button>
          <button onClick={() => go('drops')}>Drops</button>
          <button onClick={() => go('templates')}>Templates</button>
        </div>
        <div>
          <h4>Create</h4>
          <button onClick={() => go('studio')}>3D design studio</button>
          <button onClick={() => go('lookbook')}>Lookbook</button>
          <button onClick={() => go('how')}>How it works</button>
          <button onClick={() => go('orders')}>Track order</button>
        </div>
        <div>
          <h4>Studio</h4>
          <button onClick={() => go('journal')}>Journal</button>
          <button onClick={() => go('admin')}>Admin dashboard</button>
          <span style={{ display: 'block', padding: '5px 0', fontSize: 13.5 }}>Wuse 2, Abuja</span>
          <span style={{ display: 'block', padding: '5px 0', fontSize: 13.5 }}>hello@creativemode.ng</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Creative Mode — Abuja, Nigeria</span>
        <span>Card · Transfer · USSD · Pay on delivery</span>
      </div>
    </footer>
  )
}

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={'toast ' + t.tone}>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
