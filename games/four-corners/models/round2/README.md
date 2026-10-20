# Four Corners: round 2 assets (Oct 11, 2026)

Everything here is CC0 (Kenney, Quaternius) or our own work (CC0). No Mixamo, no CC-BY.

## What's here
| Path | What |
|---|---|
| `glb/<item>_<a|b|c>.glb` | 90 models: 3 versions (A/B/C) of each of the game's 30 placeable furniture/household objects |
| `thumbs-web/<item>_<a|b|c>.webp` | 256 px transparent WebP thumbnails for the choice overlay (3/4 front view; 384 px PNG masters in `thumbs/` on the box) |
| `manifest.json` | Per item: the 3 versions with label, kid description, source, licence, size in metres, node names and door hinge data |
| `objects-sheet.png` | All 3 versions of every object on one sheet |
| `mover/mover_female-b.glb` | Kenney Mini Characters `character-female-b` with clips `idle, walk, pick-up, holding-both, walk-carry, idle-carry` |
| `mover/mover-check.png` | Render check of the clips |
| `truck/truck_fourcorners_delivery.glb` | Recoloured Kenney Car Kit delivery truck. Nodes: `body`, `door`, and the four `wheel-*` nodes |
| `sky/sky_backdrop.jpg` | Painted cartoon sky panorama, 2048x768, tiles horizontally (soft clouds, faint mountains, green hills) |
| `sky/sky_dome.glb` | Ready-made backdrop: open cylinder (r 40, h 26), inward faces, the panorama repeated 4x, flat sky-blue top cap |
| `food-plants-sheet.png` | Separate deliverable: Kenney vs Quaternius food and plants plus our restyles (`food-plants/ours/*.glb`) |
| `scripts/` | Blender 4.2 / PIL scripts that rebuild everything (`build.py`, `thumbs.py`, `build_mover.py`, `make_sky.py`, `build_sky.py`, ...) |

## Conventions (same as kenney-custom)
- Units are metres, Y-up glTF, origin at bottom centre, **front faces +Z**. Wall items (`upper`, `clock`, `poster`, `curtains`) have their back at -Z.
- Every file has a `body` node. Fridges also have `door` (lower fridge door) and `door_top` (freezer door). Stoves have `door` (oven door).
  Each door node's origin **is its hinge**, so rotating the node opens it:
  - fridge `door` / `door_top`: rotate about **Y** by `open_angle` (+1.75 rad), hinge on the right-hand side (+X).
  - stove `door`: rotate about **X** by `open_angle` (+1.3 rad), bottom hinge, folds down toward the viewer.
  Fridges are hollow, with cream liners and teal shelves at y 0.42 and 0.86 (fridge) and a freezer above about 1.1 m. The freezer band `localY >= 1.1` still works for all three fridges. Stoves have a dark oven cavity with a rack at 0.27 m.
- Materials are glTF PBR named `lw_<name>`. Most are flat colours. Textured ones (`lw_tx_*` painted wood, terrazzo, marble, gingham, stripes, zigzag, dots, plus `lw_img:*` clock faces and posters) carry a 512 px JPEG baseColor texture with UVs.
  **Keep `map` when converting to MeshToonMaterial**, or the cartoon textures will disappear. `lw_chrome` is metallic 1 / roughness 0.12. Enamels have roughness about 0.16. MeshToon ignores both, so give chrome and enamel a light rim or use MeshStandard for those parts if you want shine.
- File sizes are 4 to 227 KB, all under 300 KB.
- Sizes: most versions fill the old catalog footprint (w x d x h) exactly. Exceptions are listed in `manifest.json` `size_m`: the chubby fridge is 0.98 x 0.74 x 1.58, the tables are A 0.92 square, B 1.26 x 0.86 and C 1.0 round, sinks are taller because of the tap, and the retro stove C has a 0.16 m back panel. Use each version's `size_m` for its footprint and colliders.

## Item list

