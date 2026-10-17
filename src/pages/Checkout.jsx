import { useState } from 'react'
import { useStore } from '../store.jsx'
import { fmt, COLOR_OPTIONS } from '../pricing.js'
import { PAYMENT_METHODS } from '../catalog.js'
import OrderSummary from '../components/OrderSummary.jsx'
import ShirtSVG from '../components/ShirtSVG.jsx'
import Icon from '../components/Icon.jsx'

const STEPS = [['1', 'Contact'], ['2', 'Delivery'], ['3', 'Payment'], ['4', 'Confirm']]

export default function Checkout({ go }) {
  const { cart, pricing, summary, deliveryZone, setDeliveryZone, placeOrder, customer, toast } = useStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: '',
    address: '',
    city: '',
  })
  const [gift, setGift] = useState({ isGift: false, recipient: '', message: '', hidePrice: false })
  const [payment, setPayment] = useState('paystack')
  const [placed, setPlaced] = useState(null)
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  if (placed) {
    return (
      <main>
        <div className="section">
          <div className="order-success">
            <p className="eyebrow" style={{ textAlign: 'center' }}>Confirmed</p>
            <h1 className="display">Your design is in.</h1>
            <p className="order-id">ORDER {placed.id} · {placed.payment === 'delivery' ? 'PAY ON DELIVERY' : 'PAID WITH PAYSTACK'}</p>
            <div className="design-approval" style={{ marginTop: 34, textAlign: 'left' }}>
              <div className="da-thumb" style={{ background: COLOR_OPTIONS.find((c) => c.id === placed.items[0]?.color)?.hex }}>
                <ShirtSVG color={placed.items[0]?.color} design={placed.items[0]?.design} showDesign={Boolean(placed.items[0]?.design)} />
              </div>
              <div>
                <strong>{placed.items[0]?.name}</strong>
                <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  We’ve received your order and will begin processing your approved design.
                  {placed.designApproved ? ' Your artwork is locked for production.' : ' Our team will confirm the artwork with you.'}
                </p>
              </div>
            </div>
            <div className="checkout-summary" style={{ textAlign: 'left' }}>
              <div className="summary-line"><span className="label">Product total</span><span>{fmt(placed.summary.rawSubtotal)}</span></div>
              {placed.summary.quantityDiscount > 0 && (
                <div className="summary-line discount"><span className="label">Quantity discount</span><span>−{fmt(placed.summary.quantityDiscount)}</span></div>
              )}
              {placed.summary.couponDiscount > 0 && (
                <div className="summary-line discount"><span className="label">Coupon “{placed.summary.couponCode}”</span><span>−{fmt(placed.summary.couponDiscount)}</span></div>
              )}
              <div className="summary-line"><span className="label">Delivery</span><span>{placed.summary.delivery === 0 ? 'Free' : fmt(placed.summary.delivery)}</span></div>
              <div className="summary-divider" />
              <div className="summary-total"><span>{fmt(placed.summary.total)}</span><small>Total</small></div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 30, flexWrap: 'wrap' }}>
              <button className="button button-blue button-lg" onClick={() => go('orders')}>Track order</button>
              <button className="button button-lg" onClick={() => go('catalog')}>Continue shopping</button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (cart.length === 0) {
    return (
      <main>
        <div className="nf">
          <div>
            <h1 className="display" style={{ fontSize: 60 }}>Nothing to check out</h1>
            <p className="muted" style={{ margin: '14px 0 26px' }}>Your bag is empty — design a tee first.</p>
            <button className="button button-blue button-lg" onClick={() => go('studio')}>Open the studio</button>
          </div>
        </div>
      </main>
    )
  }

  const validate = (upto) => {
    const next = {}
    if (upto >= 0 && !form.name.trim()) next.name = 'Required'
    if (upto >= 0 && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email'
    if (upto >= 0 && form.phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a valid phone number'
    if (upto >= 1 && !form.address.trim()) next.address = 'Required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const nextStep = () => { if (validate(step)) setStep((s) => Math.min(3, s + 1)) }

  const submit = () => {
    if (payment === 'delivery' && !summary.deliveryZone.id.startsWith('abuja')) {
      toast('Pay on delivery is only available for Abuja zones — please pay online.', 'error')
      return
    }
    const order = placeOrder({ ...form, zone: deliveryZone, payment, gift: gift.isGift ? gift : null })
    setPlaced(order)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <p className="eyebrow">Quiet, secure, four steps</p>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 5vw, 70px)', marginBottom: 30 }}>Checkout</h1>

        <div className="checkout-steps">
          {STEPS.map(([n, label], i) => (
            <button key={n} className={step === i ? 'active' : ''} disabled={i > step} onClick={() => i <= step && setStep(i)}>
              {n} — {label}
            </button>
          ))}
        </div>

        <div className="checkout-grid">
          <div>
            {step === 0 && (
              <div>
                <div className="field-row">
                  <div className="field">
                    <label>Full name</label>
                    <input value={form.name} onChange={set('name')} placeholder="Chiamaka Obi" autoComplete="name" />
                    {errors.name && <span className="field-err">{errors.name}</span>}
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input value={form.phone} onChange={set('phone')} placeholder="0803 000 0000" inputMode="tel" autoComplete="tel" />
                    {errors.phone && <span className="field-err">{errors.phone}</span>}
                  </div>
                </div>
                <div className="field">
                  <label>Email</label>
                  <input value={form.email} onChange={set('email')} placeholder="you@example.com" inputMode="email" autoComplete="email" />
                  {errors.email && <span className="field-err">{errors.email}</span>}
                </div>
                {!customer && (
                  <p className="muted" style={{ fontSize: 13 }}>
                    Checking out as guest. <button className="link-btn" onClick={() => go('auth')}>Sign in</button> to save this design to your account.
                  </p>
                )}
                <button className="button button-dark button-lg" style={{ marginTop: 22 }} onClick={nextStep}>Continue to delivery <Icon name="arrow" size={15} /></button>
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="field">
                  <label>Delivery zone</label>
                  <select value={deliveryZone} onChange={(e) => setDeliveryZone(e.target.value)}>
                    {pricing.deliveryZones.map((z) => (
                      <option key={z.id} value={z.id}>{z.label} — {fmt(z.fee)} ({z.eta})</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Street address</label>
                  <input value={form.address} onChange={set('address')} placeholder="12 Aminu Kano Crescent, Wuse 2" autoComplete="street-address" />
                  {errors.address && <span className="field-err">{errors.address}</span>}
                </div>
                <div className="field">
                  <label>City / area</label>
                  <input value={form.city} onChange={set('city')} placeholder="Abuja" autoComplete="address-level2" />
                </div>

                <label className="checkbox-row" style={{ marginBottom: 12 }}>
                  <input type="checkbox" checked={gift.isGift} onChange={(e) => setGift((g) => ({ ...g, isGift: e.target.checked }))} />
                  This is a gift — add a message and hide the price
                </label>
                {gift.isGift && (
                  <div style={{ border: '1px solid var(--line)', padding: 18, marginBottom: 18 }}>
                    <div className="field">
                      <label>Recipient name</label>
                      <input value={gift.recipient} onChange={(e) => setGift((g) => ({ ...g, recipient: e.target.value }))} placeholder="Who is it for?" />
                    </div>
                    <div className="field">
                      <label>Gift message</label>
                      <textarea rows={2} value={gift.message} onChange={(e) => setGift((g) => ({ ...g, message: e.target.value }))} placeholder="Happy birthday from the team…" />
                    </div>
                    <label className="checkbox-row">
                      <input type="checkbox" checked={gift.hidePrice} onChange={(e) => setGift((g) => ({ ...g, hidePrice: e.target.checked }))} />
                      Hide the price from the package
                    </label>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="button button-ghost button-lg" onClick={() => setStep(0)}>Back</button>
                  <button className="button button-dark button-lg" onClick={nextStep}>Continue to payment <Icon name="arrow" size={15} /></button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.id} className={'pay-option' + (payment === m.id ? ' active' : '')}>
                    <input type="radio" name="payment" checked={payment === m.id} onChange={() => setPayment(m.id)} />
                    <span>
                      <strong>{m.label}</strong>
                      <small>{m.note}</small>
                    </span>
                  </label>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="button button-ghost button-lg" onClick={() => setStep(1)}>Back</button>
                  <button className="button button-dark button-lg" onClick={() => setStep(3)}>Review order <Icon name="arrow" size={15} /></button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="design-approval">
                  <div className="da-thumb" style={{ background: COLOR_OPTIONS.find((c) => c.id === cart[0]?.color)?.hex }}>
                    <ShirtSVG color={cart[0]?.color} design={cart[0]?.design} showDesign={Boolean(cart[0]?.design)} />
                  </div>
                  <div>
                    <strong>Your design</strong>
                    <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                      {cart[0]?.designApproved
                        ? 'Approved and locked — this exact artwork will be produced.'
                        : 'Please verify this is the exact design to be produced.'}
                    </p>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 18 }}>
                  <div className="summary-line"><span className="label">Deliver to</span><span>{form.name} · {form.address || '—'}{form.city ? `, ${form.city}` : ''}</span></div>
                  <div className="summary-line"><span className="label">Zone</span><span>{summary.deliveryZone.label} ({summary.deliveryZone.eta})</span></div>
                  <div className="summary-line"><span className="label">Contact</span><span>{form.phone} · {form.email}</span></div>
                  <div className="summary-line"><span className="label">Payment</span><span>{PAYMENT_METHODS.find((p) => p.id === payment)?.label}</span></div>
                  {gift.isGift && <div className="summary-line"><span className="label">Gift</span><span>For {gift.recipient || 'recipient'}{gift.hidePrice ? ' · price hidden' : ''}</span></div>}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="button button-ghost button-lg" onClick={() => setStep(2)}>Back</button>
                  <button className="button button-blue button-lg" style={{ flex: 1, minWidth: 220 }} onClick={submit}>
                    {payment === 'paystack' ? `Approve & pay ${fmt(summary.total)}` : `Approve & place order — ${fmt(summary.total)}`}
                  </button>
                </div>
                <p className="muted" style={{ fontSize: 12, marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Icon name="shield" size={14} /> Secured by Paystack — card, transfer & USSD. Your details never touch our servers.
                </p>
              </div>
            )}
          </div>

          <OrderSummary compact />
        </div>
      </div>
    </main>
  )
}
