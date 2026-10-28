# ONEPIECE15 · Grand Line Atlas

A responsive world atlas that opens on the supplied OnePiece15 map. Select Alabasta, Water 7, Enies Lobby, Thriller Bark, Sabaody, Amazon Lily, Impel Down or Marineford to enter an interactive 3D diorama. Build output is a static site suitable for Vercel or another static host.

## Run

Requires Node.js 22.12+ (tested with Node 24) and a modern desktop browser with WebGL 2 and hardware acceleration.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. `npm run build` creates the static production site in `dist/`; `npm run preview` serves that build. The committed model, HDR environment and fonts are self-hosted; runtime asset loading does not depend on Sketchfab or a font CDN.

## Explore

- On phones, **Browse** opens map search, filters and location details. Drag to pan, pinch or use the zoom buttons, and tap a location. Island landmarks scroll horizontally; complete story cards fit their content without inner scrolling. Swipe downward to return to the journey, or use the return button. Markers stay hidden during the introduction and while a story is open so they cannot cover the text.
- The world map opens first. Click **Alabasta**, **Water 7** or **Enies Lobby** on the chart or in search results to enter that island. The animated sea, clouds and travelling-ship transition plays on initial load and between the map and island scenes. Landmark stories, settings and weather changes have no loading transition.
- Scroll or select **Enter the kingdom** to follow the curved camera route.
- Hover over a map marker or its bottom navigation entry to animate that landmark.
- Select a landmark to stop scrolling and frame it beside its story. Each landmark has its own viewing radius, adapted to the screen aspect ratio. Scroll upward, press **Escape**, or select **Return to the journey** to restore the journey camera. Phone story cards fit without inner scrolling.
- Alabasta has eight landmarks: the royal palace, clock tower, Rain Dinners, Sandora River, Nanohana, Yuba, Erumalu and Katorea. Water 7 adds fourteen stops across its terraces, canals, shipyards and railway. Enies Lobby adds fourteen stops from Day Station through the waterfall chasm, Tower of Justice and Gates of Justice. Each stop has a short story and a source link.
- Toggle **Desert sun** / **The rain returns** in Alabasta, or **Clear canals** / **Aqua Laguna** in Water 7. Water 7 also has waterfalls, a moving sea train and a Bull boat; reduced motion keeps these still.
- Board the **Going Merry** at Nanohana's arrival waterfront (or select **The atlas**) to open the world chart. Pan, zoom, search the expanded world directory, toggle the Straw Hat route, and return to the same island journey position. Arrow keys pan the chart; +/− zoom. Alabasta, Water 7, Enies Lobby, Thriller Bark, Sabaody and Amazon Lily have 3D scenes; other locations have chart entries.
- Thriller Bark has sixteen viewpoints, four room cutaways, and **Florian mist** / **Clearer view**. The Sunny bobs gently; reduced motion freezes it. Rooms close when returning to the journey.
- Open **Field notes** for references or **Experience settings** for reduced motion and rendering quality.
- Keyboard users can reach every landmark through the bottom navigation. Reduced-motion preferences are respected on initial load.

## Rendering and assets

React 19, TypeScript, Vite, React Three Fiber, Drei, Three.js, GSAP, Lenis and postprocessing.