### fridge
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Teal enamel fridge | Glossy teal enamel single fridge, freezer on top, polished chrome bar handles, cream inside. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Kitchen Fridge) | CC0 1.0 | 0.91 x 0.745 x 1.8 | 32 |
| B | Chubby round fridge | Rounder, shorter and fatter cartoon fridge with soft rounded corners, coral enamel, cream rounded handles, freezer on top. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Fridge) | CC0 1.0 | 0.98 x 0.74 x 1.58 | 44 |
| C | Cream retro fridge on legs | Cream enamel fridge standing on teal legs, coral freezer door, chunky horizontal teal bar handles, freezer on top. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Kitchen Fridge) + added legs/handles | CC0 1.0 | 0.91 x 0.742 x 1.8 | 43 |

### stove
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Cream stove | Cream enamel oven with a teal front, charcoal hob with four burners, coral knobs and a chrome bar handle. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Oven) | CC0 1.0 | 0.9 x 0.72 x 0.9 | 25 |
| B | Coral chef stove | Chunky coral oven with a big cream window band, chrome rail handle, black grates and teal knobs. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Oven) | CC0 1.0 | 0.9 x 0.72 x 0.9 | 66 |
| C | Mint retro range | Mint enamel retro range on little cream legs with a tall back panel, cream oven door and chrome handle. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Oven) + legs/back panel | CC0 1.0 | 0.9 x 0.72 x 1.06 | 46 |

### dishwasher
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Cream panel dishwasher | Cream panel-front dishwasher with a teal control strip and a long chrome bar handle. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Counter End) + handle/control strip | CC0 1.0 | 0.6 x 0.694 x 0.84 | 46 |
| B | Window dishwasher | Rounded mint dishwasher with a peek-in window (see the plates!), cream knobs and a chrome handle. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Oven) body reworked (hob removed) | CC0 1.0 | 0.6 x 0.64 x 0.88 | 45 |
| C | Coral plank dishwasher | Coral dishwasher with a painted-wood plank front, a cream push-button strip and a teal bar handle. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Counter Straight) + handle/control strip | CC0 1.0 | 0.6 x 0.676 x 0.88 | 79 |

### sink
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Teal sink cabinet | Teal cabinet sink with a white terrazzo-free top, chrome tap and basin. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Kitchen Sink) | CC0 1.0 | 0.9 x 0.64 x 1.25 | 64 |
| B | Wooden double-door sink | Honey painted-wood counter sink with two cream doors, a cream terrazzo top and a chrome basin. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Counter Sink) | CC0 1.0 | 0.9 x 0.64 x 1.06 | 95 |
| C | Washstand sink | Cute washstand: round cream basin with a chrome tap on a coral cabinet with a drawer and little legs. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Bathroom Sink) on Quaternius 'Ultimate House Interior Pack' (poly.pizza, Night Stand) | CC0 1.0 | 0.9 x 0.64 x 1.053 | 37 |

### cabinet
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Two-door cupboard | Cream two-door base cupboard with teal door panels, wooden knobs and a honey-wood top. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Counter Doors) | CC0 1.0 | 0.8 x 0.62 x 0.92 | 58 |
| B | Drawer cupboard | Coral cupboard with two wide drawers, cream handles and a cartoon terrazzo top. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Counter Drawers) | CC0 1.0 | 0.8 x 0.62 x 0.92 | 73 |
| C | Leggy cupboard | Mid-century style teal cupboard on wooden legs with one big drawer and a chrome knob. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Night Stand) | CC0 1.0 | 0.8 x 0.62 x 0.92 | 46 |

### island
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Plank island | Teal plank-front island with a big overhanging honey-wood top. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Counter Straight (deep)) | CC0 1.0 | 1.55 x 0.86 x 0.92 | 57 |
| B | Cupboard island | Cream island with two coral cupboard doors and a cartoon terrazzo top. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Counter Doors) | CC0 1.0 | 1.55 x 0.86 x 0.92 | 73 |
| C | Sideboard island | Low-leg sideboard island: coral drawers, light painted-wood top and wooden legs. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Drawer) | CC0 1.0 | 1.55 x 0.86 x 0.92 | 36 |

