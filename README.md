# ONEPIECE15 · Grand Line Atlas

A responsive world atlas that opens on the supplied OnePiece15 map. Select Alabasta to enter its interactive 3D diorama. The project is local-only for now; no hosting or deployment has been configured.

## Run

Requires Node.js 22.12+ (tested with Node 24) and a modern desktop browser with WebGL 2 and hardware acceleration.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. `npm run build` creates the static production site in `dist/`; `npm run preview` serves that build. The committed model, HDR environment and fonts are self-hosted; runtime asset loading does not depend on Sketchfab or a font CDN.

## Explore

- On phones, **Browse** opens map search, filters and location details. Drag to pan, pinch or use the zoom buttons, and tap a location. Island landmarks scroll horizontally; stories use a scrollable bottom card in portrait. Swipe downward from the top of a story to return to the journey, or use its return button.
- The world map opens first. Click **Alabasta** on the chart or in search results to enter the existing island model. The animated sea, clouds and travelling-ship transition plays on initial load and between the map and island scenes. Landmark stories open and close without a loading transition.
- Scroll or select **Enter the kingdom** to follow the curved camera route.
- Hover over a map marker or its bottom navigation entry to animate that landmark.
- Select a landmark to stop scrolling and frame it beside its story. Each landmark has its own viewing radius, adapted to the screen aspect ratio. Scroll upward, press **Escape**, or select **Return to the journey** to restore the journey camera. If the story panel is scrolled down, scrolling upward first returns its text to the top.
- Visit eight landmarks: the royal palace, clock tower, Rain Dinners, Sandora River, Nanohana, Yuba, Erumalu and Katorea. Each stop has a short story and a source link.
- Toggle **Desert sun** / **The rain returns** to change the atmosphere.
- Board the **Going Merry** at Nanohana's arrival waterfront (or select **The atlas**) to open the world chart. Pan, zoom, search the expanded world directory, toggle the Straw Hat route, and return to the same Alabasta journey position. Arrow keys pan the chart; +/− zoom. The other locations currently have chart entries, not 3D scenes.
- Open **Field notes** for references or **Experience settings** for reduced motion and rendering quality.
- Keyboard users can reach every landmark through the bottom navigation. Reduced-motion preferences are respected on initial load.

## Rendering and assets

React 19, TypeScript, Vite, React Three Fiber, Drei, Three.js, GSAP, Lenis and postprocessing.

- Original reference-based geometry: about 132,000 triangles, consolidated into one static island mesh, with smoother dome profiles and additional settlements.
- Blender Cycles diffuse lighting (color, direct and indirect light, including contact shading) baked into a 4096px atlas; optional OpenImageDenoise cleanup. The browser uses an unlit `MeshBasicMaterial`, with no realtime island shadows.
- Custom Gerstner ocean vertex displacement and a scene-depth texture for shallow color and shoreline foam. The depth pass renders static land only, after the camera updates, and is reused while the camera is still. The Sandora channel is carved below the waterline.
- Balanced rendering is the default: native antialiasing, DPR 1, lightweight transparent Log Pose glass, no postprocessing passes. Texture filtering uses mipmaps and up to 8× anisotropy.
- High quality adds transmission (IOR 1.52, thickness 2.5, roughness 0.05, chromatic aberration 0.1), SMAA, selective needle bloom and camera-velocity distortion, at up to DPR 1.25. Both modes use a local HDR for reflections. The 3D render loop pauses while the world chart is open.
- A child camera on a rig follows a Catmull–Rom curve. GSAP/Lenis drive normalized progress; focus transitions interrupt the route without resetting it.
- The main title is Drei text geometry with a simplex-noise texture and shader discard reveal.
- Eight landmark markers and a Going Merry entry share one DOM overlay. Their world anchors project directly after the camera update, without per-frame island raycasts or building-occlusion toggles. Marker hit circles remain 44px; the canvas and marker layer share the dock's measured boundary.
- The mainland stays anchored so marker coordinates and depth-based shore foam remain stable. The ship bobs, flags move, a falcon circles and hovered Rainbase stirs sand.

## Content and art boundaries

This is an original stylized interpretation, **not an exact anime reconstruction or a geographically accurate world map**. Alubarna, Rainbase and the coast are compressed into one navigable scene. The ship is a simplified visual suggestion, not a detailed character asset. No ripped game models or AI-generated bitmap artwork are included.

The island has eight landmarks, not exhaustive arc coverage. The world chart uses the user-supplied [OnePiece15 Map.png](OnePiece15%20Map.png); the expanded location directory spans the four Blues, Paradise, the New World and uncharted destinations. Country and sea filters make the chart searchable. Locations with unknown positions have directory entries without fabricated pins. Story coverage includes manga spoilers through Elbaph, reviewed 17 October 2026; it is not a live chapter feed. Only Alabasta has a 3D island model. Mobile polish, additional 3D islands, audio, character models and deployment remain future work.

### Map image quality

The overview uses a 7000px preview. Zoomed views load only nearby 1024px lossless PNG tiles cut directly from the original 14171 × 7087 image. The chart is laid out at its actual display size rather than scaling a cached GPU layer, keeping labels sharp. Maximum zoom is limited to the source resolution for the display's pixel density. The tiles total about 61 MB on disk, but are requested only around the visible area after zooming in.

Rebuild the full-resolution tiles with `powershell -ExecutionPolicy Bypass -File scripts/build-map.ps1` after replacing the source map. If the source dimensions change, update the dimensions and marker positions in the chart code too.

The supplied schema is preserved in [src/world.json](src/world.json); landmark view offsets and references live in [src/world.ts](src/world.ts). See [the original specification](docs/original-spec.md), [art direction](docs/ART-DIRECTION.md) and [credits](docs/CREDITS.md).

## Rebuild the model

The exported GLB is committed, so Blender is **not** needed to run or build the website. To change the architecture, edit the geometry generator and then run:

```sh
npm run model
blender --background --threads 6 --python scripts/bake-alabasta.py
blender --background --threads 6 --python scripts/denoise-alabasta.py
```

Blender 4.5 LTS was used. The scripts place source GLBs, the working Blender scene and intermediate textures in ignored `.tools/`. They export the final asset to `public/models/alabasta-baked.glb`. Local portable Blender downloads and research images are excluded from Git.

## Verification

```sh
npm run build
npm run dev
# In another terminal, with Chrome installed:
npm test
```

The Playwright tests cover all eight stops, scroll preservation, Escape return, weather, chart search and zoom, route toggling, keyboard panning, focus restoration, reduced motion, quality switching, marker stability, desktop text sizes, dock alignment and missing-model recovery. `node scripts/capture.mjs` and `node scripts/capture-world.mjs` save desktop, palace and world-chart screenshots under ignored `artifacts/`.

The scene is intended for desktop hardware. Balanced mode removes expensive effects as well as reducing pixel density. Device-specific profiling and mobile work remain before a public release. Vite ignores asset-generation and screenshot directories to avoid Windows file-lock watcher errors during development.
