// ---------------------------------------------------------------------------
// Configurable pricing engine.
// Every value here is editable from the admin dashboard (Settings → Pricing)
// and is persisted to localStorage, so the business can change prices,
// discounts, delivery fees and promos without touching the website code.
// ---------------------------------------------------------------------------

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
export const WAIST_SIZES = ['28', '30', '32', '34', '36', '38', '40']

export const COLOR_OPTIONS = [
  { id: 'black', label: 'Jet Black', hex: '#090909', text: '#f3ebdd' },
  { id: 'cream', label: 'Cream', hex: '#f3ebdd', text: '#090909' },
  { id: 'white', label: 'Soft White', hex: '#fafaf7', text: '#090909' },
  { id: 'charcoal', label: 'Charcoal', hex: '#202020', text: '#f3ebdd' },
  { id: 'navy', label: 'Navy', hex: '#23304d', text: '#f3ebdd' },
  { id: 'orange', label: 'Studio Orange', hex: '#f26332', text: '#fafaf7' },
  { id: 'olive', label: 'Olive', hex: '#5c6244', text: '#f3ebdd' },
  { id: 'yellow', label: 'Studio Yellow', hex: '#f0c65d', text: '#090909' },
  { id: 'grey', label: 'Heather Grey', hex: '#c9c6bd', text: '#090909' },
]

export const PRINT_LOCATIONS = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'front-back', label: 'Front + Back' },
  { id: 'left-sleeve', label: 'Left sleeve' },
  { id: 'right-sleeve', label: 'Right sleeve' },
]

export const PRINT_SIZES = [
  { id: 'small', label: 'Small', hint: '10 × 10 cm' },
  { id: 'medium', label: 'Medium', hint: '20 × 25 cm' },
  { id: 'large', label: 'Large', hint: '30 × 40 cm' },
]

export const SHIRT_TYPES = [
  { id: 'classic-tee', label: 'Classic Crew Neck', note: '180gsm combed cotton', kind: 'tee' },
  { id: 'premium-tee', label: 'Premium Crew Neck', note: '240gsm heavyweight', kind: 'tee' },
  { id: 'polo', label: 'Piqué Polo', note: 'Piqué cotton, 2-button', kind: 'tee' },
  { id: 'chino', label: 'Chino Trouser', note: 'Cotton twill, flat front', kind: 'trousers' },
  { id: 'cargo', label: 'Cargo Trouser', note: 'Ripstop, side pockets', kind: 'trousers' },
  { id: 'denim', label: 'Denim Jean', note: '12oz ring-spun denim', kind: 'trousers' },
]

/** kind of a garment type id: 'tee' | 'trousers' */
export const garmentKind = (typeId) => SHIRT_TYPES.find((t) => t.id === typeId)?.kind || 'tee'
/** size list appropriate for a garment type */
export const sizesFor = (typeId) => (garmentKind(typeId) === 'trousers' ? WAIST_SIZES : SIZES)

export const DEFAULT_PRICING = {
  // Base product prices per garment type
  basePrices: { 'classic-tee': 12000, 'premium-tee': 16500, polo: 18000, chino: 19500, cargo: 22000, denim: 21000 },
  // Surcharges — tops by letter size, trousers by waist inch
  sizeSurcharge: { S: 0, M: 0, L: 0, XL: 500, XXL: 1000, '28': 0, '30': 0, '32': 0, '34': 500, '36': 1000, '38': 1500, '40': 2000 },
  colorSurcharge: { black: 0, cream: 0, white: 0, grey: 0, charcoal: 500, navy: 500, orange: 1000, olive: 1000, yellow: 500 },
  printLocationFee: { front: 2500, back: 2500, 'front-back': 4500, 'left-sleeve': 1500, 'right-sleeve': 1500 },
  printSizeFee: { small: 0, medium: 1000, large: 2000 },
  // Extra customisation (per shirt)
  extras: {
    nameEmbroidery: 1500, // stitched name on chest
    customTag: 1000, // replace the neck tag with your brand
    giftWrap: 800, // boxed + tissue wrapped
  },
  // Automatic quantity discounts (applied before coupon)
  quantityDiscounts: [
    { minimum: 11, percent: 15 },
    { minimum: 6, percent: 10 },
    { minimum: 3, percent: 5 },
  ],
  // Delivery
  deliveryZones: [
    { id: 'abuja-central', label: 'Abuja — Central & Maitama', fee: 2000, eta: '1–2 days' },
    { id: 'abuja-outskirts', label: 'Abuja — Kubwa, Lugbe, Gwagwalada', fee: 3000, eta: '2–3 days' },
    { id: 'north-west', label: 'North West (Kaduna, Kano, Jos…)', fee: 4000, eta: '3–5 days' },
    { id: 'south-west', label: 'South West (Lagos, Ibadan…)', fee: 4500, eta: '3–5 days' },
    { id: 'other', label: 'Other states', fee: 5000, eta: '4–7 days' },
  ],
  freeDeliveryOver: 100000, // waive delivery above this order value (0 = never)
  currency: '₦',
}