### pantry
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Tall teal pantry | Tall teal pantry cupboard with two doors, cream panels, gold knobs and fancy feet. | Quaternius 'Furniture Pack' (poly.pizza, Closet) | CC0 1.0 | 0.64 x 0.56 x 2.05 | 162 |
| B | Pantry with drawers | Coral pantry with two doors over two drawers, cream trim and gold handles. | Quaternius 'Furniture Pack' (poly.pizza, Short Closet) | CC0 1.0 | 0.64 x 0.56 x 2.05 | 221 |
| C | Open pantry shelf | Open cream shelf unit with a ladder of little shelves, painted honey-wood shelf tops. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Shelf Large) | CC0 1.0 | 0.64 x 0.56 x 2.05 | 33 |

### upper
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Wall cupboard | Cream wall cupboard with teal sliding doors and mustard pulls. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Cabinet Doors) | CC0 1.0 | 0.9 x 0.36 x 0.72 | 34 |
| B | Cubby shelf | Coral wall shelf with little cubby holes and honey-wood shelves. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Cabinet Shelves) | CC0 1.0 | 0.9 x 0.36 x 0.72 | 33 |
| C | Open wall shelf | Long open teal wall shelf with light wood shelves. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Cabinet Shelves) | CC0 1.0 | 0.9 x 0.36 x 0.72 | 28 |

### table
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Square table | Normal square table: chunky honey painted-wood top and sturdy legs. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Table) | CC0 1.0 | 0.92 x 0.92 x 0.75 | 34 |
| B | Medium rectangle table | Medium rectangle table (seats four, not a long dining table): light wood top and coral cross legs. | Quaternius 'Furniture Pack' (poly.pizza, Table) shortened | CC0 1.0 | 1.26 x 0.86 x 0.75 | 80 |
| C | Chubby round table | Round chubby cartoon table: thick soft-edged cream top, fat teal pedestal and round foot. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Table Round Small) pedestal + new chubby top | CC0 1.0 | 1.0 x 1.0 x 0.72 | 62 |

### chair
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Ladder-back chair | One teal painted ladder-back chair with a honey wood seat. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Chair) | CC0 1.0 | 0.45 x 0.45 x 0.9 | 33 |
| B | Bentwood cafe chair | One curly bentwood cafe chair in cream with a round coral seat. | Quaternius 'Furniture Pack' (poly.pizza, Chair) | CC0 1.0 | 0.45 x 0.45 x 0.9 | 40 |
| C | Slat-back chair | One coral painted chair with a tall slatted back and a cream seat. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Chair (slat back)) | CC0 1.0 | 0.45 x 0.45 x 0.9 | 13 |

### stool
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Bar stool | Round coral seat on a tall cream stool frame with a foot ring. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Stool) | CC0 1.0 | 0.36 x 0.36 x 0.62 | 17 |
| B | Cushion stool | Teal stool with a puffy cream cushion and curved legs. | Quaternius 'Furniture Pack' (poly.pizza, Stool) | CC0 1.0 | 0.36 x 0.36 x 0.62 | 28 |
| C | Round wood stool | Chunky round stool: mint seat on honey painted-wood legs. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Stool) | CC0 1.0 | 0.36 x 0.36 x 0.62 | 35 |

### bin
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Teal round bin | Round glossy teal bin with a cream rim. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Trashcan) | CC0 1.0 | 0.34 x 0.3 x 0.56 | 13 |
| B | Wheelie bin | Little coral wheelie bin with a lid and black wheels. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Trashcan (wheelie)) | CC0 1.0 | 0.34 x 0.3 x 0.56 | 23 |
| C | Pedal bin | Slim cream pedal bin with a mustard lid. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Trashcan Small) | CC0 1.0 | 0.34 x 0.3 x 0.56 | 10 |

### rug
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Striped rug | Rectangle rug with cream, teal and coral stripes and a cream fringe. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Rug) | CC0 1.0 | 1.8 x 1.2 x 0.02 | 29 |
| B | Oval rug | Soft oval teal rug with a coral border. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Round Rug) stretched to an oval | CC0 1.0 | 1.8 x 1.2 x 0.02 | 5 |
| C | Zigzag rug | Cream rug with a happy teal, coral and mustard zigzag pattern and mustard fringe. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Rug) | CC0 1.0 | 1.8 x 1.2 x 0.02 | 65 |

