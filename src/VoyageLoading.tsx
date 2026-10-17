import { useProgress } from '@react-three/drei'
import './voyage-loading.css'

export default function VoyageLoading({
  ready,
  destination,
  mapReady,
}: {
  ready: boolean
  destination: string
  mapReady: boolean
}) {
  const { progress: modelProgress } = useProgress()
  const progress = ready
    ? 100
    : destination === 'WORLD CHART'
      ? mapReady
        ? 100
        : 0
      : modelProgress
  return (
    <div
      className={`loading voyage-loading ${ready ? 'is-ready' : ''}`}
      aria-hidden={ready}
      role="status"
      aria-live="polite"
    >
      <div className="voyage-scenery" aria-hidden="true">
        <div className="voyage-sun" />
        <div className="voyage-clouds clouds-far">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="voyage-clouds clouds-near">
          <i />
          <i />
          <i />
        </div>
        <div className="voyage-island">
          <span />
          <span />
          <span />
        </div>
        <svg className="voyage-waves waves-back" viewBox="0 0 1440 160" preserveAspectRatio="none">
          <path d="M0 30Q90 0 180 30T360 30T540 30T720 30T900 30T1080 30T1260 30T1440 30V160H0Z" />
        </svg>
        <div className="voyage-traveller">
          <svg className="voyage-ship" viewBox="0 0 240 200">
            <path
              className="voyage-wake"
              d="M12 177Q60 166 118 177T224 177M35 186Q95 178 171 186"
            />
            <g className="voyage-boat">
              <path fill="#754e34" d="M37 145H198L181 171Q110 190 59 167Z" />
              <path fill="#c49855" d="M40 145H199L194 154H49Z" />
              <path
                fill="none"
                stroke="#543d2b"
                strokeWidth="4"
                d="M117 28V145M67 66V145M177 77V145"
              />
              <path
                fill="#fff3d6"
                stroke="#b69b71"
                strokeWidth="1.5"
                d="M112 43Q66 67 70 122L112 125ZM123 43Q171 69 166 121L123 125ZM63 78Q35 100 39 128H63ZM181 91Q206 112 203 131H181Z"
              />
              <path fill="#bc6c48" d="M117 27Q132 16 151 28L138 34L151 42Q132 33 117 43Z" />
              <circle cx="139" cy="88" r="9" fill="#29575c" />
              <path stroke="#f8eac7" strokeWidth="2" d="m134 85 10 8m-10 0 10-8" />
              <path fill="none" stroke="#c49855" strokeWidth="3" d="M73 162h87" />
              <circle cx="197" cy="141" r="9" fill="#dfb570" />
            </g>
          </svg>
        </div>
        <svg className="voyage-waves waves-front" viewBox="0 0 1440 160" preserveAspectRatio="none">
          <path d="M0 30Q90 0 180 30T360 30T540 30T720 30T900 30T1080 30T1260 30T1440 30V160H0Z" />
        </svg>
        <div className="voyage-streaks">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="voyage-copy">
        <span className="eyebrow">THE GRAND LINE ATLAS</span>
        <p>Across the sea, another story.</p>
        <span className="voyage-destination">SETTING SAIL · {destination}</span>
        <div
          className="loading-line"
          role="progressbar"
          aria-label="Loading destination"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <span className="voyage-footnote">FOLLOW THE CURRENT. FIND YOUR NEXT ISLAND.</span>
    </div>
  )
}
