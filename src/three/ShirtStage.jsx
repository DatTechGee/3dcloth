import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { COLOR_OPTIONS } from '../pricing.js'
import { DESIGNS, designDataUrl } from '../designs.js'
import { buildMaskedTexture } from '../garmentPhotos.js'

// Frames must stay in sync with garmentPhotos.js — the masked photo textures
// are rendered on planes of exactly these sizes (world units). `z` is the
// depth of the front/back photo planes, kept just behind the print planes.
const PHOTO_FRAMES = {
  tee: { w: 3.1, h: 2.17, cy: -0.065, z: 0.19, side: { w: 0.44, h: 1.9, cy: 0 } },
  trousers: { w: 1.28, h: 2.26, cy: -0.05, z: 0.18, side: { w: 0.4, h: 2.0, cy: -0.05 } },
}

// ---------------------------------------------------------------------------
// Procedural shirt — a soft, extruded silhouette with bevelled edges, a
// ribbed collar and physically-based sheen fabric material. Much closer to a
// plush garment than flat primitives.
// ---------------------------------------------------------------------------

function useShirtShape() {
  return useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.34, 1.0) // left neck
    s.quadraticCurveTo(-0.62, 0.99, -0.86, 0.9) // left shoulder
    s.quadraticCurveTo(-1.22, 0.82, -1.46, 0.52) // sleeve top
    s.quadraticCurveTo(-1.52, 0.4, -1.42, 0.3) // sleeve edge
    s.lineTo(-1.1, -0.02) // sleeve cuff
    s.quadraticCurveTo(-0.95, 0.1, -0.78, 0.32) // armpit
    s.quadraticCurveTo(-0.74, -0.4, -0.7, -1.0) // body left
    s.quadraticCurveTo(0, -1.12, 0.7, -1.0) // hem
    s.quadraticCurveTo(0.74, -0.4, 0.78, 0.32) // body right
    s.quadraticCurveTo(0.95, 0.1, 1.1, -0.02)
    s.lineTo(1.42, 0.3)
    s.quadraticCurveTo(1.52, 0.4, 1.46, 0.52)
    s.quadraticCurveTo(1.22, 0.82, 0.86, 0.9)
    s.quadraticCurveTo(0.62, 0.99, 0.34, 1.0)
    s.quadraticCurveTo(0.3, 0.62, 0, 0.58) // neck opening
    s.quadraticCurveTo(-0.3, 0.62, -0.34, 1.0)
    return s
  }, [])
}

/** Trouser silhouette: waistband at top, two tapered legs with a crotch notch. */
function useTrouserShape() {
  return useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.62, 1.05) // waist left
    s.lineTo(0.62, 1.05) // waist right
    s.lineTo(0.6, 0.3) // hip right
    s.quadraticCurveTo(0.6, -0.5, 0.5, -1.05) // outer right leg
    s.lineTo(0.46, -1.15) // hem right
    s.lineTo(0.08, -1.15)
    s.lineTo(0.05, -0.15) // inner right leg up to crotch
    s.quadraticCurveTo(0, -0.02, -0.05, -0.15) // crotch notch
    s.lineTo(-0.08, -1.15)
    s.lineTo(-0.46, -1.15) // hem left
    s.lineTo(-0.5, -1.05)
    s.quadraticCurveTo(-0.6, -0.5, -0.6, 0.3) // outer left leg
    s.closePath()
    return s
  }, [])
}

/** Small tiling noise canvas → fabric bump/normal texture. */
function useFabricTexture() {
  return useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const img = ctx.createImageData(size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.random() * 30
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    // subtle weave lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    for (let y = 0; y < size; y += 3) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(6, 6)
    return tex
  }, [])
}

