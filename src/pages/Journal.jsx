import { useStore } from '../store.jsx'

export default function Journal() {
  const { site, toast } = useStore()
  const posts = site.journal || []

  return (
    <main>
      <div className="section" style={{ paddingBottom: 26 }}>
        <p className="eyebrow">Stories & guides</p>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 110px)' }}>Journal</h1>
        <p className="muted" style={{ marginTop: 12, maxWidth: 480 }}>Style notes, design guides and ideas from the Abuja studio floor.</p>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        {posts.map((p, i) => (
          <article
            key={p.id}
            className="promo-list-item"
            style={{ alignItems: 'flex-start', padding: '26px 28px', cursor: 'pointer' }}
            onClick={() => toast(`“${p.title}” — full article coming in the next drop.`, 'info')}
          >
            <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', minWidth: 34 }}>0{i + 1}</span>
            <div style={{ flex: 1 }}>
              <span className="chip blue">{p.tag}</span>
              <h2 style={{ fontSize: 22, marginTop: 10 }}>{p.title}</h2>
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{p.read} read</span>
          </article>
        ))}
      </div>
    </main>
  )
}
