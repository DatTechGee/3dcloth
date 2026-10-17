import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loadPricing, savePricing, priceCart, unitPrice, DEFAULT_PRICING } from './pricing.js'
import { loadCoupons, saveCoupons, validateCoupon, DEFAULT_COUPONS } from './coupons.js'
import { DEFAULT_SITE } from './site.js'

const StoreCtx = createContext(null)

const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null')
    return v ?? fallback
  } catch {
    return fallback
  }
}
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))

let orderSeq = Number(localStorage.getItem('dtg-order-seq') || 4100)

function seedOrders() {
  return [
    {
      id: 'DTG-4098',
      createdAt: Date.now() - 1000 * 60 * 60 * 26,
      customer: { name: 'Chiamaka Obi', email: 'chiamaka@example.com', phone: '0803 000 0000' },
      address: '12 Aminu Kano Crescent, Wuse 2',
      items: [
        { id: 'seed-1', shirtType: 'premium-tee', name: 'Premium Crew Neck', color: 'black', size: 'XL', printLocation: 'front-back', printSize: 'medium', quantity: 4, unitPrice: 21000, lineTotal: 84000, design: { text: 'AFTER\nDARK', color: '#2563eb', font: 'display' }, extras: { nameEmbroidery: false, customTag: false, giftWrap: false } },
      ],
      summary: { rawSubtotal: 84000, quantityDiscount: 8400, couponDiscount: 0, delivery: 2000, total: 77600, couponCode: null },
      zone: 'abuja-central',
      payment: 'paystack',
      status: 'Delivered',
      designApproved: true,
      activity: [
        { t: Date.now() - 1000 * 60 * 60 * 26, label: 'Order created' },
        { t: Date.now() - 1000 * 60 * 60 * 25, label: 'Payment confirmed' },
        { t: Date.now() - 1000 * 60 * 60 * 24, label: 'Design approved' },
        { t: Date.now() - 1000 * 60 * 60 * 20, label: 'Sent to production' },
        { t: Date.now() - 1000 * 60 * 60 * 4, label: 'Delivered' },
      ],
    },
    {
      id: 'DTG-4099',
      createdAt: Date.now() - 1000 * 60 * 60 * 5,
      customer: { name: 'Tunde Alabi', email: 'tunde@example.com', phone: '0805 111 2222' },
      address: '3 Adetokunbo Ademola Crescent, Wuse',
      items: [
        { id: 'seed-2', shirtType: 'polo', name: 'Piqué Polo', color: 'navy', size: 'L', printLocation: 'front', printSize: 'small', quantity: 12, unitPrice: 21500, lineTotal: 258000, design: { text: 'ZURI\nLABS', color: '#f3ebdd', font: 'mono' }, extras: { nameEmbroidery: false, customTag: true, giftWrap: false } },
      ],
      summary: { rawSubtotal: 258000, quantityDiscount: 38700, couponDiscount: 21930, delivery: 0, total: 197370, couponCode: 'WELCOME10' },
      zone: 'abuja-central',
      payment: 'paystack',
      status: 'Printing',
      designApproved: true,
      activity: [
        { t: Date.now() - 1000 * 60 * 60 * 5, label: 'Order created' },
        { t: Date.now() - 1000 * 60 * 60 * 4.8, label: 'Payment confirmed' },
        { t: Date.now() - 1000 * 60 * 60 * 4, label: 'Design approved' },
        { t: Date.now() - 1000 * 60 * 60 * 2, label: 'Sent to production' },
      ],
    },
    {
      id: 'DTG-4100',
      createdAt: Date.now() - 1000 * 60 * 50,
      customer: { name: 'Mary Eze', email: 'mary@example.com', phone: '0806 333 4444' },
      address: '24 Lagos Street, Gwarinpa',
      items: [
        { id: 'seed-3', shirtType: 'classic-tee', name: 'Classic Crew Neck', color: 'cream', size: 'M', printLocation: 'front', printSize: 'medium', quantity: 2, unitPrice: 15500, lineTotal: 31000, design: { text: 'MR &\nMRS', color: '#090909', font: 'serif' }, extras: { nameEmbroidery: false, customTag: false, giftWrap: true } },
      ],
      summary: { rawSubtotal: 31000, quantityDiscount: 0, couponDiscount: 2000, delivery: 3000, total: 32000, couponCode: 'BUY2' },
      zone: 'abuja-outskirts',
      payment: 'delivery',
      status: 'Received',
      designApproved: false,
      activity: [{ t: Date.now() - 1000 * 60 * 50, label: 'Order created (COD — needs verification)' }],
    },
  ]
}