### curtains
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Teal curtains | Two teal curtains on a chrome rail. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Curtains Double) | CC0 1.0 | 1.9 x 0.1 x 1.16 | 12 |
| B | Gingham curtains | Coral gingham curtains on a wooden rail. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Curtains Double) | CC0 1.0 | 1.9 x 0.1 x 1.16 | 21 |
| C | Cream curtains with pelmet | Cream curtains under a scalloped coral pelmet. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Curtains Double) + pelmet | CC0 1.0 | 1.94 x 0.143 x 1.16 | 91 |

### lamp
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Cone table lamp | Coral cone shade on a cream bobbin base. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Table Lamp) | CC0 1.0 | 0.26 x 0.26 x 0.52 | 9 |
| B | Desk lamp | Bendy teal desk lamp with a cream inside. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Light Desk) | CC0 1.0 | 0.222 x 0.4 x 0.506 | 11 |
| C | Drum lamp | Wide mustard drum shade on a round teal base. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Lamp) | CC0 1.0 | 0.26 x 0.26 x 0.52 | 10 |

### clock
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Round teal clock | Round wall clock with a chunky teal rim and a cream face. | Own design (Blender primitives, made for Four Corners) | CC0 1.0 | 0.4 x 0.076 x 0.4 | 35 |
| B | Sunshine clock | Mustard sunshine clock with little rays and a cream face. | Own design (Blender primitives, made for Four Corners) | CC0 1.0 | 0.4 x 0.076 x 0.4 | 43 |
| C | Square coral clock | Soft square coral clock with a mint face. | Own design (Blender primitives, made for Four Corners) | CC0 1.0 | 0.36 x 0.086 x 0.36 | 28 |

### poster
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Sunny hills poster | Painted sunny hills picture in a teal frame. | Own design (Blender primitives, made for Four Corners) | CC0 1.0 | 0.66 x 0.032 x 0.86 | 24 |
| B | Fruit poster | Happy fruit picture in a chunky honey-wood frame. | Own design (Blender primitives, made for Four Corners) | CC0 1.0 | 0.66 x 0.032 x 0.86 | 49 |
| C | Rainbow house poster | Rainbow and little house picture in a soft rounded coral frame. | Own design (Blender primitives, made for Four Corners) | CC0 1.0 | 0.66 x 0.032 x 0.86 | 50 |

### plant
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Snake plant | Tall spiky snake plant in a coral pot. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Houseplant) | CC0 1.0 | 0.211 x 0.211 x 0.58 | 12 |
| B | Cactus | Friendly round cactus with a mustard flower in a teal pot. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Cactus) | CC0 1.0 | 0.235 x 0.232 x 0.58 | 21 |
| C | Leafy plant | Bushy big-leaf plant in a cream pot. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Houseplant) | CC0 1.0 | 0.287 x 0.3 x 0.217 | 15 |

### microwave
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Cream microwave | Cream microwave with a teal door frame, dark window and coral buttons. | Kenney Furniture Kit 'kitchenMicrowave' (kenney.nl) | CC0 1.0 | 0.52 x 0.38 x 0.32 | 9 |
| B | Coral microwave on feet | Coral microwave on little cream feet with a chrome bar handle. | Kenney Furniture Kit 'kitchenMicrowave' (kenney.nl) + feet/handle | CC0 1.0 | 0.52 x 0.417 x 0.32 | 39 |
| C | Retro dial microwave | Mint retro microwave with two big cream dials and a teal top. | Kenney Furniture Kit 'kitchenMicrowave' (kenney.nl) + dials | CC0 1.0 | 0.52 x 0.405 x 0.32 | 35 |

### toaster
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Teal toaster | Teal toaster with cream sides and a coral lever. | Kenney Furniture Kit 'toaster' (kenney.nl) | CC0 1.0 | 0.3 x 0.18 x 0.2 | 11 |
| B | Coral toaster on feet | Rounder coral toaster on chrome feet with a big cream lever knob. | Kenney Furniture Kit 'toaster' (kenney.nl) + feet/knob | CC0 1.0 | 0.33 x 0.18 x 0.2 | 34 |
| C | Toast-pop toaster | Cream toaster with a mustard stripe and a slice of toast popping up. | Kenney Furniture Kit 'toaster' (kenney.nl) + Quaternius 'Ultimate Food Pack' (poly.pizza, Bread Slice) | CC0 1.0 | 0.3 x 0.18 x 0.22 | 33 |

