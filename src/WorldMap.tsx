import { useEffect, useRef, useState } from 'react'
import {
  chartPlaces,
  routePoints,
  newWorldRoutePoints,
  chartRegions,
  atlasReviewDate,
  atlasSources,
  type ChartPlace,
} from './atlas'
import './world-map.css'

type View = { x: number; y: number; scale: number }
const WIDTH = 3000,
  HEIGHT = 1500
const SOURCE_WIDTH = 14171,
  SOURCE_HEIGHT = 7087,
  TILE = 1024
const tiles = Array.from(
  { length: Math.ceil(SOURCE_WIDTH / TILE) * Math.ceil(SOURCE_HEIGHT / TILE) },
  (_, i) => {
    const col = i % Math.ceil(SOURCE_WIDTH / TILE),
      row = Math.floor(i / Math.ceil(SOURCE_WIDTH / TILE))
    return {
      col,
      row,
      x: ((col * TILE) / SOURCE_WIDTH) * WIDTH,
      y: ((row * TILE) / SOURCE_HEIGHT) * HEIGHT,
      width: (Math.min(TILE, SOURCE_WIDTH - col * TILE) / SOURCE_WIDTH) * WIDTH,
      height: (Math.min(TILE, SOURCE_HEIGHT - row * TILE) / SOURCE_HEIGHT) * HEIGHT,
    }
  },
)
const clamp = (v: number, low: number, high: number) => Math.min(high, Math.max(low, v))

