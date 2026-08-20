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

## The single-player campaign

Six hand-built levels, each with its own setting, its own music, and a new idea
to get to grips with. Clear the last one and the campaign loops: the same six
worlds come round again as lap 2, with faster enemies, reinforcements at the
pipes and less time on the clock. The HUD shows where you are as `lap-level`,
so `2-3` is the caverns on your second time through.

| World | Level | What it brings |
| --- | --- | --- |
| 1-1 | **Green Hills** | The basics: stomping, blocks, short pits, pipes. |
| 1-2 | **Cobalt Coast** | Wider chasms and bounce pads that fire you into the cloud line. |
| 1-3 | **Crystal Caverns** | Underground. Spikes on the floor, rock pillars to climb and kick shells off. |
| 1-4 | **Skyward Steps** | Almost no floor at all — three chasms crossed on platforms that will not wait for you. |
| 1-5 | **Frostbite Pass** | Night, and nothing to grip. Momentum carries further than you mean it to. |
| 1-6 | **Castle Inferno** | Everything at once, with lava under every gap. |

### What is in them

- **Moving platforms** carry you along, horizontally or vertically, and their
  patrol is linear and deterministic — no two runs differ. Ride one into a wall
  and it leaves you behind rather than burying you in the rock.
- **Bounce pads** throw you roughly twice as high as a jump, and higher still if
  you are holding the jump button as you land.
- **Spikes** cost a big player their size, the same as walking into an enemy.
- **Lava** fills the chasms of the last level and is fatal whatever size you
  are — unless you are wearing a star, which throws you clear instead.
- **Ice** turns the grip down on Frostbite Pass: top speed is unchanged, but you
  keep sliding after you let go, and turning around takes real distance.

Adding a level means adding an entry to `LEVELS` in `game.js` — ground, ledges,
blocks, enemies, hazards and the flag, all as data. Everything else, including
the coin layout, is built from that.

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
  world. Six levels make a lap; each lap after the first is faster, better
  defended and shorter on time.

## Fair spawning

Pipes never drop an enemy into somebody's lap. A spawn is held off while any
player is within 260px in any direction — so nothing appears beside you while
you stand still — and, if the pipe is ahead of a moving player, for as far as
that player will travel in the next three quarters of a second. At a sprint
that is nearly 600px of clearance, so you never round a corner into a
freshly-spawned enemy. In multiplayer the same rule applies to every player,
assuming running speed since remote velocity is not synced.

## Multiplayer

The start screen offers **Multiplayer** and **Single Player**, and the choice is
explicit — single player never signs in, never reads and never writes, so
playing solo costs nothing and needs no network at all. "Play Again" repeats
whichever mode was chosen; **Main Menu** on the game over screen goes back to
pick again.

In multiplayer, players share a level, see each other move, compete on a live
leaderboard, and can stomp each other. Pipes spawn enemies under a single
elected spawn master so everyone sees the same world. Only the name field
matters here — it is what other players see.

### Rounds

Multiplayer is played in **rounds**. Everyone shares one clock: two and a half
minutes in a world, then the standings are settled, then the next world opens.
Rounds alternate between two games — score attack and territory — described
below.
The six campaign levels come round in order, so a session moves the whole party
through the hills, the coast, the caverns, the sky, the ice and the castle, and
then round again — the HUD counts the rounds, so round 7 is the hills a second
time.

There is no flagpole in multiplayer and there never was: the clock is the only
ending a session has. Before rounds, that meant a multiplayer game had no
ending at all — one level on an infinite loop, where the only thing the timer
could do was kill you and reset itself. A round gives the session a shape, and
a reason to stay for the next one.

- **The clock** reads `Round 2:30` and counts down, turning urgent for the last
  thirty seconds. Once the whistle blows it flips to `Next` and counts down the
  twelve-second intermission instead, so the wait is never dead air.
- **The standings** freeze at the whistle and go up on the banner, best score
  first, with ties broken on name so the board reads identically on every
  screen.
- **The world holds still** for the intermission. Locking the controls would not
  have been enough: a player left airborne over a pit when the whistle blew
  would fall into it, and a pit is fatal whatever your health and invulnerability
  say. Nothing moves, so nothing can take you while you are reading the board.
- **Score carries** across rounds — a round decides who took that world, not who
  starts the next one from zero.
- **A round boundary is an amnesty.** Anyone who ran out of lives is back in for
  the new world instead of watching it from the out-of-lives screen.

### Territory

Rounds alternate between two games, and which one you get is worked out from the
round counter rather than stored — same counter, same answer on every client,
with no field to keep in step. There is no lobby to pick and nothing to vote on:
the party plays whatever the round says, which is the same reason the worlds
rotate. Because there is an even number of worlds, the lap is folded into the
sum as well; otherwise Green Hills would be score attack for all eternity.

**Score attack** is the game as it was: coins, stomps, and the leaderboard.

**Territory** is the ledges. Every ledge you can stand on belongs to whoever
touched it last, painted in their colour, and the board on the right turns into
a live percentage of the map.

- **The ground is not capturable, on purpose.** The ground segments are 700–900px
  wide against 160–200px ledges, so counting them would make jogging along the
  floor the whole game and the platforming irrelevant. Leaving the floor neutral
  is what pushes everybody up into the air, which is where the contest is.