### kettle
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Round teal kettle | Round glossy teal kettle with a cream arched handle and spout lid. | Own design (Blender primitives, made for Four Corners) | CC0 1.0 | 0.212 x 0.18 x 0.277 | 36 |
| B | Dome coral kettle | Wide dome coral kettle with a chrome side handle and a long curved spout. | Own design (Blender primitives, made for Four Corners) | CC0 1.0 | 0.22 x 0.147 x 0.132 | 35 |
| C | Jug kettle | Tall cream jug kettle with a teal handle, coral switch and a little window stripe. | Own design (Blender primitives, made for Four Corners) | CC0 1.0 | 0.24 x 0.17 x 0.246 | 39 |

### coffee
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Teal coffee maker | Teal coffee maker with a cream drip tray. | Kenney Furniture Kit 'kitchenCoffeeMachine' (kenney.nl) | CC0 1.0 | 0.22 x 0.3 x 0.36 | 9 |
| B | Coral coffee maker + mug | Coral coffee maker with a little cream mug under the spout. | Kenney Furniture Kit 'kitchenCoffeeMachine' (kenney.nl) + Kenney Food Kit 'mug' (kenney.nl) | CC0 1.0 | 0.22 x 0.3 x 0.36 | 19 |
| C | Cream coffee maker on feet | Cream coffee maker on mustard feet with a chrome top and teal buttons. | Kenney Furniture Kit 'kitchenCoffeeMachine' (kenney.nl) + feet | CC0 1.0 | 0.22 x 0.3 x 0.362 | 33 |

### blender
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Teal blender | Teal blender base with a clear jug and cream lid. | Kenney Furniture Kit 'kitchenBlender' (kenney.nl) | CC0 1.0 | 0.2 x 0.2 x 0.42 | 13 |
| B | Smoothie blender | Coral blender with a pink smoothie inside the jug. | Kenney Furniture Kit 'kitchenBlender' (kenney.nl) + smoothie | CC0 1.0 | 0.2 x 0.2 x 0.42 | 16 |
| C | Chubby cream blender | Chubby cream blender on a round mustard foot with a teal lid. | Kenney Furniture Kit 'kitchenBlender' (kenney.nl) + round foot | CC0 1.0 | 0.2 x 0.2 x 0.42 | 21 |

### fruit
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Teal fruit bowl | Deep teal bowl heaped with red apples and a banana. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Bowl) + Quaternius 'Ultimate Food Pack' (poly.pizza, Apple / Banana) | CC0 1.0 | 0.28 x 0.28 x 0.24 | 107 |
| B | Fruit platter | Flat cream platter with an orange, a green pear-pepper and red tomatoes. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Plate) + Quaternius 'Ultimate Food Pack' (poly.pizza, Tomato / Pepper / Apple) | CC0 1.0 | 0.28 x 0.28 x 0.102 | 116 |
| C | Square fruit dish | Square coral dish with bananas, a green apple and an avocado. | Quaternius 'Ultimate Food Pack' (poly.pizza, Plate Square) + Quaternius 'Ultimate Food Pack' (poly.pizza, Banana / Apple / Avocado) | CC0 1.0 | 0.26 x 0.26 x 0.17 | 71 |

### board
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Wooden board | Plain chunky honey painted-wood chopping board. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Wooden Board) | CC0 1.0 | 0.4 x 0.26 x 0.03 | 21 |
| B | Mint board with handle | Mint chopping board with a teal handle. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Chopping board) (knife removed) | CC0 1.0 | 0.4 x 0.26 x 0.026 | 20 |
| C | Mint terrazzo board | Mint terrazzo serving board with soft square corners. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Square Plate) | CC0 1.0 | 0.4 x 0.26 x 0.03 | 38 |