export default function WorldMap({
  onClose,
  onReady,
  interactive,
}: {
  onClose: () => void
  onReady: () => void
  interactive: boolean
}) {
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
  const [imageFailed, setImageFailed] = useState(false)
  const [zoom, setZoom] = useState(50)
  const [visibleTiles, setVisibleTiles] = useState<typeof tiles>([])
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('All seas')
  const [kind, setKind] = useState('All places')
  const [selected, setSelected] = useState(chartPlaces.find((p) => p.id === 'alabasta')!)
  const [showRoute, setShowRoute] = useState(true)
  const [browseOpen, setBrowseOpen] = useState(false)
  const touches = useRef(new Map<number, { x: number; y: number }>())
  const suppressMapClick = useRef(false)
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
    // Size the chart at its actual display resolution. Scaling a composited SVG
    // layer magnifies its cached raster and blurs both the map and its labels.
    Object.assign(paper.current.style, {
      left: `${next.x}px`,
      top: `${next.y}px`,
      width: `${WIDTH * next.scale}px`,
      height: `${HEIGHT * next.scale}px`,
    })
    const margin = (TILE / SOURCE_WIDTH) * WIDTH
    const left = -next.x / next.scale - margin,
      top = -next.y / next.scale - margin
    const right = (el.clientWidth - next.x) / next.scale + margin
    const bottom = (el.clientHeight - next.y) / next.scale + margin
    const visible =
      next.scale >= 0.8
        ? tiles.filter(
            (tile) =>
              tile.x + tile.width >= left &&
              tile.x <= right &&
              tile.y + tile.height >= top &&
              tile.y <= bottom,
          )
        : []
    setVisibleTiles((previous) =>
      previous.length === visible.length && previous.every((tile, i) => tile === visible[i])
        ? previous
        : visible,
    )
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
      scale = clamp(
        old.scale * factor,
        Math.min(0.25, (el.clientWidth - 60) / WIDTH),
        SOURCE_WIDTH / WIDTH / Math.max(1, devicePixelRatio),
      )
    const cx = x ?? el.clientWidth / 2,
      cy = y ?? el.clientHeight / 2
    commit({
      x: cx - ((cx - old.x) * scale) / old.scale,
      y: cy - ((cy - old.y) * scale) / old.scale,
      scale,
    })
  }
  const findPlace = (place: ChartPlace) => {
    if (place.id === 'alabasta') {
      onClose()
      return
    }
    setSelected(place)
    setQuery('')
    const el = surface.current
    if (el && place.position !== 'unknown')
      commit({
        x: el.clientWidth / 2 - place.x * 0.9,
        y: el.clientHeight / 2 - place.y * 0.9,
        scale: 0.9,
      })
  }
  useEffect(() => {
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
    }
  }, [])
  useEffect(() => {
    if (!interactive) return
    surface.current?.focus({ preventScroll: true })
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key !== 'Tab') return
      const controls = Array.from(
        modal.current?.querySelectorAll<HTMLElement>('button, input, a[href], [tabindex="0"]') ??
          [],
      ).filter((el) => el.getClientRects().length > 0)
      const first = controls[0],
        last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [interactive, onClose])
  const filteredPlaces = chartPlaces.filter(
    (place) =>
      (region === 'All seas' || place.sea === region) &&
      (kind === 'All places' || (place.kind ?? 'Island / place') === kind),
  )
  const matches = query.trim()
    ? filteredPlaces.filter((p) =>
        `${p.name} ${p.aliases ?? ''} ${p.sea}`.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : []
  const mappedPlaces = filteredPlaces.filter((place) => place.position !== 'unknown')
  return (
    <dialog
      ref={modal}
      open
      inert={!interactive}
      aria-modal="true"
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
          <span className="chart-edition">ALL ERAS / EAST BLUE TO ELBAPH / MANGA SPOILERS</span>
        </div>
        <button
          className="chart-browse-toggle"
          aria-expanded={browseOpen}
          aria-controls="chart-sidebar"
          onClick={() => setBrowseOpen(!browseOpen)}
        >
          {browseOpen ? 'Close' : 'Browse'}
        </button>
      </header>
      <div className="chart-layout">
        <aside
          id="chart-sidebar"
          className={`chart-sidebar ${browseOpen ? 'is-open' : ''}`}
          data-lenis-prevent
        >
          <div className="chart-search">
            <label htmlFor="island-search">Find a place</label>
            <input
              id="island-search"
              placeholder="Try Wano, Elbaf or a kingdom…"
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
          <div className="chart-filters">
            <label>
              Sea or region
              <select
                aria-label="Sea or region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option>All seas</option>
                {chartRegions.map((sea) => (
                  <option key={sea}>{sea}</option>
                ))}
              </select>
            </label>
            <label>
              Location type
              <select
                aria-label="Location type"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option>All places</option>
                <option value="Country">Countries & kingdoms</option>
                <option>Marine base</option>
                <option>Island / place</option>
              </select>
            </label>
          </div>
          <details className="chart-directory">
            <summary>Browse {filteredPlaces.length} places</summary>
            <div>
              {filteredPlaces.map((place) => (
                <button key={place.id} onClick={() => findPlace(place)}>
                  {place.name}
                  <small>
                    {place.sea}
                    {place.position === 'unknown' ? ' / Uncharted' : ''}
                  </small>
                </button>
              ))}
            </div>
          </details>
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
            <div className="chart-place-meta">
              <span>{selected.era ?? 'Before the timeskip'}</span>
              <span>
                {selected.position === 'unknown'
                  ? 'Position unknown / not plotted'
                  : 'Position follows the illustrated chart'}
              </span>
            </div>
            {selected.id === 'alabasta' ? (
              <button className="chart-enter" onClick={onClose}>
                Explore the island <span>↗</span>
              </button>
            ) : (
              <span className="chart-status">Chart entry · 3D island to come</span>
            )}
            <a
              href={
                selected.source ??
                `https://onepiece.fandom.com/wiki/${({ foosha: 'Foosha_Village', shells: 'Shells_Town', orange: 'Orange_Town', syrup: 'Syrup_Village', cocoyasi: 'Cocoyasi_Village', reverse: 'Reverse_Mountain', twin: 'Twin_Cape', whiskey: 'Whisky_Peak', garden: 'Little_Garden', drum: 'Drum_Island', 'long-ring': 'Long_Ring_Long_Land', 'water-seven': 'Water_7', 'enies-lobby': 'Enies_Lobby', thriller: 'Thriller_Bark', sabaody: 'Sabaody_Archipelago', amazon: 'Amazon_Lily', impel: 'Impel_Down', mariejois: 'Mary_Geoise', fishman: 'Fish-Man_Island' } as Record<string, string>)[selected.id] ?? encodeURIComponent(selected.name.replaceAll(' ', '_'))}`
              }
              target="_blank"
              rel="noreferrer"
            >
              Read the location reference ↗
            </a>
          </div>
          <div className="chart-log">
            <span className="eyebrow">ON THE CHART</span>
            <strong>{chartPlaces.length} places. Four seas.</strong>
            <p>
              From the four Blues to the New World. Story coverage includes Wano, Egghead and
              Elbaph. Manga spoilers included.
            </p>
            <p>Reviewed {atlasReviewDate}. Story summaries are curated, not a live chapter feed.</p>
            <a href={atlasSources.current} target="_blank" rel="noreferrer">
              Official One Piece updates ↗
            </a>
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
            const target = e.target as HTMLElement
            if (touches.current.size === 0) suppressMapClick.current = false
            if (
              target.closest('button,input,label') &&
              !(e.pointerType === 'touch' && target.closest('.chart-place'))
            )
              return
            if (!target.closest('.chart-place')) e.currentTarget.setPointerCapture(e.pointerId)
            touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
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
            if (!touches.current.has(e.pointerId)) return
            const previous = [...touches.current.values()]
            touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
            const current = [...touches.current.values()]
            if (current.length === 2) {
              suppressMapClick.current = true
              const before = Math.hypot(
                previous[0].x - previous[1].x,
                previous[0].y - previous[1].y,
              )
              const after = Math.hypot(current[0].x - current[1].x, current[0].y - current[1].y)
              const rect = e.currentTarget.getBoundingClientRect()
              if (before > 0)
                zoomAt(
                  after / before,
                  (current[0].x + current[1].x) / 2 - rect.left,
                  (current[0].y + current[1].y) / 2 - rect.top,
                )
              drag.current = null
              return
            }
            const d = drag.current
            if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6)
              suppressMapClick.current = true
            if (d)
              commit({
                ...view.current,
                x: d.startX + e.clientX - d.x,
                y: d.startY + e.clientY - d.y,
              })
          }}
          onPointerUp={(e) => {
            touches.current.delete(e.pointerId)
            drag.current = null
            surface.current?.classList.remove('is-dragging')
          }}
          onPointerCancel={(e) => {
            touches.current.delete(e.pointerId)
            drag.current = null
            surface.current?.classList.remove('is-dragging')
          }}
          onClickCapture={(e) => {
            if (suppressMapClick.current) {
              e.preventDefault()
              e.stopPropagation()
              suppressMapClick.current = false
            }
          }}
        >
          <img
            className="chart-preload"
            src="/maps/onepiece-world.jpg"
            alt=""
            onLoad={onReady}
            onError={() => {
              setImageFailed(true)
              onReady()
            }}
          />
          {imageFailed && (
            <div className="chart-error" role="alert">
              The world chart could not load.{' '}
              <button onClick={() => location.reload()}>Retry</button>
              <button onClick={onClose}>Explore Alabasta</button>
            </div>
          )}
          <div ref={paper} className="chart-paper">
            <img
              className="chart-geography chart-overview"
              src="/maps/onepiece-world.jpg"
              alt=""
              draggable={false}
            />
            {visibleTiles.map((tile) => (
              <img
                key={`${tile.col}-${tile.row}`}
                className="chart-tile"
                src={`/maps/tiles/${tile.col}-${tile.row}.png`}
                alt=""
                draggable={false}
                style={{
                  left: `${(tile.x / WIDTH) * 100}%`,
                  top: `${(tile.y / HEIGHT) * 100}%`,
                  width: `${(tile.width / WIDTH) * 100}%`,
                  height: `${(tile.height / HEIGHT) * 100}%`,
                }}
              />
            ))}
            <svg className="chart-geography" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
              {showRoute && (
                <>
                  <polyline
                    points={routePoints}
                    fill="none"
                    stroke="#ffe5a3"
                    strokeWidth="2.5"
                    strokeDasharray="7 5"
                    opacity=".85"
                  />
                  <polyline
                    className="new-world-route"
                    points={newWorldRoutePoints}
                    fill="none"
                    stroke="#f4ad83"
                    strokeWidth="2.5"
                    strokeDasharray="7 5"
                    opacity=".9"
                  />
                </>
              )}
            </svg>
            {mappedPlaces.map((p) => (
              <button
                key={p.id}
                className={`chart-place ${selected.id === p.id ? 'selected' : ''} ${p.id === 'alabasta' ? 'current' : ''}`}
                style={{ left: `${(p.x / WIDTH) * 100}%`, top: `${(p.y / HEIGHT) * 100}%` }}
                onClick={() => {
                  if (p.id === 'alabasta') onClose()
                  else {
                    setSelected(p)
                    setBrowseOpen(true)
                  }
                }}
                aria-label={`View ${p.name}`}
                aria-pressed={selected.id === p.id}
              >
                <span className="chart-pin" />
                <span className="chart-place-label">
                  {p.name}
                  {p.id === 'alabasta' && <small>EXPLORE IN 3D</small>}
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
        <span>ONEPIECE15 MAP · LOCATIONS ALIGNED TO THE SUPPLIED CHART</span>
        <span>A VOYAGE THROUGH EVERY ERA</span>
      </footer>
    </dialog>
  )
}