function ShirtBody({ color, fabric }) {
  const shape = useShirtShape()
  const geometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.07,
        bevelSize: 0.06,
        bevelSegments: 5,
        curveSegments: 26,
      }).center(),
    [shape],
  )
  useEffect(() => () => geometry.dispose(), [geometry])

  const hex = COLOR_OPTIONS.find((c) => c.id === color)?.hex || '#1d1c1a'
  const sheenHex = new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.45)

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={hex}
          roughness={0.92}
          metalness={0}
          sheen={1}
          sheenRoughness={0.55}
          sheenColor={sheenHex}
          bumpMap={fabric}
          bumpScale={0.018}
          clearcoat={0.05}
        />
      </mesh>
      {/* ribbed collars on both sides keep the garment readable while rotating */}
      <mesh position={[0, 0.78, 0.19]} rotation={[Math.PI / 2 - 0.22, 0, 0]} castShadow>
        <torusGeometry args={[0.33, 0.055, 14, 40, Math.PI * 1.25]} />
        <meshPhysicalMaterial color={hex} roughness={0.85} sheen={0.8} sheenColor={sheenHex} />
      </mesh>
      <mesh position={[0, 0.8, -0.19]} rotation={[Math.PI / 2 + 0.1, 0, Math.PI]} castShadow>
        <torusGeometry args={[0.31, 0.045, 14, 40, Math.PI * 1.55]} />
        <meshPhysicalMaterial color={hex} roughness={0.85} sheen={0.8} sheenColor={sheenHex} />
      </mesh>
      {/* hem + cuff ribbing */}
      <mesh position={[0, -0.98, 0]} scale={[1, 1, 1]} castShadow>
        <boxGeometry args={[1.36, 0.07, 0.4]} />
        <meshPhysicalMaterial color={new THREE.Color(hex).multiplyScalar(0.9)} roughness={0.9} sheen={0.6} sheenColor={sheenHex} />
      </mesh>
    </group>
  )
}

function TrouserBody({ color, fabric }) {
  const shape = useTrouserShape()
  const geometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.28,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.05,
        bevelSegments: 4,
        curveSegments: 20,
      }).center(),
    [shape],
  )
  useEffect(() => () => geometry.dispose(), [geometry])

  const hex = COLOR_OPTIONS.find((c) => c.id === color)?.hex || '#1d1c1a'
  const sheenHex = new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.4)
  const seam = new THREE.Color(hex).multiplyScalar(0.74)

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={hex}
          roughness={0.95}
          metalness={0}
          sheen={0.7}
          sheenRoughness={0.62}
          sheenColor={sheenHex}
          bumpMap={fabric}
          bumpScale={0.02}
        />
      </mesh>
      {/* waistband */}
      <mesh position={[0, 0.94, 0]} castShadow>
        <boxGeometry args={[1.32, 0.17, 0.38]} />
        <meshPhysicalMaterial color={seam} roughness={0.9} sheen={0.5} sheenColor={sheenHex} />
      </mesh>
      {/* fly seam (front centre) */}
      <mesh position={[0.03, 0.34, 0.2]}>
        <boxGeometry args={[0.04, 0.62, 0.02]} />
        <meshPhysicalMaterial color={seam} roughness={0.92} />
      </mesh>
      {/* back pocket hints */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={x} position={[x, 0.5, -0.19]} rotation={[0, 0, i === 0 ? 0.05 : -0.05]}>
          <boxGeometry args={[0.34, 0.26, 0.02]} />
          <meshPhysicalMaterial color={seam} roughness={0.94} />
        </mesh>
      ))}
      {/* belt loops */}
      {[-0.5, -0.18, 0.18, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.94, 0.2]}>
          <boxGeometry args={[0.05, 0.22, 0.02]} />
          <meshPhysicalMaterial color={seam} roughness={0.88} />
        </mesh>
      ))}
      {/* hem cuffs */}
      {[-0.27, 0.27].map((x) => (
        <mesh key={x} position={[x, -1.0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.07, 0.34]} />
          <meshPhysicalMaterial color={seam} roughness={0.9} sheen={0.5} sheenColor={sheenHex} />
        </mesh>
      ))}
    </group>
  )
}