### knives
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Knife block | Honey wood knife block with teal knife handles. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Kitchen Knives) | CC0 1.0 | 0.14 x 0.12 x 0.22 | 49 |
| B | Utensil pot | Round coral utensil pot holding wooden spoons and chopsticks. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Trashcan) as a pot + Quaternius 'Ultimate Food Pack' (poly.pizza, Spoon / Chopsticks) | CC0 1.0 | 0.12 x 0.12 x 0.229 | 90 |
| C | Chunky knife block | Chunky rounded teal knife block with cream handles. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Kitchen Knives) + rounded block | CC0 1.0 | 0.14 x 0.12 x 0.22 | 30 |

### pot
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Teal soup pot | Glossy teal cooking pot with side handles. | Quaternius 'Ultimate Food Pack' (poly.pizza, Cooking Pot) | CC0 1.0 | 0.24 x 0.24 x 0.16 | 15 |
| B | Coral casserole | Low coral casserole pot with cream handles. | Quaternius 'Survival pack' (poly.pizza, Pot) | CC0 1.0 | 0.24 x 0.24 x 0.16 | 18 |
| C | Soup pot | Cream pot full of yummy orange soup with a teal rim. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Pot Filled) | CC0 1.0 | 0.24 x 0.24 x 0.16 | 24 |

### plates
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Round plate | One round cream plate with a teal rim. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Plate) | CC0 1.0 | 0.18 x 0.18 x 0.025 | 10 |
| B | Square plate | One flat square coral plate. | Quaternius 'Ultimate House Interior Pack' (poly.pizza, Square Plate) | CC0 1.0 | 0.18 x 0.18 x 0.02 | 5 |
| C | Deep dotty plate | One deep square plate with coral polka dots. | Quaternius 'Ultimate Food Pack' (poly.pizza, Plate Square) | CC0 1.0 | 0.18 x 0.18 x 0.035 | 45 |

### bowls
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Coral bowl | One deep round coral bowl. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Bowl) | CC0 1.0 | 0.16 x 0.16 x 0.08 | 12 |
| B | Wide teal bowl | One wide, shallow teal bowl. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Bowl) reshaped | CC0 1.0 | 0.18 x 0.18 x 0.06 | 12 |
| C | Footed dotty bowl | One cream bowl with coral dots on a little mustard foot. | Quaternius 'Japanese/Sushi kitchen pack' (poly.pizza, Bowl) + foot | CC0 1.0 | 0.16 x 0.16 x 0.08 | 54 |

### cutlery
| Ver | Name | Looks like | Source | Licence | Size (w x d x h m) | KB |
|---|---|---|---|---|---|---|
| A | Spoon | One shiny chrome spoon. | Quaternius 'Ultimate Food Pack' (poly.pizza, Spoon) | CC0 1.0 | 0.18 x 0.038 x 0.008 | 9 |
| B | Chopsticks | One pair of honey-wood chopsticks with coral tips. | Quaternius 'Ultimate Food Pack' (poly.pizza, Chopsticks) | CC0 1.0 | 0.18 x 0.014 x 0.006 | 50 |
| C | Fork | One chunky silver fork with a teal handle (no Quaternius fork exists, so this one is our own simple model). | Own design (Blender primitives, made for Four Corners) | CC0 1.0 | 0.19 x 0.032 x 0.008 | 16 |

## Not Quaternius (no Quaternius match exists)
- **Microwave, toaster, coffee maker, blender**: Kenney Furniture Kit models (`kitchenMicrowave`, `toaster`, `kitchenCoffeeMachine`, `kitchenBlender`), recoloured, with added feet, handles, dials, a mug or a smoothie for the design differences. The coffee mug is Kenney Food Kit `mug`.
- **Kettle, clock, poster**: neither Quaternius nor Kenney (Furniture Kit) has one, so these are our own simple Blender models. The clock faces and posters are our own PIL paintings.
- **Fork** (cutlery C): Quaternius has no fork. The Kenney Food Kit fork rendered with broken tines, so the fork is a simple own model.
- **Dishwasher**: Quaternius has no dishwasher. The three versions are built from Quaternius parts (Counter End, the Oven body with its hob removed, Counter Straight) plus our handles and control strips.
- Food items (milk, eggs, cheese, pasta, cans, peas, ice cream, apple, lemon, lime, loose knife) were **not** replaced. They're food, not furniture, and are covered by the separate food & plants sheet.

