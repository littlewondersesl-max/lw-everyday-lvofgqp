# Four Corners kitchen set (customised from Kenney Furniture Kit)

Four low-poly kitchen props for **Four Corners**, adapted from Kenney's free
**Furniture Kit 2.0** (https://kenney.nl/assets/furniture-kit, CC0).

| File | Source model (GLTF format) | Size (W x D x H, m) | Tris | GLB size |
|---|---|---|---|---|
| `fridge.glb` | `kitchenFridge.glb` | 0.91 x 0.68 x 1.80 | 708 | ~20 KB |
| `stove.glb`  | `kitchenStove.glb`  | 0.90 x 0.72 x 0.90 | 828 | ~39 KB |
| `table.glb`  | `table.glb`         | 1.26 x 0.92 x 0.75 | 384 | ~12 KB |
| `chair.glb`  | `chairCushion.glb`  | 0.45 x 0.45 x 0.90 | 372 | ~13 KB |

## Conventions
- Units are metres. Y-up (standard glTF), so it loads straight into three.js / R3F with `useGLTF`.
- **Origin is at the bottom centre** of each model. Transforms are applied, so every file has a single node with identity transform.
- **Front faces +Z** in glTF/three.js (handles, oven door and knobs are on the +Z side).
- Each file has one mesh with flat-shaded Kenney geometry and smooth-shaded new parts.
- Materials are embedded glTF PBR (base colour + roughness, metallic 0). There are **no textures, images or UVs**.
  Material names start with `lw_` so they're easy to find in code (e.g. to tint on hover).

## Palette (Little Wonders)
| Material | Hex | Used for |
|---|---|---|
| `lw_teal` | `#127A68` | fridge handles + kick plate, stove rim + kick plate, table legs, chair back rail |
| `lw_coral` | `#E8735A` | stove knobs, chair cushion |
| `lw_cream` | `#F4EADB` | fridge body, stove body / oven door |
| `lw_wood` | `#C98B55` | table top, chair frame |
| `lw_charcoal` | `#2E2E2E` | hob plate, grates, oven window + handle |
| `lw_cream_dk` | `#D9CBB4` | fridge interior (derived shade) |
| `lw_teal_lt` | `#9FD3C7` | fridge door shelves (derived shade) |
| `lw_burner` | `#4A4644` | burner pans on the hob (derived shade) |

## What changed vs. stock Kenney
- **All models:** recoloured to the palette above. Proportions are chunkier, with gentle non-uniform scaling to the real-world-ish target sizes. Each model's parts are joined into one mesh, its origin is re-centred at the base and its transforms are applied.
- **Fridge:** the stock box handles were flattened into the door. They're replaced by **rounded teal U-handles** (a pipe with rounded corners) on both doors. The kick plate is teal. It's 8% wider and 5% deeper than a uniform scale would give.
- **Stove:** the body is cream, the top rim band and kick plate are teal, the hob and grates are charcoal, the burner pans are a soft charcoal and the five control knobs are coral. The oven window and handle are charcoal. Depth is trimmed to about 0.72 m.
- **Table:** the stock square top was replaced with a **thick rounded-corner wood top** with soft edges and a small overhang. The legs and stretchers are teal. The footprint is shortened to a cosy 1.26 x 0.92 m.
- **Chair:** the thin stock seat pad was replaced with a **puffy rounded coral cushion**. The frame is soft wood, the back cross-rail is teal, and the chair is 15% wider and deeper.

## Rebuild
Scripts are in `/workspace/house-game/scripts/` (Blender 4.2.3 LTS, headless):
```
blender -b -P build.py      # writes the 4 GLBs
blender -b -P render.py     # writes preview-*.png (Cycles CPU)
```

## Previews
`preview-lineup.png`, `preview-fridge.png`, `preview-stove.png`, `preview-table.png`, `preview-chair.png`

## Licence
The source models are by **Kenney (www.kenney.nl)**, released under **CC0 1.0** (public domain dedication):
http://creativecommons.org/publicdomain/zero/1.0/. Credit is optional but appreciated. A copy of
the original licence file is included as `LICENSE-Kenney-CC0.txt`. These derived models can be used freely,
commercially or otherwise.
