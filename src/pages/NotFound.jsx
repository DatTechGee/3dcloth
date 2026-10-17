import ShirtSVG from '../components/ShirtSVG.jsx'
import Icon from '../components/Icon.jsx'

export default function NotFound({ go }) {
  return (
    <main>
      <div className="nf">
        <div>
          <div className="nf-art">
            <ShirtSVG color="cream" design={{ text: '404', color: '#dc2626', font: 'display' }} />
          </div>
          <p className="eyebrow">Lost in the wardrobe</p>
          <h1 className="display" style={{ fontSize: 'clamp(48px, 8vw, 110px)' }}>404</h1>
          <p className="muted" style={{ margin: '16px auto 30px', maxWidth: 420 }}>
            This page doesn’t exist — but a shirt that does could be entirely yours. Start designing, or head back home.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="button button-blue button-lg" onClick={() => go('studio')}><Icon name="spark" size={15} /> Create your tee</button>
            <button className="button button-lg" onClick={() => go('home')}>Back home</button>
          </div>
        </div>
      </div>
    </main>
  )
}
