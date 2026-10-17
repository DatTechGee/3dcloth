import { useEffect, useState } from 'react'
import { useStore } from './store.jsx'
import { Header, Footer, Toasts, BottomNav, CartDrawer } from './components/Layout.jsx'
import Logo from './components/Logo.jsx'
import Home from './pages/Home.jsx'
import Catalog from './pages/Catalog.jsx'
import Product from './pages/Product.jsx'
import Collections from './pages/Collections.jsx'
import Drops from './pages/Drops.jsx'
import Lookbook from './pages/Lookbook.jsx'
import Templates from './pages/Templates.jsx'
import Journal from './pages/Journal.jsx'
import Studio from './pages/Studio.jsx'
import How from './pages/How.jsx'
import Orders from './pages/Orders.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Account from './pages/Account.jsx'
import Auth from './pages/Auth.jsx'
import Admin from './pages/Admin.jsx'
import NotFound from './pages/NotFound.jsx'

const pages = {
  home: Home,
  catalog: Catalog,
  product: Product,
  collections: Collections,
  drops: Drops,
  lookbook: Lookbook,
  templates: Templates,
  journal: Journal,
  studio: Studio,
  how: How,
  orders: Orders,
  cart: Cart,
  checkout: Checkout,
  account: Account,
  auth: Auth,
  admin: Admin,
}

function Boot({ done }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 850)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="boot-screen" style={{ opacity: visible && !done ? 1 : 0, pointerEvents: visible && !done ? 'auto' : 'none' }} aria-hidden={visible && !done ? 'false' : 'true'}>
      <div style={{ textAlign: 'center' }}>
        <Logo variant="full" theme="dark" size={56} />
        <p className="mono" style={{ marginTop: 22, fontSize: 10, letterSpacing: '0.24em', color: 'rgba(243,235,221,0.5)' }}>LOADING THE DROP…</p>
      </div>
    </div>
  )
}

export default function App() {
  const { toast } = useStore()
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || 'home')
  const [booted, setBooted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setBooted(true), 900); return () => clearTimeout(t) }, [])

  useEffect(() => {
    const onHashChange = () => {
      setRoute(window.location.hash.slice(1) || 'home')
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // route format: "page" or "page:param"
  const [base, param] = route.split(':')
  const go = (nextPage, nextParam) => {
    const hash = nextParam ? `${nextPage}:${nextParam}` : nextPage
    window.location.hash = hash
    setRoute(hash)
    window.scrollTo(0, 0)
  }

  const Page = pages[base]
  const notFound = Boolean(base) && !Page && base !== '404'
  const isStudio = base === 'studio'

  const content = notFound ? (
    <NotFound go={go} />
  ) : Page ? (
    <Page go={go} param={param} />
  ) : (
    <NotFound go={go} />
  )

  return (
    <>
      <Boot done={booted} />
      {!isStudio && <Header page={base} go={go} />}
      {content}
      {!isStudio && <Footer go={go} />}
      {!isStudio && <BottomNav page={base} go={go} />}
      <CartDrawer />
      <Toasts />
      <button
        className="sr-only"
        onClick={() => toast('Support: WhatsApp 0800 CREATIVE MODE', 'info')}
      >
        support
      </button>
    </>
  )
}