## Quaternius sources (poly.pizza model pages; all CC0 1.0)

- Fridge: https://poly.pizza/m/3NYolcXB1o (CC0 1.0)
- Oven: https://poly.pizza/m/TEnCAyfLoh (CC0 1.0)
- Counter Sink: https://poly.pizza/m/iruxBemFwO (CC0 1.0)
- Cabinet Doors: https://poly.pizza/m/N3I2zvkSxr (CC0 1.0)
- Cabinet Shelves: https://poly.pizza/m/X7DsAfvGqR (CC0 1.0)
- Cabinet Shelves: https://poly.pizza/m/u3A1t5DIMd (CC0 1.0)
- Counter Doors: https://poly.pizza/m/CBUx8ZMVAO (CC0 1.0)
- Counter Drawers: https://poly.pizza/m/7dcTIks23j (CC0 1.0)
- Counter End: https://poly.pizza/m/fMktagvoJm (CC0 1.0)
- Counter Straight: https://poly.pizza/m/uwfs2Gbd5I (CC0 1.0)
- Counter Straight: https://poly.pizza/m/zpURbFzEbv (CC0 1.0)
- Drawer: https://poly.pizza/m/FX1CGX9yg7 (CC0 1.0)
- Night Stand: https://poly.pizza/m/08S1j15Jcx (CC0 1.0)
- Closet: https://poly.pizza/m/BHEVb1DIuH (CC0 1.0)
- Short Closet: https://poly.pizza/m/ND4Z53Ne4C (CC0 1.0)
- Shelf Large: https://poly.pizza/m/3FmjkLClVE (CC0 1.0)
- Trashcan: https://poly.pizza/m/vlVx279xut (CC0 1.0)
- Trashcan: https://poly.pizza/m/XSwahu252t (CC0 1.0)
- Trashcan Small: https://poly.pizza/m/i7HDuYDLkx (CC0 1.0)
- Table Round Small: https://poly.pizza/m/oEArSZykyi (CC0 1.0)
- Table: https://poly.pizza/m/gQFkiM8PlM (CC0 1.0)
- Table: https://poly.pizza/m/HkPCEdQ5d5 (CC0 1.0)
- Chair: https://poly.pizza/m/iMNqRzPwwe (CC0 1.0)
- Chair: https://poly.pizza/m/Rlyhe93NNe (CC0 1.0)
- Chair: https://poly.pizza/m/kLViSk9EhX (CC0 1.0)
- Stool: https://poly.pizza/m/TvaOenUAni (CC0 1.0)
- Stool: https://poly.pizza/m/9QpPhjLcMV (CC0 1.0)
- Stool: https://poly.pizza/m/ngWUQ7Dt9u (CC0 1.0)
- Rug: https://poly.pizza/m/7H5qKjuxVY (CC0 1.0)
- Round Rug: https://poly.pizza/m/ZYBzMHnSbM (CC0 1.0)
- Light Desk: https://poly.pizza/m/uJDWrSJGVH (CC0 1.0)
- Lamp: https://poly.pizza/m/RsWYHKkDhD (CC0 1.0)
- Table Lamp: https://poly.pizza/m/9Mo3JruPHY (CC0 1.0)
- Bowl: https://poly.pizza/m/cXIpPoXb1U (CC0 1.0)
- Cactus: https://poly.pizza/m/97wBswIAvM (CC0 1.0)
- Houseplant: https://poly.pizza/m/VtJh4Irl4w (CC0 1.0)
- Houseplant: https://poly.pizza/m/bfLOqIV5uP (CC0 1.0)
- Small Plant: https://poly.pizza/m/MZdeiQApSb (CC0 1.0)
- Chopping board: https://poly.pizza/m/nH1AksPzxu (CC0 1.0)
- Wooden Board: https://poly.pizza/m/CfQ9CnzQiy (CC0 1.0)
- Kitchen Knives: https://poly.pizza/m/2XUeW4mAe6 (CC0 1.0)
- Cooking Pot: https://poly.pizza/m/jAUb3FoCN7 (CC0 1.0)
- Pot: https://poly.pizza/m/Olu4b0aiiY (CC0 1.0)
- Pot Filled: https://poly.pizza/m/kXCojdgsiN (CC0 1.0)
- Curtains Double: https://poly.pizza/m/kkeII96j9N (CC0 1.0)
- Plate: https://poly.pizza/m/JyOqlmg0O8 (CC0 1.0)
- Square Plate: https://poly.pizza/m/Gi5sAML9iw (CC0 1.0)
- Plate Square: https://poly.pizza/m/ihA4bF34hK (CC0 1.0)
- Spoon: https://poly.pizza/m/eqvrf6TrB6 (CC0 1.0)
- Chopsticks: https://poly.pizza/m/UOhOqQvF9y (CC0 1.0)
- Kitchen Fridge: https://poly.pizza/m/8sjRm8fnHh (CC0 1.0)
- Oven: https://poly.pizza/m/VNjPRwui7t (CC0 1.0)
- Kitchen Sink: https://poly.pizza/m/VZCFQj3C7Q (CC0 1.0)
- Can: https://poly.pizza/m/YnowJvWqxE (CC0 1.0)
- Apple Green: https://poly.pizza/m/3VXWnjDOEw (CC0 1.0)
- Bread Slice: https://poly.pizza/m/OkkMwZSFTb (CC0 1.0)
- Chopsticks: https://poly.pizza/m/UOhOqQvF9y (CC0 1.0)
- Cooking Pot: https://poly.pizza/m/jAUb3FoCN7 (CC0 1.0)
- Plate Square: https://poly.pizza/m/ihA4bF34hK (CC0 1.0)
- Spoon: https://poly.pizza/m/eqvrf6TrB6 (CC0 1.0)
- Bathroom Sink: https://poly.pizza/m/OMCJDgMUui (CC0 1.0)