export function loadPricing() {
  try {
    const saved = JSON.parse(localStorage.getItem('dtg-pricing') || 'null')
    if (saved && typeof saved === 'object') {
      return {
        ...DEFAULT_PRICING,
        ...saved,
        basePrices: { ...DEFAULT_PRICING.basePrices, ...saved.basePrices },
        sizeSurcharge: { ...DEFAULT_PRICING.sizeSurcharge, ...saved.sizeSurcharge },
        colorSurcharge: { ...DEFAULT_PRICING.colorSurcharge, ...saved.colorSurcharge },
        printLocationFee: { ...DEFAULT_PRICING.printLocationFee, ...saved.printLocationFee },
        printSizeFee: { ...DEFAULT_PRICING.printSizeFee, ...saved.printSizeFee },
        extras: { ...DEFAULT_PRICING.extras, ...saved.extras },
      }
    }
  } catch {
    /* corrupted storage → fall through to defaults */
  }
  return DEFAULT_PRICING
}

export function savePricing(pricing) {
  localStorage.setItem('dtg-pricing', JSON.stringify(pricing))
}

export const fmt = (n) => '₦' + Math.round(n).toLocaleString('en-NG')

/** Price of a single shirt (before quantity discount / coupon). */
export function unitPrice(pricing, config) {
  const base = pricing.basePrices[config.shirtType] ?? DEFAULT_PRICING.basePrices['classic-tee']
  const size = pricing.sizeSurcharge[config.size] ?? 0
  const color = pricing.colorSurcharge[config.color] ?? 0
  const location = pricing.printLocationFee[config.printLocation] ?? 0
  const printSize = pricing.printSizeFee[config.printSize] ?? 0
  const extras = Object.entries(config.extras || {}).reduce(
    (sum, [key, on]) => sum + (on ? pricing.extras[key] || 0 : 0),
    0,
  )
  return base + size + color + location + printSize + extras
}

/** Best matching automatic quantity discount for a cart quantity. */
export function quantityTier(pricing, quantity) {
  return pricing.quantityDiscounts
    .slice()
    .sort((a, b) => b.minimum - a.minimum)
    .find((tier) => quantity >= tier.minimum)
}

/**
 * Cart pricing summary. Coupon validation lives in coupons.js; this function
 * accepts an already-resolved coupon (or null) and stacks discounts in the
 * documented order: quantity tier first, then coupon, then delivery.
 */
export function priceCart(pricing, items, couponResult, deliveryZoneId) {
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const rawSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const tier = quantityTier(pricing, quantity)
  const quantityDiscount = tier ? Math.round((rawSubtotal * tier.percent) / 100) : 0
  const afterQuantity = rawSubtotal - quantityDiscount

  const coupon = couponResult?.ok ? couponResult : null
  const couponDiscount = coupon ? coupon.discount : 0
  const afterCoupon = Math.max(0, afterQuantity - couponDiscount)

  const zone = pricing.deliveryZones.find((z) => z.id === deliveryZoneId) || pricing.deliveryZones[0]
  const freeDeliveryHit = pricing.freeDeliveryOver > 0 && afterCoupon >= pricing.freeDeliveryOver
  const delivery = items.length === 0 ? 0 : coupon?.freeDelivery || freeDeliveryHit ? 0 : zone.fee

  return {
    quantity,
    rawSubtotal,
    tier,
    quantityDiscount,
    afterQuantity,
    coupon,
    couponDiscount,
    afterCoupon,
    deliveryZone: zone,
    delivery,
    freeDeliveryHit,
    total: afterCoupon + delivery,
  }
}
