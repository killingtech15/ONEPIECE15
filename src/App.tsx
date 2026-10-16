import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Scene from './Scene'
import { island, places, travel } from './world'

gsap.registerPlugin(ScrollTrigger)
type IconName = 'compass' | 'arrow' | 'rain' | 'sun' | 'settings' | 'close' | 'map'
function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5Z" />
        <path d="M12 1v3m0 16v3M1 12h3m16 0h3" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    rain: (
      <>
        <path d="M6 14a4 4 0 0 1-.3-8 6 6 0 0 1 11.2 0A4 4 0 0 1 18 14" />
        <path d="m8 16-1 3m6-3-1 3m6-3-1 3" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l1.5 1.5m13 13L20 20M4 20l1.5-1.5m13-13L20 4" />
      </>
    ),
    settings: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <path d="M8 3v6m8 0v6m-5 0v6" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    map: (
      <>
        <path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z" />
        <path d="M9 3v16m6-14v16" />
      </>
    ),
  }
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        <Icon name="compass" />
        <h2>The sea needs another moment.</h2>
        <p>
          The 3D scene could not load. Your browser needs WebGL 2 and hardware acceleration. The
          landmark stories are still available below.
        </p>
        <button onClick={() => location.reload()}>
          Try again <Icon name="arrow" />
        </button>
      </div>
    ) : (
      this.props.children
    )
  }
}
function Loading({ ready }: { ready: boolean }) {
  const { progress } = useProgress()
  return (
    <div className={`loading ${ready ? 'is-ready' : ''}`} aria-hidden={ready} aria-live="polite">
      <Icon name="compass" />
      <span className="eyebrow">THE GRAND LINE ATLAS</span>
      <p>Plotting a course.</p>
      <div className="loading-line">
        <span style={{ width: `${progress}%` }} />
      </div>
      <span className="mono">{Math.round(progress)}% · ALABASTA</span>
    </div>
  )
}

