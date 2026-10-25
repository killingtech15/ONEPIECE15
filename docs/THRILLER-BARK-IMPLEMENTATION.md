# Thriller Bark implementation

Built locally on 24–25 October 2026 as the fourth selectable 3D scene. The [research plan](THRILLER-BARK-PLAN.md) records the references, proposed layout and targets.

## What is built

An intact arrival-era interpretation of the island ship: a timber outer hull and grinning mouth gate surround a real water annulus, a separate ruined inner wall, forest road, cemetery and two distinct mansions. Three towering masts, bowed sails, original bat/skull geometry and four suspended chains define the overview.

Hogback's mansion includes a broad gothic facade, repeated pointed windows, corner turrets, dormers and a central spire. The cylindrical mast mansion has ring balconies, round and pointed windows, red drapery, a large wheel and connected annexes. The Wonder Garden is a supported elevated connection with trees, unusual doors and a lit green arch. A parked carriage, rooted trees, mushrooms and fallen timber, cracked/open graves, graveyard fence, mausoleum, ivy and masonry courses, planked landing with supplies, and separate clearings complete the smaller viewpoints.

Sixteen selectable stops link to short sourced stories. Four reveal furnished cutaways: Hogback's laboratory, Perona's room, Oars' chamber and the chapel. Their roofs/walls are restored on leaving. These are interpreted rooms, with authored footprints, rather than a surveyed interior or walkable game level. The static Oars figure includes horns, teeth, shoulder plates, stitches, restraints and ice.

The Thousand Sunny is a separate original model: lion prow, curved sail, raised stern cabin, red roof, deck rails, rigging, cabin portholes, lawn/palm accents and stern nozzle. Its only motion is a bounded vertical bob of +/-0.1 units. Reduced motion freezes it and the two low-opacity mist surfaces. The clearer-view control reduces mist without changing the historical state. Sails are static bowed geometry with front/back faces, weathered hems, seams, patches and conformed lettering. Rigging, ratlines, crow’s nests and pennants fill out all three masts. Five small flying bats use two instanced meshes; reduced motion freezes them.

Later events are recalled in text: no simultaneous destruction, dawn battle or playable combat. The story of the initial Mini Merry landing is included; an additional launch is not modeled. The full dance hall, every mansion room, zombies/crew and a destruction simulation are outside this version. Exact secondary architecture and event-clearings are illustrative. [Credits and sources](CREDITS.md#thriller-bark) distinguish research stills from original production geometry.

## Layout, navigation and mobile

`src/thriller-layout.json` is the shared Y-up layout, with sea at zero. Outer radius is 160 units, land approximately 200 by 184, Hogback mansion at (0,10,22), mast mansion at (0,10,-50), and Sunny at (45,0,116). These are composition choices, not canonical dimensions.

Each landmark has its own radius, target and direction. The camera measures the introductory text or story panel and frames the subject in the remaining space. The garden uses a side approach; the Sunny uses a steeper approach to clear the foreground hull on phones. Overview framing includes all three masts.

- Enter through the atlas pin or directory. Brand and world-chart controls return to the atlas.
- Select stories without invoking the voyage loader. Return, Escape, reverse wheel and downward touch swipe restore the journey.
- Complete phone cards retain their source and next action without internal scrolling. Return/source touch targets are at least 44px on this island; the dock alone scrolls horizontally.
- Pins are hidden during the introduction and selected stories. The shared dock provides every selection.
- Four cutaway visibility groups are instance-local clones; switching/re-entering cannot leave the cached model permanently open. Ocean depth refreshes when the selected geometry changes. The Sunny is excluded from static depth.

## Measured costs

| Measurement | Result |
| --- | --- |
| GLB geometry, including hidden rooms and Sunny | 149,846 triangles |
| Spatial / visibility batches | 47 |
| GLB | 10,447,040 bytes (9.96 MiB) |
| Texture | One shared 4096px JPEG atlas |
| Lighting | Cycles diffuse direct/indirect/color, 96 samples, OIDN cleanup; unlit runtime |
| Decoded atlas estimate | 85.3 MiB for RGBA with mipmaps; not total GPU memory |
| Sampled whole frames | 19-84 calls; 97,088-314,048 rendered triangles |
| Renderer resources observed | 62-63 geometries, 7 textures |

Frame samples: local headless Chrome, 1440 by 900, balanced quality, normal motion, ten selected views after their camera transition. A development-only counter covers the full frame, including a refreshed static-depth pass. These are samples, not a maximum or FPS claim. Samples preceded the final texture/normal repair, which retained the same geometry and batches. The initial target was 100k-160k triangles, 40-70 batches and 8-12 MiB. The asset is within those targets; decoded texture cost still needs hardware profiling.

The Sunny's full rendered AABB gives conservative horizontal clearance of 10.46 units from an enclosing 106-unit land/wall radius and 22.50 from the outer wall's 156-unit inner radius. Its hull crosses sea level throughout the bob. There is no lateral drift, roll or yaw that can carry it into shore. These bounds are conservative checks, accompanied by rendered desktop/phone inspection.

## Build pipeline

```sh
node scripts/build-thriller-bark.mjs --source
blender --background --threads 6 --python scripts/bake-thriller-bark.py
blender --background --threads 6 --python scripts/denoise-thriller-bark.py
npm run build
```

`scripts/thriller-city.mjs` authors the geometry. Source GLB, Blender scene, raw/clean atlas and research copies remain under ignored `.tools/`. Only the final GLB and measured asset JSON are production assets. Running the builder without `--source` produces a quick vertex-lit preview; it is not the baked release asset.

For the atlas bake, removable shells are displaced, all transforms are applied, and their coordinates are restored after separation by material. This lights open rooms without baking opaque roofs over their contents. Imported split normals are carried through vertex welding in a temporary corner attribute and restored before baking, preventing black cone tips. A continuous road strip avoids coincident disk faces. UV island scales are equalized before packing with explicit two-pixel margins, followed by a four-pixel EXTEND bake margin and texture cleanup. This gives small curved surfaces adequate texels without increasing the atlas resolution. The baker uses OptiX when available, with CPU fallback.

## Verification and remaining limits

Completed 25 October 2026:

- All sixteen final landmark views visually reviewed at 1440×900 and 390×740, including sails, Sunny, all four exposed rooms, small roofs and environment details.
- Three Thriller Bark browser checks passed: all cards at five sizes (1440×900, 390×740, 360×640, 320×568, 844×390), loading failure recovery, cutaway restoration, shader uniforms, bounded ship motion, reverse-wheel/touch return and cached re-entry.
- Ten existing Enies Lobby, Water 7, Alabasta/mobile and map-navigation regression checks passed earlier in the same implementation task.
- Final texture/normal-only repair was followed by a fresh desktop/phone visual sweep. TypeScript and the production build pass; Vite retains its large-chunk advisory.

Screenshots and raw frame/bounds samples remain in ignored `artifacts/`.

Physical Android/iOS FPS, mobile browser toolbar changes, enlarged system text, GPU context-loss recovery, high-quality rendering cost and long-session cache memory remain unverified. Assets load on first entry and are cached; this is not district streaming or a mobile LOD implementation. The hidden scene pauses behind the atlas.
