# Mario Clone - Touch Edition

A web-based platformer with a hand-tuned physics engine, touch controls, and an
optional live multiplayer arena. Built with vanilla JavaScript and HTML5 Canvas,
optimised for iPhone and other mobile devices.

## Playing

### Desktop

| Key | Action |
| --- | --- |
| `←` `→` (or `A` `D`) | Move |
| `Space` / `↑` / `W` | Jump — hold for a higher jump |
| `Shift` (or `X`) | Run |
| `P` / `Esc` | Pause |
| `M` | Mute |

### Mobile

On-screen **←**, **→**, **RUN** and **JUMP** buttons. Multi-touch is supported,
so you can run and jump at the same time, and sliding a finger between buttons
works the way you would expect.

### Objective

Reach the flagpole at the end of the level. Grabbing it higher up is worth more,
and whatever is left on the clock is converted into a time bonus.

## Game mechanics

- **Jumping** — variable height: tapping gives a short hop, holding gives a full
  jump, and running gives more of both. Coyote time (6 frames) lets you jump
  just after stepping off a ledge, and jump buffering (8 frames) means a press
  made slightly before you land still fires.
- **Enemies** — stomp them from above. Consecutive stomps in one airborne
  sequence build a multiplier up to 10x; landing ends the chain. Everything
  stops at a drop rather than marching into it, pipes top the level back up
  slowly, and anything that does fall into a pit is gone for good.
- **Turtles** — one stomp tucks them into a shell, a second kick sends the shell
  sliding, and a sliding shell mows down everything in its path. Stomp a moving
  shell to stop it dead. A walking turtle turns back at a ledge and shows its
  head; a kicked shell is a projectile and sails straight off into the pit.
- **Blocks** — head-butt `?` blocks for coins and power-ups. Big Mario smashes
  brick blocks; small Mario just bumps them. Bumping a block flips any enemy
  standing on top of it.
- **Power-ups** — a mushroom makes you big (one free hit and the ability to
  smash bricks); a star makes you briefly invincible and lethal on contact.
  Like everything else that walks, a loose power-up turns back at a drop
  instead of throwing itself into the pit a second after you earned it.
- **Coins** — 50 points each, and every 100 coins is an extra life.
- **Pits and the clock** — falling into a gap or running the timer out costs a
  life regardless of size.
- **Dying** — death is a beat, not a teleport. The level freezes, the body pops
  up and tumbles off the screen, and only then does the world reset. You come
  back on the last patch of solid ground you stood on, with a moment of grace
  and a few seconds of invulnerability before control returns.
- **Levels** — clearing the flagpole awards a life and moves you to the next
  world, with faster enemies and reinforcements each time.

## Fair spawning

Pipes never drop an enemy into somebody's lap. A spawn is held off while any
player is within 260px in any direction — so nothing appears beside you while
you stand still — and, if the pipe is ahead of a moving player, for as far as
that player will travel in the next three quarters of a second. At a sprint
that is nearly 600px of clearance, so you never round a corner into a
freshly-spawned enemy. In multiplayer the same rule applies to every player,
assuming running speed since remote velocity is not synced.

## Multiplayer

When Firebase is reachable, players share a level, see each other move, compete
on a live leaderboard, and can stomp each other. Pipes spawn enemies under a
single elected spawn master so everyone sees the same world. If Firebase is
blocked or offline the game falls back to single player automatically.

### Firebase setup

