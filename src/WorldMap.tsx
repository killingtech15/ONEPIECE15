import { useEffect, useRef, useState } from 'react'
import { chartPlaces, routePoints, type ChartPlace } from './atlas'
import './world-map.css'

type View = { x: number; y: number; scale: number }
const WIDTH = 3000,
  HEIGHT = 1500
const clamp = (v: number, low: number, high: number) => Math.min(high, Math.max(low, v))

export default function WorldMap({ onClose }: { onClose: () => void }) {
  const modal = useRef<HTMLDialogElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const paper = useRef<HTMLDivElement>(null)
  const view = useRef<View>({ x: 0, y: 0, scale: 0.5 })
  const drag = useRef<{
    x: number
    y: number
    startX: number
    startY: number
    moved: boolean
  } | null>(null)
  const [zoom, setZoom] = useState(50)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(chartPlaces.find((p) => p.id === 'alabasta')!)
  const [showRoute, setShowRoute] = useState(true)
  const commit = (next: View) => {
    const el = surface.current
    if (!el || !paper.current) return
    next.x = clamp(
      next.x,
      Math.min(80, el.clientWidth - WIDTH * next.scale - 80),
      Math.max(80, el.clientWidth - WIDTH * next.scale - 80),
    )
    next.y = clamp(
      next.y,
      Math.min(80, el.clientHeight - HEIGHT * next.scale - 80),
      Math.max(80, el.clientHeight - HEIGHT * next.scale - 80),
    )
    view.current = next
    paper.current.style.transform = `translate3d(${next.x}px,${next.y}px,0) scale(${next.scale})`
    // Keep chart labels readable when the whole world is fitted on screen.
    paper.current.style.setProperty('--label-scale', String(Math.max(0.65, 1 / next.scale)))
    setZoom(Math.round(next.scale * 100))
  }
  const fit = () => {
    const el = surface.current
    if (!el) return
    const scale = Math.min((el.clientWidth - 60) / WIDTH, (el.clientHeight - 60) / HEIGHT)
    commit({
      x: (el.clientWidth - WIDTH * scale) / 2,
      y: (el.clientHeight - HEIGHT * scale) / 2,
      scale,
    })
  }
  const zoomAt = (factor: number, x?: number, y?: number) => {
    const el = surface.current
    if (!el) return
    const old = view.current,
      scale = clamp(old.scale * factor, 0.25, 1.8)
    const cx = x ?? el.clientWidth / 2,
      cy = y ?? el.clientHeight / 2
    commit({
      x: cx - ((cx - old.x) * scale) / old.scale,
      y: cy - ((cy - old.y) * scale) / old.scale,
      scale,
    })
  }
  const findPlace = (place: ChartPlace) => {
    setSelected(place)
    setQuery('')
    const el = surface.current
    if (el)
      commit({
        x: el.clientWidth / 2 - place.x * 0.9,
        y: el.clientHeight / 2 - place.y * 0.9,
        scale: 0.9,
      })
  }
  useEffect(() => {
    modal.current?.showModal()
    fit()
    const el = surface.current!
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      zoomAt(Math.exp(-event.deltaY * 0.0015), event.clientX - rect.left, event.clientY - rect.top)
    }
    el.addEventListener('wheel', wheel, { passive: false })
    const resize = new ResizeObserver(fit)
    resize.observe(el)
    return () => {
      el.removeEventListener('wheel', wheel)
      resize.disconnect()
      modal.current?.close()
    }
  }, [])
  const matches = query.trim()
    ? chartPlaces
        .filter((p) => `${p.name} ${p.sea}`.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 7)
    : []
  return (
    <dialog
      ref={modal}
      className="world-dialog"
      aria-labelledby="world-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <header className="chart-header">
        <div>
          <span className="eyebrow">THE GRAND LINE ATLAS / WORLD CHART</span>
          <h1 id="world-title">An ocean of stories.</h1>
        </div>
        <button className="chart-return" onClick={onClose}>
          ← Return to Alabasta <kbd>ESC</kbd>
        </button>
      </header>
      <div className="chart-layout">
        <aside className="chart-sidebar" data-lenis-prevent>
          <div className="chart-search">
            <label htmlFor="island-search">Find a place</label>
            <input
              id="island-search"
              placeholder="Try Water 7 or Skypiea…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {query && (
              <div className="chart-results" aria-live="polite">
                {matches.length ? (
                  matches.map((place) => (
                    <button key={place.id} onClick={() => findPlace(place)}>
                      {place.name}
                      <small>{place.sea}</small>
                    </button>
                  ))
                ) : (
                  <p>No places found on this chart.</p>
                )}
              </div>
            )}
          </div>
          <div className="chart-entry" aria-live="polite">
            <span className="eyebrow">{selected.sea}</span>
            <div className={`island-sketch sketch-${selected.id}`} aria-hidden="true">
              <svg viewBox="0 0 260 110">
                <path d="M18 85Q48 66 79 76L94 49L111 61L135 18L164 61L185 52L207 77Q232 77 245 86L226 96H48Z" />
                <path d="M35 102h193M55 107h150M121 61l14-43 16 36M75 84l19-35" fill="none" />
                <circle cx="209" cy="28" r="15" />
              </svg>
            </div>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            {selected.id === 'alabasta' ? (
              <button className="chart-enter" onClick={onClose}>
                Explore the island <span>↗</span>
              </button>
            ) : (
              <span className="chart-status">Chart entry · 3D island to come</span>
            )}
            <a
              href={`https://onepiece.fandom.com/wiki/${({ foosha: 'Foosha_Village', shells: 'Shells_Town', orange: 'Orange_Town', syrup: 'Syrup_Village', cocoyasi: 'Cocoyasi_Village', reverse: 'Reverse_Mountain', twin: 'Twin_Cape', whiskey: 'Whisky_Peak', garden: 'Little_Garden', drum: 'Drum_Island', 'long-ring': 'Long_Ring_Long_Land', 'water-seven': 'Water_7', 'enies-lobby': 'Enies_Lobby', thriller: 'Thriller_Bark', sabaody: 'Sabaody_Archipelago', amazon: 'Amazon_Lily', impel: 'Impel_Down', mariejois: 'Mary_Geoise', fishman: 'Fish-Man_Island' } as Record<string, string>)[selected.id] ?? selected.name.replaceAll(' ', '_')}`}
              target="_blank"
              rel="noreferrer"
            >
              Read the location reference ↗
            </a>
          </div>
          <div className="chart-log">
            <span className="eyebrow">ON THE CHART</span>
            <strong>25 places. Four seas.</strong>
            <p>A pre-timeskip voyage, from the East Blue to the gates of the New World.</p>
          </div>
        </aside>
        <div
          ref={surface}
          className="chart-surface"
          tabIndex={0}
          role="region"
          aria-label="World map. Drag to pan, scroll to zoom, or use arrow keys and plus or minus."
          onKeyDown={(e) => {
            const delta: Record<string, [number, number]> = {
              ArrowLeft: [80, 0],
              ArrowRight: [-80, 0],
              ArrowUp: [0, 80],
              ArrowDown: [0, -80],
            }
            if (e.target !== e.currentTarget) return
            if (delta[e.key]) {
              e.preventDefault()
              const [x, y] = delta[e.key]
              commit({ ...view.current, x: view.current.x + x, y: view.current.y + y })
            }
            if (e.key === '+' || e.key === '=') zoomAt(1.2)
            if (e.key === '-') zoomAt(1 / 1.2)
          }}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('button,input,label')) return
            e.currentTarget.setPointerCapture(e.pointerId)
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              startX: view.current.x,
              startY: view.current.y,
              moved: false,
            }
            e.currentTarget.classList.add('is-dragging')
          }}
          onPointerMove={(e) => {
            const d = drag.current
            if (d)
              commit({
                ...view.current,
                x: d.startX + e.clientX - d.x,
                y: d.startY + e.clientY - d.y,
              })
          }}
          onPointerUp={() => {
            drag.current = null
            surface.current?.classList.remove('is-dragging')
          }}
          onPointerCancel={() => {
            drag.current = null
            surface.current?.classList.remove('is-dragging')
          }}
        >
          <div ref={paper} className="chart-paper">
            <svg className="chart-geography" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
              <defs>
                <pattern id="chart-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path
                    d="M100 0H0V100"
                    fill="none"
                    stroke="#638b87"
                    strokeWidth="1"
                    opacity=".24"
                  />
                </pattern>
                <pattern id="belt-lines" width="18" height="18" patternUnits="userSpaceOnUse">
                  <path d="m0 18 18-18" stroke="#9ab49e" strokeWidth="1" opacity=".45" />
                </pattern>
                <pattern id="red-rock" width="35" height="50" patternUnits="userSpaceOnUse">
                  <path
                    d="m0 30 18-20 17 30M8 50l15-20"
                    fill="none"
                    stroke="#9c5b48"
                    strokeWidth="1.5"
                    opacity=".5"
                  />
                </pattern>
              </defs>
              <rect width="3000" height="1500" fill="#c5d4c8" />
              <rect y="595" width="3000" height="300" fill="#7faaa5" />
              <path d="M0 540H3000V595H0ZM0 895H3000V1175H0Z" fill="url(#belt-lines)" />
              <path
                d="M0 595H3000M0 895H3000"
                stroke="#517c78"
                strokeWidth="2"
                strokeDasharray="12 8"
              />
              <rect width="3000" height="1500" fill="url(#chart-grid)" />
              {[390, 2400].map((x, i) => (
                <g key={x}>
                  <path
                    d={`M${x - 48} 0l22 115-28 110 16 140-12 135 17 140-19 100 17 140-23 130 22 120-9 140 14 135h72l-10-140 23-145-18-100 14-145-18-125 15-130-19-140 14-125-17-120 22-130-13-100Z`}
                    fill="#c8876a"
                    stroke="#985d4b"
                    strokeWidth="3"
                  />
                  <rect x={x - 25} width="50" height="1500" fill="url(#red-rock)" />
                  <text
                    x={x + 8}
                    y={i ? 255 : 1130}
                    transform={`rotate(-90 ${x + 8} ${i ? 255 : 1130})`}
                    className="chart-red-label"
                  >
                    RED LINE
                  </text>
                </g>
              ))}
              <g className="sea-names">
                <text x="150" y="235">
                  NORTH BLUE
                </text>
                <text x="1440" y="120">
                  EAST BLUE
                </text>
                <text x="2740" y="240">
                  NORTH BLUE
                </text>
                <text x="160" y="1330">
                  WEST BLUE
                </text>
                <text x="1330" y="1370">
                  SOUTH BLUE
                </text>
                <text x="2730" y="1330">
                  WEST BLUE
                </text>
              </g>
              <text x="1080" y="590" className="belt-label">
                CALM BELT
              </text>
              <text x="1120" y="1120" className="belt-label">
                CALM BELT
              </text>
              <text x="1170" y="958" className="grand-label">
                G R A N D L I N E
              </text>
              <text x="1190" y="995" className="belt-label">
                PARADISE · FIRST HALF
              </text>
              <text x="2750" y="710" className="grand-label">
                NEW WORLD
              </text>
              <text x="2750" y="760" className="belt-label">
                BEYOND THIS VOYAGE
              </text>
              {showRoute && (
                <g>
                  <polyline
                    points={routePoints}
                    fill="none"
                    stroke="#a34f37"
                    strokeWidth="3"
                    strokeDasharray="8 8"
                  />
                  <path
                    d="M1400 710L1435 505M1760 715L1780 990M2150 700L1930 1130L2210 1150L2230 940"
                    fill="none"
                    stroke="#a34f37"
                    strokeWidth="2"
                    strokeDasharray="5 9"
                    opacity=".65"
                  />
                </g>
              )}
              {chartPlaces
                .filter((p) => !['reverse', 'mariejois', 'fishman', 'baratie'].includes(p.id))
                .map((p, i) => (
                  <g
                    key={p.id}
                    transform={`translate(${p.x} ${p.y}) rotate(${((i * 37) % 80) - 40})`}
                  >
                    <path
                      d="M-31 1Q-45-20-14-27L5-39 25-25Q43-27 39-7L49 8 27 22 7 19Q-19 37-35 18Z"
                      fill={p.id === 'alabasta' ? '#dfbc7d' : '#dfd7b5'}
                      stroke="#6f8a73"
                      strokeWidth="2"
                    />
                    <path
                      d="m-18 9 13-21 11 15 8-9 13 20"
                      fill="none"
                      stroke="#8f9874"
                      strokeWidth="2"
                    />
                  </g>
                ))}
              <g transform="translate(2720 390)" stroke="#527672" fill="none">
                <circle r="80" />
                <circle r="68" strokeDasharray="2 8" />
                <path d="M0-110V110M-110 0H110M-65-65 65 65M-65 65 65-65" />
                <path d="M0-85 17 0 0 85-17 0Z" fill="#527672" />
                <path d="M-85 0 0-17 85 0 0 17Z" fill="#dce1cd" />
                <text y="-125" textAnchor="middle" fill="#527672" stroke="none" fontSize="25">
                  N
                </text>
              </g>
            </svg>
            {chartPlaces.map((p) => (
              <button
                key={p.id}
                className={`chart-place ${selected.id === p.id ? 'selected' : ''} ${p.id === 'alabasta' ? 'current' : ''}`}
                style={{ left: p.x, top: p.y }}
                onClick={() => setSelected(p)}
                aria-label={`View ${p.name}`}
                aria-pressed={selected.id === p.id}
              >
                <span className="chart-pin" />
                <span className="chart-place-label">
                  {p.name}
                  {p.id === 'alabasta' && <small>YOU ARE HERE</small>}
                </span>
              </button>
            ))}
          </div>
          <div className="chart-tools" onPointerDown={(e) => e.stopPropagation()}>
            <button onClick={() => zoomAt(1.25)} aria-label="Zoom in">
              +
            </button>
            <output aria-label="Map zoom">{zoom}%</output>
            <button onClick={() => zoomAt(0.8)} aria-label="Zoom out">
              −
            </button>
            <button onClick={fit}>Fit chart</button>
          </div>
          <label className="chart-route">
            <input
              type="checkbox"
              checked={showRoute}
              onChange={(e) => setShowRoute(e.target.checked)}
            />{' '}
            Straw Hat route
          </label>
          <span className="chart-drag-hint">DRAG TO EXPLORE · SCROLL TO ZOOM</span>
        </div>
      </div>
      <footer className="chart-footer">
        <span>ILLUSTRATED ROUTE CHART · POSITIONS & DISTANCES ARE SCHEMATIC</span>
        <span>THE GOING MERRY’S CHART ROOM</span>
      </footer>
    </dialog>
  )
}
