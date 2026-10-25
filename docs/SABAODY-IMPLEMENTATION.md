# Sabaody Archipelago

First implementation, 26 October 2026. Research and composition are recorded in the [plan](SABAODY-PLAN.md).

## Built scene

- Eight connected root-platform districts and 79 numbered mangroves, with exposed roots, fluted trunks, branches and layered crowns.
- Sixteen landmark views: arrival anchorage, mangrove, bubble landing, Shakky's bar, auction exterior and hall, lawless streets, Grove 12, park, wheel, tourist quarter, coating yards, Marine port, hotels, Grove 42 pier and overlook.
- Original reference-informed Shakky and auction silhouettes, supported signs, facade windows, stone courses, moss, pastel park towers, elevated ride track, bridge rails, lanterns and garden props.
- Forty-eight drifting resin bubbles and three tethered rental bubbles share one instanced draw. The five-draw Ferris wheel has twelve upright gondolas; reduced motion freezes its rotation and ambient drift.
- One bounded, gently bobbing Thousand Sunny beside Grove 41. A separate empty Grove 42 pier recalls the reunion. The physical scene represents intact first arrival; later events remain narrative recollections.
- One instance-local auction hall cutaway. The exterior restores when leaving it, including cached re-entry.

This is a compressed diorama. Building distances, secondary shops, Marine/hotel architecture and the auction room are interpretations. There are no character performances, playable interiors, Sabao Dome concert, moving coaster train or complete ride simulation.

## Camera and interaction

Sabaody and Thriller Bark share a measured-rectangle camera implementation. Landmark radius and target determine framing inside the space left by the actual header, story and controls. Five Sabaody phone views have separately authored approach directions to avoid intervening mangroves; desktop angles remain independent. The model and camera consume the same layout file, including the Sunny and both piers.

The atlas remains the entry screen. Its Sabaody location opens this scene; the brand returns to the atlas. Loading transitions occur on scene changes. Stories, quiet-canopy control and return gestures do not trigger the voyage loader. Phone story cards preserve the complete text and actions without internal scrolling. Reverse wheel, downward touch gesture and Return restore journey progress.

## Asset measurements

| Measurement | Result |
| --- | --- |
| Geometry, including hidden room and Sunny | 220,532 triangles |
| Spatial / visibility batches | 73 |
| GLB | 14,065,068 bytes (13.41 MiB) |
| Lighting texture | One 4096px JPEG atlas |
| Bake | Cycles diffuse color/direct/indirect, 96 samples, OIDN cleanup |
| Runtime island material | Unlit, no realtime island shadows |
| Decoded atlas estimate | 85.3 MiB RGBA including mipmaps; not total GPU memory |
| Sampled whole frames | 34–78 calls; 168,381–281,908 rendered triangles |
| Renderer resources observed | 89–91 geometries, 7 textures |

Frame samples were taken in local headless Chrome at 1440×900, balanced quality, normal motion, at ten landmark views after camera settling. The counter resets before the full frame and reads after it, including a refreshed static-depth pass where required. These are samples, not maximum costs or frame-rate claims.

The Sunny's complete rendered bounds span x=221–229.12 and z=-52–-36.87. Conservative circles enclosing each root platform and protruding roots leave at least 3.94 units of horizontal clearance; the pier side is 4.5 units away. Only vertical bob (±0.08) is animated, so this horizontal clearance does not change. Hull geometry crosses sea level throughout the motion.

The original targets were 120k–220k triangles, 45–85 batches and 10–16 MiB. Geometry is 532 triangles (0.2%) above the approximate upper target; batches and download size are within target. Non-hero root/flute/crown tessellation was reduced without dropping grove numbers. Separate terrain/forest batches let buildings and signs receive 2.5 times the UV linear scale during packing, keeping small details clearer without a larger texture.

## Rebuild

```sh
node scripts/build-sabaody.mjs --source
blender --background --threads 6 --python scripts/bake-sabaody.py
blender --background --threads 6 --python scripts/denoise-sabaody.py
npm run build
```

Blender uses OptiX when available, with CPU fallback. Imported split corner normals survive welding. Removable shells bake away from their rooms and are restored before export. UV packing uses explicit two-pixel margins and the bake uses four-pixel extension. Source geometry, Blender files, reference images and review captures remain in ignored working directories. Running the model builder without `--source` creates a vertex-lit preview and must be followed by the bake before release.

## Validation limits

Verification on 26 October 2026:

- Every final landmark reviewed visually at desktop 1440×900 and phone 390×740, with additional arrival, pier and landing checks after the waterfront corrections.
- All story cards checked at 1440×900, 390×740, 360×640, 320×568 and 844×390; complete actions and no internal scrolling. The long landscape chapter label stays on one line.
- Sabaody browser coverage checks navigation, loader boundaries, reverse-wheel/touch return, failed loading, cached re-entry, cutaway restoration, ship layers/bob, ocean camera uniforms, moving level gondolas and the reduced-motion setting.
- Thirteen existing map, mobile, Water 7, Enies Lobby and Thriller Bark regression checks passed after the shared-camera extraction and Sabaody integration.
- TypeScript and production build passed. The production GLB hash matches the reviewed source asset. Vite retains its existing large-chunk advisory.

Screenshots and raw measurements are retained in ignored `artifacts/`.

Physical Android/iOS frame rates, browser toolbar changes, enlarged system text, GPU context-loss recovery, high-quality rendering cost and long-session cache memory need separate device testing. Headless Chrome and viewport emulation do not establish those results. Assets load on island entry and remain cached; this implementation does not stream individual groves or use separate mobile LOD assets.