## Kenney sources (CC0 1.0)
- Furniture Kit 2.0: https://kenney.nl/assets/furniture-kit
- Food Kit: https://kenney.nl/assets/food-kit
- Nature Kit: https://kenney.nl/assets/nature-kit (food & plants sheet only)
- Mini Characters: https://kenney.nl/assets/mini-characters (`character-female-b`)
- Cube Pets 2.0: https://kenney.nl/assets/cube-pets (`animal-dog`, clips idle, walk, run, eat) — the yard dog
- Car Kit (truck base, recoloured in round 1): https://kenney.nl/assets/car-kit

## Mover
`mover/mover_female-b.glb` (135 KB). The rig is root, leg-left/right, torso, arm-left/right and head. Clips:
- `walk` and `idle`: stock clips.
- `walk-carry`: the stock walk on root, legs, torso and head, plus the `holding-both` arm pose held on arm-left/right. This is the bone-masked blend, baked into one clip.
- `idle-carry`: the same blend on top of idle.
- `pick-up` (8 frames): play it once when grabbing a box.
- `holding-both`: the arm pose on its own, if you'd rather blend at runtime.
The model is about 0.75 units tall in source units, so scale it to the old mover's height. Its front is +Z. In the three.js preview the Icosphere helper is not exported.

## Truck
`truck/truck_fourcorners_delivery.glb` is about 1.5 w x 1.65 h x 3.25 l (units = m), with the front at +Z.
- `door`: the pivot is the top edge of the rear opening (0, 1.5, -1.475). Rotate about X by about +1.4 rad to swing it up and open.
- `wheel-*`: spin about their local X by `distance / 0.3` rad (the radius is 0.3).
Scale it to fit the scene. The old truck sat at TRUCK = (2.35, -5.7). A scale of about 0.8 gives a ~2.6 m long truck.

## Sky
Either load `sky/sky_dome.glb`, or build a `CylinderGeometry(40, 40, 26, 96, 1, true)` with `side: BackSide` and the panorama
(`wrapS = RepeatWrapping`, `repeat.x = 4`, `colorSpace = SRGBColorSpace`, MeshBasicMaterial so it isn't lit). Set `scene.background` / fog to #78C4E8 (top) or #F4EADB (horizon).
