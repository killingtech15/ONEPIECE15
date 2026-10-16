# ONEPIECE15 · Grand Line Atlas

A desktop-first, interactive Alabasta diorama. First milestone for a pre-timeskip One Piece world atlas. The project is local-only for now; no hosting or deployment has been configured.

## Run

Requires Node.js 22.12+ (tested with Node 24) and a modern desktop browser with WebGL 2 and hardware acceleration.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. `npm run build` creates the static production site in `dist/`; `npm run preview` serves that build. The committed model, HDR environment and fonts are self-hosted; runtime asset loading does not depend on Sketchfab or a font CDN.

## Explore

- Scroll or select **Enter the kingdom** to follow the curved camera route.
- Hover over a map marker or its bottom navigation entry to animate that landmark.
- Select a landmark to stop scrolling and move the camera closer. **Escape** or **Return to the journey** restores the previous route position.
- Visit the palace, clock tower, Rain Dinners and coastline. Each stop has a short story and an official episode reference.
- Toggle **Desert sun** / **The rain returns** to change the atmosphere.
- Open **The atlas** for the local schematic, **Field notes** for references, or **Experience settings** for reduced motion and rendering quality.
- Keyboard users can reach every landmark through the bottom navigation. Reduced-motion preferences are respected on initial load.

## Rendering and assets

React 19, TypeScript, Vite, React Three Fiber, Drei, Three.js, GSAP, Lenis and postprocessing.

- Original reference-based geometry: about 102,000 triangles, consolidated into one static island mesh.
- Blender Cycles diffuse lighting (color, direct and indirect light, including contact shading) baked into a 4096px atlas; optional OpenImageDenoise cleanup. The browser uses an unlit `MeshBasicMaterial`, with no realtime island shadows.
- Custom Gerstner ocean vertex displacement and a scene-depth texture for shallow color and shoreline foam.
- Glass Log Pose using transmission, IOR 1.52, thickness 2.5, roughness 0.05 and chromatic aberration 0.1. A local city HDR supplies reflections.
- SMAA, selected-object bloom for the needle, and a restrained camera-velocity chromatic effect.
- A child camera on a rig follows a Catmull–Rom curve. GSAP/Lenis drive normalized progress; focus transitions interrupt the route without resetting it.
- The main title is Drei text geometry with a simplex-noise texture and shader discard reveal.
- Four occluding HTML markers. Drei's non-transform HTML mode keeps their screen size constant without a second distance-scaling correction.
- The mainland stays anchored so marker coordinates and depth-based shore foam remain stable. The ship bobs, flags move, a falcon circles and hovered Rainbase stirs sand.

## Content and art boundaries

This is an original stylized interpretation, **not an exact anime reconstruction or a geographically accurate world map**. Alubarna, Rainbase and the coast are compressed into one navigable scene. The ship is a simplified visual suggestion, not a detailed character asset. No ripped game models or AI-generated bitmap artwork are included.

The first milestone has four landmarks, not exhaustive arc coverage. Story content stops before the timeskip. Mobile polish, the rest of the world, audio, character models and deployment remain future work.

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

The Playwright tests cover scroll preservation during focus, all four stops, Escape return, weather, atlas navigation, reduced motion, quality switching and missing-model recovery. `node scripts/capture.mjs` saves desktop and palace screenshots under ignored `artifacts/`.

The scene is intended for desktop hardware. The quality toggle reduces pixel density; it does not make this a complete mobile implementation. Large 3D assets and rendering effects still need device-specific profiling before a public release.
