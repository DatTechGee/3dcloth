// ---------------------------------------------------------------------------
// Coupon & promotion engine.
// Supports every coupon type in the spec: percentage, fixed amount, first
// order only, minimum order, product/category specific, quantity based,
// limited use, expiring, seasonal and customer specific coupons, plus a
// "can be combined with other promotions" flag.
//
// Admins create and manage coupons from Admin → Coupons. Coupons persist to
// localStorage so the business can run campaigns without code changes.
// ---------------------------------------------------------------------------

export const DEFAULT_COUPONS = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    description: '10% off your first order',
    scope: 'all', // all | products | categories
    productIds: [],
    categories: [],
    minOrder: 0,
    minQuantity: 0,
    firstOrderOnly: true,
    customerEmails: [], // empty = everyone
    maxUses: 0, // 0 = unlimited
    uses: 0,
    combinable: true,
    startsAt: '',
    expiresAt: '',
    active: true,
    promoText: '10% OFF YOUR FIRST ORDER — use code WELCOME10',
  },
  {
    code: 'ABUJA500',
    type: 'fixed',
    value: 500,
    description: '₦500 off orders above ₦20,000',
    scope: 'all',
    productIds: [],
    categories: [],
    minOrder: 20000,
    minQuantity: 0,
    firstOrderOnly: false,
    customerEmails: [],
    maxUses: 0,
    uses: 0,
    combinable: true,
    startsAt: '',
    expiresAt: '',
    active: true,
    promoText: '',
  },
  {
    code: 'BUY2',
    type: 'fixed',
    value: 2000,
    description: 'Buy 2 custom shirts, get ₦2,000 off',
    scope: 'all',
    productIds: [],
    categories: [],
    minOrder: 0,
    minQuantity: 2,
    firstOrderOnly: false,
    customerEmails: [],
    maxUses: 0,
    uses: 0,
    combinable: true,
    startsAt: '',
    expiresAt: '',
    active: true,
    promoText: 'BUY 2 CUSTOM SHIRTS AND GET ₦2,000 OFF — use code BUY2',
  },
]

