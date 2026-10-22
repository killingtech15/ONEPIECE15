# Enies Lobby implementation

Built locally on 22 October 2026. This is the third selectable 3D island in the atlas. The [original plan](ENIES-LOBBY-PLAN.md) records proposals; this document describes the implemented exterior and its limits.

## Model and setting

An intact rescue-era reconstruction: perpetual daylight, three separated landmasses, a broad judicial town, courthouse and rooftop, paired bridge controls, a stepped Tower of Justice, balcony, passage exit, supported Bridge of Hesitation and monumental two-leaf Gates of Justice. Fourteen selectable views connect these places to short, sourced stories.

The entrance includes a covered Day Station platform, rail approach, keyhole gate openings, cylindrical gate towers and green/gold relief. The town has a broad central avenue and forecourt. The tower has stepped terraces, patterned panels, balconies, side windows and attached lettering. The Gates have a curved silhouette, raised border, emblem and center seam.

The waterfall has an actual ocean cutout, descending flow surface, foam rim and dark floor. Main island and tower foundations remain separated by open space. Flags and waterfall flow animate; reduced motion freezes them. The Merry appears only at the remembered escape stop. It reuses the project's stylized ship, placed beside the bridge rather than at the arrival station.

Layout is authored in `src/enies-layout.json`, with Y up and sea level zero. Chasm radius is 185 units and depth 135; the gate reaches 280 units high. These are original composition choices, not canonical dimensions. Exact secondary facades, station roof details and town buildings are interpretive. References and narrative sources are listed in [credits](CREDITS.md#enies-lobby).

## Experience

- Atlas entry, directory search, hover/focus 3D labels and brand return use the shared navigation.
- Each landmark has its own target, radius and viewing direction. The camera measures the story/intro area and fits the subject in the available region.
- Overview and travelling camera blend across a progress interval. Returning from a landmark restores saved journey progress, including reverse wheel and downward touch swipe.
- Phone cards show complete text, source and next action without nested scrolling. Long dock labels determine their entry width instead of overflowing adjacent entries. Landscape uses compact introductory text and separate controls.
- Scene changes retain the voyage loader. Landmark selection and return do not invoke it.
- A failed GLB still permits returning to the atlas. Enies Lobby has no night or rain toggle.

## Asset and measured rendering costs

| Measurement | Result |
| --- | --- |
| Static GLB triangles | 46,032 |
| Static spatial batches | 26 |
| GLB bytes | 6,263,512 (5.97 MiB) |
| Bake | Blender 4.5.8, Cycles diffuse direct/indirect/color, 24 samples |
| Atlas | One 4096px texture; unlit runtime materials |
| Decoded atlas estimate | Approximately 85.3 MiB for RGBA plus mipmaps, without GPU compression |
| Sampled rendered frames | 27–92 calls and 55,478–91,312 triangles at four desktop story views |
| Renderer resources in that session | 103 geometries normally, 123 with Merry; 7 textures |

The frame samples came from local headless Chrome, 1440×900, balanced quality, normal motion. A development-only counter resets renderer statistics before the frame and samples after rendering, so a refreshed ocean depth pass is included. Samples are not a maximum over all views, a GPU memory total, an FPS measurement or a phone performance guarantee. Other renderer resources include shared water, flags, UI geometry, reflection environment and render targets. High-quality postprocessing was not profiled.

The model is lighter than the initial 8–12 MiB / 140k–180k triangle target. The decoded texture cost still warrants physical-device profiling. The scene loads on entry and pauses behind the atlas; this is not district streaming or a set of LOD assets.

## Build pipeline

```sh
node scripts/build-enies-lobby.mjs --source
blender --background --threads 6 --python scripts/bake-enies-lobby.py
npm run build
```

`scripts/enies-city.mjs` authors the architecture; the builder batches geometry. The bake writes `public/models/enies-lobby.glb` and its metrics JSON. Source GLB, Blender scene and working texture remain under ignored `.tools/`. No reference still is shipped as a texture. Running the builder without `--source` writes a quick vertex-lit preview; rebake before release.

## Verification

- Inspected all fourteen desktop and phone landmark views, plus narrow portrait and landscape introductions. Fixed baked face orientation artifacts, gate relief depth conflicts, dock label collisions and landscape control overlap during review.
- Automated all fourteen cards at 1440×900, 390×740, 360×640, 320×568 and 844×390: card bounds, source/action visibility, no inner scroll and no landmark loading overlay.
- Checked reverse-wheel return, touch return, normal-motion water updates, repeated island switching and failed-model recovery.
- Swept the Merry's rendered bounds through 27 bob/yaw/roll combinations. The conservative horizontal clearance is 95.57 authoring units from the waterfall and 35.15 from the nearest bridge support; the hull reaches below sea level. Confirmed visually at the escape stop.
- Verified live ocean near/far uniforms against each island's active camera. The previous stale initial values caused incorrect distant water and shoreline rendering; the shader now updates its rendered material. Fine water ripples fade below pixel resolution.
- Existing mobile, map-navigation and Water 7 regression suites passed alongside the Enies checks. Production TypeScript/Vite build passed; Vite still reports the existing large JavaScript chunk advisory.
- Screenshots and test output remain in ignored `artifacts/`.

## Explicit limits

This milestone provides exterior architecture and story viewpoints. It has no playable CP9 rooms, character models, battle/destruction simulation, full underwater tunnel, animated drawbridge, Buster Call fleet or additional moving Sea Train. The underground route is represented by its visible mouths and story, not a false surface bridge. Distances and details are stylized.

Physical Android/iOS frame times, mobile browser toolbar changes, GPU context-loss recovery, long-session GPU memory behavior and enlarged system-text accessibility remain unverified on hardware. The tested default viewport layouts are not evidence for those separate cases.
