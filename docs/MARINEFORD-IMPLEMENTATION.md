# Marineford — implementation notes

Built locally on 26 October 2026. The scene is an original compressed interpretation of the **intact original headquarters before the Summit War**, around episode 459. It is not New Marineford. No combatants, frozen bay, burning ships or destroyed fortress are mixed into this state.

## Architecture and journey

Fourteen selectable views cover the approach, crescent harbor, cannon battery, eastern quay, western and eastern towns, Oris Plaza, fortified terrace, execution scaffold, Admirals’ dais, headquarters facade, roof galleries, pinnacle lookout and harbor overview.

- One continuous crescent mesh surrounds a genuine open-water inlet. The bay has no hidden ground disk beneath a blue surface.
- A clear forecourt connects to a raised fortified terrace and the small cross-braced timber scaffold. Its rear stair is a simplified authored connection.
- The headquarters has a tapered pale foundation, original dimensional 海軍 strokes and Marine gull, buttresses, entry stairs, red galleries, arched openings, four graduated teal roof levels and curved front gables.
- Four irregular rock pinnacles support watch pavilions, curved roofs and flags. Town houses have doors, windows, balconies, chimneys, separate streets and stepped access.
- Inner and outer cannon lines, wall courses, quay bollards, cargo and trees give the waterfront readable detail.
- One detailed Marine flagship and 24 reduced-detail offshore vessels depict the blockade. This is a representative fleet, not a literal reconstruction of every ship. Hulls, decks, masts, bowed sails, gun ports and rigging are original geometry.

Unseen rear elevations, side streets, precise chair ornament, stairs and dimensions are interpretations. The Gate of Justice, Ox Bell, Moby Dick, interiors and character crowds are outside this model. Event descriptions link to official episodes 459 and 461; the later arrival remains narrative rather than a second physical state.

## Interaction and mobile framing

The atlas has a Marineford 3D entry. Landmark selection uses the established named dock and projected markers. Markers are hidden during introductions and focused stories. Story selection, weather/settings and returning to the journey do not trigger the voyage loader.

Camera framing uses the actual story and dock rectangles. Headquarters facade and roof galleries have separate close views, with full-island overviews available. Focus travel rises above the tallest roof before crossing the island. The original journey progress is retained on return, Escape, reverse wheel and downward touch gesture. Phone stories group source and next actions without internal scrolling.

The harbor toggle freezes the flagship’s bounded vertical bob and calms the ocean. Flags are static authored cloth. The flagship is excluded from static ocean depth; fixed fleet geometry remains in that cache. The shared measured camera now reserves the actual desktop dock height instead of a fixed 70 pixels.

## Build pipeline

```sh
node scripts/build-marineford.mjs --source
blender --background --python scripts/bake-marineford.py
blender --background --python scripts/denoise-marineford.py
```

Geometry, camera targets and ship placement share `src/marineford-layout.json`. Preview generation without `--source` replaces the production asset with vertex-colored geometry; restore the baked export before release. The final asset uses 96-sample Cycles diffuse color/direct/indirect lighting, preserved bake corner normals, architectural UV weighting and OIDN cleanup. The runtime material is unlit with one shared 4096-pixel atlas. Spatial batches retain useful culling.

## Measured costs, separate from targets

Final asset: **166,046 triangles, 53 mesh batches, 11,795,560 bytes (11.25 MiB)**. The 4096 atlas is approximately **85.3 MiB decoded RGBA with mipmaps**, excluding geometry, render targets and other cached scenes.

Headless Chrome, 1440×900, balanced rendering, settled cameras:

| View | Whole-frame draw calls | Sampled triangles including ocean |
| --- | ---: | ---: |
| Approach | 54 | 207,518 |
| Harbor | 49 | 186,938 |
| Cannon battery | 17 | 96,308 |
| Flagship | 45 | 186,418 |
| Western town | 23 | 118,342 |
| Eastern town | 30 | 124,982 |
| Plaza | 33 | 143,002 |
| Terrace | 26 | 133,950 |
| Scaffold | 21 | 105,798 |
| Admirals’ dais | 19 | 98,958 |
| Headquarters facade | 29 | 138,062 |
| Roof galleries | 21 | 119,778 |
| Pinnacle | 32 | 141,522 |
| Harbor overview | 54 | 207,518 |

Sampled camera travel reached **106 calls / 365,696 triangles**, including the static ocean-depth refresh. Settled focused views are below the plan’s 100-call target; this is not an FPS measurement.

Full flagship source bounds: X **329.28–370.72**, Y **−4–72**, Z **14.58–96.16**. Minimum radial shore clearance is **25.00 units** against the conservative radius-310 island envelope; full sail/rigging clearance from the quay’s X=322 edge is **7.28 units**. Bob is vertical-only **±0.06**, preserving horizontal clearances. A narrow gangway intentionally connects the quay to the deck.

Physical-phone FPS, high-quality GPU cost and context-loss recovery remain unmeasured.


## Final asset corrections — 28 October 2026

The final review corrected upward deck normals, replaced crossing front/back sail triangulations with matching outward faces and thin edge closures, and separated coincident flag faces. This removed dark bake patches without additional textures. Raised town pads now end at house floor height, keeping the higher rows’ doorways visible. These changes are included in the measurements above.

## Verification — 28 October 2026

- All fourteen final landmark renders visually reviewed at 1440×900 and 390×740. Card/layout checks also passed at 360×640, 320×568 and 844×390, with complete actions and no story-card inner scroll.
- Thirteen browser tests passed across Marineford, Impel Down, Amazon Lily and atlas navigation. A separate phone test passed after tightening atlas button spacing: every 3D control has a nonoverlapping 44px target, and both Impel Down and Marineford open directly.
- Normal camera segments sampled across all fourteen Marineford selections did not intersect model geometry. Touch return, reverse wheel, Escape, cached re-entry, reduced motion and missing-model recovery passed.
- Production build passed; the existing large JavaScript chunk warning remains. The served and production Marineford GLBs match SHA-256 `14771D516002B6A820745811CBAC3B69BBAE2A9B328156AB2D49B2DAD11D2BEE`.
