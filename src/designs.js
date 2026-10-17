// ---------------------------------------------------------------------------
// Graphic design library — real streetwear-style artwork (not plain text).
// Each design returns inner SVG markup on a 0 0 200 200 grid with its own
// screen-print palette, so it reads the same on any garment colour. Used both
// inline on 2D cards and rasterised into a canvas texture for the 3D stage.
// ---------------------------------------------------------------------------

const P = {
  cream: '#F3EBDD',
  ink: '#0d0d0d',
  red: '#D7263D',
  blue: '#2563EB',
  gold: '#E8B84B',
  teal: '#1FA3A3',
  orange: '#F26332',
  green: '#2E7D5B',
  rose: '#E2536B',
  sky: '#7FB2E5',
}

// helper: radial rays around a centre
function rays(cx, cy, r0, r1, count, color, strokeW = 0) {
  let out = ''
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const x0 = cx + Math.cos(a) * r0
    const y0 = cy + Math.sin(a) * r0
    const x1 = cx + Math.cos(a) * r1
    const y1 = cy + Math.sin(a) * r1
    if (strokeW > 0) {
      out += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round"/>`
    } else {
      const a2 = ((i + 0.5) / count) * Math.PI * 2
      const xm = cx + Math.cos(a2) * r1
      const ym = cy + Math.sin(a2) * r1
      out += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)} L${xm.toFixed(1)} ${ym.toFixed(1)} Z" fill="${color}"/>`
    }
  }
  return out
}