- Alabasta: original reference-based geometry, about 132,000 triangles, consolidated into one static island mesh, with smoother dome profiles and additional settlements.
- Water 7: about 134,000 static triangles in 54 spatial batches sharing a baked lighting atlas. The model loads on first entry; normal frustum culling skips offscreen districts. It does not stream individual districts or use separate LOD assets. See [Water 7 implementation notes](docs/WATER-7-IMPLEMENTATION.md) for measurements and scope.
- Amazon Lily: twelve viewpoints across a hollow mountain, Kuja town, cliff palace, arena and Perfume Yuda. The 14.64 MiB Cycles-baked asset has 206,945 triangles in 64 batches. See [implementation notes](docs/AMAZON-LILY-IMPLEMENTATION.md).
- Sabaody Archipelago: 79 numbered groves, 16 landmark views, an auction cutaway, instanced bubbles and an upright-gondola Ferris wheel. The 13.41 MiB baked model has 220,532 triangles in 73 batches. See [implementation notes](docs/SABAODY-IMPLEMENTATION.md).
- Thriller Bark: 149,846 authored triangles in 47 batches, including four selectable room cutaways, a separate Thousand Sunny, three masts and the surrounding ship hull. See [implementation notes](docs/THRILLER-BARK-IMPLEMENTATION.md).
- Enies Lobby: 46,032 static triangles, 26 spatial batches and a 5.97 MiB baked GLB. Includes a masked waterfall chasm, separate landmasses, perpetual daylight and a story-specific Merry. See [implementation notes](docs/ENIES-LOBBY-IMPLEMENTATION.md).
- Blender Cycles diffuse lighting (color, direct and indirect light, including contact shading) baked into a 4096px atlas; optional OpenImageDenoise cleanup. The browser uses an unlit `MeshBasicMaterial`, with no realtime island shadows.
- Custom Gerstner ocean vertex displacement and a scene-depth texture for shallow color and shoreline foam. The depth pass renders static land only, after the camera updates, and is reused while the camera is still. The Sandora channel is carved below the waterline.
- Balanced rendering is the default: native antialiasing, DPR 1, lightweight transparent Log Pose glass, no postprocessing passes. Texture filtering uses mipmaps and up to 8× anisotropy.
- High quality adds transmission (IOR 1.52, thickness 2.5, roughness 0.05, chromatic aberration 0.1), SMAA, selective needle bloom and camera-velocity distortion, at up to DPR 1.25. Both modes use a local HDR for reflections. The 3D render loop pauses while the world chart is open.
- A child camera on a rig follows a Catmull–Rom curve. GSAP/Lenis drive normalized progress; focus transitions interrupt the route without resetting it.
- The main title is Drei text geometry with a simplex-noise texture and shader discard reveal.
- Each island�s landmark markers and Going Merry entry share one DOM overlay. Their world anchors project directly after the camera update, without per-frame island raycasts or building-occlusion toggles. Marker hit circles remain 44px; the canvas and marker layer share the dock's measured boundary.
- The mainland stays anchored so marker coordinates and depth-based shore foam remain stable. The ship bobs, flags move, a falcon circles and hovered Rainbase stirs sand.

## Content and art boundaries

This is an original stylized interpretation, **not an exact anime reconstruction or a geographically accurate world map**. Alubarna, Rainbase and the coast are compressed into one navigable scene. The ship is a simplified visual suggestion, not a detailed character asset. No ripped game models or AI-generated bitmap artwork are included.

Alabasta has eight landmarks; Water 7 and Enies Lobby each have fourteen; Thriller Bark and Sabaody each have sixteen; Amazon Lily has twelve; Impel Down has fourteen views across its surface fortress and prison cutaway. Marineford adds fourteen views of the intact prewar headquarters, open crescent harbor, scaffold and fleet. These dioramas do not offer exhaustive arc coverage or playable interiors. The world chart uses the user-supplied [OnePiece15 Map.png](OnePiece15%20Map.png); the expanded location directory spans the four Blues, Paradise, the New World and uncharted destinations. Country and sea filters make the chart searchable. Locations with unknown positions have directory entries without fabricated pins. Story coverage includes manga spoilers through Elbaph, reviewed 17 October 2026; it is not a live chapter feed. Alabasta, Water 7, Enies Lobby, Thriller Bark, Sabaody, Amazon Lily, Impel Down and Marineford have 3D island models. Additional islands, audio and character models remain future work; real-phone performance still requires hardware profiling.

### Map image quality

The overview uses a 7000px preview. Zoomed views load only nearby 1024px lossless PNG tiles cut directly from the original 14171 × 7087 image. The chart is laid out at its actual display size rather than scaling a cached GPU layer, keeping labels sharp. Maximum zoom is limited to the source resolution for the display's pixel density. The tiles total about 61 MB on disk, but are requested only around the visible area after zooming in.

