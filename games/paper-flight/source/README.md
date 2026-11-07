# Pip

A browser game about folding a real sheet of paper, then throwing it down a long indoor hall. Up to four competitors. Empty seats are filled by bots that use the same fold rules and the same flight model. A second browser can join with the room code and take a bot's seat when this page is served by the optional Node server below.

## Little Wonders static page

The copy on the Little Wonders site (`games/paper-flight/index.html`) is a static build (`vite build`, `base: './'`). It plays **solo**: one person and three bots (Ivo, Nim, and Bru). Fold, aim, throw, and results all run in the browser from `src/sim/room.ts`. GitHub Pages does not host a WebSocket server, so that page labels itself Solo and does not offer a room link.

On localhost the page still looks for the optional server at `/ws`. If that server answers, the original room UI (code and copy link) is used, because a second person can actually join. If nothing answers, it drops into solo. On any other host, including GitHub Pages, it does not open a socket. `?online=1` or `?room=` asks for `/ws` on purpose. A public game with other people still needs a reachable `wss` server running `server/`. This site does not provide one.

## Run

```bash
npm install
npm test
npm run dev
```

On your own computer, double-click `start-pip.bat` (Windows) or run `npm run dev`. That starts the page and the WebSocket room server together, then opens http://127.0.0.1:43123 on that same computer. No account and no external service.

A localhost address on the machine that built Pip is not your computer. Cursor can forward port 43123 only while this cloud agent is open in the Agents window (plug icon, Ports). That forward is created by the Cursor app on your PC. This environment does not publish a public game URL.

Share a seat by copying the room link. A second browser (not a second tab that reuses the same saved seat token) joins that room and replaces a bot. Closing that browser marks the seat away; after a short grace period the seat becomes a bot again so the round cannot stall.

`npm start` serves a production build (`npm run build` first) on the same port.

## How a round works

1. **Fold.** Drag the crease, spin the round handle through a full turn, and fold. The smaller side always flips onto the larger. When the two sides match, you pick the side. Undo and reset are there. The guide is an optional dart recipe, not a required path. A blank sheet is legal, and it flies badly.
2. **Aim.** The hall is viewed from behind a platform whose deck is two-thirds of the way up the walls. The floor and its distance markers are below you. Click your sheet to lift it. The height control is meters above that deck; the throw is released at deck height plus that hand height. Drag to set it and to yaw, scroll to pitch, and set speed on the right-hand power slider.
3. **Flight.** Each sheet is released with a short pullback and then moves under the flight model. Distance markers run down the floor. The score is how far forward the sheet is when it comes to rest.
4. **Results.** Replay the flights or start a new round. Everyone gets a fresh sheet.

Each competitor keeps a different sheet color from the fold through the landing. Pick a free dye from the stack on the left. Names stay next to the color.

The Book tab on the left opens a paged primer: how to slide and turn the crease, how the smaller side folds over, and recipes the folder can actually run (beginner plane, pointed dart, envelope, flat hat). Place a recipe crease onto your sheet. The envelope and the hat are real folds, and they are not meant to glide.

## What the model actually is

It is a fixed-step rigid-body approximation, not a claim that a real sheet would match it fold for fold. The in-game Model note says the same thing, shorter.

- Letter paper, 215.9 mm by 279.4 mm, 80 g/m². Mass is about 4.8 g.
- A crease is an infinite line. It splits the current stack of convex facets. The lighter side is reflected. Layers stack, faces flip, and the summed area of the facets stays the area of the original sheet.
- Still air at 1.20 kg/m³. Gravity is 9.81 m/s². Lift and drag use the sheet's own velocity, so there is air-relative flow even with no wind.
- The aerodynamic force is a flat-plate function of angle of attack: an aspect-ratio lift slope, parasite drag from how blunt the nose is, induced drag, and a separated-flow plate law past stall.
- That force is applied at a neutral point estimated from the outline. A pointed, nose-heavy, symmetric fold also gets a small pure pitching couple standing in for crease reflex, so it can hold a shallow angle and glide. A blunt, tail-heavy, or lopsided fold does not, and it drops or banks.
- Integration is a fixed 1/240 s step. Rotational damping is semi-implicit. Angular rate is clamped so the tiny inertia of a sheet cannot blow the step up. That clamp is a numerical limiter.
- The sheet is rigid. It does not flex, flutter, or cushion on the floor. Planes do not disturb each other's air. On-screen thickness is exaggerated so layers stay readable.

Bots are four fixed archetypes (Ivo, Nim, Bru, Cass). They submit fold operations and an aim, then take the same integrator. They are not a language model.

## Tests

`npm test` covers:

- bisect, corner fold, rotated creases, area conservation, and layer stacking
- dart versus blank sheet, separation of the four bot throws, a longer flight than a vacuum toss, and a drop from rest
- room join, replace, authoritative resimulation, disconnect grace, and a new round
- two separate WebSocket clients joining one room

`node scripts/browser-round.mjs` drives a full UI round in Chrome and a second browser context that joins and disconnects. `node scripts/check-book.mjs` checks dye changes plus book paging, close, and reopen.
