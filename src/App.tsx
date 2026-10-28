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
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Scene, { MarkerButtons } from './Scene'
import WorldMap from './WorldMap'
import Loading from './VoyageLoading'
import { travel } from './world'
import { IslandContext, islands, type IslandId } from './IslandContext'

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
  { children: ReactNode; onError: () => void; sceneId: string },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  componentDidUpdate(previous: { sceneId: string }) {
    if (previous.sceneId !== this.props.sceneId && this.state.failed)
      this.setState({ failed: false })
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
export default function App() {
  const [activeIsland, setActiveIsland] = useState<IslandId>('alabasta')
  const config = islands[activeIsland]
  const { island, places } = config
  const isWater = activeIsland === 'water-7'
  const isMarine = activeIsland === 'marineford'
  const isImpel = activeIsland === 'impel-down'
  const isAmazon = activeIsland === 'amazon-lily'
  const isSabaody = activeIsland === 'sabaody'
  const isThriller = activeIsland === 'thriller-bark'
  const isEnies = activeIsland === 'enies-lobby'
  const savedScroll = useRef<Record<string, number>>({})
  const [selected, setSelected] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [transitioning, setTransitioning] = useState(true)
  const [destination, setDestination] = useState('WORLD CHART')
  const [islandMounted, setIslandMounted] = useState(false)
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigating = useRef(false)
  const [rain, setRain] = useState(false)
  const [reduced, setReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [quality, setQuality] = useState(false)
  const [worldOpen, setWorldOpen] = useState(true)
  const ready = !transitioning && (worldOpen ? mapReady : sceneReady)
  useEffect(() => {
    document.title = `${worldOpen ? 'World Map' : island.name} — Grand Line Atlas`
  }, [worldOpen, island.name])
  const navigate = useCallback(
    (change: () => void, label: string) => {
      if (navigating.current) return
      navigating.current = true
      setDestination(label)
      setTransitioning(true)
      transitionTimer.current = setTimeout(
        () => {
          change()
          setTransitioning(false)
          navigating.current = false
        },
        reduced ? 80 : 1400,
      )
    },
    [reduced],
  )
  useEffect(() => {
    const initial = setTimeout(() => setTransitioning(false), 1300)
    return () => {
      clearTimeout(initial)
      if (transitionTimer.current) clearTimeout(transitionTimer.current)
    }
  }, [])
  const worldReturnFocus = useRef<HTMLElement | null>(null)
  const openWorld = useCallback(() => {
    if (worldOpen) return
    savedScroll.current[activeIsland] = window.scrollY
    worldReturnFocus.current =
      document.activeElement instanceof HTMLButtonElement
        ? document.activeElement
        : document.querySelector('.merry-marker')
    navigate(() => setWorldOpen(true), 'WORLD CHART')
  }, [navigate, worldOpen, activeIsland])
  const enterIsland = useCallback(
    (id: IslandId) => {
      if (!worldOpen) return
      navigate(() => {
        if (id !== activeIsland) {
          setSceneReady(false)
          setSelected(null)
          setHover(null)
          setRain(false)
          setActiveIsland(id)
          window.scrollTo(0, savedScroll.current[id] ?? 0)
          ScrollTrigger.update()
        }
        setIslandMounted(true)
        setWorldOpen(false)
        requestAnimationFrame(() => worldReturnFocus.current?.focus({ preventScroll: true }))
      }, islands[id].title)
    },
    [navigate, worldOpen, activeIsland],
  )
  const closeWorld = useCallback(() => enterIsland(activeIsland), [enterIsland, activeIsland])
  const [markerLayer, setMarkerLayer] = useState<HTMLDivElement | null>(null)
  const dock = useRef<HTMLElement>(null)
  const [dialog, setDialog] = useState<'settings' | 'notes' | null>(null)
  const [departed, setDeparted] = useState(false)
  const lenis = useRef<Lenis | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const modal = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const detailHeading = useRef<HTMLHeadingElement>(null)
  const onReady = useCallback(() => setSceneReady(true), [])
  const onMapReady = useCallback(() => setMapReady(true), [])
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
    const smooth = new Lenis({ lerp: reduced ? 1 : 0.14, smoothWheel: !reduced })
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
        scrub: reduced ? true : 0.35,
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
    if (selected !== null || dialog !== null || worldOpen || !ready) lenis.current?.stop()
    else lenis.current?.start()
    if (selected !== null) detailHeading.current?.focus({ preventScroll: true })
  }, [selected, dialog, worldOpen, ready, reduced])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected !== null && !dialog && !worldOpen) closeDetail()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [selected, dialog, worldOpen, closeDetail])
  useEffect(() => {
    if (selected === null || dialog || worldOpen || !ready) return
    let reverseScroll = 0
    let lastWheel = 0
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.deltaY >= 0) {
        reverseScroll = 0
        return
      }
      // Let a long story scroll back to its top before leaving the landmark.
      const panel = (event.target as Element).closest?.('.story')
      if (panel && panel.scrollTop > 0) return
      event.preventDefault()
      const now = performance.now()
      if (now - lastWheel > 250) reverseScroll = 0
      lastWheel = now
      reverseScroll +=
        -event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1)
      if (reverseScroll >= 45) closeDetail()
    }
    window.addEventListener('wheel', wheel, { passive: false, capture: true })
    let touchY: number | null = null
    const touchStart = (event: TouchEvent) => {
      const panel = (event.target as Element).closest?.('.story')
      touchY =
        event.touches.length === 1 && (!panel || panel.scrollTop <= 0)
          ? event.touches[0].clientY
          : null
    }
    const touchMove = (event: TouchEvent) => {
      if (touchY === null || event.touches.length !== 1) return
      if (event.touches[0].clientY - touchY > 65) {
        event.preventDefault()
        touchY = null
        closeDetail()
      }
    }
    window.addEventListener('touchstart', touchStart, { passive: true })
    window.addEventListener('touchmove', touchMove, { passive: false })
    return () => {
      window.removeEventListener('wheel', wheel, { capture: true })
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchmove', touchMove)
    }
  }, [selected, dialog, worldOpen, ready, closeDetail])
  useEffect(() => {
    if (dialog) modal.current?.showModal()
    else modal.current?.close()
  }, [dialog])
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      root.current?.style.setProperty('--dock-height', `${entry.borderBoxSize[0].blockSize}px`)
    })
    if (dock.current) observer.observe(dock.current)
    return () => observer.disconnect()
  }, [])
  const go = () =>
    lenis.current?.scrollTo(window.innerHeight * 1.05, { duration: reduced ? 0 : 1.4 })

  return (
    <IslandContext.Provider value={config}>
      <div
        ref={root}
        className={`app ${isWater ? 'is-water7' : ''} ${isEnies ? 'is-enies' : ''} ${isThriller ? 'is-thriller' : ''} ${isSabaody ? 'is-sabaody' : ''} ${isAmazon ? 'is-amazon' : ''} ${isImpel ? 'is-impel' : ''} ${isMarine ? 'is-marine' : ''} ${departed ? 'has-departed' : ''} ${selected !== null ? 'is-exploring' : ''} ${reduced ? 'reduced-motion' : ''}`}
      >
        <div inert={worldOpen || !ready} aria-hidden={worldOpen || undefined}>
          <a className="skip-link" href="#landmarks">
            Skip to island landmarks
          </a>
          <div className="scene" aria-label={`Interactive 3D diorama of ${island.name}`}>
            {islandMounted && (
              <SceneBoundary onError={onReady} sceneId={activeIsland}>
                <Canvas
                  frameloop={worldOpen ? 'never' : 'always'}
                  dpr={quality ? [1, 1.25] : 1}
                  gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
                >
                  <Suspense fallback={null}>
                    <IslandContext.Provider value={config}>
                      <Scene
                        key={activeIsland}
                        selected={selected}
                        hover={hover}
                        reduced={reduced}
                        rain={rain}
                        quality={quality}
                        onSelect={onSelect}
                        onHover={setHover}
                        onReady={onReady}
                        markerLayer={markerLayer}
                        onWorldMap={openWorld}
                      />
                    </IslandContext.Provider>
                  </Suspense>
                </Canvas>
              </SceneBoundary>
            )}
          </div>
          <div ref={setMarkerLayer} className="marker-layer" aria-label="Island map markers">
            <MarkerButtons
              key={activeIsland}
              selected={selected}
              hover={hover}
              onSelect={onSelect}
              onHover={setHover}
              onWorldMap={openWorld}
            />
          </div>
          <div className="paper-wash" aria-hidden="true" />
          <header className="masthead">
            <button
              className="brand"
              onClick={openWorld}
              aria-label="Grand Line Atlas, return to the world map"
            >
              <Icon name="compass" />
              <span>
                GRAND LINE<span className="brand-sub">AN INTERACTIVE ATLAS</span>
              </span>
            </button>
            <nav aria-label="Main navigation">
              <button className="nav-link" onClick={openWorld}>
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
                    <span className="small-rule" /> CHAPTER {config.chapter}{' '}
                    <span className="dot">·</span> {config.region}
                  </div>
                  <h1 id="island-title" className="sr-only">
                    {island.name}
                  </h1>
                  <div className="title-space" aria-hidden="true" />
                  <p className="intro-subtitle">{config.subtitle}</p>
                  <p className="intro-copy">{config.description}</p>
                  <button className="journey-button" onClick={go}>
                    {config.action}{' '}
                    <span>
                      <Icon name="arrow" />
                    </span>
                  </button>
                  <div className="island-meta">
                    <span>GRAND LINE</span>
                    <i />
                    <span>{config.title} ARC</span>
                  </div>
                </section>
                <div className="travel-caption">
                  <span className="eyebrow">
                    {isWater ||
                    isEnies ||
                    isThriller ||
                    isSabaody ||
                    isAmazon ||
                    isImpel ||
                    isMarine
                      ? config.region
                      : 'THE DESERT KINGDOM'}
                  </span>
                  <p>Every place holds a story.</p>
                  <span className="mono">Choose a landmark to look closer.</span>
                </div>
              </>
            ) : (
              <section className="story" aria-labelledby="story-title" data-lenis-prevent>
                <button className="back-button" onClick={closeDetail}>
                  <Icon name="arrow" />
                  Return to the journey <kbd>ESC</kbd>
                </button>
                <span className="eyebrow">
                  {String(selected + 1).padStart(2, '0')} <span className="dot">/</span>{' '}
                  {places[selected].location}
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
                  {/^\d/.test(island.incidents[selected].episodes) ? 'EPISODE ' : ''}
                  {island.incidents[selected].episodes}
                  <span>
                    {isWater || isSabaody || isAmazon || isImpel || isMarine
                      ? 'Story reference'
                      : 'Official episode notes'}{' '}
                    ↗
                  </span>
                </a>
                <div className="story-actions">
                  {!isEnies &&
                    !isThriller &&
                    !isSabaody &&
                    !isAmazon &&
                    !isImpel &&
                    !isMarine &&
                    (isWater ? selected === 4 : selected === 0) && (
                      <button
                        className={`rain-story ${rain ? 'active' : ''}`}
                        onClick={() => setRain((v) => !v)}
                      >
                        <Icon name={rain ? 'sun' : 'rain'} />
                        {isWater
                          ? rain
                            ? 'Calm the sea'
                            : 'Aqua Laguna'
                          : rain
                            ? 'Return to the desert sun'
                            : 'Let the rain return'}
                      </button>
                    )}
                  <button
                    className="next-story"
                    onClick={() => onSelect((selected + 1) % places.length)}
                  >
                    Next landmark <Icon name="arrow" />
                  </button>
                </div>
              </section>
            )}
            <aside className="scene-aside">
              <div className="location-stamp">
                <span className="stamp-dot" />
                <span>{config.region}</span>
              </div>
              <div className="north">
                <span>N</span>
                <Icon name="compass" />
                <span className="north-rule" />
              </div>
            </aside>
            <div className="scene-controls">
              {isEnies ? (
                <span className="weather">
                  <Icon name="sun" />
                  Perpetual daylight
                </span>
              ) : (
                <button
                  className={rain ? 'weather active' : 'weather'}
                  onClick={() => setRain((v) => !v)}
                  aria-pressed={rain}
                >
                  <Icon
                    name={
                      isThriller || isSabaody || isAmazon || isImpel || isMarine
                        ? 'compass'
                        : rain
                          ? 'rain'
                          : 'sun'
                    }
                  />
                  <span>{config.weather[rain ? 1 : 0]}</span>
                </button>
              )}
              <button className="merry-departure" onClick={openWorld}>
                <Icon name="map" />
                <span>
                  {isWater || isEnies || isThriller || isSabaody || isAmazon || isImpel || isMarine
                    ? 'Return to the world chart'
                    : 'Set sail on the Going Merry'}
                  <small>OPEN THE WORLD MAP</small>
                </span>
                <Icon name="arrow" />
              </button>
              <span className="scroll-hint">
                <span className="mouse" />
                SCROLL TO TRAVEL
              </span>
            </div>
          </main>
          <footer ref={dock} className="island-dock" id="landmarks" tabIndex={-1}>
            <div className="dock-heading">
              <span className="eyebrow">EXPLORE {config.title}</span>
              {isImpel ? (
                <select
                  className="level-picker"
                  aria-label="Choose Impel Down landmark or level"
                  value={selected ?? ''}
                  onChange={(e) => {
                    if (e.target.value !== '') onSelect(Number(e.target.value))
                  }}
                >
                  <option value="">Choose a prison level</option>
                  {places.map((place, i) => (
                    <option key={place.name} value={i}>
                      {String(i + 1).padStart(2, '0')} · {place.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{config.landmarkHint}</span>
              )}
            </div>
            <nav className="landmark-list" aria-label="Island landmarks" data-lenis-prevent>
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
                  <span className="landmark-index">{String(i + 1).padStart(2, '0')}</span>
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
        </div>
        <Loading ready={ready} destination={destination} mapReady={mapReady} />
        {worldOpen && (
          <WorldMap
            onEnterIsland={enterIsland}
            onClose={closeWorld}
            onReady={onMapReady}
            interactive={ready}
          />
        )}
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
                    High visual quality
                    <small>Extra reflections and bloom. Balanced rendering is the default.</small>
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
                  An independent fan-made world atlas inspired by Eiichiro Oda’s One Piece. The
                  chart spans all four seas and the New World through Elbaph. Explore Alabasta,
                  Water 7, Enies Lobby, Thriller Bark, Sabaody, Amazon Lily, Impel Down and
                  Marineford in interactive 3D.
                </p>
                <p>
                  The architecture is an original 3D interpretation based on anime references. The
                  desert settlements and Water 7’s terraces, shipyards and rail outposts form
                  compressed dioramas. Distances and placements are illustrative; Water 7 uses a
                  historical arrival setting, with later events described in its stories. Enies
                  Lobby reconstructs the intact rescue-era architecture; the Merry appears at the
                  escape viewpoint as a remembered event. Thriller Bark preserves an intact
                  arrival-era ship, with four interpreted room cutaways and later events recalled in
                  stories. Sabaody depicts the intact first-arrival groves, with later reunion
                  events recalled in text. Amazon Lily depicts the Kuja kingdom during Luffy�s first
                  visit. Impel Down is an architectural cutaway of the intact infiltration-era
                  prison; its connecting rooms are interpreted and later escape events are recalled
                  in text. Marineford depicts the intact original headquarters before the war, with
                  open water in the bay and no combat crowds. Distances are compressed for this
                  atlas.
                </p>
                <p>
                  Story summaries link to official episode notes and location references. One Piece
                  and its characters belong to their respective rights holders.
                </p>
                <p>
                  The atlas includes manga spoilers through Elbaph, with a content review dated 17
                  October 2026. Illustrated positions are not official geographic coordinates;
                  uncharted places stay in the directory. This is a curated atlas, not a live
                  chapter feed.
                </p>
                <div className="credits">
                  <a
                    href={
                      isMarine
                        ? 'https://one-piece.com/story/marineford/index.html'
                        : isImpel
                          ? 'https://one-piece.com/story/impel_down/index.html'
                          : isAmazon
                            ? 'https://one-piece.com/story/amazon_lily/index.html'
                            : isSabaody
                              ? 'https://one-piece.com/story/sabaody/index.html'
                              : isThriller
                                ? 'https://one-piece.com/story/thriller_bark/index.html'
                                : isEnies
                                  ? 'https://one-piece.com/story/enies_lobby/index.html'
                                  : isWater
                                    ? 'https://one-piece.com/story/water_seven/index.html'
                                    : 'https://one-piece.com/anime/126/index.html'
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official story reference ↗
                  </a>
                  <a
                    href="https://polyhaven.com/a/potsdamer_platz"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Environment light · Poly Haven (CC0) ↗
                  </a>
                  <span>Type · Cinzel, DM Sans & IBM Plex Mono (OFL)</span>
                </div>
              </>
            )}
          </div>
        </dialog>
      </div>
    </IslandContext.Provider>
  )
}
