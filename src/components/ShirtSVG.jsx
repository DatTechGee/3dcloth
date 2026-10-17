import { DESIGNS } from '../designs.js'

// Brand garment palette — jet black, cream, soft white, charcoal + accents.
export const GARMENT_COLORS = [
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

const hexOf = (id) => GARMENT_COLORS.find((c) => c.id === id)?.hex || '#090909'

const isDark = (hex) => ['#090909', '#202020', '#23304d', '#5c6244', '#f26332'].includes(hex)

const FONT_MAP = {
  serif: '"Playfair Display", serif',
  sans: '"DM Sans", sans-serif',
  mono: '"DM Mono", monospace',
  display: '"Bebas Neue", sans-serif',
}

/** Flat trouser illustration — waistband, tapered legs, used for chino/cargo/denim. */
function TrouserPaths({ fill, stitch }) {
  return (
    <>
      <path
        d="M64 22 L136 22 L138 54 L130 182 L110 182 L104 96 L96 96 L90 182 L70 182 L62 54 Z"
        fill={fill}
        stroke={stitch}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="62" y="22" width="76" height="14" fill={stitch} />
      {/* belt loops */}
      {[70, 96, 104, 130].map((x) => <rect key={x} x={x - 2.5} y="20" width="5" height="18" fill={stitch} />)}
      {/* pocket hints */}
      <path d="M68 44 Q78 52 86 44" fill="none" stroke={stitch} strokeWidth="2" />
      <path d="M114 44 Q122 52 132 44" fill="none" stroke={stitch} strokeWidth="2" />
      {/* fly seam */}
      <path d="M100 36 L100 60" fill="none" stroke={stitch} strokeWidth="1.6" />
    </>
  )
}

/** Flat shirt illustration used in cards, drawer thumbs and print previews. */
export default function ShirtSVG({ color = 'black', design, showDesign = true, garment = 'tee', className }) {
  const fill = hexOf(color)
  const stitch = isDark(fill) ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)'
  const defaultPrint = isDark(fill) ? '#f3ebdd' : '#090909'
  const printColor = !design?.color || design.color === 'auto' ? defaultPrint : design.color
  const isTrouser = garment === 'trousers'

  const artwork = (
    <>
      {showDesign && design?.graphic && DESIGNS[design.graphic] ? (
        <g transform={isTrouser ? 'translate(66 46) scale(0.34)' : 'translate(60 68) scale(0.4)'}>{DESIGNS[design.graphic]()}</g>
      ) : null}
      {showDesign && design?.text ? (
        <text
          x="100"
          y={isTrouser ? 62 : design.text.includes('\n') ? 106 : 113}
          textAnchor="middle"
          fill={printColor}
          style={{
            fontFamily: FONT_MAP[design.font] || FONT_MAP.sans,
            fontWeight: design.font === 'display' ? 400 : 700,
            fontSize: design.font === 'display' ? (isTrouser ? 19 : 26) : design.text.includes('\n') ? 19 : isTrouser ? 17 : 23,
            letterSpacing: '0.04em',
            whiteSpace: 'pre',
          }}
        >
          {design.text}
        </text>
      ) : null}
      {showDesign && design?.image ? (
        <image href={design.image} x={isTrouser ? 76 : 70} y={isTrouser ? 40 : 80} width="50" height="50" preserveAspectRatio="xMidYMid meet" />
      ) : null}
    </>
  )

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      {isTrouser ? (
        <>
          <TrouserPaths fill={fill} stitch={stitch} />
          {artwork}
        </>
      ) : (
        <>
          <path
            d="M70 24 L52 32 L18 62 L38 86 L58 72 L58 176 L142 176 L142 72 L162 86 L182 62 L148 32 L130 24 C126 42 112 50 100 50 C88 50 74 42 70 24 Z"
            fill={fill}
            stroke={stitch}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M70 24 C76 40 88 47 100 47 C112 47 124 40 130 24 L122 21 C118 33 110 38 100 38 C90 38 82 33 78 21 Z" fill={stitch} />
          {artwork}
        </>
      )}
    </svg>
  )
}
