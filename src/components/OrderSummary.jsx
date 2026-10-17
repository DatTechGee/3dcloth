import { useStore } from '../store.jsx'
import { fmt } from '../pricing.js'
import CouponBox from './CouponBox.jsx'

/**
 * The order summary breakdown required by the spec:
 *   Product total · Discount (quantity + coupon) · Delivery · TOTAL
 */
export default function OrderSummary({ compact = false }) {
  const { summary, cart } = useStore()
  const s = summary
  const totalDiscount = s.quantityDiscount + s.couponDiscount

  return (
    <div className="checkout-summary">
      <h2>Order summary</h2>

      {!compact && (
        <div style={{ marginBottom: 6 }}>
          {cart.map((item) => (
            <div className="summary-line" key={item.id}>
              <span className="label">
                {item.name} · {item.color} · {item.size} × {item.quantity}
              </span>
              <span>{fmt(item.lineTotal)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="summary-divider" />

      <div className="summary-line">
        <span className="label">Product total{compact && s.quantity > 0 ? ` (${s.quantity} shirts)` : ''}</span>
        <span>{fmt(s.rawSubtotal)}</span>
      </div>

      {s.quantityDiscount > 0 && (
        <div className="summary-line discount">
          <span className="label">Quantity discount ({s.tier.percent}%)</span>
          <span>−{fmt(s.quantityDiscount)}</span>
        </div>
      )}

      <CouponBox />

      {s.couponDiscount > 0 && (
        <div className="summary-line discount">
          <span className="label">Coupon “{s.coupon.code}”</span>
          <span>−{fmt(s.couponDiscount)}</span>
        </div>
      )}

      <div className="summary-line">
        <span className="label">Delivery — {s.deliveryZone.label}</span>
        <span>{s.delivery === 0 ? (s.freeDeliveryHit ? 'Free' : '₦0') : fmt(s.delivery)}</span>
      </div>

      {s.freeDeliveryHit && (
        <div className="summary-line discount">
          <span className="label">Free delivery unlocked</span>
          <span>🎉</span>
        </div>
      )}

      <div className="summary-divider" />

      <div className="summary-total">
        <span>{fmt(s.total)}</span>
        <small>Total</small>
      </div>

      {totalDiscount > 0 && (
        <p className="coupon-msg ok" style={{ marginTop: 12 }}>
          🎉 You’re saving {fmt(totalDiscount)} on this order.
        </p>
      )}
    </div>
  )
}