export function StoreProvider({ children }) {
  const [pricing, setPricingState] = useState(loadPricing)
  const [coupons, setCouponsState] = useState(loadCoupons)
  const [cart, setCart] = useState(() => read('dtg-cart', []))
  const [orders, setOrders] = useState(() => read('dtg-orders', seedOrders()))
  const [customer, setCustomer] = useState(() => read('dtg-customer', null))
  const [isAdmin, setIsAdmin] = useState(() => read('dtg-admin', false))
  const [appliedCode, setAppliedCode] = useState(() => read('dtg-applied-code', ''))
  const [deliveryZone, setDeliveryZone] = useState(() => read('dtg-zone', 'abuja-central'))
  const [toasts, setToasts] = useState([])

  // wishlist + saved designs + recently viewed
  const [wishlist, setWishlist] = useState(() => read('dtg-wishlist', []))
  const [savedDesigns, setSavedDesigns] = useState(() => read('dtg-designs', []))
  const [recentlyViewed, setRecentlyViewed] = useState(() => read('dtg-recent', []))

  // site content managed by admin (announcement bar, homepage sections, drops, banners)
  const [site, setSiteState] = useState(() => {
    const saved = read('dtg-site', null)
    return saved ? { ...DEFAULT_SITE, ...saved } : DEFAULT_SITE
  })

  // operational audit log
  const [audit, setAudit] = useState(() => read('dtg-audit', []))

  // cart drawer visibility
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => write('dtg-cart', cart), [cart])
  useEffect(() => write('dtg-orders', orders), [orders])
  useEffect(() => write('dtg-customer', customer), [customer])
  useEffect(() => write('dtg-admin', isAdmin), [isAdmin])
  useEffect(() => write('dtg-applied-code', appliedCode), [appliedCode])
  useEffect(() => write('dtg-zone', deliveryZone), [deliveryZone])
  useEffect(() => write('dtg-wishlist', wishlist), [wishlist])
  useEffect(() => write('dtg-designs', savedDesigns), [savedDesigns])
  useEffect(() => write('dtg-recent', recentlyViewed), [recentlyViewed])
  useEffect(() => write('dtg-audit', audit), [audit])

  const setSite = useCallback((updater) => {
    setSiteState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      write('dtg-site', next)
      return next
    })
  }, [])

  const logAudit = useCallback((actor, action) => {
    setAudit((a) => [{ t: Date.now(), actor, action }, ...a].slice(0, 200))
  }, [])

  const toast = useCallback((message, tone = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4600)
  }, [])

  // ----- cart -------------------------------------------------------------
  const addToCart = useCallback((config, quantity) => {
    const item = {
      id: Math.random().toString(36).slice(2),
      shirtType: config.shirtType,
      name: config.name,
      category: config.category,
      color: config.color,
      size: config.size,
      printLocation: config.printLocation,
      printSize: config.printSize,
      design: config.design || null,
      extras: config.extras || { nameEmbroidery: false, customTag: false, giftWrap: false },
      quantity,
      unitPrice: unitPrice(pricing, config),
      designApproved: Boolean(config.designApproved),
    }
    item.lineTotal = item.unitPrice * item.quantity
    setCart((c) => [...c, item])
    return item
  }, [pricing])

  const updateQuantity = useCallback((id, delta) => {
    setCart((c) => c.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta), lineTotal: i.unitPrice * Math.max(1, i.quantity + delta) } : i)))
  }, [])

  const setItemQuantity = useCallback((id, quantity) => {
    setCart((c) => c.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity), lineTotal: i.unitPrice * Math.max(1, quantity) } : i)))
  }, [])

  const removeFromCart = useCallback((id) => setCart((c) => c.filter((i) => i.id !== id)), [])
  const clearCart = useCallback(() => { setCart([]); setAppliedCode('') }, [])

  // ----- wishlist ---------------------------------------------------------
  const toggleWishlist = useCallback((entry) => {
    setWishlist((w) => {
      const exists = w.some((x) => x.id === entry.id)
      if (exists) return w.filter((x) => x.id !== entry.id)
      return [{ ...entry, savedAt: Date.now() }, ...w]
    })
  }, [])
  const isWished = useCallback((id) => wishlist.some((x) => x.id === id), [wishlist])

  // ----- saved designs ----------------------------------------------------
  const saveDesign = useCallback((design) => {
    const entry = { id: Math.random().toString(36).slice(2), savedAt: Date.now(), ...design }
    setSavedDesigns((d) => [entry, ...d].slice(0, 40))
    return entry
  }, [])
  const removeDesign = useCallback((id) => setSavedDesigns((d) => d.filter((x) => x.id !== id)), [])

  const markViewed = useCallback((entry) => {
    setRecentlyViewed((r) => [entry, ...r.filter((x) => x.id !== entry.id)].slice(0, 8))
  }, [])

  // ----- coupon + order summary ------------------------------------------
  const priorOrders = useMemo(() => {
    if (!customer?.email) return 0
    const email = customer.email.toLowerCase()
    return orders.filter((o) => (o.customer?.email || '').toLowerCase() === email && o.status !== 'Cancelled').length
  }, [orders, customer])

  const couponItems = useMemo(() => cart.map((i) => ({ ...i, lineTotal: i.unitPrice * i.quantity })), [cart])
  const couponProbe = useMemo(() => {
    if (!appliedCode) return null
    const quantity = couponItems.reduce((s, i) => s + i.quantity, 0)
    const subtotal = couponItems.reduce((s, i) => s + i.lineTotal, 0)
    return validateCoupon(appliedCode, coupons, {
      items: couponItems,
      subtotal,
      quantity,
      customerEmail: customer?.email || '',
      priorOrders,
    })
  }, [appliedCode, coupons, couponItems, customer, priorOrders])

  const summary = useMemo(
    () => priceCart(pricing, couponItems, couponProbe, deliveryZone),
    [pricing, couponItems, couponProbe, deliveryZone],
  )

  const applyCoupon = useCallback((code) => {
    const quantity = cart.reduce((s, i) => s + i.quantity, 0)
    const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const result = validateCoupon(code, coupons, {
      items: cart.map((i) => ({ ...i, lineTotal: i.unitPrice * i.quantity })),
      subtotal,
      quantity,
      customerEmail: customer?.email || '',
      priorOrders,
    })
    if (result.ok) {
      setAppliedCode((code || '').trim().toUpperCase())
      toast(result.message, 'success')
    } else {
      toast(result.message, 'error')
    }
    return result
  }, [cart, coupons, customer, priorOrders, toast])

  const removeCoupon = useCallback(() => setAppliedCode(''), [])

  // ----- orders -----------------------------------------------------------
  const placeOrder = useCallback(({ name, email, phone, address, zone, payment, gift }) => {
    orderSeq += 1
    localStorage.setItem('dtg-order-seq', String(orderSeq))
    const now = Date.now()
    const order = {
      id: 'DTG-' + orderSeq,
      createdAt: now,
      customer: { name, email, phone },
      address,
      gift: gift || null,
      items: cart.map((i) => ({ ...i })),
      summary: {
        rawSubtotal: summary.rawSubtotal,
        quantityDiscount: summary.quantityDiscount,
        couponDiscount: summary.couponDiscount,
        delivery: summary.delivery,
        total: summary.total,
        couponCode: summary.coupon ? summary.coupon.code : null,
      },
      zone,
      payment,
      status: 'Received',
      designApproved: cart.every((i) => i.designApproved),
      activity: [
        { t: now, label: 'Order created' },
        ...(payment === 'delivery' ? [{ t: now, label: 'COD — awaiting verification' }] : [{ t: now, label: 'Payment confirmed' }]),
      ],
    }
    setOrders((o) => [order, ...o])
    if (summary.coupon) {
      const code = summary.coupon.code
      setCouponsState((cs) => {
        const next = cs.map((c) => (c.code === code ? { ...c, uses: (c.uses || 0) + 1 } : c))
        saveCoupons(next)
        return next
      })
    }
    setCart([])
    setAppliedCode('')
    return order
  }, [cart, summary])

  const updateOrderStatus = useCallback((id, status, actor = 'Super Admin') => {
    setOrders((os) =>
      os.map((o) =>
        o.id === id
          ? { ...o, status, activity: [...(o.activity || []), { t: Date.now(), label: `Status → ${status}`, actor }] }
          : o,
      ),
    )
    logAudit(actor, `Order ${id} status → ${status}`)
  }, [logAudit])

  // ----- admin mutators ---------------------------------------------------
  const setPricing = useCallback((next) => {
    setPricingState((prev) => {
      const merged = typeof next === 'function' ? next(prev) : next
      savePricing(merged)
      return merged
    })
  }, [])

  const setCoupons = useCallback((next) => {
    setCouponsState((prev) => {
      const merged = typeof next === 'function' ? next(prev) : next
      saveCoupons(merged)
      return merged
    })
  }, [])

  // ----- auth -------------------------------------------------------------
  const login = useCallback((email, name) => {
    setCustomer({ email, name: name || email.split('@')[0] })
  }, [])
  const logout = useCallback(() => { setCustomer(null); setIsAdmin(false) }, [])

  const resetAll = useCallback(() => {
    setPricingState(DEFAULT_PRICING); savePricing(DEFAULT_PRICING)
    setCouponsState(DEFAULT_COUPONS); saveCoupons(DEFAULT_COUPONS)
    setSiteState(DEFAULT_SITE); write('dtg-site', DEFAULT_SITE)
  }, [])

  const activePromos = useMemo(() => coupons.filter((c) => c.active && c.promoText), [coupons])

  const value = {
    pricing, setPricing,
    coupons, setCoupons,
    cart, addToCart, updateQuantity, setItemQuantity, removeFromCart, clearCart,
    summary, applyCoupon, removeCoupon, couponProbe, appliedCode,
    deliveryZone, setDeliveryZone,
    orders, placeOrder, updateOrderStatus,
    customer, login, logout, isAdmin, setIsAdmin, priorOrders,
    wishlist, toggleWishlist, isWished,
    savedDesigns, saveDesign, removeDesign,
    recentlyViewed, markViewed,
    site, setSite, audit, logAudit,
    cartOpen, setCartOpen,
    toasts, toast, resetAll, activePromos,
  }

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