- **Touched, not landed on.** The claim runs on every frame you are stood on
  something, so walking from one ledge onto the next takes the second one too.
  It short-circuits on ledges already yours, so standing still is not a write
  every frame — a capture is written only when a ledge actually changes hands.
- **Holding pays**, one point per ledge per second. Without that the whole game
  is one fast lap at the death: last touch wins, so whoever laps last takes
  everything and the previous two minutes were decoration. Paying for held
  ground makes defending a corner of the map worth as much as sprinting round
  it — and gives stomping somebody off their ledge a point, which is the first
  time PvP has had one.
- **Taking a ledge off somebody** scores; colouring in a loose one does not.
- **At the whistle** the round is settled on share of the map, and your final
  share is paid into your score, which is the one currency the session and the
  all-time table share.
- A player who quits mid-round **leaves their colour on the board** rather than
  having their ledges turn grey.

A tile is identified across the network by nothing more than its index in the
level's platform list. That works only because levels are built from data in a
fixed order with no randomness anywhere in the layout, so every client numbers
the ledges identically without agreeing on anything first — and `tests.html`
rebuilds every level in the campaign twice and compares the numbering, so the
day someone reaches for `Math.random` in a layout, that is the test that fails.

Unlike a coin, a capture is not a transaction and should not be: last write wins
is exactly what taking a ledge means, where two players banking the same coin is
a bug.

Every client derives all of this — which world, how long is left, whether we are
playing or reading the board — from a single shared timestamp, rather than
anybody broadcasting "the round has ended". That is what lets somebody who joins
ninety seconds in land in the right world with the right time left on the clock
and no catch-up traffic at all. The spawn master is the only client that writes
the round on, and the write is a transaction guarded on the round it is
advancing *from*, so if the role changes hands mid-intermission the second
client reads an index that has already moved and aborts. Advancing is therefore
idempotent, which is what stops a handover skipping a world.

Multiplayer can be unavailable in two ways, and they surface differently. If the
Firebase SDK never loaded there is nothing to join, so the button is disabled on
the menu with a note saying why. If the SDK loaded but sign-in or the rules
reject the join, that cannot be known until you press the button: the run starts
solo and says so in the level banner.

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
- **`round`** — the shared clock, writable by any signed-in player for the same
  reason `enemies` is: the spawn master election is client-side, so the rules
  cannot express which client is entitled to write it. What they *can* express
  is that `index` only ever goes up. Nobody can rewind a session to replay a
  world, and a stale client cannot clobber the round everybody else has moved
  on to. `duration` is bounded at both ends so a bad write cannot leave the
  party staring at a twelve-hour countdown; the client clamps it again on read.
- **`territory/$tile`** — who owns which ledge. `owner` is validated as
  `auth.uid`, so the rule enforces the mechanic: you can only ever claim a ledge
  *for yourself*, never assign one to somebody else. Clearing a tile is allowed
  because that is how the map is wiped between worlds — and clearing somebody's
  ledge is not an attack the game does not already permit, since taking it is
  the point.
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
- **Grid-aligned levels.** Everything sits on a 40px grid — one cell is exactly
  the player's width and height — and tiers are spaced three cells apart, well
  inside the ~158px a standing jump clears. Building on the grid is what keeps
  every gap either genuinely passable or honestly solid; hand-placed geometry
  drifts into 20 and 30px slots that look like openings but are too tight to
  walk into. `tests.html` re-checks every level in the campaign on every run.
- **Levels as data, themes as tables.** A level is a plain object — where the
  ground breaks, what to stand on, what wants to kill you — and its theme is a
  table entry giving the sky, the backdrop, the dirt, the masonry and the tune.
  No renderer hard-codes a colour, so a new setting is a table entry rather than
  a new drawing routine.
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

Open `tests.html` in a browser to run the test suite — 145 checks covering
geometry helpers, the collision resolver and its corner-correction behaviour,
level construction, block and power-up behaviour, the death and respawn
sequence, enemy behaviour at ledges, enemy population limits, fair spawning,
hitbox fidelity against the rendered sprite, enemy artwork (the turtle's head
and neck are scanned for in the rendered frame), power-up safety, moving
platforms, springs and hazards, the multiplayer round clock, territory
capture, and shadow casting, alongside DOM and configuration checks.

The round suite is worth a word on how it is written. Everything the round
system decides is a pure function of one timestamp — which world, how much time
is left, whether the world should be frozen — so the whole of it is tested by
handing those functions a synthetic round and a made-up clock. No database, no
second browser, no waiting two and a half minutes for a round to end.

The level-geometry suite runs against **every level in the campaign**, not just
the first one — a stage you only reach on the fourth clear is exactly the one
nobody plays by hand before shipping. It holds each of them to the same
standard: no overlapping solids, no gap too narrow to walk into or too short to
duck under, every surface has somewhere to stand, every tier within a jump of
the one below, every chasm crossable (counting moving platforms along their
whole patrol as stepping stones), no wall along the floor taller than a jump,
nothing hanging at head height over a pit, moving platforms that never sweep
into the scenery, bounce pads with room to bounce and land, and lava that fills
a chasm rather than blocking a path.

Built with:

- HTML5 Canvas for rendering
- Vanilla JavaScript for game logic
- Web Audio API for sound effects and the chiptune loops (one per setting)
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
