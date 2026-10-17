import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ShirtStage from '../three/ShirtStage.jsx'
import Icon from '../components/Icon.jsx'
import { useStore } from '../store.jsx'
import { COLOR_OPTIONS, PRINT_SIZES, SHIRT_TYPES, garmentKind, sizesFor, unitPrice, quantityTier, fmt } from '../pricing.js'
import { PRODUCTS } from '../catalog.js'
import { DESIGN_TEMPLATES } from '../site.js'
import { DESIGNS, DESIGN_META, DESIGN_LIST } from '../designs.js'

// ---------------------------------------------------------------------------
// Premium customizer: DESIGN MODE (precise 2D artboard) ↔ 3D MODE (realistic
// garment) ↔ PROOF MODE (print-area, quality gate, approval lock).
// ---------------------------------------------------------------------------

const TOOLS = [
  { id: 'select', label: 'Select', ico: '⤢', key: 'V' },
  { id: 'graphics', label: 'Graphics', ico: '✦', key: 'A' },
  { id: 'text', label: 'Text', ico: 'T', key: 'T' },
  { id: 'image', label: 'Image', ico: '🖼', key: 'I' },
  { id: 'templates', label: 'Templates', ico: '▦', key: 'G' },
  { id: 'layers', label: 'Layers', ico: '≡', key: 'L' },
  { id: 'garment', label: 'Garment', ico: '◧', key: 'S' },
]

const SURFACES_TEE = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left-sleeve', label: 'Left sleeve' },
  { id: 'right-sleeve', label: 'Right sleeve' },
]
const SURFACES_TROUSER = [
  { id: 'front', label: 'Hip print' },
  { id: 'back', label: 'Back pocket' },
  { id: 'left-sleeve', label: 'Left leg' },
  { id: 'right-sleeve', label: 'Right leg' },
]

const DESIGN_FONTS = [
  { id: 'display', label: 'Bebas Neue' },
  { id: 'serif', label: 'Playfair' },
  { id: 'sans', label: 'DM Sans' },
  { id: 'mono', label: 'DM Mono' },
]

const DESIGN_PALETTE = ['#090909', '#fafaf7', '#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#ec4899']

const uid = () => Math.random().toString(36).slice(2, 9)

// Each design element: { id, type: 'text'|'image', text?, font?, color, size, x, y (0..1), scale, rotation, opacity, locked, hidden, src? }
const newTextEl = (text = 'YOUR TEXT', color = '#090909') => ({
  id: uid(), type: 'text', text, font: 'display', color, size: 48, x: 0.5, y: 0.42, scale: 1, rotation: 0, opacity: 1, locked: false, hidden: false,
})
const newImageEl = (src) => ({
  id: uid(), type: 'image', src, color: '#090909', size: 120, x: 0.5, y: 0.4, scale: 1, rotation: 0, opacity: 1, locked: false, hidden: false,
})
const newGraphicEl = (graphic) => ({
  id: uid(), type: 'graphic', graphic, color: '#090909', size: 150, x: 0.5, y: 0.4, scale: 1, rotation: 0, opacity: 1, locked: false, hidden: false,
})

/** Crude but effective DPI estimate from a data URL's pixel width vs print size. */
function imageDpi(src, printSize) {
  const widths = { small: 10, medium: 20, large: 30 } // cm
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const cm = widths[printSize] || 20
      resolve(Math.round(img.width / (cm / 2.54)))
    }
    img.onerror = () => resolve(0)
    img.src = src
  })
}