Rebuild the full-resolution tiles with `powershell -ExecutionPolicy Bypass -File scripts/build-map.ps1` after replacing the source map. If the source dimensions change, update the dimensions and marker positions in the chart code too.

The supplied schema is preserved in [src/world.json](src/world.json); landmark view offsets and references live in [src/world.ts](src/world.ts). See [the original specification](docs/original-spec.md), [art direction](docs/ART-DIRECTION.md) and [credits](docs/CREDITS.md).

## Rebuild the model

The exported GLBs are included, so Blender is **not** needed to run or build the website. To change Alabasta's architecture, edit the geometry generator and then run:

```sh
npm run model
blender --background --threads 6 --python scripts/bake-alabasta.py
blender --background --threads 6 --python scripts/denoise-alabasta.py
```

Blender 4.5 LTS was used. The scripts place source GLBs, the working Blender scene and intermediate textures in ignored `.tools/`. They export the final asset to `public/models/alabasta-baked.glb`. Local portable Blender downloads and research images are excluded from Git.

Rebuild Water 7 with the same offline lighting approach:

```sh
npm run model:water7
blender --background --threads 6 --python scripts/bake-water7.py
```

This exports `public/models/water7.glb` and its metrics. Running `node scripts/build-water7.mjs` without `--source` replaces the final model with a quick vertex-lit geometry preview; run the bake again before release.

Rebuild Enies Lobby with `node scripts/build-enies-lobby.mjs --source`, then `blender --background --threads 6 --python scripts/bake-enies-lobby.py`. This exports its GLB and measured static metrics.

Rebuild Amazon Lily with `node scripts/build-amazon-lily.mjs --source`, then Blender running `scripts/bake-amazon-lily.py` and `scripts/denoise-amazon-lily.py`.

Rebuild Sabaody with `node scripts/build-sabaody.mjs --source`, then Blender running `scripts/bake-sabaody.py` and `scripts/denoise-sabaody.py`. See its implementation notes for the weighted lighting atlas and measurement details.

## Verification

```sh
npm run build
npm run dev
# In another terminal, with Chrome installed:
npm test
```

The Playwright tests cover all eight stops, scroll preservation, Escape return, weather, chart search and zoom, route toggling, keyboard panning, focus restoration, reduced motion, quality switching, marker stability, desktop text sizes, dock alignment and missing-model recovery. `node scripts/capture.mjs` and `node scripts/capture-world.mjs` save desktop, palace and world-chart screenshots under ignored `artifacts/`.

Desktop and phone layouts are covered in browser tests, including 360×640 and 390×740 story cards without nested scrolling. Balanced mode removes expensive effects as well as reducing pixel density. Emulation does not establish real-device frame rates; Android and iOS hardware profiling remains a separate check. Vite ignores asset-generation and screenshot directories to avoid Windows file-lock watcher errors during development.

## Impel Down and Marineford

Impel Down is available from the atlas with six main floors, a hidden Newkama refuge and fourteen views. See [implementation notes](docs/IMPEL-DOWN-IMPLEMENTATION.md) for interpretation limits, rendering modes and measured costs. Rebuild with `node scripts/build-impel-down.mjs --source`, then Blender running `scripts/bake-impel-down.py` and `scripts/denoise-impel-down.py`.

Marineford has fourteen views of the intact prewar headquarters, crescent bay, towns, scaffold and Marine fleet. See [implementation notes](docs/MARINEFORD-IMPLEMENTATION.md). Rebuild with `node scripts/build-marineford.mjs --source`, then Blender running `scripts/bake-marineford.py` and `scripts/denoise-marineford.py`.

Impel Down offers a visible prison-level selector; on phones it replaces the horizontal landmark strip. Nearby 3D atlas buttons use leader lines to their unchanged map anchors so they remain individually tappable.