export function loadCoupons() {
  try {
    const saved = JSON.parse(localStorage.getItem('dtg-coupons') || 'null')
    if (Array.isArray(saved)) return saved
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_COUPONS
}

export function saveCoupons(coupons) {
  localStorage.setItem('dtg-coupons', JSON.stringify(coupons))
}

const now = () => Date.now()
const parseDate = (value) => (value ? new Date(value).getTime() : null)

const money = (n) => '₦' + Math.round(n).toLocaleString('en-NG')

/**
 * Validate a coupon against the current cart and customer.
 *
 * @param {string} rawCode    entered by the customer
 * @param {Array}  coupons    all coupons from the store
 * @param {object} ctx
 *   @param {Array}  ctx.items        cart items (need product/category/lineTotal)
 *   @param {number} ctx.subtotal     order subtotal after quantity discounts
 *   @param {number} ctx.quantity     total shirts in cart
 *   @param {string} ctx.customerEmail signed-in customer email ('' = guest)
 *   @param {number} ctx.priorOrders  completed orders for this customer
 *
 * Returns { ok, discount, freeDelivery, message, coupon } — message always
 * explains exactly why a coupon failed, per the spec.
 */
export function validateCoupon(rawCode, coupons, ctx) {
  const code = (rawCode || '').trim().toUpperCase()
  if (!code) return { ok: false, discount: 0, message: 'Enter a coupon code first.' }

  const coupon = coupons.find((c) => c.code.toUpperCase() === code)
  if (!coupon || !coupon.active) {
    return { ok: false, discount: 0, message: `“${code}” is not a valid code. Check the spelling and try again.` }
  }

  const t = now()
  const starts = parseDate(coupon.startsAt)
  const expires = parseDate(coupon.expiresAt)

  if (starts && t < starts) {
    return { ok: false, discount: 0, coupon, message: `“${code}” is not active yet — it starts on ${new Date(starts).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}.` }
  }
  if (expires && t > expires) {
    return { ok: false, discount: 0, coupon, message: `“${code}” has expired. Browse our other offers instead.` }
  }
  if (coupon.maxUses > 0 && coupon.uses >= coupon.maxUses) {
    return { ok: false, discount: 0, coupon, message: `“${code}” has been fully redeemed and can no longer be used.` }
  }
  if (coupon.firstOrderOnly && ctx.priorOrders > 0) {
    return { ok: false, discount: 0, coupon, message: `“${code}” is for first-time customers only — you’ve ordered with us before.` }
  }
  if (Array.isArray(coupon.customerEmails) && coupon.customerEmails.length > 0) {
    const email = (ctx.customerEmail || '').trim().toLowerCase()
    if (!email || !coupon.customerEmails.map((e) => e.trim().toLowerCase()).includes(email)) {
      return { ok: false, discount: 0, coupon, message: `“${code}” is a private offer and isn’t available on this account.` }
    }
  }
  if (coupon.minQuantity > 0 && ctx.quantity < coupon.minQuantity) {
    return { ok: false, discount: 0, coupon, message: `“${code}” needs at least ${coupon.minQuantity} shirts in your cart — you currently have ${ctx.quantity}.` }
  }
  if (coupon.minOrder > 0 && ctx.subtotal < coupon.minOrder) {
    return { ok: false, discount: 0, coupon, message: `“${code}” requires a minimum order of ${money(coupon.minOrder)} — add ${money(coupon.minOrder - ctx.subtotal)} more to use it.` }
  }

  // Product / category scope
  if (coupon.scope === 'products' && Array.isArray(coupon.productIds) && coupon.productIds.length > 0) {
    const eligible = ctx.items.filter((item) => coupon.productIds.includes(item.productId))
    if (eligible.length === 0) {
      return { ok: false, discount: 0, coupon, message: `“${code}” only applies to selected products that aren’t in your cart.` }
    }
  }
  if (coupon.scope === 'categories' && Array.isArray(coupon.categories) && coupon.categories.length > 0) {
    const eligible = ctx.items.filter((item) => coupon.categories.includes(item.category))
    if (eligible.length === 0) {
      return { ok: false, discount: 0, coupon, message: `“${code}” only applies to the ${coupon.categories.join(', ')} category, which isn’t in your cart.` }
    }
  }

  // Compute discount on the eligible portion of the order
  let eligibleTotal = ctx.subtotal
  if (coupon.scope === 'products' && coupon.productIds.length > 0) {
    eligibleTotal = ctx.items.filter((i) => coupon.productIds.includes(i.productId)).reduce((s, i) => s + i.lineTotal, 0)
  } else if (coupon.scope === 'categories' && coupon.categories.length > 0) {
    eligibleTotal = ctx.items.filter((i) => coupon.categories.includes(i.category)).reduce((s, i) => s + i.lineTotal, 0)
  }

  let discount =
    coupon.type === 'percentage' ? Math.round((eligibleTotal * coupon.value) / 100) : Math.min(coupon.value, eligibleTotal)
  if (discount <= 0) {
    return { ok: false, discount: 0, coupon, message: `“${code}” doesn’t give a discount on the items currently in your cart.` }
  }
  discount = Math.min(discount, ctx.subtotal)

  const label =
    coupon.type === 'percentage' ? `${coupon.value}% off` : `${money(coupon.value)} off`
  return {
    ok: true,
    discount,
    freeDelivery: Boolean(coupon.freeDelivery),
    combinable: coupon.combinable !== false,
    coupon,
    message: `Coupon “${code}” applied — ${label}${coupon.description ? ` (${coupon.description})` : ''}. You save ${money(discount)}.`,
  }
}

/** Count of uses of a code by a specific email (for limited per-customer use). */
export function usesByEmail(orders, code, email) {
  if (!email) return 0
  return orders.filter((o) => o.couponCode === code && (o.email || '').toLowerCase() === email.toLowerCase()).length
}

export function blankCoupon() {
  return {
    code: '',
    type: 'percentage',
    value: 10,
    description: '',
    scope: 'all',
    productIds: [],
    categories: [],
    minOrder: 0,
    minQuantity: 0,
    firstOrderOnly: false,
    customerEmails: [],
    maxUses: 0,
    uses: 0,
    combinable: true,
    startsAt: '',
    expiresAt: '',
    active: true,
    promoText: '',
  }
}

/** Human status badge for the admin table. */
export function couponStatus(coupon) {
  if (!coupon.active) return { label: 'Paused', tone: 'muted' }
  const t = now()
  const starts = parseDate(coupon.startsAt)
  const expires = parseDate(coupon.expiresAt)
  if (starts && t < starts) return { label: 'Scheduled', tone: 'info' }
  if (expires && t > expires) return { label: 'Expired', tone: 'danger' }
  if (coupon.maxUses > 0 && coupon.uses >= coupon.maxUses) return { label: 'Maxed out', tone: 'danger' }
  return { label: 'Live', tone: 'success' }
}