export default function Studio({ go, param }) {
  const { pricing, addToCart, toast, saveDesign, setCartOpen, site } = useStore()

  // garment config
  const [shirtType, setShirtType] = useState('premium-tee')
  const kind = garmentKind(shirtType)
  const SURFACES = kind === 'trousers' ? SURFACES_TROUSER : SURFACES_TEE
  const sizeOptions = sizesFor(shirtType)
  const [color, setColor] = useState('black')
  const [size, setSize] = useState('M')
  const [printLocation, setPrintLocation] = useState('front')
  const [printSize, setPrintSize] = useState('medium')
  const [extras, setExtras] = useState({ nameEmbroidery: false, customTag: false, giftWrap: false })
  const [quantity, setQuantity] = useState(1)

  // editor state — designs are stored per print surface
  const [mode, setMode] = useState('3d') // 'design' | '3d' | 'proof'
  const [tool, setTool] = useState('select')
  const [surface, setSurface] = useState('front')
  const [elementsBySurface, setElementsBySurface] = useState(() => ({ front: [newGraphicEl('wave')], back: [], 'left-sleeve': [], 'right-sleeve': [] }))
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('front')
  const [autoRotate, setAutoRotate] = useState(true)
  const [showSafe, setShowSafe] = useState(true)
  const [approved, setApproved] = useState(false)

  // history
  const [past, setPast] = useState([])
  const [future, setFuture] = useState([])
  const fileRef = useRef(null)

  const elements = elementsBySurface[surface] || []
  const selected = elements.find((e) => e.id === selectedId) || null

  const commit = useCallback((nextEls, surfaceId = surface) => {
    setPast((p) => [...p.slice(-24), elementsBySurface])
    setFuture([])
    setElementsBySurface((prev) => ({ ...prev, [surfaceId]: typeof nextEls === 'function' ? nextEls(prev[surfaceId] || []) : nextEls }))
  }, [surface, elementsBySurface])

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p
      setElementsBySurface((cur) => {
        setFuture((f) => [cur, ...f])
        return p[p.length - 1]
      })
      return p.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f
      setElementsBySurface((cur) => {
        setPast((p) => [...p, cur])
        return f[0]
      })
      return f.slice(1)
    })
  }, [])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) { redo() } else { undo() }; return }
      if (e.key === 'Delete' && selectedId) { removeElement(selectedId); return }
      const t = TOOLS.find((x) => x.key === e.key.toUpperCase())
      if (t) setTool(t.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // load template via route param "tpl:<id>" or remix
  useEffect(() => {
    if (!param?.startsWith('tpl:')) return
    const tpl = DESIGN_TEMPLATES.find((t) => t.id === param.slice(4))
    if (!tpl) return
    setColor(tpl.color)
    if (tpl.graphic) {
      commit([newGraphicEl(tpl.graphic)])
    } else {
      const lines = tpl.text.split('\n')
      commit(lines.map((line, i) => ({ ...newTextEl(line, tpl.textColor), font: tpl.font, y: 0.36 + i * 0.16, size: 46 })))
    }
    setSurface('front')
    setMode('design')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param])

  // keep the selected size valid when the garment kind changes (tee ↔ trousers)
  useEffect(() => {
    const opts = sizesFor(shirtType)
    if (!opts.includes(size)) setSize(opts[Math.floor(opts.length / 2)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shirtType])

  // map surface ↔ print location pricing
  const effectiveLocation = printLocation
  const config = {
    shirtType, color, size,
    printLocation: effectiveLocation,
    printSize,
    extras,
    name: PRODUCTS.find((p) => p.id === shirtType)?.name || 'Custom Crew Neck',
    category: PRODUCTS.find((p) => p.id === shirtType)?.category || 'brands',
  }
  const price = unitPrice(pricing, config)
  const tier = quantityTier(pricing, quantity)
  const tierSaving = tier ? Math.round((price * quantity * tier.percent) / 100) : 0

  // per-surface designs drive the 3D stage
  const switchSurface = (id) => {
    setSurface(id)
    setPrintLocation(id === 'left-sleeve' || id === 'right-sleeve' ? id : id)
    setView(id === 'left-sleeve' ? 'left' : id === 'right-sleeve' ? 'right' : id)
    setSelectedId(null)
  }

  const makeStageDesign = useCallback((surfaceId) => {
    const els = (elementsBySurface[surfaceId] || []).filter((e) => !e.hidden)
    if (els.length === 0) return null
    const texts = els.filter((e) => e.type === 'text')
    const imgs = els.filter((e) => e.type === 'image')
    const graphics = els.filter((e) => e.type === 'graphic')
    const firstText = texts[0]
    const firstImg = imgs[0]
    const firstGraphic = graphics[0]
    return {
      text: texts.map((t) => t.text).join('\n'),
      image: firstImg?.src || null,
      graphic: firstGraphic?.graphic || null,
      color: firstText?.color || firstGraphic?.color || '#2563eb',
      font: firstText?.font || 'display',
    }
  }, [elementsBySurface])

  const stageDesign = useMemo(() => makeStageDesign(surface), [makeStageDesign, surface])
  const frontDesign = useMemo(() => makeStageDesign('front'), [makeStageDesign])
  const backDesign = useMemo(() => makeStageDesign('back'), [makeStageDesign])
  const leftDesign = useMemo(() => makeStageDesign('left-sleeve'), [makeStageDesign])
  const rightDesign = useMemo(() => makeStageDesign('right-sleeve'), [makeStageDesign])

  const onUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { toast('Please pick an image under 4 MB.', 'error'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const el = newImageEl(reader.result)
      commit((els) => [...els, el])
      setTool('select')
      setSelectedId(el.id)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const updateEl = (id, patch) => commit(elements.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  const removeElement = (id) => { commit(elements.filter((e) => e.id !== id)); setSelectedId(null) }
  const duplicateEl = (id) => {
    const el = elements.find((e) => e.id === id)
    if (!el) return
    const copy = { ...el, id: uid(), x: Math.min(0.9, el.x + 0.06), y: Math.min(0.9, el.y + 0.06) }
    commit([...elements, copy])
    setSelectedId(copy.id)
  }
  const reorder = (id, dir) => {
    const idx = elements.findIndex((e) => e.id === id)
    if (idx < 0) return
    const to = idx + dir
    if (to < 0 || to >= elements.length) return
    const next = [...elements]
    ;[next[idx], next[to]] = [next[to], next[idx]]
    commit(next)
  }

  // 2D artboard drag
  const dragRef = useRef(null)
  const onArtPointerDown = (e, el) => {
    if (el.locked) return
    e.preventDefault()
    setSelectedId(el.id)
    const board = e.currentTarget.closest('.artboard') || e.currentTarget.parentElement
    dragRef.current = { id: el.id, board, mode: 'move' }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onArtPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const rect = d.board.getBoundingClientRect()
    const x = Math.max(0.04, Math.min(0.96, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0.04, Math.min(0.96, (e.clientY - rect.top) / rect.height))
    setElementsBySurface((prev) => ({ ...prev, [surface]: (prev[surface] || []).map((el) => (el.id === d.id ? { ...el, x, y } : el)) }))
  }
  const onArtPointerUp = () => { dragRef.current = null }
  const onScaleHandle = (e, el) => {
    e.stopPropagation()
    const board = e.currentTarget.closest('.artboard')
    dragRef.current = { id: el.id, board, mode: 'scale', startY: e.clientY, startScale: el.scale }
    const move = (ev) => {
      const dy = (dragRef.current.startY - ev.clientY) / 160
      const scale = Math.max(0.3, Math.min(3, dragRef.current.startScale + dy))
      setElementsBySurface((prev) => ({ ...prev, [surface]: (prev[surface] || []).map((x) => (x.id === el.id ? { ...x, scale } : x)) }))
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); dragRef.current = null }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // alignment tools
  const align = (id, how) => {
    const pos = { left: 0.12, center: 0.5, right: 0.88, top: 0.12, middle: 0.5, bottom: 0.88 }
    updateEl(id, how === 'centerH' ? { x: 0.5 } : how === 'centerV' ? { y: 0.5 } : { [how === 'left' || how === 'right' ? 'x' : 'y']: pos[how] })
  }

  // print quality gate
  const [dpi, setDpi] = useState(null)
  useEffect(() => {
    const img = elements.find((e) => e.type === 'image')
    if (!img?.src) { setDpi(null); return }
    let alive = true
    imageDpi(img.src, printSize).then((d) => alive && setDpi(d))
    return () => { alive = false }
  }, [elements, printSize])

  const dpiInfo = dpi == null ? null : dpi >= 300 ? { label: `${dpi} DPI — EXCELLENT`, cls: 'excellent' } : dpi >= 150 ? { label: `${dpi} DPI — GOOD`, cls: 'excellent' } : { label: `${dpi} DPI — LOW`, cls: 'low' }

  const proofChecks = [
    { ok: elements.some((e) => !e.hidden), label: 'Design contains at least one element' },
    { ok: dpiInfo == null || dpiInfo.cls === 'excellent', label: dpiInfo == null ? 'Vector/text artwork — resolution safe' : `Artwork resolution ${dpiInfo.label}` },
    { ok: elements.every((e) => e.x > 0.04 && e.x < 0.96 && e.y > 0.04 && e.y < 0.96), label: 'All artwork inside the print safe area' },
    { ok: true, label: `Print zone: ${SURFACES.find((s) => s.id === surface)?.label} · ${PRINT_SIZES.find((s) => s.id === printSize)?.hint}` },
  ]
  const proofPassed = proofChecks.every((c) => c.ok)

  const handleAddToCart = () => {
    if (!approved) { toast('Approve your design in Proof mode before adding to cart.', 'error'); setMode('proof'); return }
    const item = addToCart({ ...config, design: stageDesign, designApproved: true }, quantity)
    toast(`${item.name} added to your bag — ${fmt(item.unitPrice * quantity)}`)
    setCartOpen(true)
  }

  const handleSave = () => {
    saveDesign({ name: config.name, color, shirtType, elements, surface, printSize, thumbnail: stageDesign })
    toast('Design saved to your account.', 'info')
  }

  const handleShare = async () => {
    const link = `${window.location.origin}${window.location.pathname}#/studio`
    try { await navigator.clipboard.writeText(link); toast('Share link copied — send it to your group.', 'info') }
    catch { toast(link, 'info') }
  }

  const step = (n) => setQuantity((q) => Math.max(1, Math.min(999, q + n)))
  const product = PRODUCTS.find((p) => p.id === shirtType)

  // ---------------- render ----------------
  const Artboard = (
    <div className="design-board" onPointerMove={onArtPointerMove} onPointerUp={onArtPointerUp}>
      <div className="artboard" style={{ background: COLOR_OPTIONS.find((c) => c.id === color)?.hex }}>
        {showSafe && <div className="safe-area" />}
        {elements.map((el) => {
          if (el.hidden) return null
          const style = {
            left: `${el.x * 100}%`,
            top: `${el.y * 100}%`,
            transform: `translate(-50%, -50%) rotate(${el.rotation}rad) scale(${el.scale})`,
            opacity: el.opacity,
          }
          if (el.type === 'text') {
            const fontFam = { display: '"Bebas Neue", sans-serif', serif: '"Playfair Display", serif', sans: '"DM Sans", sans-serif', mono: '"DM Mono", monospace' }[el.font]
            return (
              <div key={el.id} className={'art-el' + (selectedId === el.id ? ' selected' : '')} style={{ ...style, color: el.color, fontFamily: fontFam, fontWeight: 700, fontSize: el.size, lineHeight: 1.05, whiteSpace: 'pre' }} onPointerDown={(e) => onArtPointerDown(e, el)}>
                {el.text}
                {selectedId === el.id && <span className="art-handle br" onPointerDown={(e) => onScaleHandle(e, el)} />}
              </div>
            )
          }
          if (el.type === 'graphic' && DESIGNS[el.graphic]) {
            return (
              <div key={el.id} className={'art-el' + (selectedId === el.id ? ' selected' : '')} style={style} onPointerDown={(e) => onArtPointerDown(e, el)}>
                <div style={{ width: el.size, height: el.size }}>{DESIGNS[el.graphic]()}</div>
                {selectedId === el.id && <span className="art-handle br" onPointerDown={(e) => onScaleHandle(e, el)} />}
              </div>
            )
          }
          return (
            <div key={el.id} className={'art-el' + (selectedId === el.id ? ' selected' : '')} style={style} onPointerDown={(e) => onArtPointerDown(e, el)}>
              <img src={el.src} alt="" style={{ width: el.size }} draggable={false} />
              {selectedId === el.id && <span className="art-handle br" onPointerDown={(e) => onScaleHandle(e, el)} />}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="studio-page">
      {/* TOP BAR */}
      <div className="studio-topbar">
        <button onClick={() => go('catalog')}><Icon name="arrow" size={13} style={{ transform: 'rotate(180deg)' }} /> Back</button>
        <span className="st-title">{product?.name} — {COLOR_OPTIONS.find((c) => c.id === color)?.label}</span>
        <div className="st-actions">
          <button onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)"><Icon name="undo" size={13} /> Undo</button>
          <button onClick={redo} disabled={future.length === 0} title="Redo">Redo</button>
          <button onClick={handleSave}><Icon name="check" size={13} /> Save</button>
          <button onClick={handleShare}><Icon name="share" size={13} /> Share</button>
          <button className="primary" onClick={handleAddToCart}><Icon name="bag" size={13} /> Add to cart — {fmt(price * quantity - tierSaving)}</button>
        </div>
      </div>

      <div className="studio-body">
        {/* LEFT TOOLS */}
        <nav className="studio-tools" aria-label="Design tools">
          {TOOLS.map((t) => (
            <button key={t.id} className={tool === t.id ? 'active' : ''} onClick={() => setTool(t.id)} title={`${t.label} (${t.key})`}>
              <span className="tool-ico">{t.ico}</span>
              <small>{t.label}</small>
            </button>
          ))}
        </nav>

        {/* CENTER */}
        <div className="studio-center">
          <div className="studio-modebar">
            {['design', '3d', 'proof'].map((m) => (
              <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
                {m === '3d' ? '3D Mode' : m === 'design' ? 'Design mode' : 'Proof mode'}
              </button>
            ))}
          </div>

          <div className="studio-canvas">
            {mode === '3d' && site.garmentImages?.[shirtType]?.front && (
              <span className="photo-chip">◉ Real garment photos — 3D from studio uploads</span>
            )}
            {mode === 'design' && Artboard}
            {mode === '3d' && (
              <ShirtStage
                garment={kind}
                color={color}
                design={stageDesign}
                frontDesign={frontDesign}
                backDesign={backDesign}
                leftDesign={leftDesign}
                rightDesign={rightDesign}
                photos={site.garmentImages?.[shirtType] || null}
                printLocation="all"
                printSize={printSize}
                offset={{ x: 0, y: 0.18 }}
                scale={1}
                rotation={0}
                view={view}
                autoRotate={autoRotate}
                interactive
              />
            )}
            {mode === 'proof' && (
              <>
                <ShirtStage
                  garment={kind}
                  color={color}
                  design={stageDesign}
                  frontDesign={frontDesign}
                  backDesign={backDesign}
                  leftDesign={leftDesign}
                  rightDesign={rightDesign}
                  photos={site.garmentImages?.[shirtType] || null}
                  printLocation="all"
                  printSize={printSize}
                  offset={{ x: 0, y: 0.18 }}
                  scale={1}
                  rotation={0}
                  view={view}
                  autoRotate={false}
                />
                <div className="proof-panel">
                  <p className="mono" style={{ fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(243,235,221,0.5)' }}>Final check — {SURFACES.find((s) => s.id === surface)?.label}</p>
                  <div className="proof-checks">
                    {proofChecks.map((c, i) => (
                      <div key={i} className={'proof-check ' + (c.ok ? 'ok' : 'warn')}>
                        <span className="pc-ico">{c.ok ? '✓' : '!'}</span> {c.label}
                      </div>
                    ))}
                  </div>
                  <label className="proof-approve">
                    <input type="checkbox" checked={approved} disabled={!proofPassed} onChange={(e) => { setApproved(e.target.checked); if (e.target.checked) toast('Design locked — this exact artwork will be produced.', 'info') }} />
                    <span>I confirm that this 3D preview accurately represents the design I want produced.</span>
                  </label>
                  <div className="prop-btn-row">
                    <button onClick={() => setMode('design')}>Keep editing</button>
                    <button className="active" onClick={handleAddToCart} disabled={!approved || !proofPassed}>{approved ? 'Approved — add to cart' : 'Approve to continue'}</button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SURFACE BAR */}
          <div className="studio-surfacebar">
            {SURFACES.map((s) => (
              <button key={s.id} className={surface === s.id ? 'active' : ''} onClick={() => switchSurface(s.id)}>{s.label}</button>
            ))}
            {mode === '3d' && (
              <>
                {['front', 'back', 'left', 'right'].map((angle) => (
                  <button key={angle} className={view === angle ? 'active' : ''} onClick={() => setView(angle)}>{angle}</button>
                ))}
                <button onClick={() => setAutoRotate((a) => !a)} style={{ marginLeft: 14 }} className={autoRotate ? 'active' : ''}><Icon name="rotate" size={12} /> Spin</button>
                <button onClick={() => setShowSafe((s) => !s)} className={showSafe ? 'active' : ''}>Safe area</button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PROPERTIES */}
        <aside className="studio-props">
          <div className="props-scroll">
            {/* GARMENT section always visible at top */}
            <h3>Garment</h3>
            <div className="garment-swatches">
              {COLOR_OPTIONS.slice(0, 6).map((c) => (
                <button key={c.id} className={color === c.id ? 'active' : ''} onClick={() => setColor(c.id)}>
                  <span className="dot" style={{ background: c.hex }} /> {c.label}
                </button>
              ))}
            </div>

            {tool === 'text' && (
              <>
                <h3>Text</h3>
                {!selected && (
                  <button className="prop-btn-row" style={{ width: '100%' }}>
                    <button className="active" style={{ width: '100%' }} onClick={() => { const el = newTextEl(); commit([...elements, el]); setSelectedId(el.id) }}>+ Add text layer</button>
                  </button>
                )}
                {selected?.type === 'text' && (
                  <>
                    <div className="prop-field">
                      <label>Content</label>
                      <textarea rows={2} value={selected.text} onChange={(e) => updateEl(selected.id, { text: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="prop-field">
                      <label>Font</label>
                      <select value={selected.font} onChange={(e) => updateEl(selected.id, { font: e.target.value })}>
                        {DESIGN_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                      </select>
                    </div>
                    <div className="prop-field">
                      <label>Size <span>{selected.size}px</span></label>
                      <input type="range" min="18" max="96" value={selected.size} onChange={(e) => updateEl(selected.id, { size: Number(e.target.value) })} />
                    </div>
                    <div className="prop-field">
                      <label>Colour</label>
                      <div className="prop-swatches">
                        {DESIGN_PALETTE.map((c) => <button key={c} className={selected.color === c ? 'active' : ''} style={{ background: c }} onClick={() => updateEl(selected.id, { color: c })} aria-label={`Colour ${c}`} />)}
                      </div>
                    </div>
                    <div className="prop-field">
                      <label>Opacity <span>{Math.round(selected.opacity * 100)}%</span></label>
                      <input type="range" min="0.1" max="1" step="0.05" value={selected.opacity} onChange={(e) => updateEl(selected.id, { opacity: Number(e.target.value) })} />
                    </div>
                    <div className="prop-field">
                      <label>Rotation <span>{Math.round((selected.rotation * 180) / Math.PI)}°</span></label>
                      <input type="range" min="-1.57" max="1.57" step="0.05" value={selected.rotation} onChange={(e) => updateEl(selected.id, { rotation: Number(e.target.value) })} />
                    </div>
                  </>
                )}
              </>
            )}

            {tool === 'image' && (
              <>
                <h3>Image</h3>
                <div className="upload-zone" style={{ background: '#0d0d0d', border: '1px dashed rgba(243,235,221,0.2)', color: 'rgba(243,235,221,0.6)' }} onClick={() => fileRef.current?.click()} role="button" tabIndex={0}>
                  <Icon name="upload" size={19} />
                  <p style={{ marginTop: 6, fontSize: 12 }}>Upload logo — PNG, JPG up to 4 MB</p>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
                </div>
                {dpiInfo && <p style={{ marginTop: 10 }}><span className={'dpi-badge ' + dpiInfo.cls}>{dpiInfo.cls === 'excellent' ? '✓' : '⚠'} {dpiInfo.label}</span></p>}
                {selected?.type === 'image' && (
                  <>
                    <div className="prop-field">
                      <label>Width <span>{Math.round(selected.scale * 100)}%</span></label>
                      <input type="range" min="0.3" max="2.4" step="0.05" value={selected.scale} onChange={(e) => updateEl(selected.id, { scale: Number(e.target.value) })} />
                    </div>
                    <div className="prop-field">
                      <label>Rotation <span>{Math.round((selected.rotation * 180) / Math.PI)}°</span></label>
                      <input type="range" min="-1.57" max="1.57" step="0.05" value={selected.rotation} onChange={(e) => updateEl(selected.id, { rotation: Number(e.target.value) })} />
                    </div>
                    <div className="prop-field">
                      <label>Opacity <span>{Math.round(selected.opacity * 100)}%</span></label>
                      <input type="range" min="0.1" max="1" step="0.05" value={selected.opacity} onChange={(e) => updateEl(selected.id, { opacity: Number(e.target.value) })} />
                    </div>
                  </>
                )}
              </>
            )}

            {tool === 'graphics' && (
              <>
                <h3>Graphics library</h3>
                <p style={{ fontSize: 11.5, color: 'rgba(243,235,221,0.45)', marginBottom: 10 }}>Original screen-print artwork. Click to place on the {SURFACES.find((s) => s.id === surface)?.label.toLowerCase()}.</p>
                <div className="graphic-grid">
                  {DESIGN_LIST.map((g) => (
                    <button key={g} className="graphic-cell" title={DESIGN_META[g]?.title || g} onClick={() => {
                      const el = newGraphicEl(g)
                      commit([...elements, el])
                      setSelectedId(el.id)
                      setMode('design')
                      toast(`${DESIGN_META[g]?.title || g} placed — drag to position.`, 'info')
                    }}>
                      {DESIGNS[g]()}
                    </button>
                  ))}
                </div>
                {selected?.type === 'graphic' && (
                  <>
                    <h3>Graphic</h3>
                    <div className="prop-field">
                      <label>Size <span>{selected.size}px</span></label>
                      <input type="range" min="40" max="300" value={selected.size} onChange={(e) => updateEl(selected.id, { size: Number(e.target.value) })} />
                    </div>
                    <div className="prop-field">
                      <label>Opacity <span>{Math.round(selected.opacity * 100)}%</span></label>
                      <input type="range" min="0.1" max="1" step="0.05" value={selected.opacity} onChange={(e) => updateEl(selected.id, { opacity: Number(e.target.value) })} />
                    </div>
                    <div className="prop-field">
                      <label>Rotation <span>{Math.round((selected.rotation * 180) / Math.PI)}°</span></label>
                      <input type="range" min="-1.57" max="1.57" step="0.05" value={selected.rotation} onChange={(e) => updateEl(selected.id, { rotation: Number(e.target.value) })} />
                    </div>
                  </>
                )}
              </>
            )}

            {tool === 'templates' && (
              <>
                <h3>Templates</h3>
                {DESIGN_TEMPLATES.map((t) => (
                  <button key={t.id} className="layer-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => {
                    if (t.graphic) {
                      const el = newGraphicEl(t.graphic)
                      commit([...elements, el])
                      setSelectedId(el.id)
                    } else {
                      commit([...elements, ...t.text.split('\n').map((line, i) => ({ ...newTextEl(line, t.textColor), font: t.font, y: 0.3 + i * 0.16 }))])
                    }
                    if (t.color) setColor(t.color)
                    toast(`“${t.title}” added — remix away.`, 'info')
                  }}>
                    <span className="layer-ico">{t.graphic && DESIGNS[t.graphic] ? <span style={{ display: 'inline-flex', width: 20, height: 20 }}>{DESIGNS[t.graphic]()}</span> : '▦'}</span>
                    <span className="layer-name">{t.title}</span>
                    <Icon name="plus" size={12} />
                  </button>
                ))}
              </>
            )}

            {tool === 'layers' && (
              <>
                <h3>Layers — {SURFACES.find((s) => s.id === surface)?.label}</h3>
                <div className="layer-row" style={{ opacity: 0.6 }}>
                  <span className="layer-ico">👕</span><span className="layer-name">Base garment</span><Icon name="lock" size={12} />
                </div>
                {[...elements].reverse().map((el) => (
                  <div key={el.id} className={'layer-row' + (selectedId === el.id ? ' active' : '')} onClick={() => setSelectedId(el.id)}>
                    <span className="layer-ico">{el.type === 'text' ? 'T' : el.type === 'graphic' && DESIGNS[el.graphic] ? <span style={{ display: 'inline-flex', width: 18, height: 18 }}>{DESIGNS[el.graphic]()}</span> : '🖼'}</span>
                    <span className="layer-name">{el.type === 'text' ? el.text.replace(/\n/g, ' ') : el.type === 'graphic' ? (DESIGN_META[el.graphic]?.title || 'Graphic') : 'Artwork'}</span>
                    <button onClick={(e) => { e.stopPropagation(); updateEl(el.id, { hidden: !el.hidden }) }} title="Hide"><Icon name="eye2" size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); updateEl(el.id, { locked: !el.locked }) }} title="Lock"><Icon name="lock" size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); duplicateEl(el.id) }} title="Duplicate"><Icon name="copy" size={12} /></button>
                    <button className="danger" onClick={(e) => { e.stopPropagation(); removeElement(el.id) }} title="Delete"><Icon name="trash" size={12} /></button>
                  </div>
                ))}
                {selected && (
                  <div className="prop-btn-row" style={{ marginTop: 10 }}>
                    <button onClick={() => reorder(selected.id, 1)}>Move up</button>
                    <button onClick={() => reorder(selected.id, -1)}>Move down</button>
                  </div>
                )}
              </>
            )}

            {tool === 'select' && (
              <>
                <h3>Selection</h3>
                {selected ? (
                  <>
                    <div className="prop-btn-row">
                      <button onClick={() => align(selected.id, 'centerH')}>Center H</button>
                      <button onClick={() => align(selected.id, 'centerV')}>Center V</button>
                      <button onClick={() => align(selected.id, 'left')}>Left</button>
                      <button onClick={() => align(selected.id, 'right')}>Right</button>
                      <button onClick={() => align(selected.id, 'top')}>Top</button>
                      <button onClick={() => align(selected.id, 'bottom')}>Bottom</button>
                    </div>
                    <div className="prop-field" style={{ marginTop: 12 }}>
                      <label>Position X <span>{Math.round(selected.x * 100)}%</span></label>
                      <input type="range" min="0.04" max="0.96" step="0.01" value={selected.x} onChange={(e) => updateEl(selected.id, { x: Number(e.target.value) })} />
                    </div>
                    <div className="prop-field">
                      <label>Position Y <span>{Math.round(selected.y * 100)}%</span></label>
                      <input type="range" min="0.04" max="0.96" step="0.01" value={selected.y} onChange={(e) => updateEl(selected.id, { y: Number(e.target.value) })} />
                    </div>
                    <div className="prop-btn-row">
                      <button onClick={() => duplicateEl(selected.id)}>Duplicate</button>
                      <button onClick={() => removeElement(selected.id)}>Delete</button>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 12.5, color: 'rgba(243,235,221,0.45)' }}>Click an element on the artboard (Design mode) or add one from Text / Image.</p>
                )}
                <h3>Print settings</h3>
                <div className="prop-field">
                  <label>Print size</label>
                  <select value={printSize} onChange={(e) => setPrintSize(e.target.value)}>
                    {PRINT_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label} — {s.hint}</option>)}
                  </select>
                </div>
                <div className="prop-field">
                  <label>{kind === 'trousers' ? 'Waist' : 'Size'}</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)}>
                    {sizeOptions.map((s) => <option key={s} value={s}>{s}{pricing.sizeSurcharge[s] ? ` (+${fmt(pricing.sizeSurcharge[s])})` : ''}</option>)}
                  </select>
                </div>
                <div className="prop-field">
                  <label>Garment</label>
                  <select value={shirtType} onChange={(e) => setShirtType(e.target.value)}>
                    {SHIRT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label} — {fmt(pricing.basePrices[t.id])}</option>)}
                  </select>
                </div>
              </>
            )}

            {tool === 'garment' && (
              <>
                <h3>Customisation</h3>
                {Object.entries(pricing.extras).map(([key, fee]) => (
                  <div className="toggle-row" key={key} style={{ borderBottom: '1px dashed rgba(243,235,221,0.12)' }}>
                    <div className="toggle-info">
                      <strong style={{ color: 'var(--cream)', fontSize: 13 }}>{key === 'nameEmbroidery' ? 'Stitched name' : key === 'customTag' ? 'Custom neck tag' : 'Gift wrap'}</strong>
                      <small style={{ color: 'rgba(243,235,221,0.45)' }}>+{fmt(fee)} per shirt</small>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={Boolean(extras[key])} onChange={() => setExtras((x) => ({ ...x, [key]: !x[key] }))} />
                      <i />
                    </label>
                  </div>
                ))}
                <h3>Quantity</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div className="qty-stepper" style={{ borderColor: 'rgba(243,235,221,0.2)' }}>
                    <button onClick={() => step(-1)} aria-label="Decrease">−</button>
                    <span style={{ color: 'var(--cream)' }}>{quantity}</span>
                    <button onClick={() => step(1)} aria-label="Increase">+</button>
                  </div>
                  {tier && <span className="chip blue">{tier.percent}% bulk discount</span>}
                </div>
                {pricing.quantityDiscounts.slice().sort((a, b) => a.minimum - b.minimum).map((t) => (
                  <p key={t.minimum} style={{ fontSize: 11.5, color: quantity >= t.minimum ? 'var(--success)' : 'rgba(243,235,221,0.4)', marginTop: 6 }}>
                    {quantity >= t.minimum ? '✓' : '○'} {t.minimum}+ shirts — {t.percent}% off
                  </p>
                ))}
              </>
            )}
          </div>

          {/* live price footer */}
          <div style={{ borderTop: '1px solid rgba(243,235,221,0.12)', padding: 16, background: '#0d0d0d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(243,235,221,0.55)', marginBottom: 4 }}>
              <span>{config.name}</span><span>{fmt(price)}</span>
            </div>
            {tierSaving > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--success)', marginBottom: 4 }}>
                <span>Bulk {tier.percent}% × {quantity}</span><span>−{fmt(tierSaving)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, color: 'var(--cream)', margin: '8px 0 12px' }}>
              <span>Total</span><span>{fmt(price * quantity - tierSaving)}</span>
            </div>
            <button className="button button-blue button-block" onClick={handleAddToCart}>
              {approved ? 'Add to cart' : 'Approve design first'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