export const DESIGNS = {
  // 1 — Japanese great wave + rising sun
  wave: () => `
    <circle cx="138" cy="66" r="30" fill="${P.red}"/>
    ${rays(138, 66, 34, 60, 16, P.red, 2)}
    <path d="M12 150 C40 120 60 150 82 132 C104 114 120 150 150 138 C172 129 186 148 192 156 L192 178 L12 178 Z" fill="${P.blue}"/>
    <path d="M12 158 C34 140 56 162 80 150 C104 138 126 164 154 154 C174 147 186 160 192 166" fill="none" stroke="${P.cream}" stroke-width="4" stroke-linecap="round"/>
    <path d="M40 150 C46 138 60 138 64 150 C58 146 48 146 40 150 Z" fill="${P.cream}"/>
    <path d="M96 148 C104 134 122 136 126 150 C118 145 104 144 96 148 Z" fill="${P.cream}"/>
    <path d="M150 156 C158 146 172 148 174 158 C166 153 156 153 150 156 Z" fill="${P.cream}"/>
    <path d="M22 138 C40 108 70 120 78 150 C70 132 44 128 30 150 Z" fill="${P.blue}"/>
    <path d="M78 150 C90 112 128 118 138 150 C126 130 96 128 84 152 Z" fill="${P.blue}"/>`,

  // 2 — Tiger head crest
  tiger: () => `
    <path d="M100 24 C64 24 44 46 44 82 C44 96 48 108 54 118 C48 130 60 150 78 156 C86 172 114 172 122 156 C140 150 152 130 146 118 C152 108 156 96 156 82 C156 46 136 24 100 24 Z" fill="${P.orange}"/>
    <path d="M50 40 L34 20 L40 58 Z" fill="${P.orange}"/>
    <path d="M150 40 L166 20 L160 58 Z" fill="${P.orange}"/>
    <path d="M54 34 L44 24 L48 48 Z" fill="${P.ink}"/>
    <path d="M146 34 L156 24 L152 48 Z" fill="${P.ink}"/>
    <path d="M100 30 L100 60 M84 34 L78 62 M116 34 L122 62" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>
    <path d="M56 70 L74 78 M56 86 L72 88 M144 70 L126 78 M144 86 L128 88" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>
    <path d="M74 90 C82 82 94 84 96 94 C88 90 80 90 74 94 Z" fill="${P.cream}"/>
    <path d="M126 90 C118 82 106 84 104 94 C112 90 120 90 126 94 Z" fill="${P.cream}"/>
    <circle cx="85" cy="92" r="4.5" fill="${P.ink}"/>
    <circle cx="115" cy="92" r="4.5" fill="${P.ink}"/>
    <path d="M100 104 L92 116 L108 116 Z" fill="${P.ink}"/>
    <path d="M100 116 L100 128 M100 128 C92 128 86 134 88 140 M100 128 C108 128 114 134 112 140" stroke="${P.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M70 120 L58 116 M70 128 L58 130 M130 120 L142 116 M130 128 L142 130" stroke="${P.cream}" stroke-width="2.5" stroke-linecap="round"/>`,

  // 3 — Eagle head, front-facing
  eagle: () => `
    <path d="M100 20 C70 20 52 40 52 74 C52 92 60 108 72 118 L100 176 L128 118 C140 108 148 92 148 74 C148 40 130 20 100 20 Z" fill="${P.cream}"/>
    <path d="M52 66 C40 60 34 44 40 34 C48 40 58 46 66 52 Z" fill="${P.ink}"/>
    <path d="M148 66 C160 60 166 44 160 34 C152 40 142 46 134 52 Z" fill="${P.ink}"/>
    <path d="M70 66 C82 56 96 58 100 70 C88 64 78 64 70 72 Z" fill="${P.ink}"/>
    <path d="M130 66 C118 56 104 58 100 70 C112 64 122 64 130 72 Z" fill="${P.ink}"/>
    <circle cx="80" cy="74" r="8" fill="${P.gold}"/>
    <circle cx="120" cy="74" r="8" fill="${P.gold}"/>
    <circle cx="80" cy="74" r="3.5" fill="${P.ink}"/>
    <circle cx="120" cy="74" r="3.5" fill="${P.ink}"/>
    <path d="M100 84 L86 104 C86 116 114 116 114 104 Z" fill="${P.gold}"/>
    <path d="M100 88 L100 108" stroke="${P.ink}" stroke-width="2"/>
    <path d="M78 120 L100 138 L122 120 C118 150 82 150 78 120 Z" fill="${P.ink}"/>
    <path d="M100 138 L100 168" stroke="${P.ink}" stroke-width="3"/>`,

  // 4 — Oni demon mask
  oni: () => `
    <path d="M60 40 C60 26 74 22 78 34 L70 58 Z" fill="${P.red}"/>
    <path d="M140 40 C140 26 126 22 122 34 L130 58 Z" fill="${P.red}"/>
    <path d="M100 34 C66 34 46 58 46 92 C46 126 70 158 100 166 C130 158 154 126 154 92 C154 58 134 34 100 34 Z" fill="${P.red}"/>
    <path d="M64 78 C74 66 92 66 98 80 C86 74 74 74 64 86 Z" fill="${P.ink}"/>
    <path d="M136 78 C126 66 108 66 102 80 C114 74 126 74 136 86 Z" fill="${P.ink}"/>
    <circle cx="80" cy="86" r="5" fill="${P.cream}"/>
    <circle cx="120" cy="86" r="5" fill="${P.cream}"/>
    <path d="M100 92 L92 112 L108 112 Z" fill="${P.ink}"/>
    <path d="M66 120 C80 112 120 112 134 120 C126 140 74 140 66 120 Z" fill="${P.ink}"/>
    <path d="M74 122 L80 136 M88 120 L90 138 M100 120 L100 140 M112 120 L110 138 M126 122 L120 136" stroke="${P.cream}" stroke-width="3" stroke-linecap="round"/>
    <path d="M52 96 L34 92 M148 96 L166 92" stroke="${P.red}" stroke-width="4" stroke-linecap="round"/>`,

  // 5 — Coiled serpent
  snake: () => `
    <path d="M150 40 C110 30 60 44 60 84 C60 118 108 118 108 84 C108 62 84 58 78 78" fill="none" stroke="${P.green}" stroke-width="16" stroke-linecap="round"/>
    <path d="M78 78 C74 92 86 104 100 100" fill="none" stroke="${P.green}" stroke-width="16" stroke-linecap="round"/>
    <path d="M60 150 C100 170 150 156 150 120 C150 96 120 92 116 112" fill="none" stroke="${P.green}" stroke-width="16" stroke-linecap="round"/>
    <path d="M150 40 C138 34 128 40 132 52 C140 58 152 54 150 40 Z" fill="${P.green}"/>
    <path d="M150 40 C160 32 176 34 176 46 C176 58 158 58 150 46 Z" fill="${P.green}"/>
    <circle cx="160" cy="44" r="3" fill="${P.ink}"/>
    <path d="M176 46 L190 42 M176 50 L190 56" stroke="${P.red}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M64 84 L74 90 M84 118 L94 112 M110 150 L120 146 M138 138 L146 132" stroke="${P.cream}" stroke-width="3" stroke-linecap="round"/>`,

  // 6 — Sakura branch
  sakura: () => `
    <path d="M20 176 C60 150 90 120 120 90 C140 70 160 50 178 34" fill="none" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>
    <path d="M96 108 C110 104 120 96 128 84 M132 78 C140 84 150 86 160 82 M60 140 C68 132 72 122 74 112" fill="none" stroke="${P.ink}" stroke-width="3.5" stroke-linecap="round"/>
    ${[[128, 74], [160, 74], [74, 100], [176, 40], [110, 96]].map(([x, y]) => `
      <g transform="translate(${x} ${y})">
        ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-9" rx="5" ry="9" fill="${P.rose}" transform="rotate(${a})"/>`).join('')}
        <circle r="3.5" fill="${P.gold}"/>
      </g>`).join('')}
    <circle cx="46" cy="150" r="4" fill="${P.rose}"/>
    <circle cx="150" cy="52" r="3" fill="${P.rose}"/>`,

  // 7 — Koi fish
  koi: () => `
    <path d="M40 100 C70 60 130 60 150 100 C130 140 70 140 40 100 Z" fill="${P.orange}"/>
    <path d="M150 100 C160 84 178 76 188 80 C182 96 182 104 188 120 C178 124 160 116 150 100 Z" fill="${P.orange}"/>
    <path d="M40 100 C30 92 20 92 14 98 C22 104 22 96 14 104 C22 110 32 108 40 100 Z" fill="${P.orange}"/>
    <path d="M78 72 C88 84 88 116 78 128 M108 66 C120 82 120 118 108 134" fill="none" stroke="${P.cream}" stroke-width="3"/>
    <circle cx="60" cy="94" r="5" fill="${P.ink}"/>
    <path d="M70 108 C84 118 108 118 122 108" fill="none" stroke="${P.ink}" stroke-width="2.5"/>
    <path d="M92 60 C100 46 116 44 122 56 C110 52 100 54 92 64 Z" fill="${P.blue}"/>
    <circle cx="120" cy="86" r="4" fill="${P.cream}"/>
    <circle cx="96" cy="118" r="4" fill="${P.cream}"/>`,

  // 8 — Mountain + sun
  mountain: () => `
    <circle cx="130" cy="66" r="26" fill="${P.gold}"/>
    ${rays(130, 66, 30, 52, 12, P.gold, 2)}
    <path d="M10 156 L70 66 L104 118 L128 84 L190 156 Z" fill="${P.blue}"/>
    <path d="M70 66 L92 100 L78 104 L58 84 Z" fill="${P.cream}"/>
    <path d="M128 84 L146 110 L132 112 L118 96 Z" fill="${P.cream}"/>
    <path d="M10 156 L190 156" stroke="${P.ink}" stroke-width="3"/>
    <path d="M40 156 C60 148 80 152 100 150 C130 147 160 152 190 150" fill="none" stroke="${P.cream}" stroke-width="2.5"/>`,

  // 9 — Rising sun rays
  sun: () => `
    ${rays(100, 100, 44, 92, 24, P.red)}
    <circle cx="100" cy="100" r="46" fill="${P.red}"/>
    <circle cx="100" cy="100" r="38" fill="none" stroke="${P.cream}" stroke-width="2"/>
    <path d="M100 76 L106 94 L124 94 L110 105 L115 124 L100 113 L85 124 L90 105 L76 94 L94 94 Z" fill="${P.cream}"/>`,

  // 10 — Mystic compass / all-seeing eye
  compass: () => `
    <circle cx="100" cy="100" r="72" fill="none" stroke="${P.gold}" stroke-width="3"/>
    <circle cx="100" cy="100" r="60" fill="none" stroke="${P.gold}" stroke-width="1.5"/>
    ${rays(100, 100, 62, 84, 8, P.gold, 0)}
    <path d="M100 40 L110 92 L160 100 L110 108 L100 160 L90 108 L40 100 L90 92 Z" fill="${P.cream}"/>
    <ellipse cx="100" cy="100" rx="34" ry="20" fill="${P.blue}" stroke="${P.cream}" stroke-width="3"/>
    <circle cx="100" cy="100" r="10" fill="${P.ink}"/>
    <circle cx="96" cy="96" r="3" fill="${P.cream}"/>`,

  // 11 — Lightning bolt sport crest
  bolt: () => `
    <circle cx="100" cy="100" r="70" fill="${P.ink}"/>
    <circle cx="100" cy="100" r="70" fill="none" stroke="${P.gold}" stroke-width="3"/>
    ${rays(100, 100, 72, 92, 20, P.gold, 0)}
    <path d="M112 40 L70 108 L98 108 L84 160 L132 92 L104 92 Z" fill="${P.gold}"/>
    <path d="M112 40 L70 108 L98 108 L84 160 L132 92 L104 92 Z" fill="none" stroke="${P.ink}" stroke-width="2"/>`,

  // 12 — Flower / botanical stamp
  bloom: () => `
    <g transform="translate(100 96)">
      ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="0" cy="-44" rx="14" ry="30" fill="${P.rose}" transform="rotate(${a})" opacity="0.92"/>`).join('')}
      <circle r="20" fill="${P.gold}"/>
      <circle r="12" fill="${P.orange}"/>
    </g>
    <path d="M100 130 L100 178 M100 150 C86 146 78 156 78 156 M100 160 C114 156 122 166 122 166" fill="none" stroke="${P.green}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="78" cy="150" r="5" fill="${P.green}"/>
    <circle cx="122" cy="160" r="5" fill="${P.green}"/>`,
}

export const DESIGN_LIST = Object.keys(DESIGNS)

/** Full standalone SVG string for a graphic — used to rasterise to canvas. */
export function designSVG(id, size = 200) {
  const inner = DESIGNS[id]
  if (!inner) return null
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 200 200">${inner()}</svg>`
}

/** Data URL for a graphic — safe for <image href> and canvas drawing. */
export function designDataUrl(id, size = 200) {
  const svg = designSVG(id, size)
  if (!svg) return null
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** Meta for UI pickers. */
export const DESIGN_META = {
  wave: { title: 'Great Wave', style: 'Japanese' },
  tiger: { title: 'Tiger Crest', style: 'Animal' },
  eagle: { title: 'Eagle Head', style: 'Animal' },
  oni: { title: 'Oni Mask', style: 'Japanese' },
  snake: { title: 'Serpent', style: 'Animal' },
  sakura: { title: 'Sakura', style: 'Botanical' },
  koi: { title: 'Koi Fish', style: 'Japanese' },
  mountain: { title: 'Summit', style: 'Nature' },
  sun: { title: 'Rising Sun', style: 'Graphic' },
  compass: { title: 'Compass', style: 'Mystic' },
  bolt: { title: 'Thunder', style: 'Sport' },
  bloom: { title: 'Bloom', style: 'Botanical' },
}
