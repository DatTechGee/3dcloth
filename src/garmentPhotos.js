// ---------------------------------------------------------------------------
// Garment photo engine.
// The admin photographs a real garment — front, back and both sides — and
// uploads the shots. This module masks those photos to the garment silhouette
// (so backgrounds drop away) and returns three.js textures the 3D stage wraps
// onto the rotatable garment form. The creator then designs on top.
// ---------------------------------------------------------------------------

import * as THREE from 'three'

// Silhouette outlines in the same world coordinates as the 3D body shapes.
const TEE_PATH = [
  ['M', -0.34, 1.0],
  ['Q', -0.62, 0.99, -0.86, 0.9],
  ['Q', -1.22, 0.82, -1.46, 0.52],
  ['Q', -1.52, 0.4, -1.42, 0.3],
  ['L', -1.1, -0.02],
  ['Q', -0.95, 0.1, -0.78, 0.32],
  ['Q', -0.74, -0.4, -0.7, -1.0],
  ['Q', 0, -1.12, 0.7, -1.0],
  ['Q', 0.74, -0.4, 0.78, 0.32],
  ['Q', 0.95, 0.1, 1.1, -0.02],
  ['L', 1.42, 0.3],
  ['Q', 1.52, 0.4, 1.46, 0.52],
  ['Q', 1.22, 0.82, 0.86, 0.9],
  ['Q', 0.62, 0.99, 0.34, 1.0],
  ['Q', 0.3, 0.62, 0, 0.58],
  ['Q', -0.3, 0.62, -0.34, 1.0],
  ['Z'],
]

const TROUSER_PATH = [
  ['M', -0.62, 1.05],
  ['L', 0.62, 1.05],
  ['L', 0.6, 0.3],
  ['Q', 0.6, -0.5, 0.5, -1.05],
  ['L', 0.46, -1.15],
  ['L', 0.08, -1.15],
  ['L', 0.05, -0.15],
  ['Q', 0, -0.02, -0.05, -0.15],
  ['L', -0.08, -1.15],
  ['L', -0.46, -1.15],
  ['L', -0.5, -1.05],
  ['Q', -0.6, -0.5, -0.6, 0.3],
  ['Z'],
]

const BODY_FRAMES = {
  tee: { xMin: -1.55, xMax: 1.55, yMin: -1.15, yMax: 1.02 },
  trousers: { xMin: -0.64, xMax: 0.64, yMin: -1.18, yMax: 1.08 },
}

// Side profile frames — a narrow capsule matching the garment depth.
const SIDE_FRAMES = {
  tee: { w: 0.44, h: 1.9, cy: 0.0 },
  trousers: { w: 0.4, h: 2.0, cy: -0.05 },
}

function frameOf(kind, mode) {
  if (mode === 'side') {
    const f = SIDE_FRAMES[kind] || SIDE_FRAMES.tee
    return { xMin: -f.w / 2, xMax: f.w / 2, yMin: f.cy - f.h / 2, yMax: f.cy + f.h / 2, w: f.w, h: f.h }
  }
  const f = BODY_FRAMES[kind] || BODY_FRAMES.tee
  return { ...f, w: f.xMax - f.xMin, h: f.yMax - f.yMin }
}

function buildPath2D(kind, mode, frame, s) {
  const p = new Path2D()
  const X = (x) => (x - frame.xMin) * s
  const Y = (y) => (frame.yMax - y) * s

  if (mode === 'side') {
    const r = Math.min(frame.w, frame.h) * s * 0.22
    const x0 = X(frame.xMin)
    const y0 = Y(frame.yMax)
    const x1 = X(frame.xMax)
    const y1 = Y(frame.yMin)
    p.moveTo(x0 + r, y0)
    p.arcTo(x1, y0, x1, y1, r)
    p.arcTo(x1, y1, x0, y1, r)
    p.arcTo(x0, y1, x0, y0, r)
    p.arcTo(x0, y0, x1, y0, r)
    p.closePath()
    return p
  }

  const cmds = kind === 'trousers' ? TROUSER_PATH : TEE_PATH
  for (const c of cmds) {
    if (c[0] === 'M') p.moveTo(X(c[1]), Y(c[2]))
    else if (c[0] === 'L') p.lineTo(X(c[1]), Y(c[2]))
    else if (c[0] === 'Q') p.quadraticCurveTo(X(c[1]), Y(c[2]), X(c[3]), Y(c[4]))
    else p.closePath()
  }
  return p
}

/**
 * Load an uploaded photo, cover-fit it to the garment frame and clip it to
 * the silhouette (side photos clip to a soft capsule). Returns a THREE texture.
 * mode: 'front' | 'back' | 'side'
 */
export function buildMaskedTexture(url, kind = 'tee', mode = 'front') {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const frame = frameOf(kind, mode)
        const maxDim = 640
        const scale = maxDim / Math.max(frame.w, frame.h)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(frame.w * scale)
        canvas.height = Math.round(frame.h * scale)
        const ctx = canvas.getContext('2d')

        // cover-fit the photo into the frame
        const s = Math.max(canvas.width / img.width, canvas.height / img.height)
        const dw = img.width * s
        const dh = img.height * s
        ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)

        // clip to garment silhouette — everything outside drops away
        ctx.globalCompositeOperation = 'destination-in'
        ctx.fillStyle = '#000'
        ctx.fill(buildPath2D(kind, mode, frame, scale))
        ctx.globalCompositeOperation = 'source-over'

        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 8
        resolve(tex)
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Could not read garment photo'))
    img.src = url
  })
}

/**
 * Downscale an uploaded file to a compact JPEG data URL so several garment
 * photo sets survive in localStorage without blowing the quota.
 */
export function downscaleImage(file, maxDim = 768) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const s = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * s))
        const h = Math.max(1, Math.round(img.height * s))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => reject(new Error('Could not read that image'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.readAsDataURL(file)
  })
}
