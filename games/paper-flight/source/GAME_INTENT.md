# Pip — game intent

This file is the design the game is supposed to keep. Later changes should extend it, not quietly replace the loop with premade planes, scripted trajectories, or a fake multiplayer.

## Competitors

- Up to four seats.
- Empty seats are filled by computer opponents with different folds and different throws.
- Bots are not a language-model API. They submit the same kind of fold operations a person does, and they fly in the same simulator.
- A real second client can join with a room code or share link and replace a bot.
- Disconnect returns that seat to a bot without stranding the round. There is a short grace period so a refresh can reclaim the seat.
- Solo play against three bots needs no account and no external service.
- Same-browser tabs that share one saved seat token are one player reconnecting, not two players. A separate browser context is a real join.
- If a public hosted deployment is not available, the local server is the real server. Do not invent connected players.

## Folding

- Everyone starts from one flat letter sheet.
- The player places a crease line anywhere, translates it freely, and rotates it through a full turn.
- They can preview, then commit.
- The smaller portion folds over the larger. If the two sides match, either side may be chosen.
- Folds are successive real geometry: split, reflect, stack layers. Not a swap between premade airplane meshes.
- Corner folds of adjustable size fall out of placing the line, and the guide demonstrates a few.
- Undo and reset.
- The finished object can be a good glider or a bad lump. Both are allowed to fly.
- An optional guided recipe may suggest creases. It is a helper, not a substitute for folding whatever you want.

## The hall

- After folding, the view is a long indoor hall from behind a platform whose deck is two-thirds of the way up the walls, the start of the upper third. The camera looks down the hallway below. Release height is that deck plus how high the hand is held above it.
- Up to four paper objects are visible. They are the folded sheets, not stock plane models.
- Select and lift your own sheet with the cursor. Set height. Aim pitch down, up, or straight, and a modest yaw left or right.
- A vertical power slider on the right sets launch speed.
- Show a small wrist-like pullback and a forward release along the aim, then free flight in still air.
- The floor has distance markers.
- Furthest forward landing distance wins. Show every flight and the results. Offer replay and a new round.

## Flight model

Do not claim one-to-one paper physics.

Use a physically motivated approximation with units:

- gravity
- air-relative velocity even when ambient wind is zero
- lift and drag that depend on angle of attack
- mass, area, center of mass, and asymmetry taken from the folded geometry
- stability as a torque from where the aerodynamic force acts relative to the mass
- stall
- bad shapes tumble or drop; a folded dart can glide
- deterministic, stable time integration

Say what is approximate, briefly, where a player can read it. Do not cover the game with that explanation.

Do not play a scripted curve and call it flight. The trajectory has to come from integrating the forces.

## Color and the book

- Each competitor's sheet has its own light dye. The dye stays through folding, flight, and the results. Names stay readable beside it.
- The player can pick a free dye. Two seats never share one.
- A small Book control sits off the side of the menu. Open, it is a paged book: how to move and turn the crease, how the smaller side folds over, and recipes the folder can actually run (beginner plane, pointed dart, envelope, flat hat). Pictures are drawn from those creases. Placing a recipe crease uses the live sheet. The envelope and the hat are not meant to fly well, and the book says so.

## Feel

- One loop: fold, aim, throw, watch the competition, read the result.
- Desktop and mouse first. Readable, inviting, not a wall of menus.
- Strong depth in the hall. Paper layers, creases, and a visible fold.
- No emoji. No generated illustration. No relation to any other game's art.

## Authority

The server owns the round. It replays fold operations and aims through the same geometry and flight code, so every client sees the same distances. Clients render; they do not get to report their own score.