export default function App() {
  const [selected, setSelected] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const [rain, setRain] = useState(false)
  const [reduced, setReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [quality, setQuality] = useState(true)
  const [dialog, setDialog] = useState<'atlas' | 'settings' | 'notes' | null>(null)
  const [departed, setDeparted] = useState(false)
  const lenis = useRef<Lenis | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const modal = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const detailHeading = useRef<HTMLHeadingElement>(null)
  const onReady = useCallback(() => setReady(true), [])
  const onSelect = useCallback((index: number) => {
    returnFocus.current = document.activeElement as HTMLElement
    setSelected(index)
    setHover(null)
    setDialog(null)
  }, [])
  const closeDetail = useCallback(() => {
    setSelected(null)
    requestAnimationFrame(() => returnFocus.current?.focus({ preventScroll: true }))
  }, [])
  useEffect(() => {
    const smooth = new Lenis({ lerp: reduced ? 1 : 0.075, smoothWheel: !reduced })
    lenis.current = smooth
    smooth.on('scroll', (e: Lenis) => {
      travel.velocity = e.velocity
      ScrollTrigger.update()
    })
    const tick = (t: number) => smooth.raf(t * 1000)
    gsap.ticker.add(tick)
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: '.scroll-track',
        start: 'top top',
        end: 'bottom bottom',
        scrub: reduced ? true : 1,
        onUpdate: (self) => {
          root.current?.style.setProperty('--journey', String(self.progress))
          setDeparted(self.progress > 0.16)
        },
      },
    })
    timeline.fromTo(travel, { progress: 0 }, { progress: 1, duration: 1, ease: 'none' })
    const resize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      timeline.scrollTrigger?.kill()
      timeline.kill()
      gsap.ticker.remove(tick)
      smooth.destroy()
      lenis.current = null
    }
  }, [reduced])
  useEffect(() => {
    if (selected !== null || dialog !== null || !ready) lenis.current?.stop()
    else lenis.current?.start()
    if (selected !== null) detailHeading.current?.focus({ preventScroll: true })
  }, [selected, dialog, ready, reduced])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected !== null && !dialog) closeDetail()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [selected, dialog, closeDetail])
  useEffect(() => {
    if (dialog) modal.current?.showModal()
    else modal.current?.close()
  }, [dialog])
  const go = () =>
    lenis.current?.scrollTo(window.innerHeight * 1.05, { duration: reduced ? 0 : 2.5 })
  const reset = () => {
    setSelected(null)
    lenis.current?.start()
    lenis.current?.scrollTo(0, { duration: reduced ? 0 : 1.8 })
  }

  return (
    <div
      ref={root}
      className={`app ${departed ? 'has-departed' : ''} ${selected !== null ? 'is-exploring' : ''} ${reduced ? 'reduced-motion' : ''}`}
    >
      <a className="skip-link" href="#landmarks">
        Skip to island landmarks
      </a>
      <div className="scene" aria-label="Interactive 3D diorama of Alabasta">
        <SceneBoundary onError={onReady}>
          <Canvas
            dpr={quality ? [1, 1.5] : 1}
            gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
          >
            <Suspense fallback={null}>
              <Scene
                selected={selected}
                hover={hover}
                reduced={reduced}
                rain={rain}
                quality={quality}
                onSelect={onSelect}
                onHover={setHover}
                onReady={onReady}
              />
            </Suspense>
          </Canvas>
        </SceneBoundary>
      </div>
      <div className="paper-wash" aria-hidden="true" />
      <header className="masthead">
        <button
          className="brand"
          onClick={reset}
          aria-label="Grand Line Atlas, return to the beginning"
        >
          <Icon name="compass" />
          <span>
            GRAND LINE<span className="brand-sub">AN INTERACTIVE ATLAS</span>
          </span>
        </button>
        <nav aria-label="Main navigation">
          <button className="nav-link" onClick={() => setDialog('atlas')}>
            <Icon name="map" />
            The atlas
          </button>
          <button className="nav-link" onClick={() => setDialog('notes')}>
            Field notes
          </button>
          <span className="nav-rule" />
          <button
            className="icon-button"
            onClick={() => setDialog('settings')}
            aria-label="Experience settings"
          >
            <Icon name="settings" />
          </button>
        </nav>
      </header>
      <main className="overlay">
        {selected === null ? (
          <>
            <section className="intro" aria-labelledby="island-title">
              <div className="chapter-kicker">
                <span className="small-rule" /> CHAPTER 01 <span className="dot">·</span> SANDY
                ISLAND
              </div>
              <h1 id="island-title" className="sr-only">
                Alabasta
              </h1>
              <div className="title-space" aria-hidden="true" />
              <p className="intro-subtitle">A kingdom waiting for rain.</p>
              <p className="intro-copy">
                Beyond the dunes, a promise still stands.
                <br />
                Follow the needle into the land of sand,
                <br />
                and the stories that changed its course.
              </p>
              <button className="journey-button" onClick={go}>
                Enter the kingdom{' '}
                <span>
                  <Icon name="arrow" />
                </span>
              </button>
              <div className="island-meta">
                <span>GRAND LINE</span>
                <i />
                <span>PRE-TIMESKIP</span>
              </div>
            </section>
            <div className="travel-caption">
              <span className="eyebrow">THE DESERT KINGDOM</span>
              <p>Every place holds a story.</p>
              <span className="mono">Choose a landmark to look closer.</span>
            </div>
          </>
        ) : (
          <section className="story" aria-labelledby="story-title">
            <button className="back-button" onClick={closeDetail}>
              <Icon name="arrow" />
              Return to the journey <kbd>ESC</kbd>
            </button>
            <span className="eyebrow">
              0{selected + 1} <span className="dot">/</span> {places[selected].location}
            </span>
            <h2 id="story-title" tabIndex={-1} ref={detailHeading}>
              {places[selected].name}
            </h2>
            <span className="story-rule" />
            <p className="story-title">{island.incidents[selected].title}</p>
            <p className="story-copy">{island.incidents[selected].description}</p>
            <a
              className="episode-link"
              href={places[selected].source}
              target="_blank"
              rel="noreferrer"
            >
              EPISODE {island.incidents[selected].episodes}
              <span>Official episode notes ↗</span>
            </a>
            {selected === 0 && (
              <button
                className={`rain-story ${rain ? 'active' : ''}`}
                onClick={() => setRain((v) => !v)}
              >
                <Icon name={rain ? 'sun' : 'rain'} />
                {rain ? 'Return to the desert sun' : 'Let the rain return'}
              </button>
            )}
            <button className="next-story" onClick={() => onSelect((selected + 1) % places.length)}>
              Next landmark <Icon name="arrow" />
            </button>
          </section>
        )}
        <aside className="scene-aside">
          <div className="location-stamp">
            <span className="stamp-dot" />
            <span>ALABASTA KINGDOM</span>
          </div>
          <div className="north">
            <span>N</span>
            <Icon name="compass" />
            <span className="north-rule" />
          </div>
        </aside>
        <div className="scene-controls">
          <button
            className={rain ? 'weather active' : 'weather'}
            onClick={() => setRain((v) => !v)}
            aria-pressed={rain}
          >
            <Icon name={rain ? 'rain' : 'sun'} />
            <span>{rain ? 'The rain returns' : 'Desert sun'}</span>
          </button>
          <span className="scroll-hint">
            <span className="mouse" />
            SCROLL TO TRAVEL
          </span>
        </div>
      </main>
      <footer className="island-dock" id="landmarks" tabIndex={-1}>
        <div className="dock-heading">
          <span className="eyebrow">EXPLORE ALABASTA</span>
          <span>Four places. One unforgettable journey.</span>
        </div>
        <nav className="landmark-list" aria-label="Island landmarks">
          {places.map((place, i) => (
            <button
              key={place.name}
              className={`landmark ${selected === i ? 'active' : ''}`}
              onClick={() => onSelect(i)}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-pressed={selected === i}
            >
              <span className="landmark-index">0{i + 1}</span>
              <span className="landmark-name">
                {place.name}
                <span>{place.location}</span>
              </span>
              <span className="landmark-arrow">↗</span>
            </button>
          ))}
        </nav>
        <div className="dock-bottom">
          <span>A FAN-MADE JOURNEY THROUGH THE WORLD OF ONE PIECE</span>
          <span>SCROLL · DISCOVER · REMEMBER</span>
          <button onClick={() => setDialog('notes')}>CREDITS & REFERENCES ↗</button>
        </div>
        <div className="journey-line" aria-hidden="true">
          <span />
        </div>
      </footer>
      <div className="scroll-track" aria-hidden="true" />
      <div className="small-screen-note">
        Designed for desktop. Open on a larger screen for the full journey.
      </div>
      <Loading ready={ready} />
      <dialog
        ref={modal}
        className="atlas-dialog"
        onCancel={() => setDialog(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDialog(null)
        }}
      >
        <div className="dialog-inner">
          <button
            className="dialog-close icon-button"
            onClick={() => setDialog(null)}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
          {dialog === 'atlas' && (
            <>
              <span className="eyebrow">THE GRAND LINE ATLAS</span>
              <h2>One island at a time.</h2>
              <p>Our first stop is Alabasta. The wider pre-timeskip world will grow from here.</p>
              <svg
                className="mini-map"
                viewBox="0 0 540 290"
                role="img"
                aria-label="Schematic Alabasta landmark map, not canonical distances"
              >
                <path
                  d="M78 150Q45 67 160 39Q257 5 410 44Q510 80 486 175Q459 265 309 266Q179 285 92 227Z"
                  fill="#e0c9a0"
                  stroke="#bda57c"
                />
                <path
                  d="M142 116Q231 175 325 88Q292 171 281 198Q330 222 389 233"
                  fill="none"
                  stroke="#a56b48"
                  strokeDasharray="4 5"
                />
                {[
                  [325, 88],
                  [281, 198],
                  [142, 116],
                  [389, 233],
                ].map(([x, y], i) => (
                  <g key={i}>
                    <circle cx={x} cy={y} r="12" fill="#1d4a50" />
                    <text x={x} y={y + 4} textAnchor="middle" fill="#fff" fontSize="11">
                      {i + 1}
                    </text>
                  </g>
                ))}
                <text x="316" y="59">
                  ALUBARNA
                </text>
                <text x="104" y="91">
                  RAINBASE
                </text>
                <text x="390" y="269">
                  COAST
                </text>
              </svg>
              <span className="map-caption">ILLUSTRATED DIORAMA · DISTANCES COMPRESSED</span>
              <div className="map-links">
                {places.map((p, i) => (
                  <button key={p.name} onClick={() => onSelect(i)}>
                    0{i + 1} · {p.name}
                    <Icon name="arrow" />
                  </button>
                ))}
              </div>
            </>
          )}
          {dialog === 'settings' && (
            <>
              <span className="eyebrow">MAKE YOURSELF AT HOME</span>
              <h2>A comfortable voyage.</h2>
              <label className="setting">
                <span>
                  Reduced motion<small>Still water, quiet wind, instant camera moves.</small>
                </span>
                <input
                  type="checkbox"
                  checked={reduced}
                  onChange={(e) => setReduced(e.target.checked)}
                />
              </label>
              <label className="setting">
                <span>
                  High visual quality<small>Sharper rendering and a brighter Log Pose.</small>
                </span>
                <input
                  type="checkbox"
                  checked={quality}
                  onChange={(e) => setQuality(e.target.checked)}
                />
              </label>
              <p className="settings-note">
                Scroll to travel. Select a landmark to pause and explore. Press Escape to return.
              </p>
            </>
          )}
          {dialog === 'notes' && (
            <>
              <span className="eyebrow">FROM THE CHART ROOM</span>
              <h2>Made for the journey.</h2>
              <p>
                An independent fan-made atlas inspired by Eiichiro Oda’s One Piece. This first
                island covers Alabasta before the timeskip.
              </p>
              <p>
                The architecture is an original 3D interpretation based on anime references. The
                palace, clock tower, Rainbase and coastline share a compressed diorama; their
                distances are illustrative.
              </p>
              <p>
                Story summaries are linked to the official episode notes. One Piece and its
                characters belong to their respective rights holders.
              </p>
              <div className="credits">
                <a
                  href="https://one-piece.com/anime/126/index.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Official story reference ↗
                </a>
                <a href="https://polyhaven.com/a/potsdamer_platz" target="_blank" rel="noreferrer">
                  Environment light · Poly Haven (CC0) ↗
                </a>
                <span>Type · Cinzel, DM Sans & IBM Plex Mono (OFL)</span>
              </div>
            </>
          )}
        </div>
      </dialog>
    </div>
  )
}
