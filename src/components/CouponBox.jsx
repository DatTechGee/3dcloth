import { useState } from 'react'
import { useStore } from '../store.jsx'
import Icon from './Icon.jsx'

/**
 * "Have a coupon?" input used on cart + checkout.
 * Shows clear valid / invalid / expired / used / min-order messages.
 */
export default function CouponBox() {
  const { appliedCode, couponProbe, applyCoupon, removeCoupon } = useStore()
  const [code, setCode] = useState('')

  if (appliedCode && couponProbe) {
    return (
      <div className="coupon-box">
        <p>Coupon applied</p>
        <div className="applied-coupon">
          <span className="code">“{appliedCode}” {couponProbe.ok ? `− ₦${couponProbe.discount.toLocaleString('en-NG')}` : ''}</span>
          <button type="button" onClick={removeCoupon}>Remove</button>
        </div>
        <p className={'coupon-msg ' + (couponProbe.ok ? 'ok' : 'err')} style={{ marginTop: 10 }}>
          <Icon name={couponProbe.ok ? 'check' : 'close'} size={14} />
          <span>{couponProbe.message}</span>
        </p>
      </div>
    )
  }

  return (
    <div className="coupon-box">
      <p>Have a coupon?</p>
      <div className="coupon-input-row">
        <input
          type="text"
          value={code}
          placeholder="ENTER COUPON CODE"
          aria-label="Coupon code"
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter' && code.trim()) applyCoupon(code) }}
        />
        <button type="button" className="button button-dark button-sm" disabled={!code.trim()} onClick={() => applyCoupon(code)}>
          Apply
        </button>
      </div>
    </div>
  )
}
