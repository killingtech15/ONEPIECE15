# Project Specification: Grand Line Interactive (Technical Blueprint)

## 1. Architectural Overview & Environment
*   **Engine:** Three.js via React Three Fiber (R3F).
*   **Scroll Hijacking:** Lenis (Studio Freight) wrapping the R3F `<Canvas>`, outputting a normalized `scrollProgress` value (0.0 to 1.0).
*   **Post-Processing:** `@react-three/postprocessing` (EffectComposer). Required passes:
    *   `SMAA` (Subpixel Morphological Antialiasing) for crisp geometry edges.
    *   `Bloom` (Selective, threshold: 0.8, intensity: 1.5) mapped only to specific emissive materials (e.g., Log Pose glowing needle, Sabaody bubbles).
    *   `ChromaticAberration` mapped to camera velocity (higher scroll speed = higher radial offset).

## 2. Detailed Graphics & Shader Specifications

### The Hero Asset: The Log Pose
*   **Material:** Must use Drei's `<MeshTransmissionMaterial>` (or a custom PBR implementation) to achieve physical glass refraction.
*   **Parameters:** `transmission: 1`, `ior: 1.52` (glass index of refraction), `thickness: 2.5`, `roughness: 0.05`, `chromaticAberration: 0.1`.
*   **Environment Reflection:** Use an HDR environment map (`<Environment preset="city" />` but heavily blurred) specifically for the glass to reflect, ensuring it doesn't look like empty plastic.

### The Ocean Shader (Custom GLSL)
Do not use a flat plane or standard Three.js water.
*   **Vertex Shader:** Implement a **Gerstner Wave algorithm**. This requires passing uniform variables for `time`, `speed`, and `amplitude`. The vertex shader must displace the `position.y` based on overlapping sine/cosine waves to create sharp, stylized ocean peaks.
*   **Fragment Shader:** Implement depth-based color grading. Pass the camera's depth texture to the shader.
    *   Deep water (high depth delta): `#0077b6`
    *   Shallow water/Foam (where island geometry intersects the water plane): Generate a white ring (`#ffffff`) using a smoothstep function on the depth intersection.

### Island Diorama Shading (Baked Lighting)
Real-time shadow casting in Three.js is too expensive for this many assets.
*   **Workflow:** Light the scenes in Blender using Cycles (Sun light + Sky texture).
*   **Baking:** Bake the lighting into a single Diffuse/Ambient Occlusion (AO) map for each island mesh.
*   **Material Setup in R3F:** Use `MeshBasicMaterial` (which ignores scene lights and saves performance) and assign the baked texture. Multiply the baked texture by a custom uniform if day/night transitions are needed.

## 3. Animation & Camera Choreography

### The Core Scroll Track
*   **Spline Path:** The camera does not move linearly. Define a `THREE.CatmullRomCurve3` array of `Vector3` points that weave through the 3D space.
*   **Camera Rig:** Create an empty `Group` as a camera target, and the `PerspectiveCamera` as its child.
*   **GSAP Integration:**
    *   Use `gsap.timeline({ scrollTrigger: { scrub: 1 } })`.
    *   Map the Lenis scroll progress (0 to 1) to the `curve.getPointAt(progress)`.
    *   Update the Camera Rig's position on `useFrame`.
    *   Use `curve.getTangentAt(progress)` to calculate the `lookAt` vector so the camera naturally banks and turns along the path.

### Procedural Idle Animations
Objects must feel alive when the user is not scrolling.
*   **Buoyancy Math:** Inside a `useFrame` hook, apply a sine wave to the Y-axis of the floating islands and ships:
    `mesh.current.position.y = initialY + Math.sin(state.clock.elapsedTime * frequency) * amplitude`.
*   *(Example: `frequency: 1.2`, `amplitude: 0.5` for small ships; `frequency: 0.5`, `amplitude: 0.2` for massive islands).*

## 4. Interactive Physics, Raycasting & UI

### Click-to-Zoom Mechanic (Interrupting the Scroll)
When an island is clicked, the scroll track must be temporarily disabled.
*   **Raycasting:** Use R3F's built-in `onClick` event on the island's Group mesh.
*   **Camera Animation:** Use GSAP to animate the camera away from the Spline path to a hardcoded `Vector3` offset from the island.
    *   `gsap.to(camera.position, { x: target.x + 10, y: target.y + 15, z: target.z + 10, duration: 1.5, ease: "power4.inOut" })`
    *   Animate the `camera.lookAt` to target the island's center simultaneously.
*   **State Management:** Toggle a boolean `isZoomed`. When `true`, disable Lenis scroll.

### Incident Markers (3D to 2D Projection)
*   **Component:** Use Drei's `<Html>` component for the interactive dots on the islands.
*   **Behavior:** Set `occlude={true}` so the markers disappear if they are behind a 3D mountain or building.
*   **Styling:** Use standard CSS/Tailwind for the markers, but apply a CSS `transform: scale()` tied to the camera distance to ensure they stay a consistent size on the screen regardless of how far the camera is.

### Shader-Driven UI Transitions
Do not use standard CSS fade-ins for the major arc titles.
*   **Text Rendering:** Render the Arc Titles (e.g., "WATER 7") using Drei's `<Text>` geometry.
*   **Custom Material:** Write a custom ShaderMaterial for the text. Use a Simplex Noise texture as a displacement mask.
*   **Animation:** Animate a `u_progress` uniform from 0.0 to 1.0 via GSAP when the island enters the viewport. The fragment shader will discard pixels based on the noise map, creating an ink-bleed or liquid-reveal effect for the typography.

## 5. Required Data Schema
To drive the 3D markers and UI, structure your `JSON` exactly like this to map DOM data to 3D coordinates:

```json
{
  "islands": [
    {
      "id": "water-7",
      "name": "Water 7",
      "meshUrl": "/models/water7-baked.glb",
      "splineProgress": 0.45,
      "cameraZoomOffset": { "x": 15, "y": 20, "z": 15 },
      "incidents": [
        {
          "title": "Franky House Raid",
          "episodes": "233-234",
          "localPosition": { "x": -5.2, "y": 2.1, "z": 4.8 },
          "description": "The Straw Hats avenge Usopp..."
        }
      ]
    }
  ]
}
```