/** Canvas texture rendering the design (uploaded image, styled text, or graphic). */
function useDesignTexture(design) {
  return useMemo(() => {
    if (!design || (!design.image && !design.text && !design.graphic)) return null
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    if (design.graphic && DESIGNS[design.graphic]) {
      // rasterise the SVG graphic onto the print canvas
      const img = new Image()
      const url = designDataUrl(design.graphic, 512)
      const draw = () => {
        ctx.clearRect(0, 0, size, size)
        ctx.drawImage(img, 0, 0, size, size)
        tex.needsUpdate = true
      }
      img.onload = draw
      img.src = url
    } else if (design.image) {
      const img = new Image()
      img.src = design.image
      // draw synchronously once decoded on load
      const draw = () => {
        const scale = Math.min((size * 0.86) / img.width, (size * 0.86) / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.clearRect(0, 0, size, size)
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        tex.needsUpdate = true
      }
      if (img.complete) draw()
      else img.onload = draw
    } else if (design.text) {
      const color = !design.color || design.color === 'auto' ? '#f26332' : design.color
      ctx.clearRect(0, 0, size, size)
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const lines = design.text.split('\n').slice(0, 3)
      const family = design.font === 'mono' ? '"DM Mono", monospace' : design.font === 'serif' ? '"Playfair Display", serif' : '"DM Sans", sans-serif'
      ctx.font = `700 ${lines.length > 1 ? 84 : 108}px ${family}`
      const lh = lines.length > 1 ? 100 : 0
      lines.forEach((line, i) => ctx.fillText(line, size / 2, size / 2 + (i - (lines.length - 1) / 2) * lh))
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.anisotropy = 8
    return tex
  }, [design?.image, design?.text, design?.graphic, design?.color, design?.font])
}

const PRINT_SIZES_3D = { small: 0.5, medium: 0.82, large: 1.12 }

/**
 * Loads the admin-uploaded garment photographs (front/back/left/right) and
 * masks them to the garment silhouette. Returns null until photos exist —
 * the stage then falls back to the procedural body.
 */
function usePhotoTextures(kind, photos) {
  const [tex, setTex] = useState(null)
  const alive = useRef(true)
  const sig = photos ? `${kind}|${photos.front || ''}|${photos.back || ''}|${photos.left || ''}|${photos.right || ''}` : ''

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  useEffect(() => {
    if (!photos || (!photos.front && !photos.back && !photos.left && !photos.right)) {
      setTex(null)
      return undefined
    }
    let cancelled = false
    const mode = { front: 'front', back: 'back', left: 'side', right: 'side' }
    Promise.all(
      Object.entries(mode).map(([slot, m]) =>
        photos[slot]
          ? buildMaskedTexture(photos[slot], kind, m).catch(() => null)
          : Promise.resolve(null),
      ),
    ).then((list) => {
      if (cancelled || !alive.current) {
        list.forEach((t) => t?.dispose())
        return
      }
      setTex({ front: list[0], back: list[1], left: list[2], right: list[3] })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, sig])

  // dispose on unmount
  useEffect(() => () => tex && Object.values(tex).forEach((t) => t?.dispose()), [tex])
  return tex
}

/**
 * The 3D form built from the admin's uploaded photographs: front and back
 * silhouette planes + left/right profile planes, cut out by the garment
 * outline. Drag to orbit — the creator is looking at the real garment.
 */
function PhotoPlanes({ kind, tex, color }) {
  const frame = PHOTO_FRAMES[kind] || PHOTO_FRAMES.tee
  const hex = COLOR_OPTIONS.find((c) => c.id === color)?.hex || '#1d1c1a'
  const mat = { color: hex, roughness: 0.94, metalness: 0 }

  const Face = ({ map, position, rotation }) => (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <planeGeometry args={[frame.w, frame.h]} />
      {map
        ? <meshStandardMaterial map={map} transparent alphaTest={0.5} side={THREE.DoubleSide} roughness={0.88} />
        : <meshStandardMaterial {...mat} side={THREE.DoubleSide} />}
    </mesh>
  )

  const Profile = ({ map, x }) => (
    <mesh position={[x, frame.side.cy, 0]} rotation={[0, x < 0 ? -Math.PI / 2 : Math.PI / 2, 0]} castShadow>
      <planeGeometry args={[frame.side.w, frame.side.h]} />
      {map
        ? <meshStandardMaterial map={map} transparent alphaTest={0.5} side={THREE.DoubleSide} roughness={0.88} />
        : <meshStandardMaterial {...mat} side={THREE.DoubleSide} />}
    </mesh>
  )

  return (
    <group>
      <Face map={tex.front} position={[0, frame.cy, frame.z]} />
      <Face map={tex.back} position={[0, frame.cy, -frame.z]} rotation={[0, Math.PI, 0]} />
      <Profile map={tex.left} x={-0.004} />
      <Profile map={tex.right} x={0.004} />
    </group>
  )
}

function PrintPlane({ texture, offset, scale, rotation, side, printSize, onDragState }) {
  const size = PRINT_SIZES_3D[printSize] || 0.82
  const dragging = useRef(false)
  const prev = useRef({ x: 0, y: 0 })

  // safety: always release drag even if pointer leaves the mesh
  useEffect(() => {
    const stop = () => {
      if (dragging.current) {
        dragging.current = false
        onDragState?.(false)
      }
    }
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [onDragState])

  if (!texture) return null
  const z = side === 'back' ? -0.21 : 0.21

  return (
    <mesh
      position={[offset.x, offset.y, z]}
      rotation={[0, side === 'back' ? Math.PI : 0, rotation]}
      scale={scale}
      onPointerDown={(e) => {
        e.stopPropagation()
        dragging.current = true
        prev.current = { x: e.point.x, y: e.point.y }
        onDragState?.(true)
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return
        e.stopPropagation()
        const dx = e.point.x - prev.current.x
        const dy = e.point.y - prev.current.y
        prev.current = { x: e.point.x, y: e.point.y }
        onDragState?.(true, { dx, dy })
      }}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={texture} transparent depthWrite={false} roughness={0.85} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

function SleevePrint({ texture, side, scale }) {
  if (!texture) return null
  const isLeft = side === 'left' || side === 'left-sleeve'
  const x = isLeft ? -1.16 : 1.16
  return (
    <mesh position={[x, 0.36, 0.02]} rotation={[0, isLeft ? -0.9 : 0.9, isLeft ? 0.5 : -0.5]} scale={scale * 0.42}>
      <planeGeometry args={[0.5, 0.5]} />
      <meshStandardMaterial map={texture} transparent depthWrite={false} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
  )
}

const VIEWS = {
  front: [0, 0.05, 3.6],
  back: [0, 0.05, -3.6],
  left: [-3.6, 0.05, 0.2],
  right: [3.6, 0.05, 0.2],
}

function CameraRig({ view, dragging }) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls)
  const target = useMemo(() => new THREE.Vector3(...(VIEWS[view] || VIEWS.front)), [view])
  useFrame(() => {
    if (dragging) return
    camera.position.lerp(target, 0.06)
    if (controls) {
      controls.target.lerp(ORIGIN, 0.1)
      controls.update()
    }
  })
  return null
}

const ORIGIN = new THREE.Vector3(0, 0, 0)

function DownloadShot() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    window.__dtgDownloadShot = () => {
      gl.render(scene, camera)
      const url = gl.domElement.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = 'creative-mode-design.png'
      a.click()
    }
    return () => { delete window.__dtgDownloadShot }
  }, [gl, scene, camera])
  return null
}

/** Trouser print zone — positioned on hip (front) / seat (back) / leg side. */
function TrouserPrint({ texture, offset, scale, rotation, side, printSize, onDragState }) {
  const size = (PRINT_SIZES_3D[printSize] || 0.82) * 0.62
  const dragging = useRef(false)
  const prev = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const stop = () => {
      if (dragging.current) {
        dragging.current = false
        onDragState?.(false)
      }
    }
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [onDragState])

  if (!texture) return null

  // zone anchors per surface (relative to centred trouser body)
  const zones = {
    front: { pos: [-0.16 + offset.x, 0.34 + offset.y, 0.2], rot: [0, 0, rotation] },
    back: { pos: [0.16 + offset.x, 0.4 + offset.y, -0.2], rot: [0, Math.PI, rotation] },
    'left-sleeve': { pos: [-0.3 + offset.x, -0.3 + offset.y, 0.12], rot: [0, -0.5, rotation] },
    'right-sleeve': { pos: [0.3 + offset.x, -0.3 + offset.y, 0.12], rot: [0, 0.5, rotation] },
  }
  const zone = zones[side] || zones.front

  return (
    <mesh
      position={zone.pos}
      rotation={zone.rot}
      scale={scale}
      onPointerDown={(e) => {
        e.stopPropagation()
        dragging.current = true
        prev.current = { x: e.point.x, y: e.point.y }
        onDragState?.(true)
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return
        e.stopPropagation()
        const dx = e.point.x - prev.current.x
        const dy = e.point.y - prev.current.y
        prev.current = { x: e.point.x, y: e.point.y }
        onDragState?.(true, { dx, dy })
      }}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={texture} transparent depthWrite={false} roughness={0.9} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

/**
 * Interactive 3D garment stage.
 * Props: garment 'tee'|'trousers', color, design {image,text,graphic,color,font},
 *        printLocation, printSize, offset, scale, rotation, view, autoRotate,
 *        onDragMove(dx,dy) — parent adjusts offset while dragging the print.
 */
export default function ShirtStage({
  garment = 'tee',
  color = 'black',
  design = null,
  frontDesign = null,
  backDesign = null,
  leftDesign = null,
  rightDesign = null,
  photos = null,
  printLocation = 'front',
  printSize = 'medium',
  offset = { x: 0, y: 0.12 },
  scale = 1,
  rotation = 0,
  view = 'front',
  autoRotate = false,
  interactive = true,
  onDragMove,
}) {
  const fabric = useFabricTexture()
  const texture = useDesignTexture(design)
  const frontTexture = useDesignTexture(frontDesign)
  const backTexture = useDesignTexture(backDesign)
  const leftTexture = useDesignTexture(leftDesign)
  const rightTexture = useDesignTexture(rightDesign)
  const photoTex = usePhotoTextures(garment, photos)
  const [dragging, setDragging] = useState(false)

  useEffect(() => () => texture?.dispose(), [texture])

  const isTrouser = garment === 'trousers'
  const showAll = printLocation === 'all'
  const showFront = showAll || printLocation === 'front' || printLocation === 'front-back'
  const showBack = showAll || printLocation === 'back' || printLocation === 'front-back'
  const showLeft = showAll || printLocation === 'left-sleeve'
  const showRight = showAll || printLocation === 'right-sleeve'
  const PrintComp = isTrouser ? TrouserPrint : PrintPlane
  const SleeveComp = isTrouser ? TrouserPrint : SleevePrint

  const onDrag = (d, delta) => {
    setDragging(d)
    if (delta && onDragMove) onDragMove(delta.dx, delta.dy)
  }

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.05, isTrouser ? 3.5 : 3.15], fov: 34 }}
      gl={{ alpha: true, preserveDrawingBuffer: true, antialias: true }}
      style={{ touchAction: 'none' }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 3]} intensity={1.7} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 1.5, 2]} intensity={0.5} color="#cdd8ff" />
      <directionalLight position={[0, 2, -5]} intensity={0.9} color="#ffe6cf" />

      <Environment resolution={128}>
        <Lightformer form="rect" intensity={1.4} position={[0, 4, 3]} scale={[8, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.6} position={[-5, 1, 2]} scale={[4, 6, 1]} target={[0, 0, 0]} color="#ffd9c4" />
        <Lightformer form="rect" intensity={0.5} position={[5, 1, -2]} scale={[4, 6, 1]} target={[0, 0, 0]} color="#cfe0ff" />
      </Environment>

      <group position={[0, 0.15, 0]}>
        {photoTex
          ? <PhotoPlanes kind={garment} tex={photoTex} color={color} />
          : isTrouser
            ? <TrouserBody color={color} fabric={fabric} />
            : <ShirtBody color={color} fabric={fabric} />}
        {showFront && <PrintComp texture={frontTexture || texture} offset={offset} scale={scale} rotation={rotation} side="front" printSize={printSize} onDragState={onDrag} />}
        {showBack && <PrintComp texture={backTexture || texture} offset={offset} scale={scale} rotation={rotation} side="back" printSize={printSize} onDragState={onDrag} />}
        {showLeft && <SleeveComp texture={leftTexture || texture} offset={offset} scale={scale} rotation={rotation} side="left-sleeve" printSize={printSize} onDragState={onDrag} />}
        {showRight && <SleeveComp texture={rightTexture || texture} offset={offset} scale={scale} rotation={rotation} side="right-sleeve" printSize={printSize} onDragState={onDrag} />}
      </group>

      <ContactShadows position={[0, isTrouser ? -1.2 : -1.16, 0]} opacity={0.4} scale={7} blur={2.6} far={2.4} />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={2.1}
        maxDistance={5.5}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI - 0.35}
        autoRotate={autoRotate}
        autoRotateSpeed={1.6}
        enabled={!dragging}
        enableDamping
        dampingFactor={0.08}
      />
      <CameraRig view={view} dragging={dragging} />
      <DownloadShot />
    </Canvas>
  )
}
