import { useState } from 'react'
import { useStore } from '../store.jsx'
import Icon from '../components/Icon.jsx'
import ShirtSVG from '../components/ShirtSVG.jsx'

export default function Auth({ go }) {
  const { customer, login, logout, toast } = useStore()
  const [mode, setMode] = useState('signin') // signin | register
  const [form, setForm] = useState({ name: '', email: '' })
  const [errors, setErrors] = useState({})

  if (customer) {
    return (
      <main>
        <div className="nf">
          <div>
            <div className="nf-art"><ShirtSVG color="black" design={{ text: 'DTG', color: '#2563eb', font: 'display' }} /></div>
            <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}>You’re signed in</h1>
            <p className="muted" style={{ margin: '14px 0 30px' }}>{customer.name} · {customer.email}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="button button-blue button-lg" onClick={() => go('account')}>Go to account</button>
              <button className="button button-lg" onClick={logout}>Sign out</button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (mode === 'register' && !form.name.trim()) next.name = 'Required'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    login(form.email, form.name || form.email.split('@')[0])
    toast(mode === 'register' ? 'Account created — welcome to the studio.' : 'Signed in. Welcome back.')
    go('account')
  }

  return (
    <main className="checkout-page">
      <div className="auth-shell">
        <div className="auth-aside">
          <p className="eyebrow" style={{ color: 'var(--muted-dark)' }}>Members get</p>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 20, display: 'grid', gap: 16 }}>
            {[
              'Saved designs that sync across devices',
              'Full production timeline on every order',
              'Early access to every drop',
              'Wishlist + instant reorder',
            ].map((perk) => (
              <li key={perk} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--muted-dark)', fontSize: 14 }}>
                <Icon name="check" size={16} /> {perk}
              </li>
            ))}
          </ul>
        </div>

        <form className="auth-card" onSubmit={submit}>
          <div className="template-tabs" style={{ marginBottom: 26 }}>
            <button type="button" className={'template-tab' + (mode === 'signin' ? ' active' : '')} onClick={() => setMode('signin')}>Sign in</button>
            <button type="button" className={'template-tab' + (mode === 'register' ? ' active' : '')} onClick={() => setMode('register')}>Create account</button>
          </div>

          {mode === 'register' && (
            <div className="field">
              <label>Full name</label>
              <input value={form.name} onChange={set('name')} placeholder="Chiamaka Obi" autoComplete="name" />
              {errors.name && <span className="field-err">{errors.name}</span>}
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input value={form.email} onChange={set('email')} placeholder="you@example.com" inputMode="email" autoComplete="email" />
            {errors.email && <span className="field-err">{errors.email}</span>}
          </div>

          <button className="button button-blue button-lg button-block" type="submit" style={{ marginTop: 18 }}>
            {mode === 'signin' ? 'Sign in' : 'Create account'} <Icon name="arrow" size={15} />
          </button>
          <p className="muted" style={{ fontSize: 12, marginTop: 16, textAlign: 'center' }}>
            Demo studio — any email works, no password needed. Orders & designs stay on this device.
          </p>
          <button type="button" className="link-btn" style={{ display: 'block', margin: '14px auto 0' }} onClick={() => go('studio')}>
            Or continue as guest →
          </button>
        </form>
      </div>
    </main>
  )
}