Multiplayer needs two things configured on the Firebase project, both under
[console.firebase.google.com](https://console.firebase.google.com):

1. **Authentication → Sign-in method → Anonymous → enable.** Clients sign in
   anonymously before connecting, and the database rules key on the resulting
   `auth.uid`. With the provider disabled, sign-in fails and every client stays
   in single player.
2. **Realtime Database → Rules → paste `database.rules.json`** (or
   `firebase deploy --only database`). The default test-mode rules expire 30
   days after they are created, after which every read and write is denied and
   multiplayer silently stops working for everybody.

Anonymous auth is not a gate on who can play — anyone holding the public web
config can mint a token. It is there so each player has a server-verified
identity, which is what lets the rules stop one client writing another's score
or wiping the world. It also leaves room to add Google or email sign-in later:
an anonymous account can be upgraded in place with `linkWithCredential`, keeping
the same uid and everything attached to it.

### What the rules enforce

`database.rules.json` must stay comment-free — Firebase parses it as strict
JSON and reads any `"//"` key as a child path, which is rejected because path
names cannot contain a slash. The reasoning therefore lives here:

- **`players/$uid`** — you may only write your own node, and every field is
  shape- and range-checked. `$other: false` rejects any key the game does not
  write, so a hand-crafted request cannot smuggle extra data into a node that
  every other client renders.
- **`coins/$coin`** — a node exists only while that coin is banked. A claim may
  be written when the coin is free, and cleared by anyone once it respawns, but
  a live claim cannot be overwritten. That, together with the client-side
  transaction, is what stops two players banking the same coin.
- **`enemies`** — shared world state, writable by any signed-in player. Only the
  elected spawn master actually writes it, but the election is client-side, so
  the rules cannot express which client that is. Field validation is the
  available protection here, not authorship.
- **`hits/$victim`** — a per-player inbox. You read only your own; anyone may
  post a claim into yours stamped with their own uid, and your client decides
  whether to accept it. Only you can clear your inbox.
- **`allTimeLeaderboard`** — publicly readable, because the start screen shows it
  before anyone signs in. `.indexOn: score` matters: the query sorts by score,
  and without the index Firebase downloads the whole node and sorts on the
  client.

Name length is capped at 15 everywhere a name is stored, because names are
rendered in every other player's leaderboard. The client escapes them too — the
`maxlength` on the input constrains only people using the form.

### Spawn master

One client is elected to spawn enemies, write their positions and tidy up
abandoned players. The election is a pure function of the player list that every
client evaluates independently — no lock node, no election messages, no polling:
the longest-standing player that has checked in within the last 15 seconds wins.
Clean departures are instant because `onDisconnect()` removes the player node
server-side; the activity window is the backstop for a tab that is frozen or on
a dead network but still nominally connected. Timestamps are compared against
Firebase's server-corrected clock, so a device with a badly set clock cannot
decide everyone else is asleep and seize the role.

## Engine notes

- **Fixed timestep.** The simulation runs at exactly 60Hz through an accumulator
  regardless of display refresh rate, so the game plays identically on a 60Hz
  laptop and a 120Hz phone. Rendering still happens once per animation frame.
- **Swept AABB collision.** One resolver handles the player and every enemy.
  Movement is applied in sub-steps of at most 8px so nothing tunnels through a
  platform at terminal velocity, and each axis resolves separately so floors,
  ceilings and walls all behave. Cloud platforms are one-way: you jump up
  through them and land on top.
- **Device-pixel-ratio rendering.** The canvas backing store is scaled by DPR
  and the viewport adapts to the screen's shape, so the game fills the display
  without letterboxing and stays sharp on retina panels.
- **Deterministic levels.** Layout is data-driven and free of `Math.random`, so
  every player in a multiplayer session sees the same platforms and coins.
- **Grid-aligned level.** Everything sits on a 40px grid — one cell is exactly
  the player's width and height — and tiers are spaced three cells apart, well
  inside the ~158px a standing jump clears. Building on the grid is what keeps
  every gap either genuinely passable or honestly solid; hand-placed geometry
  drifts into 20 and 30px slots that look like openings but are too tight to
  walk into. `tests.html` re-checks this on every run.
- **Collision courtesies.** Clipping a few pixels of a block's corner on the
  way up slides you past it instead of killing the jump, and resolution always
  pushes clear of the deepest overlap so nothing ends up embedded in a stack of
  blocks.
- **Hitboxes that match the artwork.** The player's collision box is the
  measured size of the drawn sprite (28x40 big, 22x30 small), not the 40px
  grid cell. It used to be a flat 40 wide, so a third of big Mario — and
  nearly half of small Mario — was invisible padding that still bumped blocks
  and enemies. `tests.html` renders the sprite and scans its pixels, so the
  box and the art cannot drift apart again.
- **Cast shadows.** Shadows are projected onto the nearest surface beneath a
  body — ground, platform or block — and fade with height, rather than being
  pinned under the sprite's feet where they travel along with a jump and read
  as a sticker.

## Development

Serve the directory over HTTP and open `index.html`:

```sh
python3 -m http.server 8000
```

Open `tests.html` in a browser to run the test suite — 83 checks covering
geometry helpers, the collision resolver and its corner-correction behaviour,
level construction, level geometry (no overlapping solids, no impassable gaps,
every tier reachable, every pit jumpable), block and power-up behaviour, and the
death and respawn sequence, enemy behaviour at ledges, enemy population
limits, fair spawning, hitbox fidelity against the rendered sprite, enemy
artwork (the turtle's head and neck are scanned for in the rendered frame),
power-up safety (a loose power-up turns at a ledge, and every power-up block
has a runway before the next pit), and shadow casting, alongside DOM and
configuration checks.

Built with:

- HTML5 Canvas for rendering
- Vanilla JavaScript for game logic
- Web Audio API for sound effects and the chiptune loop
- Firebase Realtime Database for multiplayer
- CSS3 for the UI

## Deployment

The game is automatically deployed to GitHub Pages via GitHub Actions whenever
changes are pushed to the main branch.

## Browser compatibility

Works on all modern browsers including Safari (iOS), Chrome (Android/iOS),
Firefox and Edge.

## License

This is a demo project for educational purposes.
