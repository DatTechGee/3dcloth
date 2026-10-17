// ---------------------------------------------------------------------------
// CREATIVE MODE brand logo.
// Mark: a garment silhouette inside a 360° orbit — the shirt that spins
// through every angle in the 3D studio. Scales from 16px favicon to hero.
// ---------------------------------------------------------------------------

const TEE_PATH =
  'M70 24 L52 32 L18 62 L38 86 L58 72 L58 176 L142 176 L142 72 L162 86 L182 62 L148 32 L130 24 C126 42 112 50 100 50 C88 50 74 42 70 24 Z'

function Mark({ theme = 'dark', size = 40 }) {
  const light = theme === 'light'
  const shirt = light ? '#090909' : '#F3EBDD'
  const ring = '#2563EB'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* orbit — the 360° stage */}
      <ellipse cx="32" cy="33" rx="28.5" ry="10.5" transform="rotate(-18 32 33)" stroke={ring} strokeWidth="2.6" />
      {/* the garment, mid-spin */}
      <path d={TEE_PATH} fill={shirt} transform="translate(32 33) scale(0.27) translate(-100 -100)" />
      {/* the designer's dot, riding the orbit */}
      <circle cx="60.2" cy="23.9" r="3.4" fill={ring} />
    </svg>
  )
}

/**
 * Full lockup. theme: 'dark' (on dark backgrounds) | 'light' (on light).
 * variant: 'full' (mark + wordmark) | 'mark' (icon only).
 */
export default function Logo({ variant = 'full', theme = 'dark', size = 40, className }) {
  const word = theme === 'light' ? '#090909' : '#F3EBDD'
  const muted = theme === 'light' ? '#6b675e' : 'rgba(243,235,221,0.55)'
  const blue = '#2563EB'

  if (variant === 'mark') return <Mark theme={theme} size={size} />

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.28 }}>
      <Mark theme={theme} size={size} />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: size * 0.56,
            letterSpacing: '0.07em',
            color: word,
          }}
        >
          Creative Mode<span style={{ color: blue }}>.</span>
        </span>
        <span
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: Math.max(7, size * 0.19),
            letterSpacing: '0.24em',
            color: muted,
            marginTop: size * 0.1,
          }}
        >
          3D CUSTOM STUDIO
        </span>
      </span>
    </span>
  )
}
