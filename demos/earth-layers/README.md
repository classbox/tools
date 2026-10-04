# 🌍 Inside Our Earth – Grade 2 Layers Explorer

An interactive 3D science utility designed specifically for Grade 2 classrooms, interactive smartboards, and classroom projectors.

---

## 🚀 Quick Start
**No server or installation required!**
1. Open this folder: `Earth-Layers-Explorer`
2. **Double-click `index.html`** in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari).
3. Tap **Fullscreen (`F`)** on the top right for a clean, distraction-free classroom presentation!

---

## 🌟 Classroom & Projector Highlights

- **Rock-Solid Turntable Globe Controls (No Dizzying Roll or Off-Center Tumbling)**:
  - **Left Drag**: Spins the Earth smoothly like a classroom globe on a stand. Drag left/right to spin around the vertical axis; drag up/down to tilt and inspect the poles (pitch clamped to $\pm 66^\circ$).
  - **Zero Sideways Roll**: Roll is permanently locked to 0 with `YXZ` Euler rotation. The Earth **never** tilts sideways or tumbles out of alignment!
  - **On-Center Orbit**: The camera always targets the Earth's exact center. It **never** starts orbiting an arbitrary point or swinging off-screen.
- **Middle-Click Canvas Panning**:
  - **Middle Drag / Wheel Click**: Slides the canvas smoothly across the screen.
  - **Right Drag**: Also provides alternate panning (context menu disabled).
  - **Scroll Wheel / Pinch**: Zooms in and out smoothly.
  - **Reset View (`🎯 Reset`)**: Returns Earth rotation, pan offset, and zoom smoothly back to presentation defaults.
- **Wide 3D Peel Separation (True Exploded Shells)**:
  - Generous separation distances (Inner Core at center, Outer Core $+4.5$, Mantle $+9.5$, Crust $+14.8$ units).
  - Camera automatically expands back so all 4 nesting shells float completely detached in space with clear gaps between every layer.
  - Tapping **`🧅 Peel`** again smoothly slides them all back together into a solid globe!
- **Satisfying Mechanical "Click-Click" Switch Sound**:
  - Synthesizes an authentic mechanical switch double-snap (down-stroke contact snap at $t=0$, followed by up-stroke return snap at $t=38\text{ms}$).
  - **Zero Sound on Canvas Movement**: Basic dragging, rotating, panning, and zooming are completely silent. Clicks only trigger on intentional UI buttons and quiz answers.
- **Elegant Volume of Grade 2 Emojis**:
  - Restored friendly, recognizable educational emojis (`🌍`, `1 · 🏔️ Crust`, `2 · 🌋 Mantle`, `3 · 🌊 Outer Core`, `4 · ☀️ Inner Core`, `🍑`, `💡`) without messy visual clutter.
- **Radiant, Hot, Convective Interior Shaders**:
  - **Planar UV Mapping**: Applied planar UV coordinates to all cut faces to eliminate polar distortion and blurry radial smears.
  - **Mantle**: Multi-octave Rayleigh-Bénard convection cells with dark basalt crust rafts floating on incandescent molten magma fissure rivers (`emissive: 0xd9480f`).
  - **Outer Core**: Churning liquid metal dynamo with radiant molten gold ribbons (`emissive: 0xf59f00`).
  - **Inner Core**: White-hot solid metallic sphere (`emissive: 0xfef08a`) with dual internal core point lights illuminating the cut faces from within.
- **Interactive Grade 2 Quiz**:
  - 9 engaging classroom questions with instant feedback, tactile sounds, star scores, and celebratory confetti!

---

## 👩‍🏫 Teacher Presentation Controls (Keyboard & Clicker)

| Key | Action |
| :--- | :--- |
| `1` – `4` | Select layer (1: Crust, 2: Mantle, 3: Outer Core, 4: Inner Core) or quiz answer |
| `Left Drag` | Spin Earth smoothly (turntable; zero roll) |
| `Middle Drag` / `Wheel Click` | Pan the 3D canvas position |
| `Scroll` / `Pinch` | Zoom in & out |
| `←` / `→` | Previous / Next layer |
| `Space` | Advance to next quiz question |
| `P` | Peel layers outward with wide separation |
| `E` | Switch to **Explore** mode |
| `Q` | Switch to **Quiz** mode |
| `F` | Toggle Fullscreen |
| `Esc` | Close side panels and modals |

---

## ✏️ Customizing Lesson Content
All lesson text, depths, temperatures, analogies, and quiz questions live inside [`js/data.js`](js/data.js). You can easily customize text or add quiz questions for your specific curriculum.
