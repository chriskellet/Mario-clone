// Game Configuration
// Every value below is expressed per simulation step; the game runs a fixed
// 60Hz timestep, so these numbers mean the same thing on any display.
const CONFIG = {
    // --- Gravity and falling ---
    GRAVITY: 0.6,
    JUMP_HOLD_GRAVITY: 0.3,   // Reduced gravity while the jump button is held
    MAX_FALL_SPEED: 15,

    // --- Jumping ---
    JUMP_POWER: -11,          // Base jump impulse
    MAX_JUMP_HOLD_TIME: 11,   // Frames the hold can extend a jump
    JUMP_CUT: 0.45,           // Velocity kept when the button is released early
    JUMP_CUT_THRESHOLD: -4,   // Only cut a jump that is still rising fast
    RUN_JUMP_BONUS: -1.6,     // Extra height at full running speed
    COYOTE_TIME: 6,           // Frames of grace after walking off a ledge
    JUMP_BUFFER: 8,           // Frames an early jump press stays queued
    STOMP_BOUNCE: -8,         // Bounce after stomping an enemy
    STOMP_BOUNCE_HELD: -12,   // Higher bounce when the jump button is held

    // --- Dying ---
    DEATH_FREEZE: 26,         // Frames held still so the hit registers
    DEATH_POP: -13,           // Upward kick before the body falls away
    DEATH_FALL: 90,           // Frames of falling before the world resets
    RESPAWN_READY: 50,        // Frames of "Ready?" before control returns
    DEATH_PIT_TAIL: 30,       // Shorter beat when you already fell out of sight

    // --- Running ---
    MOVE_SPEED: 4.6,
    RUN_SPEED: 7.2,
    ACCELERATION: 0.5,
    RUN_ACCELERATION: 0.42,
    AIR_ACCELERATION: 0.34,
    TURN_DECELERATION: 1.0,   // Skid strength when reversing on the ground
    FRICTION: 0.82,
    AIR_FRICTION: 0.97,

    // --- Camera ---
    CAMERA_SMOOTHING: 0.16,
    CAMERA_LOOKAHEAD: 90,
    CAMERA_GROUND_BIAS: 40,   // Keeps the ground clear of the touch buttons

    // --- Collision courtesies ---
    CORNER_CORRECTION: 7,     // Slide past a block corner clipped by this much
    SHADOW_FADE_DISTANCE: 260, // Height at which a cast shadow fades out

    // --- Entities ---
    PLAYER_SIZE: 40,           // Drawing size and the level's grid cell
    // The artwork is 28x45 for big and 22x34 for small (measured off the
    // rendered sprite). The collision box used to be a flat 40 wide, so a
    // third of big Mario - and nearly half of small Mario - was empty air that
    // still bumped blocks and enemies. These are the real, visible bounds.
    PLAYER_WIDTH: 28,
    SMALL_PLAYER_WIDTH: 22,
    SMALL_PLAYER_HEIGHT: 30,   // Small Mario really is shorter, hitbox included
    ENEMY_SIZE: 35,
    COIN_SIZE: 25,
    BLOCK_SIZE: 40,
    BLOCK_BUMP_SPEED: -9,      // Sharper pop so the hit reads on contact
    BLOCK_BUMP_GRAVITY: 2.6,
    BLOCK_FLASH_FRAMES: 5,
    POWERUP_SIZE: 30,
    POWERUP_SPEED: 2,
    PORTAL_WIDTH: 60,
    PORTAL_HEIGHT: 60,
    JUMPER_JUMP_POWER: -9,
    SPRING_POWER: -15,         // Launch off a bounce pad
    SPRING_POWER_HELD: -18.5,  // ...and higher still with jump held
    STAR_DURATION: 600,        // 10 seconds of invincibility
    ENEMY_RESPAWN_MS: 8000,
    MAX_ENEMIES_PER_TYPE: 3,
    PORTAL_SPAWN_MIN: 900,     // 15s between spawns at the very least
    PORTAL_SPAWN_RANGE: 600,   // ...up to 25s
    SPAWN_SAFE_RADIUS: 260,    // Never appear this close to a player
    SPAWN_LOOKAHEAD_FRAMES: 45, // ...nor within 0.75s of travel ahead of one
    enemySpeedScale: 1,        // Raised each level by initLevel()

    // --- World ---
    // WORLD_WIDTH and LEVEL_TIME are per-level: initLevel() sets them from the
    // design being built. The values here are the level 1-1 defaults.
    WORLD_WIDTH: 3600,         // Large scrollable world
    WORLD_HEIGHT: 600,         // Fixed world height
    LEVEL_TIME: 300,           // Seconds on the level clock
    TIME_TICK_FRAMES: 24,      // Frames per unit of level time
    surfaceGrip: 1,            // 1 = normal footing, lower = icy (per level)
};

// Game State
const gameState = {
    running: false,
    paused: false,
    muted: false,
    score: 0,
    coins: 0,
    lives: 3,
    level: 1,              // Counts up forever; the campaign loops beneath it
    worldLabel: '1-1',     // What the HUD shows: lap-level, Mario style
    levelName: 'Green Hills',
    levelTime: 300,        // Seconds this level starts with, after lap penalty
    time: 300,
    timeTicker: 0,
    levelCleared: false,
    keys: {},
    touchControls: { left: false, right: false, jump: false, run: false },
    camera: { x: 0, y: 0 },
    screenShake: { intensity: 0, duration: 0, maxDuration: 0 },
};

// Multiplayer Color Palettes
const PLAYER_COLORS = [
    { name: 'red', shirt: '#E52521', overalls: '#0066CC', skin: '#FFDBAC' },      // Classic Mario
    { name: 'green', shirt: '#3FBF3F', overalls: '#0066CC', skin: '#FFDBAC' },    // Luigi
    { name: 'blue', shirt: '#4A90E2', overalls: '#1A4D8F', skin: '#FFDBAC' },     // Blue Mario
    { name: 'yellow', shirt: '#FFD93D', overalls: '#E68A00', skin: '#FFDBAC' },   // Wario
    { name: 'purple', shirt: '#9B59B6', overalls: '#4A235A', skin: '#FFDBAC' },   // Waluigi
    { name: 'pink', shirt: '#FF69B4', overalls: '#C71585', skin: '#FFDBAC' },     // Pink
    { name: 'orange', shirt: '#FF8C00', overalls: '#8B4513', skin: '#FFDBAC' },   // Orange
    { name: 'cyan', shirt: '#00CED1', overalls: '#008B8B', skin: '#FFDBAC' },     // Cyan
];

// ============================================================================
//  THEMES
//  A level's theme is its whole look: sky, backdrop, the dirt under your feet,
//  the brick you stand on and the tune playing over it. Every drawing routine
//  in the game reads its colours from here rather than hard-coding them, so a
//  new setting is a table entry and not a new renderer.
// ============================================================================
const THEMES = {
    overworld: {
        sky: ['#3E7CC4', '#79B7EC', '#CDEBFF'],
        light: { kind: 'sun', core: 'rgba(255, 249, 196, 0.95)', halo: 'rgba(255, 236, 139, 0.45)' },
        backdrop: 'hills',
        far: 'rgba(88, 132, 176, 0.55)',
        near: 'rgba(74, 154, 96, 0.75)',
        clouds: 'rgba(255, 255, 255, 0.88)',
        scenery: 'bushes',
        sceneryColor: 'rgba(46, 125, 62, 0.85)',
        soil: ['#A9663A', '#8B4513', '#5C3010'],
        turf: ['#3FA34D', '#5FD068'],
        blades: true,
        brick: ['#E08A4A', '#A0522D'],
        mortar: 'rgba(90, 45, 20, 0.65)',
        block: ['#A0763F', '#6E4B22'],
        blockEdge: '#4A3113',
        oneWay: 'cloud',
        deep: ['#4A2A12', '#1B0F06'],
        track: 'overworld',
    },
    coast: {
        sky: ['#1E5F9E', '#5FB3E4', '#FFE2B8'],
        light: { kind: 'sun', core: 'rgba(255, 236, 190, 0.95)', halo: 'rgba(255, 190, 120, 0.45)' },
        backdrop: 'hills',
        far: 'rgba(70, 120, 170, 0.5)',
        near: 'rgba(96, 164, 140, 0.7)',
        clouds: 'rgba(255, 242, 226, 0.9)',
        scenery: 'palms',
        sceneryColor: 'rgba(38, 110, 88, 0.9)',
        soil: ['#E4C58A', '#C9A96B', '#8A6A3A'],
        turf: ['#69C7A8', '#8FE3C6'],
        blades: false,
        brick: ['#E9D7A8', '#B99A63'],
        mortar: 'rgba(120, 95, 55, 0.6)',
        block: ['#D8C08A', '#A8874E'],
        blockEdge: '#6E5528',
        oneWay: 'cloud',
        deep: ['#1B4A63', '#08202F'],
        track: 'overworld',
    },
    cave: {
        sky: ['#0D0B1A', '#1A1430', '#2A1F3D'],
        light: { kind: 'none' },
        backdrop: 'cave',
        far: 'rgba(52, 42, 82, 0.8)',
        near: 'rgba(34, 26, 58, 0.9)',
        clouds: null,
        scenery: 'crystals',
        sceneryColor: 'rgba(120, 200, 220, 0.55)',
        soil: ['#4A4460', '#332E48', '#1B1728'],
        turf: ['#5C5680', '#7B74A6'],
        blades: false,
        brick: ['#6A6188', '#3C3555'],
        mortar: 'rgba(20, 16, 34, 0.7)',
        block: ['#6E6690', '#3B3455'],
        blockEdge: '#1A1428',
        oneWay: 'plank',
        deep: ['#140F22', '#05030A'],
        track: 'cavern',
    },
    sky: {
        sky: ['#2E6FD8', '#7EB6F5', '#DDF1FF'],
        light: { kind: 'sun', core: 'rgba(255, 255, 235, 0.95)', halo: 'rgba(200, 235, 255, 0.45)' },
        backdrop: 'none',
        far: 'rgba(255,255,255,0.4)',
        near: 'rgba(255,255,255,0.55)',
        clouds: 'rgba(255, 255, 255, 0.95)',
        scenery: 'none',
        sceneryColor: 'rgba(255,255,255,0.6)',
        // Warm stone against a cold sky: white-on-blue washed out badly, and
        // you could not see where a ledge ended.
        soil: ['#F0E7D2', '#D2C29B', '#9A8963'],
        turf: ['#FFF6E2', '#FFFFFF'],
        blades: false,
        brick: ['#F3EAD6', '#C0AE86'],
        mortar: 'rgba(120, 105, 70, 0.55)',
        block: ['#EFE6D2', '#BFAE8C'],
        blockEdge: '#8B7B5C',
        oneWay: 'cloud',
        deep: ['rgba(120, 175, 225, 0.55)', 'rgba(70, 130, 190, 0.15)'],
        track: 'sky',
    },
    ice: {
        sky: ['#0B1B3A', '#20406E', '#7FA9C9'],
        light: { kind: 'moon', core: 'rgba(235, 245, 255, 0.95)', halo: 'rgba(180, 215, 255, 0.35)' },
        backdrop: 'peaks',
        far: 'rgba(150, 185, 220, 0.5)',
        near: 'rgba(200, 226, 245, 0.7)',
        clouds: 'rgba(220, 235, 250, 0.55)',
        scenery: 'drifts',
        sceneryColor: 'rgba(226, 240, 252, 0.9)',
        soil: ['#BCD9EC', '#7FA6C4', '#3F5F80'],
        turf: ['#DFF1FF', '#FFFFFF'],
        blades: false,
        brick: ['#CFE7F7', '#8FB4CE'],
        mortar: 'rgba(90, 130, 165, 0.55)',
        block: ['#CFE7F7', '#87AFCC'],
        blockEdge: '#4E7392',
        oneWay: 'ice',
        deep: ['#16304F', '#050D1A'],
        track: 'sky',
    },
    castle: {
        sky: ['#1B0A0A', '#3A1208', '#8A2E08'],
        light: { kind: 'ember', core: 'rgba(255, 170, 60, 0.5)', halo: 'rgba(200, 60, 10, 0.25)' },
        backdrop: 'pillars',
        far: 'rgba(60, 30, 30, 0.75)',
        near: 'rgba(38, 20, 22, 0.9)',
        clouds: 'rgba(60, 30, 25, 0.55)',
        scenery: 'none',
        sceneryColor: 'rgba(80, 40, 30, 0.9)',
        soil: ['#5A4038', '#3E2A26', '#1E1210'],
        turf: ['#6B4A40', '#8A6055'],
        blades: false,
        brick: ['#7A5A50', '#41302C'],
        mortar: 'rgba(15, 8, 6, 0.7)',
        block: ['#7E5F52', '#43302A'],
        blockEdge: '#150B08',
        oneWay: 'ember',
        deep: ['#3A0D06', '#120301'],
        track: 'castle',
    },
};

// The theme in force right now. Set by initLevel(); every renderer reads it.
let theme = THEMES.overworld;

// How many all-time scores are kept and shown. The stored table is trimmed to
// this on write so it cannot grow without bound.
const ALL_TIME_LEADERBOARD_SIZE = 10;

// Player names arrive from other clients and land in innerHTML, so they are
// untrusted markup until proven otherwise. The maxlength on the name input is
// a nicety for honest players and no defence at all against a hand-written
// database write.
const MAX_DISPLAY_NAME_LENGTH = 15;

function escapeHtml(value) {
    return String(value ?? '')
        .slice(0, MAX_DISPLAY_NAME_LENGTH)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
//  MULTIPLAYER ROUNDS
// ---------------------------------------------------------------------------
// Multiplayer used to be one level on an infinite loop: no flag is built when
// connected, so nothing could ever end a session. A round gives it a shape -
// everyone plays the same world against the same clock, the standings are
// settled, and the next world starts. All of it derives from a single shared
// timestamp rather than a synchronised state machine, so a client that joins
// halfway through lands on the right world with the right time left on it.
const ROUND = {
    DURATION_MS: 150000,        // 2:30 of play per world
    INTERMISSION_MS: 12000,     // Standings, then the next world
    // A duration read off the database is clamped into this range before it is
    // trusted. The rules bound it too; this is the client refusing to render a
    // twelve-hour countdown if anything ever slips past them.
    MIN_DURATION_MS: 30000,
    MAX_DURATION_MS: 600000,
    URGENT_MS: 30000,           // When the clock starts shouting
};

const ROUND_PHASE = {
    ACTIVE: 'active',           // Playing, clock running
    INTERMISSION: 'intermission', // Round settled, next world on the way
    EXPIRED: 'expired',         // Intermission is over and nobody has advanced yet
};

// What game a round is. Which one you get is derived from the round counter
// rather than stored, so every client agrees without a field to keep in step.
const ROUND_MODES = {
    SCORE: 'score',             // Coins, stomps and the leaderboard
    TERRITORY: 'territory',     // Paint the ledges your colour
};

// ---------------------------------------------------------------------------
//  TERRITORY
// ---------------------------------------------------------------------------
// Every ledge you can stand on belongs to whoever touched it last. The ground
// itself is deliberately excluded: the ground segments are 700-900px wide
// against 160-200px ledges, so counting them would make jogging along the floor
// the whole game and the platforming irrelevant. Leaving them neutral is what
// pushes everybody up into the air, which is where the contest is.
const TERRITORY = {
    HOLD_POINTS_PER_TILE: 1,    // Per tile, per second held
    STEAL_POINTS: 25,           // For taking a ledge off somebody
    WIN_BONUS: 2000,            // Multiplied by your final share at the whistle
};

const territoryState = {
    ref: null,
    // tileId -> uid. The source of truth for who owns what: a snapshot can
    // arrive before or after the level is built, so ownership cannot live on
    // the platform objects themselves.
    owners: new Map(),
    // uid -> palette, remembered for everyone we have ever seen. A player who
    // quits mid-round leaves their colour on the board behind them, and
    // remotePlayers no longer has them.
    colors: new Map(),
    tileCount: 0,
    // Server time the last hold payment was made, so holding pays once a second
    // however many frames go by.
    lastPaidAt: 0,
    // Cached shares, recomputed only when ownership actually changes.
    shares: [],
    dirty: true,
};

// Multiplayer State
const multiplayerState = {
    playerId: null,
    playerName: null,
    playerColor: null,
    remotePlayers: new Map(),
    lastSyncTime: 0,
    syncInterval: 150, // Reduced to ~7 updates per second, rely on interpolation
    heartbeatInterval: 5000, // Send heartbeat every 5 seconds if idle
    lastHeartbeatTime: 0,
    lastCleanupTime: 0,
    cleanupInterval: 30000, // Run cleanup every 30 seconds
    connected: false,
    playerRef: null,
    playersRef: null,
    coinsRef: null,
    enemiesRef: null,
    portalRef: null,
    hitsRef: null, // For PvP hit messages
    lastProcessedHit: null, // Track last hit to prevent duplicates
    isSpawnMaster: false, // True if this client controls enemy spawning
    // { timestamp, joinedAt } for every player, ourselves included. The spawn
    // master election runs off this rather than off a full snapshot of the
    // players node, so it costs nothing to re-run on every change.
    playerMeta: new Map(),
    // Firebase reports how far this device's clock is from the server's. Every
    // stored timestamp is server time, so comparing it against a raw
    // Date.now() silently breaks on any device with a skewed clock.
    serverTimeOffset: 0,
    lastLeaderboardSignature: '',
    lastSubmittedAllTimeScore: 0,
    roundRef: null,
    // { index, startedAt, duration } in server time, or null before the first
    // snapshot arrives. The index is a monotonic round counter, not a level
    // index - which world it means is index % LEVELS.length.
    round: null,
    // The phase this client last acted on, so the transition into the
    // intermission fires exactly once however often tick() looks at the clock.
    roundPhaseSeen: null,
    // Standings frozen at the whistle, so the board cannot move while it is
    // being read.
    roundResult: null,
    // Rate-limits the spawn master's retries when a round advance fails.
    lastAdvanceAttempt: 0,
    // Track last synced values to avoid redundant updates
    lastSyncedState: {
        x: null,
        y: null,
        direction: null,
        health: null,
        invulnerable: null,
        outOfLives: null,
        score: null,
    },
};

// Firebase Multiplayer Manager
class MultiplayerManager {
    constructor() {
        this.db = null;
        try {
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                this.db = firebase.database();
            }
        } catch (err) {
            console.warn('Firebase database unavailable:', err);
        }
        if (!this.db) {
            console.warn('Firebase not initialized - multiplayer disabled');
        }
    }

    // Signs in anonymously and returns the uid, or null if auth is unavailable.
    //
    // Anonymous sign-in is not a gate on who can play - anyone can mint a token
    // from the public config. What it buys is a server-verified identity in
    // auth.uid, which is what the database rules key on so that a client can
    // only ever write its own player node. It is also the upgrade path: an
    // anonymous account can later be linked to Google or email sign-in with
    // linkWithCredential, keeping the same uid and everything attached to it.
    async signIn() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.warn('Firebase Auth SDK not loaded - multiplayer disabled');
            return null;
        }

        try {
            const credential = await firebase.auth().signInAnonymously();
            return credential.user.uid;
        } catch (err) {
            // The most likely cause is the Anonymous provider being switched
            // off in the Firebase console.
            console.warn('Anonymous sign-in failed, running in single player:', err);
            return null;
        }
    }

    async connect(playerName) {
        if (!this.db) return false;

        try {
            const uid = await this.signIn();
            if (!uid) return false;

            multiplayerState.playerId = uid;
            multiplayerState.playerName = playerName || 'Anonymous';
            // Reported once per connection, not once per page: a rules problem
            // fixed between two runs should be able to report itself again.
            this.reportedRulesProblem = false;

            // Assign color based on player ID hash
            const colorIndex = Math.abs(this.hashCode(multiplayerState.playerId)) % PLAYER_COLORS.length;
            multiplayerState.playerColor = PLAYER_COLORS[colorIndex];
            territoryState.colors.set(uid, multiplayerState.playerColor);

            // Set up Firebase references
            multiplayerState.playersRef = this.db.ref('players');
            multiplayerState.playerRef = multiplayerState.playersRef.child(multiplayerState.playerId);
            multiplayerState.coinsRef = this.db.ref('coins');
            multiplayerState.enemiesRef = this.db.ref('enemies');
            multiplayerState.portalRef = this.db.ref('portals');
            multiplayerState.hitsRef = this.db.ref('hits');
            multiplayerState.roundRef = this.db.ref('round');
            territoryState.ref = this.db.ref('territory');

            // Initialize player data
            await multiplayerState.playerRef.set({
                name: multiplayerState.playerName,
                color: multiplayerState.playerColor.name,
                score: 0,
                x: 100,
                y: 300,
                direction: 1,
                health: 2, // Start with 2 health (big Mario)
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                // Fixed for the lifetime of the session and used to order the
                // spawn master election, so the role stays with the
                // longest-standing player instead of shuffling on every join.
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
            });

            this.trackServerTimeOffset();

            // Set up disconnect cleanup. Our inbox goes with us, otherwise any
            // hit still in flight when we close the tab is orphaned forever.
            multiplayerState.playerRef.onDisconnect().remove();
            multiplayerState.hitsRef.child(multiplayerState.playerId).onDisconnect().remove();

            // Listen for other players
            this.listenForPlayers();

            // Listen for coin state
            this.listenForCoins();

            // Clear any locally spawned enemies before syncing with Firebase
            enemies.length = 0;

            // Listen for enemy state
            this.listenForEnemies();

            // Listen for incoming PvP hits
            this.listenForHits();

            // Listen for the shared round clock. This also opens round zero if
            // this client is the first into an empty session.
            this.listenForRound();

            // Listen for who owns which ledge.
            this.listenForTerritory();

            // Update leaderboard
            this.updateLeaderboard();

            multiplayerState.connected = true;
            console.log('Connected to multiplayer as:', multiplayerState.playerName);
            return true;
        } catch (error) {
            console.error('Failed to connect to multiplayer:', error);
            return false;
        }
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return hash;
    }

    // Tracks how far this device's clock is from the server's, which keeps the
    // spawn master election honest on devices whose clocks are minutes out.
    // This is a local SDK value maintained off the existing connection, not a
    // billed read. Subscribed once per page rather than once per connect, so
    // that quitting to the menu and starting again does not stack handlers.
    trackServerTimeOffset() {
        if (this.trackingServerTime || !this.db) return;
        this.trackingServerTime = true;

        this.db.ref('.info/serverTimeOffset').on('value', (snap) => {
            multiplayerState.serverTimeOffset = snap.val() || 0;
        });
    }

    // Server-corrected wall clock. Every timestamp in the database is written
    // with ServerValue.TIMESTAMP, so this is the only sound thing to compare
    // them against.
    serverNow() {
        return Date.now() + multiplayerState.serverTimeOffset;
    }

    /**
     * A subscription the server refused. Firebase delivers this to the third
     * argument of .on(), and a listener registered without one fails in total
     * silence - the callback simply never fires again. That is how a round
     * clock that never arrived came to look identical to one still loading.
     *
     * Almost always this is the rules: a node added to database.rules.json but
     * never deployed is denied by the root's `.read: false`, and everything
     * else carries on working, which makes it look like a game bug rather than
     * a deployment one.
     */
    onSubscriptionDenied(path, error) {
        const denied = error && (error.code === 'PERMISSION_DENIED' || /permission_denied/i.test(error.message || ''));
        console.error(`Multiplayer: subscription to "${path}" failed`, error);

        if (!denied || this.reportedRulesProblem) return;
        this.reportedRulesProblem = true;

        console.error(
            `Multiplayer: the database rules do not grant access to "${path}". ` +
            'Deploy database.rules.json to the Firebase project ' +
            '(Realtime Database -> Rules, or `firebase deploy --only database`).'
        );

        // The player cannot fix this, but they can be told that what they are
        // looking at is broken rather than merely slow.
        showBanner('Round clock unavailable', 'The server rules need updating - playing without rounds', 5000);
    }

    // ---- Territory ---------------------------------------------------------

    // Ownership is a flat node of tile -> uid. There is no transaction here and
    // there should not be: last write wins is exactly what capturing a ledge
    // means, unlike a coin, where two players banking the same one is a bug.
    listenForTerritory() {
        if (!territoryState.ref) return;

        const apply = (snapshot) => {
            const tileId = tileIdFromKey(snapshot.key);
            const data = snapshot.val();
            if (tileId === null || !data || !data.owner) return;
            setTileOwner(tileId, data.owner);
        };

        const denied = (error) => this.onSubscriptionDenied('territory', error);

        territoryState.ref.on('child_added', apply, denied);
        territoryState.ref.on('child_changed', apply, denied);
        territoryState.ref.on('child_removed', (snapshot) => {
            setTileOwner(tileIdFromKey(snapshot.key), null);
        }, denied);
    }

    async claimTile(tileId) {
        if (!territoryState.ref || !multiplayerState.connected) return;

        try {
            await territoryState.ref.child(tileKey(tileId)).set({
                owner: multiplayerState.playerId,
                at: this.serverNow(),
            });
        } catch (error) {
            console.error('Failed to claim a ledge:', error);
        }
    }

    // ---- Rounds -----------------------------------------------------------

    // The round node is one small object that every client reads and only the
    // spawn master writes. Everything else - which world we are on, how long
    // is left, whether we are playing or reading the standings - is derived
    // from it locally, so there is no per-tick traffic and no way for two
    // clients to disagree about the clock beyond their offset from the server.
    listenForRound() {
        if (!multiplayerState.roundRef) return;

        multiplayerState.roundRef.on('value', (snapshot) => {
            const data = snapshot.val();

            if (!data || typeof data.index !== 'number' || typeof data.startedAt !== 'number') {
                multiplayerState.round = null;
                // An empty node means nobody has started the session yet. Any
                // client may open the first round; the transaction settles it.
                this.ensureRound();
                return;
            }

            const previous = multiplayerState.round;
            multiplayerState.round = {
                index: Math.max(0, Math.floor(data.index)),
                startedAt: data.startedAt,
                duration: clamp(
                    typeof data.duration === 'number' ? data.duration : ROUND.DURATION_MS,
                    ROUND.MIN_DURATION_MS,
                    ROUND.MAX_DURATION_MS
                ),
            };

            if (!previous || previous.index !== multiplayerState.round.index) {
                onRoundStarted(previous);
            }
        }, (error) => this.onSubscriptionDenied('round', error));
    }

    // Opens round zero if the session has none. Guarded by a transaction, so
    // several clients arriving at an empty database at once still produce one
    // round rather than one each.
    async ensureRound() {
        if (!multiplayerState.roundRef || this.openingRound) return;
        this.openingRound = true;

        try {
            await multiplayerState.roundRef.transaction((current) => {
                if (current && typeof current.index === 'number') return undefined; // Someone got there first
                return { index: 0, startedAt: this.serverNow(), duration: ROUND.DURATION_MS };
            });
        } catch (error) {
            console.error('Failed to open the first round:', error);
        } finally {
            this.openingRound = false;
        }
    }

    /**
     * Moves the session on to the next world. Only the spawn master calls this,
     * but the transaction is guarded on the index we are advancing *from*
     * rather than trusting that: if the role changes hands during an
     * intermission and both clients try, the second one reads an index that has
     * already moved and aborts. Advancing is therefore idempotent, which is
     * what stops a handover skipping a world.
     */
    async advanceRound(fromIndex) {
        if (!multiplayerState.roundRef || this.advancingRound) return false;
        this.advancingRound = true;

        try {
            const result = await multiplayerState.roundRef.transaction((current) => {
                if (!current || current.index !== fromIndex) return undefined; // Already moved on
                return { index: fromIndex + 1, startedAt: this.serverNow(), duration: ROUND.DURATION_MS };
            });

            if (result.committed) await this.clearSharedWorld();
            return result.committed;
        } catch (error) {
            console.error('Failed to advance the round:', error);
            return false;
        } finally {
            this.advancingRound = false;
        }
    }

    /**
     * Wipes the world state that belonged to the round just finished. Enemies
     * are the important half: their coordinates were chosen for the old level,
     * so carrying them over drops turtles into the walls of the new one.
     * Clearing a coin claim marks that coin uncollected, which is exactly what
     * a fresh world wants.
     */
    async clearSharedWorld() {
        try {
            const jobs = [];

            // The enemies node is writable as a whole, so it goes in one call.
            if (multiplayerState.enemiesRef) jobs.push(multiplayerState.enemiesRef.remove());

            // Coin claims are not: the rules put .write on coins/$coin and
            // nothing on the parent, so removing the node outright is denied.
            // Nulling each claim in one multi-path update is checked per child
            // instead, and clearing a claim is something the rules already
            // allow anybody to do once the coin is up for respawn.
            if (multiplayerState.coinsRef) {
                jobs.push(multiplayerState.coinsRef.once('value').then((snapshot) => {
                    const cleared = {};
                    snapshot.forEach((child) => { cleared[child.key] = null; });
                    if (Object.keys(cleared).length) return multiplayerState.coinsRef.update(cleared);
                }));
            }

            // Territory is per-world by definition, and the rules put .write on
            // territory/$tile for the same reason, so it is cleared the same
            // way. Carrying it over would open a new world with the last one's
            // map already painted in.
            if (territoryState.ref) {
                jobs.push(territoryState.ref.once('value').then((snapshot) => {
                    const cleared = {};
                    snapshot.forEach((child) => { cleared[child.key] = null; });
                    if (Object.keys(cleared).length) return territoryState.ref.update(cleared);
                }));
            }

            await Promise.all(jobs);
        } catch (error) {
            console.error('Failed to clear the world between rounds:', error);
        }
    }

    listenForPlayers() {
        const ref = multiplayerState.playersRef;

        // Child-level listeners, not a 'value' listener on the whole node. A
        // 'value' listener re-sends every player to every client on every
        // single position update - O(players^2) bandwidth carrying one
        // player's worth of new information.
        ref.on('child_added', (snapshot) => {
            this.applyPlayerSnapshot(snapshot.key, snapshot.val());
            this.onPlayersChanged();
        });

        ref.on('child_changed', (snapshot) => {
            this.applyPlayerSnapshot(snapshot.key, snapshot.val());
            this.onPlayersChanged();
        });

        ref.on('child_removed', (snapshot) => {
            multiplayerState.remotePlayers.delete(snapshot.key);
            multiplayerState.playerMeta.delete(snapshot.key);
            this.onPlayersChanged();
        }, (error) => this.onSubscriptionDenied('players', error));
    }

    applyPlayerSnapshot(id, data) {
        if (!data) return;

        // Tracked for every player including ourselves - the election needs to
        // know whether we are still a live candidate too.
        multiplayerState.playerMeta.set(id, {
            timestamp: data.timestamp || 0,
            joinedAt: data.joinedAt || 0,
        });

        if (id === multiplayerState.playerId) return;

        const existingPlayer = multiplayerState.remotePlayers.get(id);

        if (existingPlayer) {
            // Update target position for interpolation
            existingPlayer.targetX = data.x || 0;
            existingPlayer.targetY = data.y || 0;
            existingPlayer.direction = data.direction || 1;
            existingPlayer.score = data.score || 0;
            existingPlayer.health = data.health || 2;
            existingPlayer.invulnerable = data.invulnerable || false;
            existingPlayer.outOfLives = data.outOfLives || false;
            existingPlayer.timestamp = data.timestamp || this.serverNow();
        } else {
            // New player - initialize with current position
            const palette = PLAYER_COLORS.find(c => c.name === data.color) || PLAYER_COLORS[0];
            // Remembered separately so their ledges keep their colour after
            // they leave and this entry is gone.
            territoryState.colors.set(id, palette);

            multiplayerState.remotePlayers.set(id, {
                name: data.name || 'Unknown Player',
                color: palette,
                x: data.x || 0,
                y: data.y || 0,
                targetX: data.x || 0,
                targetY: data.y || 0,
                direction: data.direction || 1,
                score: data.score || 0,
                health: data.health || 2,
                invulnerable: data.invulnerable || false,
                outOfLives: data.outOfLives || false,
                timestamp: data.timestamp || this.serverNow(),
            });
        }
    }

    onPlayersChanged() {
        this.electSpawnMaster();

        if (multiplayerState.isSpawnMaster) {
            this.cleanupInactivePlayers();
        }

        this.updateLeaderboardUI();
    }

    // Elects the client responsible for spawning enemies and tidying up.
    //
    // This is a pure function of state every client already has, so it needs no
    // election messages, no lock node and no timers: each client independently
    // reaches the same answer and re-derives it whenever the roster changes.
    // Departures are usually instant anyway, because onDisconnect() removes a
    // player server-side the moment their socket drops; the activity window
    // below is the backstop for the case that does not cover - a tab that is
    // frozen, suspended or on a dead network but still nominally connected.
    //
    // Two properties matter more than they look:
    //
    //   - "longest-standing active player" rather than "most recently active".
    //     The latter changes answer on every heartbeat and depends on message
    //     arrival order, so two clients holding slightly different snapshots
    //     elect different masters - and two spawn masters means double spawns
    //     and double writes. Ordering by join time also means a new arrival
    //     never displaces a working master, which sorting by the random auth
    //     uid alone would do roughly half the time.
    //   - Timestamps are compared against server-corrected time. Stored
    //     timestamps are server-side; a device whose clock is a minute fast
    //     would otherwise consider every other player AFK and seize the role.
    electSpawnMaster() {
        const now = this.serverNow();
        const activityWindow = 15000; // 15 seconds

        // Earliest joiner first, uid as a stable tie-break for the case where
        // two players' join timestamps land on the same millisecond.
        const ids = Array.from(multiplayerState.playerMeta.keys()).sort((a, b) => {
            const joinedA = multiplayerState.playerMeta.get(a).joinedAt || 0;
            const joinedB = multiplayerState.playerMeta.get(b).joinedAt || 0;
            return joinedA === joinedB ? a.localeCompare(b) : joinedA - joinedB;
        });

        if (!ids.length) {
            multiplayerState.isSpawnMaster = false;
            return;
        }

        const active = ids.filter(id =>
            (now - (multiplayerState.playerMeta.get(id).timestamp || 0)) <= activityWindow
        );

        // If nobody looks active we have most likely just joined and have not
        // seen a heartbeat yet - fall back to the full roster so the world
        // still gets a master rather than stalling.
        const masterId = (active.length ? active : ids)[0];

        const wasSpawnMaster = multiplayerState.isSpawnMaster;
        multiplayerState.isSpawnMaster = (masterId === multiplayerState.playerId);

        if (multiplayerState.isSpawnMaster && !wasSpawnMaster) {
            console.log('🎮 You are now the spawn master - controlling enemy spawns and cleanup');
        } else if (!multiplayerState.isSpawnMaster && wasSpawnMaster) {
            console.log('🎮 Spawn master role transferred to another player');
        }
    }

    async cleanupInactivePlayers() {
        if (!multiplayerState.isSpawnMaster) return;

        const now = this.serverNow();

        // Throttle cleanup - only run every 30 seconds
        if (now - multiplayerState.lastCleanupTime < multiplayerState.cleanupInterval) {
            return;
        }

        multiplayerState.lastCleanupTime = now;
        const inactivityThreshold = 10000; // 10 seconds of inactivity (reduced from 60s to handle abandoned players faster)

        for (const [playerId, meta] of multiplayerState.playerMeta) {
            // Skip our own player
            if (playerId === multiplayerState.playerId) continue;

            const timeSinceUpdate = now - (meta.timestamp || 0);

            // If player hasn't updated in 10 seconds, remove them
            if (timeSinceUpdate > inactivityThreshold) {
                const name = multiplayerState.remotePlayers.get(playerId)?.name || playerId;
                console.log(`🧹 Cleaning up inactive player: ${name} (inactive for ${Math.round(timeSinceUpdate / 1000)}s)`);

                try {
                    // Remove player from players list, along with any hit
                    // claims still sitting in their inbox - nothing will ever
                    // read those once the player is gone.
                    await multiplayerState.playersRef.child(playerId).remove();
                    await multiplayerState.hitsRef.child(playerId).remove();
                } catch (error) {
                    console.error('Failed to cleanup inactive player:', error);
                }
            }
        }
    }

    coinFromKey(key) {
        const index = Number.parseInt(String(key).replace('coin_', ''), 10);
        if (!Number.isInteger(index)) return null;
        return coins.find(c => c.index === index) || null;
    }

    listenForCoins() {
        // Per-coin listeners rather than a 'value' listener on the whole node:
        // one player banking one coin used to re-send the state of every coin
        // in the level to every player.
        const claim = (snapshot) => {
            const coin = this.coinFromKey(snapshot.key);
            if (!coin) return;
            coin.collected = true;
            coin.respawnTime = (snapshot.val() || {}).respawnTime;
        };

        const denied = (error) => this.onSubscriptionDenied('coins', error);

        multiplayerState.coinsRef.on('child_added', claim, denied);
        multiplayerState.coinsRef.on('child_changed', claim, denied);

        // A collected coin is represented by the node existing, so removal is
        // the respawn signal. The old 'value' handler could only ever set
        // collected = true, which meant respawned coins stayed invisible to
        // everyone except the client that removed the node.
        multiplayerState.coinsRef.on('child_removed', (snapshot) => {
            const coin = this.coinFromKey(snapshot.key);
            if (!coin) return;
            coin.collected = false;
            coin.respawnTime = null;
        }, denied);
    }

    listenForEnemies() {
        // Listen for new enemies being added
        multiplayerState.enemiesRef.on('child_added', (snapshot) => {
            const data = snapshot.val();
            const id = snapshot.key;

            // Check if we already have this enemy
            const existing = enemies.find(e => e.id === id);
            if (existing) return;

            // Create new enemy based on type
            let enemy;
            if (data.type === 'jumping') {
                enemy = new JumpingEnemy(data.x, data.y, id);
            } else if (data.type === 'turtle') {
                enemy = new TurtleEnemy(data.x, data.y, id);
            } else {
                enemy = new Enemy(data.x, data.y, id);
            }

            enemy.velocityX = data.velocityX || (data.type === 'turtle' ? -1 : -2);
            enemy.alive = data.alive !== false;
            enemies.push(enemy);
        });

        // Listen for enemy updates
        multiplayerState.enemiesRef.on('child_changed', (snapshot) => {
            const data = snapshot.val();
            const id = snapshot.key;

            const enemy = enemies.find(e => e.id === id);
            if (!enemy) return;

            // Update position and state (with interpolation target)
            enemy.x = data.x;
            enemy.y = data.y;
            enemy.velocityX = data.velocityX || enemy.velocityX;
            enemy.alive = data.alive !== false;
        });

        // Listen for enemies being removed
        multiplayerState.enemiesRef.on('child_removed', (snapshot) => {
            const id = snapshot.key;
            const index = enemies.findIndex(e => e.id === id);
            if (index !== -1) {
                enemies.splice(index, 1);
            }
        }, (error) => this.onSubscriptionDenied('enemies', error));
    }

    listenForHits() {
        // Listen for incoming PvP hit claims directed at us
        const myHitsRef = multiplayerState.hitsRef.child(multiplayerState.playerId);

        myHitsRef.on('child_added', (snapshot) => {
            const hitData = snapshot.val();
            const hitId = snapshot.key;

            // Prevent processing the same hit twice
            if (multiplayerState.lastProcessedHit === hitId) return;
            multiplayerState.lastProcessedHit = hitId;

            // Validate hit data structure
            if (!hitData || !hitData.attackerId || !hitData.timestamp) {
                console.warn('Invalid hit data received:', hitData);
                snapshot.ref.remove();
                return;
            }

            // Check if hit claim is recent (within last 2 seconds)
            const hitAge = Date.now() - hitData.timestamp;
            if (hitAge > 2000 || hitAge < 0) {
                console.warn('Hit claim is too old or in the future, ignoring');
                snapshot.ref.remove();
                return;
            }

            // Validate that the attacker exists
            const attacker = multiplayerState.remotePlayers.get(hitData.attackerId);
            if (!attacker) {
                console.warn('Hit from unknown player:', hitData.attackerId);
                snapshot.ref.remove();
                return;
            }

            // CONSENSUS VALIDATION: Check if we agree with the attacker's claim
            // 1. Position validation: Were we near the claimed position?
            const ourActualX = player.x;
            const ourActualY = player.y;
            const claimedVictimX = hitData.victimX;
            const claimedVictimY = hitData.victimY;

            // Allow for some tolerance due to network lag (30 pixels)
            const positionTolerance = 30;
            const positionDiffX = Math.abs(ourActualX - claimedVictimX);
            const positionDiffY = Math.abs(ourActualY - claimedVictimY);

            if (positionDiffX > positionTolerance || positionDiffY > positionTolerance) {
                console.warn(`Position mismatch - claimed: (${claimedVictimX}, ${claimedVictimY}), actual: (${ourActualX}, ${ourActualY})`);
                snapshot.ref.remove();
                return;
            }

            // 2. Geometry validation: Was attacker above us (valid stomp)?
            const attackerY = hitData.attackerY;
            if (attackerY >= ourActualY) {
                console.warn('Invalid stomp geometry - attacker was not above victim');
                snapshot.ref.remove();
                return;
            }

            // 3. Check if we're already invulnerable (can't be hit)
            if (player.invulnerable) {
                console.log('Hit claim rejected - we are invulnerable');
                snapshot.ref.remove();
                return;
            }

            // 4. Check if we're already dead
            if (player.outOfLives) {
                console.log('Hit claim rejected - we are already dead');
                snapshot.ref.remove();
                return;
            }

            // CONSENSUS REACHED! Both parties agree on the hit
            console.log(`✅ Consensus: Valid hit from ${hitData.attackerName}`);
            player.hit(true); // Apply damage to ourselves

            // Clean up the hit message
            snapshot.ref.remove();
        });
    }

    // Interpolate remote player positions for smooth movement
    interpolateRemotePlayers() {
        multiplayerState.remotePlayers.forEach((playerData) => {
            // Smooth interpolation - move 20% of the way to target each frame
            const lerpFactor = 0.2;
            playerData.x += (playerData.targetX - playerData.x) * lerpFactor;
            playerData.y += (playerData.targetY - playerData.y) * lerpFactor;
        });
    }

    async syncPlayerPosition(x, y, direction, health, invulnerable, outOfLives) {
        if (!multiplayerState.connected || !multiplayerState.playerRef) return;

        const now = Date.now();
        const timeSinceLastSync = now - multiplayerState.lastSyncTime;
        const timeSinceHeartbeat = now - multiplayerState.lastHeartbeatTime;

        // Check if any values have changed (with 2 pixel tolerance for position)
        const last = multiplayerState.lastSyncedState;
        const roundedX = Math.round(x);
        const roundedY = Math.round(y);
        const hasChanged =
            Math.abs(roundedX - (last.x || 0)) > 2 ||
            Math.abs(roundedY - (last.y || 0)) > 2 ||
            direction !== last.direction ||
            health !== last.health ||
            invulnerable !== last.invulnerable ||
            outOfLives !== last.outOfLives ||
            gameState.score !== last.score;

        // Sync if: values changed OR it's time for heartbeat
        const shouldSync = hasChanged || timeSinceHeartbeat >= multiplayerState.heartbeatInterval;

        // Throttle to prevent too frequent updates
        if (timeSinceLastSync < multiplayerState.syncInterval) return;

        if (!shouldSync) return;

        multiplayerState.lastSyncTime = now;
        if (!hasChanged) {
            multiplayerState.lastHeartbeatTime = now; // This was a heartbeat
        }

        try {
            await multiplayerState.playerRef.update({
                x: roundedX,
                y: roundedY,
                direction,
                score: gameState.score,
                health: health || 2,
                invulnerable: invulnerable || false,
                outOfLives: outOfLives || false,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
            });

            // Update last synced state
            last.x = roundedX;
            last.y = roundedY;
            last.direction = direction;
            last.health = health;
            last.invulnerable = invulnerable;
            last.outOfLives = outOfLives;
            last.score = gameState.score;
        } catch (error) {
            console.error('Failed to sync position:', error);
        }
    }

    async syncEnemyState(enemy) {
        if (!multiplayerState.connected || !enemy.id) return;

        const now = Date.now();
        // Throttle to ~10 updates per second
        if (now - enemy.lastSyncTime < 100) return;
        enemy.lastSyncTime = now;

        const enemyRef = multiplayerState.enemiesRef.child(enemy.id);

        try {
            await enemyRef.update({
                x: Math.round(enemy.x),
                y: Math.round(enemy.y),
                velocityX: enemy.velocityX,
                alive: enemy.alive,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
            });
        } catch (error) {
            console.error('Failed to sync enemy:', error);
        }
    }

    async sendHitClaim(victimId, attackerX, attackerY, victimX, victimY) {
        if (!multiplayerState.connected) return;

        try {
            // Send hit claim to victim's hits inbox
            const hitRef = multiplayerState.hitsRef.child(victimId).push();
            await hitRef.set({
                attackerId: multiplayerState.playerId,
                attackerName: multiplayerState.playerName,
                attackerX: Math.round(attackerX),
                attackerY: Math.round(attackerY),
                victimX: Math.round(victimX),
                victimY: Math.round(victimY),
                timestamp: Date.now(),
            });
        } catch (error) {
            console.error('Failed to send hit claim:', error);
        }
    }

    async spawnEnemy(portalX, portalY, type) {
        if (!multiplayerState.connected) return null;

        try {
            const enemyRef = multiplayerState.enemiesRef.push();
            await enemyRef.set({
                x: Math.round(portalX),
                y: Math.round(portalY),
                velocityX: type === 'turtle' ? -1 : -2,
                alive: true,
                type: type, // 'normal', 'jumping', or 'turtle'
                spawnedBy: multiplayerState.playerId,
                spawnedAt: Date.now(),
                timestamp: firebase.database.ServerValue.TIMESTAMP,
            });
            return enemyRef.key;
        } catch (error) {
            console.error('Failed to spawn enemy:', error);
            return null;
        }
    }

    async removeEnemy(enemyId) {
        if (!multiplayerState.connected || !enemyId) return;

        try {
            await multiplayerState.enemiesRef.child(enemyId).remove();
        } catch (error) {
            console.error('Failed to remove enemy:', error);
        }
    }

    async collectCoin(coinIndex) {
        if (!multiplayerState.connected) return;

        const coinKey = `coin_${coinIndex}`;
        const coinRef = multiplayerState.coinsRef.child(coinKey);

        try {
            // Use transaction to prevent race conditions
            const result = await coinRef.transaction((current) => {
                if (current === null || current.collected === false) {
                    return {
                        collected: true,
                        collectedBy: multiplayerState.playerId,
                        collectedAt: Date.now(),
                        respawnTime: Date.now() + 10000, // 10 seconds
                    };
                }
                return undefined; // Abort - coin already collected
            });

            return result.committed;
        } catch (error) {
            console.error('Failed to collect coin:', error);
            return false;
        }
    }

    // Called whenever our score changes. Deliberately does no network I/O: our
    // score already rides along on the throttled, dirty-checked player sync,
    // so there is nothing here worth a write of its own. It used to write a
    // dedicated /leaderboard node that nothing ever read, plus a full
    // transaction over the all-time table, on every single coin.
    updateLeaderboard() {
        this.updateLeaderboardUI();
    }

    // Persists a finished run to the all-time table. Call this at the end of a
    // run, not on every score change - it is a read-modify-write over the whole
    // node and is by far the most expensive operation in the game.
    async submitAllTimeScore() {
        if (!this.db) return;
        if (!multiplayerState.playerName || gameState.score <= 0) return;

        const playerName = multiplayerState.playerName;
        const score = gameState.score;

        // Nothing to do if we have not beaten our own submitted best.
        if (score <= multiplayerState.lastSubmittedAllTimeScore) return;
        multiplayerState.lastSubmittedAllTimeScore = score;

        try {
            const allTimeRef = this.db.ref('allTimeLeaderboard');

            // Use transaction to ensure atomic update
            await allTimeRef.transaction((currentData) => {
                if (!currentData) {
                    currentData = {};
                }

                // Find if player already exists
                let existingKey = null;
                let existingScore = 0;

                Object.entries(currentData).forEach(([key, data]) => {
                    if (data.name === playerName) {
                        existingKey = key;
                        existingScore = data.score || 0;
                    }
                });

                // Update if new score is higher
                if (!existingKey || score > existingScore) {
                    const key = existingKey || this.db.ref().child('allTimeLeaderboard').push().key;
                    currentData[key] = {
                        name: playerName,
                        score: score,
                        timestamp: Date.now(),
                    };
                }

                // Only the top scores are ever displayed, so only the top
                // scores are worth storing. Without this the node grows by one
                // entry per new name forever, and every transaction above has
                // to read and rewrite all of it.
                const ranked = Object.entries(currentData)
                    .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
                    .slice(0, ALL_TIME_LEADERBOARD_SIZE);

                return Object.fromEntries(ranked);
            });
        } catch (error) {
            console.error('Failed to update all-time leaderboard:', error);
        }
    }

    loadAllTimeLeaderboard() {
        if (!this.db) return;

        const allTimeRef = this.db.ref('allTimeLeaderboard');
        allTimeRef.orderByChild('score').limitToLast(ALL_TIME_LEADERBOARD_SIZE).on('value', (snapshot) => {
            const allTimeList = document.getElementById('all-time-list');
            const panel = document.getElementById('all-time-leaderboard');
            if (!allTimeList) return;

            const data = snapshot.val();
            // Only take up room on the start screen once there is something to show.
            if (panel) panel.classList.toggle('hidden', !data);
            if (!data) {
                allTimeList.innerHTML = '';
                return;
            }

            // Convert to array and sort by score descending
            const entries = Object.values(data)
                .sort((a, b) => b.score - a.score)
                .slice(0, ALL_TIME_LEADERBOARD_SIZE);

            // Render top 10
            allTimeList.innerHTML = entries.map((entry, index) => `
                <div class="all-time-entry">
                    <span class="rank">${this.getRankEmoji(index + 1)}</span>
                    <span class="name">${escapeHtml(entry.name)}</span>
                    <span class="score">${Number(entry.score) || 0}</span>
                </div>
            `).join('');
        });
    }

    getRankEmoji(rank) {
        const emojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        return emojis[rank - 1] || `#${rank}`;
    }

    updateLeaderboardUI() {
        const leaderboardList = document.getElementById('leaderboard-list');
        if (!leaderboardList) return;

        if (isTerritoryRound()) {
            this.updateTerritoryUI(leaderboardList);
            return;
        }

        // Combine current player with remote players
        const allPlayers = [
            {
                id: multiplayerState.playerId,
                name: multiplayerState.playerName,
                score: gameState.score,
                isYou: true,
            },
            ...Array.from(multiplayerState.remotePlayers.entries()).map(([id, data]) => ({
                id,
                name: data.name,
                score: data.score,
                isYou: false,
            }))
        ];

        // Sort by score descending
        allPlayers.sort((a, b) => b.score - a.score);

        // Take top 5
        const top5 = allPlayers.slice(0, 5);

        // Show leaderboard if we have players
        const leaderboard = document.getElementById('leaderboard');
        if (leaderboard && allPlayers.length > 0) {
            leaderboard.classList.remove('hidden');
        }

        // The heading is shared with the territory board, so put it back.
        const heading = document.querySelector('#leaderboard h3');
        if (heading) heading.textContent = 'Top Players';

        // Position updates arrive several times a second per player, but the
        // board only changes when a name, score or the ordering does. Skip the
        // innerHTML rebuild otherwise.
        const signature = top5.map(p => `${p.id}:${p.name}:${p.score}`).join('|');
        if (signature === multiplayerState.lastLeaderboardSignature) return;
        multiplayerState.lastLeaderboardSignature = signature;

        // Render leaderboard
        leaderboardList.innerHTML = top5.map((player, index) => `
            <div class="leaderboard-entry ${player.isYou ? 'you' : ''}">
                <span class="rank">#${index + 1}</span>
                <span class="name">${escapeHtml(player.name)}${player.isYou ? ' (You)' : ''}</span>
                <span class="score">${Number(player.score) || 0}</span>
            </div>
        `).join('');
    }

    /**
     * The live map split, as a bar per player. This is the whole scoreboard of
     * a territory round: the number that decides it is the share, so that is
     * what is on screen while it is being fought over, rather than a score
     * nobody can convert into a position in their head.
     */
    updateTerritoryUI(leaderboardList) {
        const heading = document.querySelector('#leaderboard h3');
        if (heading) heading.textContent = 'Territory';

        const leaderboard = document.getElementById('leaderboard');
        if (leaderboard) leaderboard.classList.remove('hidden');

        const shares = territoryShares();
        const held = shares.reduce((sum, entry) => sum + entry.tiles, 0);
        const free = Math.max(0, territoryState.tileCount - held);

        const rows = shares.slice(0, 5);
        const signature = `t:${rows.map(r => `${r.id}:${r.tiles}`).join('|')}:${free}`;
        if (signature === multiplayerState.lastLeaderboardSignature) return;
        multiplayerState.lastLeaderboardSignature = signature;

        const bars = rows.map((entry) => {
            const percent = Math.round(entry.share * 100);
            const color = (entry.palette && entry.palette.shirt) || '#BBBBBB';
            return `
            <div class="territory-entry ${entry.isSelf ? 'you' : ''}">
                <span class="swatch" style="background:${escapeHtml(color)}"></span>
                <span class="name">${escapeHtml(entry.name)}${entry.isSelf ? ' (You)' : ''}</span>
                <span class="share">${percent}%</span>
                <span class="bar"><span class="fill" style="width:${percent}%;background:${escapeHtml(color)}"></span></span>
            </div>`;
        });

        if (free > 0) {
            const percent = Math.round((free / (territoryState.tileCount || 1)) * 100);
            bars.push(`
            <div class="territory-entry unclaimed">
                <span class="swatch"></span>
                <span class="name">Unclaimed</span>
                <span class="share">${percent}%</span>
                <span class="bar"><span class="fill" style="width:${percent}%"></span></span>
            </div>`);
        }

        leaderboardList.innerHTML = bars.join('');
    }

    respawnPlayer() {
        if (!multiplayerState.connected) return;

        // Apply 20% score penalty
        const penalty = Math.floor(gameState.score * 0.2);
        gameState.score = Math.max(0, gameState.score - penalty);
        document.getElementById('score').textContent = gameState.score;

        // The new score reaches other players on the next player sync.
        this.updateLeaderboard();

        console.log(`Respawned with ${penalty} point penalty`);
    }

    disconnect() {
        if (multiplayerState.playerRef) {
            multiplayerState.playerRef.remove();
        }
        if (multiplayerState.playersRef) {
            multiplayerState.playersRef.off();
        }
        if (multiplayerState.coinsRef) {
            multiplayerState.coinsRef.off();
        }
        // These were left subscribed on the old teardown path, so a game over
        // followed by a new game stacked a second set of handlers on top of the
        // first - every enemy update then applied twice.
        if (multiplayerState.enemiesRef) {
            multiplayerState.enemiesRef.off();
        }
        if (multiplayerState.hitsRef && multiplayerState.playerId) {
            multiplayerState.hitsRef.child(multiplayerState.playerId).off();
            multiplayerState.hitsRef.child(multiplayerState.playerId).remove();
        }
        // The round node outlives us - it belongs to the session, not to this
        // client - so it is unsubscribed rather than removed.
        if (multiplayerState.roundRef) {
            multiplayerState.roundRef.off();
        }
        // Territory outlives us too: the ledges we painted stay painted for
        // everybody still playing the round.
        if (territoryState.ref) {
            territoryState.ref.off();
        }
        multiplayerState.playerMeta.clear();
        multiplayerState.remotePlayers.clear();
        multiplayerState.lastLeaderboardSignature = '';
        multiplayerState.isSpawnMaster = false;
        multiplayerState.round = null;
        multiplayerState.roundPhaseSeen = null;
        multiplayerState.roundResult = null;
        territoryState.owners.clear();
        territoryState.colors.clear();
        territoryState.shares = [];
        territoryState.dirty = true;
        multiplayerState.connected = false;
    }
}

// Create multiplayer manager instance
const multiplayer = new MultiplayerManager();
// ============================================================================
//  ENGINE CORE
//  Fixed-timestep simulation, device-pixel-ratio aware rendering, and a shared
//  swept AABB collision resolver used by every moving entity in the game.
// ============================================================================

// Simulation runs at a fixed 60Hz regardless of display refresh rate.
const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;

// Logical size of the viewport in world units. The canvas backing store is
// scaled by devicePixelRatio on top of this, so drawing code always works in
// these units and stays crisp on high-DPI screens.
const view = { w: 800, h: 600 };

// How much of the world a viewport may show. Wide screens get more width,
// narrow ones get more height, and neither ever gets so little that the game
// becomes unreadable.
const MAX_VIEW_W = 1050;
const MIN_VIEW_W = 420;
const MAX_VIEW_H = 600;
const MAX_VIEW_TALL = 1400;

function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function overlaps(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Particle System
class Particle {
    constructor(x, y, vx, vy, color, size, lifetime, gravity = 0.3) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.gravity = gravity;
        this.age = 0;
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.age++;
        this.alpha = 1 - (this.age / this.lifetime);
        return this.age < this.lifetime;
    }

    draw() {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        // Cheap off-screen reject
        if (screenX < -20 || screenX > view.w + 20 || screenY < -20 || screenY > view.h + 20) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let particles = [];

// Hard cap so long multiplayer sessions can never drown the frame budget.
const MAX_PARTICLES = 400;

function spawnParticle(p) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push(p);
}

function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 2;
        const size = 2 + Math.random() * 3;
        spawnParticle(new Particle(x, y, vx, vy, color, size, 30));
    }
}

function createJumpDust(x, y) {
    for (let i = 0; i < 5; i++) {
        const vx = (Math.random() - 0.5) * 4;
        const vy = Math.random() * 2;
        spawnParticle(new Particle(x, y, vx, vy, '#E0E0E0', 3, 15, 0.1));
    }
}

function createSkidDust(x, y, direction) {
    for (let i = 0; i < 2; i++) {
        const vx = direction * (1 + Math.random() * 2);
        const vy = -Math.random() * 1.5;
        spawnParticle(new Particle(x, y, vx, vy, '#D9CBA3', 2 + Math.random() * 2, 18, 0.08));
    }
}

function createSparkle(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1.5;
    spawnParticle(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 1.5 + Math.random() * 2, 24, 0.02));
}

function updateParticles() {
    particles = particles.filter(p => p.update());
}

function drawParticles() {
    particles.forEach(p => p.draw());
}

function screenShake(intensity, duration) {
    // Never let a small shake cancel a bigger one that is still playing.
    if (intensity >= gameState.screenShake.intensity) {
        gameState.screenShake.intensity = intensity;
        gameState.screenShake.duration = duration;
        gameState.screenShake.maxDuration = duration;
    }
}

// Floating Text System (for combos and score popups)
class FloatingText {
    constructor(x, y, text, color, size = 20) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.vy = -2; // Float upward
        this.lifetime = 60; // 1 second at 60fps
        this.age = 0;
        this.alpha = 1;
        this.scale = 0.5; // Start small
    }

    update() {
        this.y += this.vy;
        this.vy += 0.05; // Slight deceleration
        this.age++;

        // Scale animation: grow then fade
        if (this.age < 10) {
            this.scale = Math.min(1, this.scale + 0.1);
        } else {
            this.alpha = 1 - ((this.age - 10) / (this.lifetime - 10));
        }

        return this.age < this.lifetime;
    }

    draw() {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.font = `bold ${this.size * this.scale}px "Trebuchet MS", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Outline for better visibility
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(this.text, screenX, screenY);

        ctx.fillStyle = this.color;
        ctx.fillText(this.text, screenX, screenY);
        ctx.restore();
    }
}

let floatingTexts = [];

function createFloatingText(x, y, text, color, size = 20) {
    if (floatingTexts.length > 60) floatingTexts.shift();
    floatingTexts.push(new FloatingText(x, y, text, color, size));
}

function updateFloatingTexts() {
    floatingTexts = floatingTexts.filter(t => t.update());
}

function drawFloatingTexts() {
    floatingTexts.forEach(t => t.draw());
}

// Haptic Feedback System
const haptics = {
    supported: typeof navigator !== 'undefined' && 'vibrate' in navigator,

    // Respects the same mute toggle as audio, so one button silences the game.
    buzz(pattern) {
        if (!haptics.supported || gameState.muted) return;
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            /* Some browsers throw when vibration is blocked - ignore. */
        }
    },

    light: () => haptics.buzz(10),
    medium: () => haptics.buzz(25),
    heavy: () => haptics.buzz(50),
    success: () => haptics.buzz([10, 30, 20]),
    error: () => haptics.buzz([30, 50, 30]),
};

// ============================================================================
//  CANVAS
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const screenW = Math.max(280, window.innerWidth);
    const screenH = Math.max(240, window.innerHeight);
    const aspect = screenW / screenH;

    // The logical viewport matches the screen's shape so the canvas fills it
    // edge to edge with no letterboxing, but the amount of world on screen is
    // clamped: wide screens are led by height, narrow ones by width, so a
    // phone in portrait still shows enough level to play.
    let w, h;
    if (aspect >= MIN_VIEW_W / MAX_VIEW_H) {
        h = MAX_VIEW_H;
        w = h * aspect;
        if (w > MAX_VIEW_W) {
            w = MAX_VIEW_W;
            h = w / aspect;
        }
    } else {
        w = MIN_VIEW_W;
        h = w / aspect;
        if (h > MAX_VIEW_TALL) {
            h = MAX_VIEW_TALL;
            w = h * aspect;
        }
    }

    view.w = Math.round(w);
    view.h = Math.round(h);

    // Render at device resolution so the artwork stays crisp on retina panels.
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(view.w * dpr);
    canvas.height = Math.round(view.h * dpr);
    canvas.style.width = screenW + 'px';
    canvas.style.height = screenH + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    const rotateHint = document.getElementById('rotate-hint');
    if (rotateHint) rotateHint.classList.toggle('hidden', aspect > 0.85);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 150));

// ============================================================================
//  AUDIO
//  The context is created lazily: iOS/Safari refuse to start one before a user
//  gesture, and an suspended context silently swallowed every sound effect.
// ============================================================================

let audioContext = null;
let masterGain = null;

function getAudio() {
    if (!audioContext) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        audioContext = new Ctor();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.7;
        masterGain.connect(audioContext.destination);
    }
    return audioContext;
}

function unlockAudio() {
    const ac = getAudio();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume();
}

function playSound(frequency, duration, type = 'sine', volume = 0.3) {
    if (gameState.muted) return;
    const ac = getAudio();
    if (!ac || ac.state === 'suspended') return;

    const oscillator = ac.createOscillator();
    const gainNode = ac.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    const now = ac.currentTime;
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
}

// Schedules a short note relative to "now" without stacking setTimeouts, so
// sound effects stay in time even when the main thread is busy.
function playNote(frequency, startOffset, duration, type = 'square', volume = 0.25) {
    if (gameState.muted) return;
    const ac = getAudio();
    if (!ac || ac.state === 'suspended') return;

    const oscillator = ac.createOscillator();
    const gainNode = ac.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    oscillator.type = type;

    const start = ac.currentTime + startOffset;
    oscillator.frequency.setValueAtTime(frequency, start);
    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
}

const sounds = {
    jump: () => {
        playNote(392, 0, 0.08, 'square', 0.22);
        playNote(659, 0.05, 0.1, 'square', 0.18);
    },
    coin: () => {
        playNote(988, 0, 0.07, 'square', 0.2);
        playNote(1319, 0.06, 0.16, 'square', 0.18);
    },
    stomp: () => {
        playSound(180, 0.12, 'sawtooth', 0.25);
        playNote(90, 0.02, 0.1, 'triangle', 0.2);
    },
    bump: () => {
        playSound(140, 0.08, 'square', 0.2);
    },
    brick: () => {
        playSound(220, 0.06, 'sawtooth', 0.22);
        playNote(130, 0.03, 0.12, 'square', 0.18);
    },
    powerUp: () => {
        [523, 659, 784, 1047].forEach((f, i) => playNote(f, i * 0.07, 0.12, 'square', 0.22));
    },
    powerDown: () => {
        [660, 550, 440, 330].forEach((f, i) => playNote(f, i * 0.06, 0.12, 'square', 0.2));
    },
    sprout: () => {
        [392, 523, 659, 784, 988].forEach((f, i) => playNote(f, i * 0.05, 0.1, 'triangle', 0.16));
    },
    star: () => {
        [523, 784, 1047, 784, 1047, 1319].forEach((f, i) => playNote(f, i * 0.06, 0.1, 'square', 0.16));
    },
    die: () => {
        [440, 392, 330, 262, 196].forEach((f, i) => playNote(f, i * 0.11, 0.18, 'square', 0.24));
    },
    levelComplete: () => {
        [523, 659, 784, 1047, 1319, 1047, 1319, 1568].forEach((f, i) =>
            playNote(f, i * 0.13, 0.22, 'square', 0.22));
    },
    oneUp: () => {
        [784, 1047, 1319, 1568].forEach((f, i) => playNote(f, i * 0.08, 0.14, 'triangle', 0.2));
    },
    kick: () => {
        playSound(300, 0.09, 'square', 0.22);
    },
    spring: () => {
        [330, 494, 740, 988].forEach((f, i) => playNote(f, i * 0.035, 0.09, 'square', 0.2));
    },
    sizzle: () => {
        playSound(120, 0.3, 'sawtooth', 0.25);
        playNote(90, 0.05, 0.35, 'square', 0.2);
    },
};

// ---------------------------------------------------------------------------
//  Background music: a short original chiptune loop, scheduled ahead of time
//  through the Web Audio clock so it never drifts with frame rate.
// ---------------------------------------------------------------------------
// One 32-step loop per setting, so walking into a cave or a castle sounds
// like walking into a cave or a castle. 0 = rest.
const MUSIC_TRACKS = {
    overworld: {
        tempo: 0.13,
        melody: [
            784, 0, 988, 0, 1047, 0, 988, 784,
            880, 0, 784, 0, 659, 0, 0, 0,
            698, 0, 880, 0, 1047, 0, 880, 698,
            784, 0, 659, 0, 523, 0, 0, 0,
        ],
        bass: [
            262, 0, 0, 196, 262, 0, 0, 196,
            220, 0, 0, 165, 220, 0, 0, 165,
            175, 0, 0, 131, 175, 0, 0, 131,
            196, 0, 0, 147, 196, 0, 247, 294,
        ],
        lead: 'square',
        low: 'triangle',
    },
    // Slower, minor, sparse - the sound of a lot of rock overhead.
    cavern: {
        tempo: 0.16,
        melody: [
            440, 0, 0, 523, 0, 440, 0, 0,
            392, 0, 0, 466, 0, 392, 0, 0,
            349, 0, 415, 0, 349, 0, 0, 0,
            330, 0, 392, 0, 440, 0, 0, 0,
        ],
        bass: [
            110, 0, 110, 0, 0, 0, 104, 0,
            98, 0, 98, 0, 0, 0, 93, 0,
            87, 0, 87, 0, 0, 0, 82, 0,
            110, 0, 0, 0, 82, 0, 0, 0,
        ],
        lead: 'triangle',
        low: 'sine',
    },
    // Weightless and bright: wide leaps, plenty of air between the notes.
    sky: {
        tempo: 0.14,
        melody: [
            1047, 0, 0, 1319, 0, 1568, 0, 0,
            1319, 0, 1047, 0, 880, 0, 0, 0,
            988, 0, 0, 1175, 0, 1397, 0, 0,
            1175, 0, 988, 0, 784, 0, 0, 0,
        ],
        bass: [
            262, 0, 0, 0, 330, 0, 0, 0,
            349, 0, 0, 0, 262, 0, 0, 0,
            247, 0, 0, 0, 294, 0, 0, 0,
            330, 0, 0, 0, 247, 0, 0, 0,
        ],
        lead: 'square',
        low: 'sine',
    },
    // Fast, low and menacing for the last stretch.
    castle: {
        tempo: 0.11,
        melody: [
            233, 247, 233, 220, 233, 0, 175, 0,
            233, 247, 233, 220, 233, 0, 196, 0,
            208, 220, 208, 196, 208, 0, 156, 0,
            233, 0, 220, 0, 208, 0, 196, 0,
        ],
        bass: [
            87, 0, 87, 0, 87, 0, 87, 0,
            82, 0, 82, 0, 82, 0, 82, 0,
            78, 0, 78, 0, 78, 0, 78, 0,
            73, 0, 73, 0, 87, 0, 98, 0,
        ],
        lead: 'sawtooth',
        low: 'triangle',
    },
};

const music = {
    timer: null,
    nextNoteTime: 0,
    step: 0,
    trackName: 'overworld',
    ...MUSIC_TRACKS.overworld,

    /** Swaps the loop. Restarts playback mid-run so a new level sounds new. */
    setTrack(name) {
        const track = MUSIC_TRACKS[name] || MUSIC_TRACKS.overworld;
        if (this.trackName === name) return;
        this.trackName = name;
        Object.assign(this, track);
        this.step = 0;
        if (this.timer) {
            this.stop();
            this.start();
        }
    },

    start() {
        if (this.timer || gameState.muted) return;
        const ac = getAudio();
        if (!ac || ac.state === 'suspended') return;
        this.nextNoteTime = ac.currentTime + 0.1;
        this.timer = setInterval(() => this.schedule(), 40);
    },

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    schedule() {
        const ac = getAudio();
        if (!ac || gameState.muted || !gameState.running || gameState.paused) return;

        // Queue up everything due in the next 200ms.
        while (this.nextNoteTime < ac.currentTime + 0.2) {
            const offset = this.nextNoteTime - ac.currentTime;
            const i = this.step % this.melody.length;

            if (this.melody[i]) playNote(this.melody[i], offset, this.tempo * 0.85, this.lead, 0.055);
            if (this.bass[i]) playNote(this.bass[i], offset, this.tempo * 0.9, this.low, 0.075);

            this.nextNoteTime += this.tempo;
            this.step++;
        }
    },
};

// ============================================================================
//  COLLISION
//  One resolver for the player and every enemy. Movement is applied in small
//  sub-steps so nothing tunnels through a platform at terminal velocity, and
//  each axis is resolved separately so walls, floors and ceilings all work.
// ============================================================================

const MAX_SUBSTEP = 8;

let solidCache = [];

// Rebuilt once per simulation tick and shared by every entity.
function rebuildSolids() {
    solidCache = platforms.slice();
    for (const block of blocks) {
        if (!block.destroyed) solidCache.push(block);
    }
    for (const portal of portals) solidCache.push(portal);
}

/**
 * Moves an entity by its velocity and pushes it out of any solid it hits.
 * Returns { hitWall: -1|0|1, ceiling: solid|null, ground: solid|null }.
 * The caller decides what to do about it (stop, bounce, bump a block...), so
 * the same resolver serves the player, walkers, jumpers and sliding shells.
 */
function moveAndCollide(entity, options = {}) {
    const solids = options.solids || solidCache;
    const ignoreOneWay = options.ignoreOneWay === true;

    const distance = Math.max(Math.abs(entity.velocityX), Math.abs(entity.velocityY));
    const steps = Math.max(1, Math.ceil(distance / MAX_SUBSTEP));
    let stepX = entity.velocityX / steps;
    let stepY = entity.velocityY / steps;

    const result = { hitWall: 0, ceiling: null, ground: null };
    entity.onGround = false;

    const nudge = options.cornerCorrection || 0;

    for (let step = 0; step < steps; step++) {
        // --- Horizontal ---
        if (stepX !== 0) {
            entity.x += stepX;

            // Resolve against the deepest overlap rather than whichever solid
            // happens to come first in the list. Stopping at the first hit can
            // leave the entity still inside a second one when several are
            // touching, which is how bodies end up embedded in a staircase.
            let push = 0;
            for (const solid of solids) {
                if (solid.oneWay && !ignoreOneWay) continue;
                if (!overlaps(entity, solid)) continue;

                const correction = stepX > 0
                    ? (solid.x - entity.width) - entity.x
                    : (solid.x + solid.width) - entity.x;
                if (Math.abs(correction) > Math.abs(push)) push = correction;
            }
            if (push !== 0) {
                entity.x += push;
                result.hitWall = stepX > 0 ? 1 : -1;
                // Stop advancing into the wall for the rest of this frame,
                // otherwise later sub-steps re-collide with the same solid.
                stepX = 0;
            }
        }

        // --- Vertical ---
        if (stepY !== 0) {
            const previousBottom = entity.y + entity.height;
            entity.y += stepY;

            let push = 0;
            let landedOn = null;
            let bumpedInto = null;
            for (const solid of solids) {
                if (!overlaps(entity, solid)) continue;

                let correction;
                if (stepY > 0) {
                    // One-way platforms only catch you if you were already above them.
                    if (solid.oneWay && !ignoreOneWay && previousBottom > solid.y + 1) continue;
                    correction = (solid.y - entity.height) - entity.y;
                    if (Math.abs(correction) > Math.abs(push)) { push = correction; landedOn = solid; }
                } else {
                    if (solid.oneWay && !ignoreOneWay) continue;
                    correction = (solid.y + solid.height) - entity.y;
                    if (Math.abs(correction) > Math.abs(push)) { push = correction; bumpedInto = solid; }
                }
            }

            // Clipping the corner of a block on the way up used to kill the
            // jump outright. If only a sliver is caught, slide past it instead
            // - the jump was clearly meant to go through the gap.
            if (bumpedInto && nudge > 0 && slideAroundCorner(entity, bumpedInto, solids, nudge, ignoreOneWay)) {
                continue;
            }

            if (push !== 0) {
                entity.y += push;
                entity.velocityY = 0;
                if (landedOn) {
                    entity.onGround = true;
                    result.ground = landedOn;
                } else if (bumpedInto) {
                    result.ceiling = bumpedInto;
                }
                // The remaining sub-steps would drive straight back into it and
                // a block would report two head-butts from a single jump.
                stepY = 0;
            }
        }

        if (stepX === 0 && stepY === 0) break;
    }

    // Remembered so the platform can carry whatever is standing on it next
    // frame. Anything that leaves the surface drops the reference the moment
    // it lands somewhere else - or on nothing at all.
    entity.ridingPlatform = result.ground && result.ground.carries ? result.ground : null;

    return result;
}

/**
 * Corner correction. When a rising entity catches only a few pixels of a
 * block's edge, shift it sideways past the obstruction and let the jump
 * continue. Returns true when the entity was moved clear.
 */
function slideAroundCorner(entity, ceiling, solids, maxNudge, ignoreOneWay) {
    const overshootLeft = (entity.x + entity.width) - ceiling.x;   // caught by its left edge
    const overshootRight = (ceiling.x + ceiling.width) - entity.x; // caught by its right edge

    let shift = 0;
    if (overshootLeft > 0 && overshootLeft <= maxNudge) shift = -overshootLeft - 0.5;
    else if (overshootRight > 0 && overshootRight <= maxNudge) shift = overshootRight + 0.5;
    if (shift === 0) return false;

    // Only worth doing if the new position is genuinely clear.
    const moved = { x: entity.x + shift, y: entity.y, width: entity.width, height: entity.height };
    const stillStuck = solids.some(s => (!s.oneWay || ignoreOneWay) && overlaps(moved, s));
    if (stillStuck) return false;

    entity.x += shift;
    return true;
}

/** Top of the nearest solid directly beneath a box, or null over a pit. */
function surfaceBelow(box) {
    const feet = box.y + box.height;
    let best = null;
    for (const solid of solidCache) {
        if (solid.x >= box.x + box.width || solid.x + solid.width <= box.x) continue;
        if (solid.y < feet - 0.5) continue;               // must actually be below
        if (best === null || solid.y < best) best = solid.y;
    }
    return best;
}

/**
 * Draws a contact shadow on whatever the entity is above, rather than pinned
 * under its feet. A shadow that travels with a jumping sprite reads as a
 * sticker; one that stays on the floor and fades with height reads as light.
 */
function drawGroundShadow(entity, centerScreenX) {
    const surface = surfaceBelow(entity);
    if (surface === null) return;                         // nothing below - over a pit

    const drop = surface - (entity.y + entity.height);
    if (drop > CONFIG.SHADOW_FADE_DISTANCE) return;

    const closeness = clamp(1 - drop / CONFIG.SHADOW_FADE_DISTANCE, 0, 1);
    const screenY = surface - gameState.camera.y;
    if (screenY < -20 || screenY > view.h + 20) return;

    ctx.save();
    ctx.globalAlpha = 0.05 + 0.17 * closeness;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(
        centerScreenX,
        screenY + 2,
        (entity.width / 2.3) * (0.55 + 0.45 * closeness),
        4.5 * (0.5 + 0.5 * closeness),
        0, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
}

// Is there something to stand on just past the entity's leading edge?
function hasFloorAhead(entity, direction) {
    const probeX = direction > 0 ? entity.x + entity.width + 4 : entity.x - 4;
    const probeY = entity.y + entity.height + 6;

    for (const solid of solidCache) {
        if (probeX >= solid.x && probeX <= solid.x + solid.width &&
            probeY >= solid.y && probeY <= solid.y + solid.height) {
            return true;
        }
    }
    return false;
}

// ============================================================================
//  PLAYER
// ============================================================================

class Player {
    constructor(x, y, colorPalette = null) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_SIZE;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.wasOnGround = false;
        this.direction = 1;
        this.invulnerable = false;
        this.invulnerableUntil = 0;
        this.isJumping = false;
        this.jumpTime = 0;
        this.colorPalette = colorPalette || PLAYER_COLORS[0]; // Default to red Mario
        this._health = 2; // 2 = big, 1 = small
        this.outOfLives = false;
        this.hasUsedContinue = false;
        this.combo = 0; // Combo counter for consecutive kills
        this.maxCombo = 10; // Cap at 10x multiplier
        this.deathX = 0; // Store death position for grave marker
        this.deathY = 0;

        // --- Game feel state ---
        this.coyoteTime = 0;      // Frames of grace after walking off a ledge
        this.jumpBuffer = 0;      // Frames a queued jump press stays valid
        this.jumpHeld = false;    // Was the jump control down last frame?
        this.skidding = false;
        this.running = false;
        this.animTime = 0;
        this.walkPhase = 0;
        this.squash = 1;          // 1 = neutral, <1 squashed, >1 stretched
        this.starTimer = 0;       // Frames of star invincibility remaining
        this.controlLock = 0;     // Frames where input is ignored (cutscenes)
        this.dying = false;       // Playing the death animation
        this.springBounce = false; // Launched by a pad, so not a jump to cut short
        this.deathTimer = 0;
        this.deathSpin = 0;
        this.safeGround = null;   // Last solid footing, used as a checkpoint
    }

    get starPower() {
        return this.starTimer > 0;
    }

    get health() {
        return this._health;
    }

    /**
     * Changing size changes the hitbox too: small Mario is genuinely shorter,
     * so he fits under blocks a big Mario cannot. The feet stay planted, and
     * growing pushes down out of the ceiling instead of sticking in it.
     */
    set health(value) {
        const next = clamp(value, 0, 2);
        if (next === this._health) return;

        const newHeight = next > 1 ? CONFIG.PLAYER_SIZE : CONFIG.SMALL_PLAYER_HEIGHT;
        const newWidth = next > 1 ? CONFIG.PLAYER_WIDTH : CONFIG.SMALL_PLAYER_WIDTH;
        this.y += this.height - newHeight;
        this.x += (this.width - newWidth) / 2;   // keep the sprite centred
        this.height = newHeight;
        this.width = newWidth;
        this._health = next;

        if (newHeight > CONFIG.SMALL_PLAYER_HEIGHT) this.pushOutOfSolids();
    }

    /**
     * Frees the player from anything it is inside, taking the shortest way out.
     * Growing widens the box by 3px on each side as well as raising it, so a
     * mushroom grabbed against a pipe can leave the player in a wall, not just
     * in a ceiling.
     */
    pushOutOfSolids() {
        for (let attempt = 0; attempt < 24; attempt++) {
            const stuck = solidCache.find(solid => !solid.oneWay && overlaps(this, solid));
            if (!stuck) return;

            const outLeft = (stuck.x - this.width) - this.x;        // negative
            const outRight = (stuck.x + stuck.width) - this.x;      // positive
            const outDown = (stuck.y + stuck.height) - this.y;      // positive
            const shortestX = Math.abs(outLeft) < Math.abs(outRight) ? outLeft : outRight;

            if (Math.abs(shortestX) < Math.abs(outDown)) {
                this.x += shortestX + Math.sign(shortestX) * 0.5;
            } else {
                this.y += outDown + 0.5;
            }
        }
    }

    // True while the player cannot be hurt for any reason.
    get immune() {
        return this.invulnerable || this.starPower || this.outOfLives || this.dying;
    }

    update() {
        // Don't update if out of lives (paused for decision)
        if (this.outOfLives) return;

        // A death plays out over a second and a half; nothing else the player
        // does matters until it finishes.
        if (this.dying) {
            this.updateDeath();
            return;
        }

        if (this.invulnerable && Date.now() >= this.invulnerableUntil) {
            this.setInvulnerable(false);
        }
        if (this.starTimer > 0) {
            this.starTimer--;
            if (this.starTimer === 0) {
                createFloatingText(this.x + this.width / 2, this.y, 'STAR OVER', '#FFFFFF', 16);
            } else if (this.starTimer % 3 === 0) {
                createSparkle(this.x + Math.random() * this.width, this.y + Math.random() * this.height,
                    `hsl(${(this.animTime * 12) % 360}, 90%, 60%)`);
            }
        }

        const input = this.readInput();

        this.applyHorizontal(input);
        this.applyJump(input);

        // Cap fall speed
        this.velocityY = Math.min(this.velocityY, CONFIG.MAX_FALL_SPEED);

        this.wasOnGround = this.onGround;

        const hit = moveAndCollide(this, { cornerCorrection: CONFIG.CORNER_CORRECTION });

        if (hit.hitWall !== 0 && Math.sign(this.velocityX) === hit.hitWall) {
            this.velocityX = 0;
        }
        if (hit.ceiling) {
            this.bumpCeiling(hit.ceiling);
        }
        if (hit.ground) {
            this.recordSafeGround(hit.ground);
            // Every frame you are stood on something, not only the frame you
            // land: walking from one ledge onto the next takes the second one
            // too. claimGround short-circuits on ledges already yours.
            claimGround(hit.ground);
        }

        // Keep player in world bounds
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
        }
        if (this.x + this.width > CONFIG.WORLD_WIDTH) {
            this.x = CONFIG.WORLD_WIDTH - this.width;
            this.velocityX = 0;
        }

        // Coyote time: a few frames of grace after leaving the ground.
        if (this.onGround) {
            this.coyoteTime = CONFIG.COYOTE_TIME;
            this.isJumping = false;
            this.springBounce = false;
            this.jumpTime = 0;
        } else if (this.coyoteTime > 0) {
            this.coyoteTime--;
        }

        this.handleLanding();
        this.updateAnimation();

        // Fell into a pit
        if (this.y > CONFIG.WORLD_HEIGHT + 120) {
            this.fallToDeath();
            return;
        }

        // Check for PvP collisions
        this.checkRemotePlayerCollisions();
    }

    readInput() {
        if (this.controlLock > 0) {
            this.controlLock--;
            return { left: false, right: false, jump: false, run: false };
        }
        const keys = gameState.keys;
        const touch = gameState.touchControls;
        return {
            left: !!(keys['ArrowLeft'] || keys['a'] || keys['A'] || touch.left),
            right: !!(keys['ArrowRight'] || keys['d'] || keys['D'] || touch.right),
            jump: !!(keys['ArrowUp'] || keys[' '] || keys['w'] || keys['W'] || touch.jump),
            run: !!(keys['Shift'] || keys['x'] || keys['X'] || touch.run),
        };
    }

    applyHorizontal(input) {
        const wantsRun = input.run;
        const topSpeed = wantsRun ? CONFIG.RUN_SPEED : CONFIG.MOVE_SPEED;
        const accel = this.onGround
            ? (wantsRun ? CONFIG.RUN_ACCELERATION : CONFIG.ACCELERATION)
            : CONFIG.AIR_ACCELERATION;
        // Ice levels turn the grip down: you keep sliding after letting go and
        // a turn takes real distance. Top speed and acceleration are untouched,
        // so the level is slippery without being sluggish.
        const grip = CONFIG.surfaceGrip;
        const groundFriction = 1 - (1 - CONFIG.FRICTION) * grip;

        const moving = input.left !== input.right;
        this.skidding = false;

        if (moving) {
            const wanted = input.right ? 1 : -1;
            const turning = this.velocityX !== 0 && Math.sign(this.velocityX) !== wanted;

            // Turning around on the ground gives a fast, visible skid - this is
            // most of what makes Mario's momentum readable.
            if (turning && this.onGround) {
                this.velocityX += wanted * CONFIG.TURN_DECELERATION * grip;
                this.skidding = Math.abs(this.velocityX) > 1.5;
                if (this.skidding && this.animTime % 4 === 0) {
                    createSkidDust(this.x + this.width / 2, this.y + this.height - 2, -wanted);
                }
            } else {
                this.velocityX += wanted * accel;
            }

            this.velocityX = clamp(this.velocityX, -topSpeed, topSpeed);
            this.direction = wanted;
        } else {
            this.velocityX *= this.onGround ? groundFriction : CONFIG.AIR_FRICTION;
            if (Math.abs(this.velocityX) < 0.08) this.velocityX = 0;
        }

        // Walking speed is not clamped while a run is decaying, so a released
        // run button coasts down instead of snapping to walking pace.
        if (!wantsRun && Math.abs(this.velocityX) > CONFIG.MOVE_SPEED) {
            this.velocityX *= 0.97;
        }

        this.running = Math.abs(this.velocityX) > CONFIG.MOVE_SPEED + 0.4;
    }

    applyJump(input) {
        // Buffer the press so a jump made slightly before landing still fires.
        if (input.jump && !this.jumpHeld) {
            this.jumpBuffer = CONFIG.JUMP_BUFFER;
        } else if (this.jumpBuffer > 0) {
            this.jumpBuffer--;
        }
        this.jumpHeld = input.jump;

        const canJump = this.onGround || this.coyoteTime > 0;

        if (this.jumpBuffer > 0 && canJump && !this.isJumping) {
            // Running gives a longer, higher jump, exactly like the real thing.
            const speedBonus = (Math.abs(this.velocityX) / CONFIG.RUN_SPEED) * CONFIG.RUN_JUMP_BONUS;
            this.velocityY = CONFIG.JUMP_POWER + speedBonus;
            this.onGround = false;
            this.isJumping = true;
            this.jumpTime = 0;
            this.jumpBuffer = 0;
            this.coyoteTime = 0;
            this.squash = 1.25;
            this.springBounce = false;
            sounds.jump();
            createJumpDust(this.x + this.width / 2, this.y + this.height);
            haptics.light();
            return;
        }

        if (this.isJumping && input.jump && this.velocityY < 0 && this.jumpTime < CONFIG.MAX_JUMP_HOLD_TIME) {
            // Holding the button floats you higher.
            this.velocityY += CONFIG.JUMP_HOLD_GRAVITY;
            this.jumpTime++;
        } else {
            // Releasing early cuts the jump short - but a bounce pad is not
            // your jump to cut. Landing on one with the button up used to give
            // 45% of the launch, which read as the pad being broken.
            if (this.isJumping && !input.jump && !this.springBounce &&
                this.velocityY < CONFIG.JUMP_CUT_THRESHOLD) {
                this.velocityY *= CONFIG.JUMP_CUT;
                this.jumpTime = CONFIG.MAX_JUMP_HOLD_TIME;
            }
            this.velocityY += CONFIG.GRAVITY;
        }
    }

    // Head-butting a block from below.
    bumpCeiling(solid) {
        this.jumpTime = CONFIG.MAX_JUMP_HOLD_TIME;
        this.squash = 0.85;
        if (typeof solid.onBump === 'function') {
            solid.onBump(this);
        } else {
            sounds.bump();
        }
    }

    handleLanding() {
        if (this.onGround && !this.wasOnGround) {
            haptics.medium();
            this.squash = 0.75;

            const impact = Math.min(Math.abs(this.velocityY), 12);
            if (impact > 6) {
                createJumpDust(this.x + this.width / 2, this.y + this.height);
            }

            // Landing ends a stomp chain, same as the original games.
            if (this.combo > 0) this.combo = 0;
        }
    }

    updateAnimation() {
        this.animTime++;
        this.squash = lerp(this.squash, 1, 0.18);

        if (this.onGround) {
            this.walkPhase += Math.abs(this.velocityX) * 0.16;
        } else {
            this.walkPhase = 0;
        }
    }

    fallToDeath() {
        // A pit ignores the size/health system - it always costs a life. The
        // body is already off-screen, so skip straight past the falling beat.
        if (this.outOfLives || this.dying) return;
        this.health = 1;
        this.startDeath();
        this.deathTimer = CONFIG.DEATH_FREEZE + CONFIG.DEATH_FALL - CONFIG.DEATH_PIT_TAIL;
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }

    // ---- Power-ups -------------------------------------------------------

    grow() {
        if (this.health < 2) {
            this.health = 2;
            sounds.powerUp();
            createFloatingText(this.x + this.width / 2, this.y, 'SUPER!', '#FF6B6B', 22);
        } else {
            gameState.score += 1000;
            createFloatingText(this.x + this.width / 2, this.y, '+1000', '#FFD700', 20);
            sounds.oneUp();
        }
        this.squash = 1.4;
        createParticles(this.x + this.width / 2, this.y + this.height / 2, 12, '#FF6B6B');
        haptics.success();
        updateHUD();
    }

    giveStar() {
        this.starTimer = CONFIG.STAR_DURATION;
        sounds.star();
        createParticles(this.x + this.width / 2, this.y + this.height / 2, 16, '#FFD700');
        createFloatingText(this.x + this.width / 2, this.y, 'INVINCIBLE!', '#FFD700', 24);
        haptics.success();
    }

    setInvulnerable(value, durationMs = 2000) {
        this.invulnerable = value;
        if (value) this.invulnerableUntil = Date.now() + durationMs;
        if (multiplayerState.connected) {
            multiplayer.syncPlayerPosition(this.x, this.y, this.direction, this.health, this.invulnerable, this.outOfLives);
        }
    }

    /** Remembers the last patch of solid ground stood on, as a checkpoint. */
    recordSafeGround(surface) {
        if (!surface || surface.variant !== 'ground') return;
        // Stay clear of the very edge, so the checkpoint is never a ledge you
        // immediately walk off.
        const margin = 24;
        if (this.x < surface.x + margin || this.x + this.width > surface.x + surface.width - margin) return;
        this.safeGround = { x: this.x, y: surface.y - this.height };
    }

    /**
     * Backs a checkpoint away from the edge it is standing near. Dying at a
     * chasm used to drop you a stride from the same chasm, with no room left
     * to build up speed - so you fell in again, and again. A running jump
     * needs about 200px of approach, and this makes sure the respawn has it.
     */
    withRunway(spot) {
        const RUNWAY = 220;
        const segment = platforms.find(p => p.variant === 'ground' &&
            spot.x >= p.x && spot.x + this.width <= p.x + p.width);
        if (!segment) return { ...spot };

        const toEdge = (segment.x + segment.width) - (spot.x + this.width);
        if (toEdge >= RUNWAY) return { ...spot };

        const wanted = segment.x + segment.width - this.width - RUNWAY;
        return { x: Math.max(segment.x + 24, wanted), y: spot.y };
    }

    getRandomRespawnLocation() {
        // In the multiplayer arena, dropping back in anywhere keeps things
        // moving. In single player that felt random and disorienting, so
        // respawn where the player last had their feet on solid ground.
        if (!multiplayerState.connected) {
            if (this.safeGround) return this.withRunway(this.safeGround);
            return { x: 80, y: GROUND_Y - this.height };
        }

        const candidates = platforms.filter(p =>
            p.variant !== 'ground' && p.y < GROUND_Y - 80 && p.y > 140 && p.width >= 80);

        if (candidates.length > 0) {
            const platform = candidates[Math.floor(Math.random() * candidates.length)];
            return {
                x: platform.x + platform.width / 2 - this.width / 2,
                y: platform.y - this.height - 10,
            };
        }

        // Otherwise drop in above solid ground rather than into a pit.
        const ground = platforms.filter(p => p.variant === 'ground');
        if (ground.length > 0) {
            const segment = ground[Math.floor(Math.random() * ground.length)];
            return {
                x: segment.x + segment.width / 2 - this.width / 2,
                y: segment.y - this.height - 60,
            };
        }

        return { x: 100, y: 100 };
    }

    hit(fromPlayer = false) {
        if (this.immune) return;

        // Reset combo on taking damage
        this.combo = 0;

        // Health system: 2 = big, 1 = small
        if (this.health > 1) {
            this.health = 1;
            sounds.powerDown();
            haptics.light();
            createParticles(this.x + this.width / 2, this.y + this.height / 2, 10, '#FFFFFF');
            this.setInvulnerable(true, 2000);

            // If hit by another player in PvP, they get points
            if (fromPlayer && multiplayerState.connected) {
                gameState.score = Math.max(0, gameState.score - 100);
                updateHUD();
                multiplayer.updateLeaderboard();
            }

            return;
        }

        // Small Mario dies
        this.startDeath();
    }

    /**
     * Death is a beat, not an instant teleport. The old code moved the player
     * to the respawn point on the same frame the hit landed, which read as a
     * glitch: you never saw what killed you. Now everything stops, the body
     * pops up and falls off the screen, and only then does the world reset.
     */
    startDeath() {
        if (this.dying || this.outOfLives) return;

        this.dying = true;
        this.deathTimer = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.setInvulnerable(false);
        this.starTimer = 0;
        this.combo = 0;

        gameState.lives--;
        updateHUD();
        sounds.die();
        haptics.error();
        music.stop();
        createParticles(this.x + this.width / 2, this.y + this.height / 2, 16, this.colorPalette.shirt);
    }

    updateDeath() {
        this.deathTimer++;

        // Beat one: hang motionless so the hit registers.
        if (this.deathTimer === CONFIG.DEATH_FREEZE) {
            this.velocityY = CONFIG.DEATH_POP;
        }

        // Beat two: arc up and fall away, passing through the whole level.
        if (this.deathTimer > CONFIG.DEATH_FREEZE) {
            this.velocityY = Math.min(this.velocityY + CONFIG.GRAVITY, CONFIG.MAX_FALL_SPEED);
            this.y += this.velocityY;
            this.deathSpin += 0.16;
        }

        const gone = this.y - gameState.camera.y > view.h + 80;
        if (this.deathTimer >= CONFIG.DEATH_FREEZE + CONFIG.DEATH_FALL || gone) {
            this.finishDeath();
        }
    }

    finishDeath() {
        this.dying = false;
        this.deathTimer = 0;
        this.deathSpin = 0;

        if (gameState.lives <= 0) {
            if (multiplayerState.connected) {
                // Continuous gameplay - out of lives mode
                this.deathX = this.x;
                this.deathY = Math.min(this.y, CONFIG.WORLD_HEIGHT - 100);
                this.y = this.deathY;
                this.outOfLives = true;
                multiplayer.syncPlayerPosition(this.x, this.y, this.direction, this.health, this.invulnerable, this.outOfLives);
                multiplayer.submitAllTimeScore();
                showOutOfLivesScreen();
            } else {
                gameOver();
            }
            return;
        }

        // Grow back first: the size setter shifts y to keep the feet planted,
        // so applying it after positioning would leave the player hovering.
        this.health = 2;              // Respawn as big Mario
        const spawnPos = this.getRandomRespawnLocation();
        this.x = spawnPos.x;
        this.y = spawnPos.y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpBuffer = 0;

        // Apply death penalty (20% score reduction) in multiplayer
        if (multiplayerState.connected) {
            multiplayer.respawnPlayer();
        }

        // A moment to re-orient before control comes back.
        this.controlLock = CONFIG.RESPAWN_READY;
        this.setInvulnerable(true, 2500);
        updateCamera(true);
        showBanner(`${gameState.lives} ${gameState.lives === 1 ? 'life' : 'lives'} left`, 'Ready?', 1200);
        music.start();
    }

    // Check collision with remote players for PvP
    checkRemotePlayerCollisions() {
        if (!multiplayerState.connected) return;

        const now = Date.now();
        const afkThreshold = 10000; // 10 seconds - matches cleanup threshold

        multiplayerState.remotePlayers.forEach((remotePlayer, playerId) => {
            // Skip collision if remote player is dead or invulnerable
            if (remotePlayer.outOfLives || remotePlayer.invulnerable) return;

            // Skip collision if we are dead
            if (this.outOfLives) return;

            // Skip collision with AFK players (no timestamp updates for 10+ seconds)
            // This prevents farming abandoned players for points
            const timeSinceUpdate = now - (remotePlayer.timestamp || 0);
            if (timeSinceUpdate > afkThreshold) return;

            const otherWidth = (remotePlayer.health === undefined ? 2 : remotePlayer.health) > 1
                ? CONFIG.PLAYER_WIDTH : CONFIG.SMALL_PLAYER_WIDTH;
            const otherHeight = (remotePlayer.health === undefined ? 2 : remotePlayer.health) > 1
                ? CONFIG.PLAYER_SIZE : CONFIG.SMALL_PLAYER_HEIGHT;

            const collision = this.x < remotePlayer.x + otherWidth &&
                            this.x + this.width > remotePlayer.x &&
                            this.y < remotePlayer.y + otherHeight &&
                            this.y + this.height > remotePlayer.y;

            if (!collision) return;

            // They are stomping us - damage is settled by the consensus system
            // in listenForHits(), so just don't fight them for the position.
            if (remotePlayer.y < this.y + this.height / 2 && this.velocityY >= 0) {
                return;
            }

            // Invulnerable players pass through everyone.
            if (this.invulnerable) return;

            // Are we jumping on them? That is the only way to deal damage.
            if (this.velocityY > 0 && this.y < remotePlayer.y + otherHeight / 2) {
                this.velocityY = CONFIG.STOMP_BOUNCE;
                this.isJumping = false;

                multiplayer.sendHitClaim(playerId, this.x, this.y, remotePlayer.x, remotePlayer.y);

                this.awardCombo(remotePlayer.x + otherWidth / 2, remotePlayer.y, 200);

                sounds.stomp();
                haptics.success();
                multiplayer.updateLeaderboard();
            } else {
                // Solid collision - no damage, just block each other
                const overlapX = Math.min(
                    this.x + this.width - remotePlayer.x,
                    remotePlayer.x + otherWidth - this.x
                );
                const overlapY = Math.min(
                    this.y + this.height - remotePlayer.y,
                    remotePlayer.y + otherHeight - this.y
                );

                if (overlapX < overlapY) {
                    this.x += this.x < remotePlayer.x ? -overlapX : overlapX;
                    this.velocityX *= 0.5;
                } else if (this.velocityY > 0 && this.y < remotePlayer.y) {
                    this.y = remotePlayer.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                } else if (this.velocityY < 0 && this.y > remotePlayer.y) {
                    this.y = remotePlayer.y + otherHeight;
                    this.velocityY = 0;
                }
            }
        });
    }

    /** Awards a stomp, escalating the multiplier and showing the popup. */
    awardCombo(x, y, baseScore) {
        this.combo = Math.min(this.combo + 1, this.maxCombo);
        const multiplier = this.combo;
        const scoreGained = baseScore * multiplier;
        gameState.score += scoreGained;
        updateHUD();

        if (multiplier > 1) {
            createFloatingText(x, y, `${multiplier}x COMBO!`, this.getComboColor(multiplier), 24);
        }
        createFloatingText(x, y + 30, `+${scoreGained}`, '#FFD700', 20);
        return scoreGained;
    }

    getComboColor(combo) {
        if (combo >= 8) return '#FF00FF'; // Magenta for 8-10x
        if (combo >= 6) return '#FF0000'; // Red for 6-7x
        if (combo >= 4) return '#FF6600'; // Orange for 4-5x
        if (combo >= 2) return '#FFFF00'; // Yellow for 2-3x
        return '#FFFFFF'; // White for 1x
    }

    draw() {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        // The dying body tumbles, so it reads as "that went wrong" at a glance.
        if (this.dying) {
            ctx.save();
            ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
            ctx.rotate(this.deathSpin);
            ctx.translate(-this.width / 2, -this.height / 2);
            drawMarioSprite(ctx, {
                x: 0, y: 0, width: this.width, height: this.height,
                big: false, direction: this.direction, palette: this.colorPalette,
                alpha: 1, squash: 1, onGround: false, velocityY: this.velocityY,
                walkPhase: 0, moving: false, skidding: false,
            });
            ctx.restore();
            return;
        }

        drawGroundShadow(this, screenX + this.width / 2);

        let alpha = 1;
        if (this.invulnerable && Math.floor(Date.now() / 80) % 2 === 0) alpha = 0.45;

        let palette = this.colorPalette;
        if (this.starPower) {
            // Flash through the rainbow while a star is active.
            const hue = (this.animTime * 20) % 360;
            const flicker = this.starTimer < 120 && Math.floor(this.starTimer / 4) % 2 === 0;
            palette = flicker ? this.colorPalette : {
                shirt: `hsl(${hue}, 90%, 55%)`,
                overalls: `hsl(${(hue + 140) % 360}, 85%, 45%)`,
                skin: this.colorPalette.skin,
            };
        }

        drawMarioSprite(ctx, {
            x: screenX,
            y: screenY,
            width: this.width,
            height: this.height,
            big: this._health > 1,
            direction: this.direction,
            palette,
            alpha,
            squash: this.squash,
            onGround: this.onGround,
            velocityY: this.velocityY,
            walkPhase: this.walkPhase,
            moving: Math.abs(this.velocityX) > 0.4,
            skidding: this.skidding,
        });
    }
}

/**
 * Shared character renderer, used for the local player and remote players so
 * everyone in a multiplayer session looks the same.
 */
function drawMarioSprite(ctx, o) {
    const squash = o.squash === undefined ? 1 : o.squash;

    ctx.save();
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;

    // The artwork is authored 40 units tall standing on the origin, so one
    // transform handles size, facing and squash-and-stretch about the feet.
    const u = o.height / 40;
    ctx.translate(o.x + o.width / 2, o.y + o.height);
    ctx.scale((o.direction < 0 ? -1 : 1) / squash, squash);

    // --- Legs ---
    const airborne = !o.onGround;
    let legSwing = 0;
    if (airborne) {
        legSwing = o.velocityY < 0 ? -4 : 3;
    } else if (o.moving) {
        legSwing = Math.sin(o.walkPhase) * 6;
    }

    ctx.strokeStyle = '#1E4C8F';
    ctx.lineWidth = 5 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4 * u, -10 * u);
    ctx.lineTo((-5 + legSwing * 0.5) * u, -2 * u);
    ctx.moveTo(4 * u, -10 * u);
    ctx.lineTo((5 - legSwing * 0.5) * u, -2 * u);
    ctx.stroke();

    // Shoes
    ctx.fillStyle = '#5C3C1C';
    ctx.beginPath();
    ctx.ellipse((-6 + legSwing * 0.5) * u, -1.5 * u, 5 * u, 2.6 * u, 0, 0, Math.PI * 2);
    ctx.ellipse((6 - legSwing * 0.5) * u, -1.5 * u, 5 * u, 2.6 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Body / overalls ---
    ctx.fillStyle = o.palette.overalls;
    ctx.beginPath();
    ctx.roundRect(-8 * u, -20 * u, 16 * u, 12 * u, 3 * u);
    ctx.fill();

    // Shirt (shoulders and arms)
    ctx.fillStyle = o.palette.shirt;
    ctx.beginPath();
    ctx.roundRect(-9 * u, -26 * u, 18 * u, 8 * u, 3 * u);
    ctx.fill();

    // Arms
    const armSwing = o.skidding ? -7 : (o.moving && !airborne ? Math.cos(o.walkPhase) * 5 : (airborne ? -6 : 0));
    ctx.strokeStyle = o.palette.shirt;
    ctx.lineWidth = 4.5 * u;
    ctx.beginPath();
    ctx.moveTo(-8 * u, -24 * u);
    ctx.lineTo((-11 - armSwing * 0.4) * u, (-17 + Math.abs(armSwing) * 0.2) * u);
    ctx.moveTo(8 * u, -24 * u);
    ctx.lineTo((11 + armSwing * 0.4) * u, (-17 + Math.abs(armSwing) * 0.2) * u);
    ctx.stroke();

    // Hands
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc((-11 - armSwing * 0.4) * u, (-16 + Math.abs(armSwing) * 0.2) * u, 2.6 * u, 0, Math.PI * 2);
    ctx.arc((11 + armSwing * 0.4) * u, (-16 + Math.abs(armSwing) * 0.2) * u, 2.6 * u, 0, Math.PI * 2);
    ctx.fill();

    // Overall straps + button
    ctx.strokeStyle = o.palette.overalls;
    ctx.lineWidth = 2.5 * u;
    ctx.beginPath();
    ctx.moveTo(-4.5 * u, -19 * u);
    ctx.lineTo(-3.5 * u, -26 * u);
    ctx.moveTo(4.5 * u, -19 * u);
    ctx.lineTo(3.5 * u, -26 * u);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(-3.5 * u, -19 * u, 1.4 * u, 0, Math.PI * 2);
    ctx.arc(3.5 * u, -19 * u, 1.4 * u, 0, Math.PI * 2);
    ctx.fill();

    // --- Head ---
    const headY = -32 * u;
    ctx.fillStyle = o.palette.skin;
    ctx.beginPath();
    ctx.arc(0, headY, 8 * u, 0, Math.PI * 2);
    ctx.fill();

    // Ear
    ctx.beginPath();
    ctx.arc(-6 * u, headY + 1 * u, 2.4 * u, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.beginPath();
    ctx.arc(6.5 * u, headY + 1 * u, 3 * u, 0, Math.PI * 2);
    ctx.fill();

    // Moustache
    ctx.fillStyle = '#4A2C0F';
    ctx.beginPath();
    ctx.ellipse(4 * u, headY + 3.5 * u, 4.5 * u, 2 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(3 * u, headY - 2 * u, 2 * u, 2.6 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1B2A4A';
    ctx.beginPath();
    ctx.ellipse(3.6 * u, headY - 2 * u, 1 * u, 1.8 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sideburn
    ctx.fillStyle = '#4A2C0F';
    ctx.beginPath();
    ctx.ellipse(-4 * u, headY + 1 * u, 2.4 * u, 3.4 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Cap ---
    ctx.fillStyle = o.palette.shirt;
    ctx.beginPath();
    ctx.arc(0, headY - 3 * u, 8.4 * u, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6 * u, headY - 3.5 * u, 7 * u, 2.4 * u, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-0.5 * u, -3.5 * u + headY, 12 * u, 2 * u);

    // Cap badge
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-0.5 * u, headY - 6 * u, 3.2 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = o.palette.shirt;
    ctx.font = `bold ${4.6 * u}px "Trebuchet MS", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Un-mirror just the badge so the letter never reads backwards
    ctx.scale(o.direction < 0 ? -1 : 1, 1);
    ctx.fillText('M', (o.direction < 0 ? 0.5 : -0.5) * u, headY - 5.6 * u);

    ctx.restore();
}

// Function to draw grave marker at death position
function drawGraveMarker(x, y) {
    const screenX = x - gameState.camera.x;
    const screenY = y - gameState.camera.y;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(screenX + 20, screenY + 45, 15, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Grave base (stone)
    ctx.fillStyle = '#666';
    ctx.fillRect(screenX + 5, screenY + 20, 30, 25);

    // Grave top (rounded)
    ctx.beginPath();
    ctx.arc(screenX + 20, screenY + 20, 15, Math.PI, 0, true);
    ctx.fill();

    // Cross on gravestone
    ctx.fillStyle = '#888';
    ctx.fillRect(screenX + 17, screenY + 25, 6, 12);
    ctx.fillRect(screenX + 13, screenY + 29, 14, 6);

    // R.I.P. text
    ctx.fillStyle = '#999';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('R.I.P.', screenX + 20, screenY + 15);

    ctx.restore();
}

// Function to draw remote players
function drawRemotePlayer(playerData) {
    const x = playerData.x;
    const y = playerData.y;

    // If player is dead (out of lives), draw gravestone instead
    if (playerData.outOfLives) {
        drawGraveMarker(x, y);
        return;
    }

    const screenX = x - gameState.camera.x;
    const screenY = y - gameState.camera.y;

    // Skip anyone outside the view entirely.
    if (screenX < -80 || screenX > view.w + 80) return;

    // Check if player is AFK (no updates for 10+ seconds)
    const timeSinceUpdate = Date.now() - (playerData.timestamp || 0);
    const isAFK = timeSinceUpdate > 10000;

    const remoteBig = (playerData.health === undefined ? 2 : playerData.health) > 1;
    const remoteHeight = remoteBig ? CONFIG.PLAYER_SIZE : CONFIG.SMALL_PLAYER_HEIGHT;
    const remoteWidth = remoteBig ? CONFIG.PLAYER_WIDTH : CONFIG.SMALL_PLAYER_WIDTH;
    drawGroundShadow(
        { x, y, width: remoteWidth, height: remoteHeight },
        screenX + remoteWidth / 2
    );

    drawMarioSprite(ctx, {
        x: screenX,
        y: screenY,
        width: remoteWidth,
        height: remoteHeight,
        big: remoteBig,
        direction: playerData.direction || 1,
        palette: playerData.color || PLAYER_COLORS[0],
        alpha: isAFK ? 0.3 : (playerData.invulnerable ? 0.6 : 1),
        squash: 1,
        onGround: true,
        velocityY: 0,
        walkPhase: 0,
        moving: false,
        skidding: false,
    });

    ctx.save();

    // Player name label above character
    const name = playerData.name || 'Player';
    ctx.font = 'bold 10px "Trebuchet MS", Arial, sans-serif';
    ctx.textAlign = 'center';
    const labelWidth = Math.max(40, ctx.measureText(name).width + 12);
    const labelCentre = screenX + remoteWidth / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.roundRect(labelCentre - labelWidth / 2, screenY - 17, labelWidth, 14, 4);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillText(name, labelCentre, screenY - 7);

    // AFK indicator
    if (isAFK) {
        ctx.fillStyle = 'rgba(220, 40, 40, 0.85)';
        ctx.beginPath();
        ctx.roundRect(labelCentre - 16, screenY - 33, 32, 13, 4);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 9px "Trebuchet MS", Arial, sans-serif';
        ctx.fillText('AFK', labelCentre, screenY - 24);
    }

    ctx.restore();
}

// ============================================================================
//  ENEMIES
//  All three enemy types share one physics step, so a fix to ledge detection,
//  wall bouncing or pit falling applies to every one of them.
// ============================================================================

class Enemy {
    constructor(x, y, id = null) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.ENEMY_SIZE;
        this.height = CONFIG.ENEMY_SIZE;
        this.velocityX = -2 * (CONFIG.enemySpeedScale || 1);
        this.velocityY = 0;
        this.alive = true;
        this.onGround = false;
        this.id = id; // Unique Firebase ID
        this.lastSyncTime = 0;
        this.animTime = Math.floor(Math.random() * 60);
        this.deathTimer = 0;      // Frames left of the squashed-death pose
        this.respawnTime = null;
        this.turnsAtLedges = true;   // See avoidsLedges()
        this.scoreValue = 100;
        this.color = '#D2691E';
    }

    /** Runs before movement - subclasses use it for their own behaviour. */
    behave() {}

    update() {
        if (!this.alive) {
            if (this.deathTimer > 0) this.deathTimer--;
            // Respawn only in single player (in multiplayer, portals handle spawning)
            if (!multiplayerState.connected && this.respawnTime && Date.now() >= this.respawnTime) {
                this.revive();
            }
            return;
        }

        this.animTime++;
        this.behave();
        this.physicsStep();

        if (this.alive) this.handlePlayerCollision();

        // Sync enemy position to Firebase (throttled). Only the spawn master
        // writes: enemies are simulated identically on every client, so having
        // all of them write the same node multiplied the traffic by the player
        // count and had them fighting over whose physics step won.
        if (this.alive && multiplayerState.connected && multiplayerState.isSpawnMaster && this.id) {
            multiplayer.syncEnemyState(this);
        }
    }

    physicsStep() {
        this.velocityY = Math.min(this.velocityY + CONFIG.GRAVITY, CONFIG.MAX_FALL_SPEED);

        const hit = moveAndCollide(this);

        // Bounced off a wall, a pipe or the side of a block
        if (hit.hitWall !== 0 && Math.sign(this.velocityX) === hit.hitWall) {
            this.velocityX = -this.velocityX;
            this.onWallHit();
        }

        // World bounds - reverse direction at edges
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = Math.abs(this.velocityX);
        }
        if (this.x + this.width > CONFIG.WORLD_WIDTH) {
            this.x = CONFIG.WORLD_WIDTH - this.width;
            this.velocityX = -Math.abs(this.velocityX);
        }

        // Turn around rather than stroll off a ledge
        if (this.onGround && this.avoidsLedges() && this.velocityX !== 0 &&
            !hasFloorAhead(this, Math.sign(this.velocityX))) {
            this.velocityX = -this.velocityX;
        }

        // Fell into a pit
        if (this.y > CONFIG.WORLD_HEIGHT + 120) {
            this.despawn();
        }
    }

    onWallHit() {}

    /** Whether this enemy stops at the edge of a drop. */
    avoidsLedges() {
        return this.turnsAtLedges;
    }

    handlePlayerCollision() {
        if (player.outOfLives || !player.checkCollision(this)) return;

        // A star turns the player into a battering ram.
        if (player.starPower) {
            this.die(true, 'star');
            return;
        }

        if (this.isStompedBy(player)) {
            this.stompedBy(player);
        } else if (this.velocityY < 0 && this.y > player.y + player.height / 2) {
            // Rose into the player's feet from below - counts as a stomp
            this.stompedBy(player);
        } else {
            player.hit();
        }
    }

    /** True when the player is falling onto this enemy's head. */
    isStompedBy(p) {
        return p.velocityY > 0 && (p.y + p.height) < this.y + this.height * 0.65;
    }

    stompedBy(p) {
        this.die(true, 'stomp');
        p.velocityY = CONFIG.STOMP_BOUNCE;
        p.isJumping = false;
        p.jumpTime = CONFIG.MAX_JUMP_HOLD_TIME;
        p.squash = 1.2;
        // Holding jump while stomping gives the classic higher bounce.
        if (p.jumpHeld) p.velocityY = CONFIG.STOMP_BOUNCE_HELD;
    }

    /** Killed from underneath - by a bumped block or a sliding shell. */
    flip(scoreValue = this.scoreValue) {
        if (!this.alive) return;
        this.alive = false;
        this.deathTimer = 0;
        this.respawnTime = multiplayerState.connected ? null : Date.now() + CONFIG.ENEMY_RESPAWN_MS;
        gameState.score += scoreValue;
        updateHUD();
        createFloatingText(this.x + this.width / 2, this.y, `+${scoreValue}`, '#FFD700', 18);
        createParticles(this.x + this.width / 2, this.y + this.height / 2, 12, this.color);
        sounds.kick();
        if (multiplayerState.connected && this.id) multiplayer.removeEnemy(this.id);
    }

    die(byPlayer, cause = 'stomp') {
        if (!this.alive) return;
        this.alive = false;
        this.deathTimer = cause === 'stomp' ? 24 : 0;
        this.respawnTime = multiplayerState.connected ? null : Date.now() + CONFIG.ENEMY_RESPAWN_MS;

        if (byPlayer) {
            player.awardCombo(this.x + this.width / 2, this.y, this.scoreValue);
            sounds.stomp();
            createParticles(this.x + this.width / 2, this.y + this.height / 2, 12, this.color);
            screenShake(cause === 'star' ? 4 : 3, 10);
            haptics.heavy();

            if (multiplayerState.connected) {
                multiplayer.updateLeaderboard();
                if (this.id) multiplayer.removeEnemy(this.id);
            }
        }
    }

    /**
     * Gone for good (fell in a pit) - no respawn, no points. Respawning these
     * turned every pit into a conveyor: an enemy fell in, came back at its
     * spawn point, walked in again, while the pipe added more on top.
     */
    despawn() {
        this.alive = false;
        this.deathTimer = 0;
        this.respawnTime = null;
        if (multiplayerState.connected && this.id) multiplayer.removeEnemy(this.id);
    }

    revive() {
        this.alive = true;
        this.respawnTime = null;
        this.deathTimer = 0;
        this.velocityY = 0;
        this.velocityX = -2 * (CONFIG.enemySpeedScale || 1);
        createParticles(this.x + this.width / 2, this.y + this.height / 2, 12, this.color);
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }

    /** Common off-screen reject plus the squashed death pose. */
    beginDraw() {
        if (!this.alive && this.deathTimer <= 0) return null;

        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;
        if (screenX < -80 || screenX > view.w + 80 || screenY < -80 || screenY > view.h + 80) return null;

        ctx.save();
        if (!this.alive) {
            // Squashed flat and fading out
            const t = this.deathTimer / 24;
            ctx.globalAlpha = t;
            ctx.translate(screenX, screenY + this.height);
            ctx.scale(1, Math.max(0.12, t * 0.5));
            ctx.translate(-screenX, -(screenY + this.height));
        }
        return { screenX, screenY };
    }

    draw() {
        const pos = this.beginDraw();
        if (!pos) return;
        const { screenX, screenY } = pos;

        drawGroundShadow(this, screenX + this.width / 2);

        const cx = screenX + this.width / 2;
        const waddle = this.alive ? Math.sin(this.animTime * 0.18) * 2 : 0;

        // Feet
        ctx.fillStyle = '#5C3C1C';
        ctx.beginPath();
        ctx.ellipse(cx - 8 + waddle, screenY + this.height - 3, 6, 3.5, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 8 - waddle, screenY + this.height - 3, 6, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stem / body
        ctx.fillStyle = '#F5DEB3';
        ctx.beginPath();
        ctx.roundRect(cx - 8, screenY + this.height / 2.6, 16, this.height / 1.9, 4);
        ctx.fill();

        // Mushroom cap
        const capGradient = ctx.createLinearGradient(0, screenY, 0, screenY + this.height / 2);
        capGradient.addColorStop(0, '#E07B39');
        capGradient.addColorStop(1, '#8B4513');
        ctx.fillStyle = capGradient;
        ctx.beginPath();
        ctx.ellipse(cx, screenY + this.height / 2.4, this.width / 2, this.height / 2.6, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(cx - this.width / 2, screenY + this.height / 2.4 - 1, this.width, 3);

        // Cap spots
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(cx - 8, screenY + 9, 3.2, 0, Math.PI * 2);
        ctx.arc(cx + 7, screenY + 7, 2.6, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyes
        const look = Math.sign(this.velocityX) || 1;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(cx - 5, screenY + this.height * 0.6, 3.4, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 5, screenY + this.height * 0.6, 3.4, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(cx - 5 + look, screenY + this.height * 0.6, 1.8, 0, Math.PI * 2);
        ctx.arc(cx + 5 + look, screenY + this.height * 0.6, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrows
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 9, screenY + this.height * 0.5);
        ctx.lineTo(cx - 2, screenY + this.height * 0.55);
        ctx.moveTo(cx + 9, screenY + this.height * 0.5);
        ctx.lineTo(cx + 2, screenY + this.height * 0.55);
        ctx.stroke();

        ctx.restore();
    }
}

// Jumping Enemy Class
class JumpingEnemy extends Enemy {
    constructor(x, y, id = null) {
        super(x, y, id);
        this.jumpCooldown = 40 + Math.floor(Math.random() * 60);
        this.jumpInterval = 60 + Math.random() * 60; // Jump every 60-120 frames
        this.color = '#FF6B6B'; // Red color to distinguish from regular enemies
        this.scoreValue = 150;
        this.velocityX = -2.4 * (CONFIG.enemySpeedScale || 1);
        this.squash = 1;
    }

    /**
     * Hoppers used to ignore ledges so they could clear gaps. In practice they
     * queued up at the nearest pit and threw themselves in, and the pipe kept
     * feeding replacements. They now respect edges like everything else.
     */
    avoidsLedges() {
        return true;
    }

    behave() {
        this.squash = lerp(this.squash, 1, 0.15);

        if (this.onGround) {
            this.jumpCooldown--;
            // Wind up visibly just before the hop so it can be read and dodged.
            if (this.jumpCooldown < 12) this.squash = 0.8;

            if (this.jumpCooldown <= 0) {
                this.velocityY = CONFIG.JUMPER_JUMP_POWER;
                this.squash = 1.3;
                this.jumpCooldown = this.jumpInterval;
                createParticles(this.x + this.width / 2, this.y + this.height, 5, this.color);
            }
        }
    }

    revive() {
        super.revive();
        this.velocityX = -2.4 * (CONFIG.enemySpeedScale || 1);
        this.jumpCooldown = this.jumpInterval;
    }

    draw() {
        const pos = this.beginDraw();
        if (!pos) return;
        const { screenX, screenY } = pos;

        const squash = this.alive ? this.squash : 1;
        const w = this.width / squash;
        const h = this.height * squash;
        const cx = screenX + this.width / 2;
        const bottom = screenY + this.height;

        drawGroundShadow(this, cx);

        // Springy blob body
        const bodyGradient = ctx.createRadialGradient(cx - w / 5, bottom - h * 0.7, 2, cx, bottom - h / 2, w / 1.4);
        bodyGradient.addColorStop(0, '#FF9A9A');
        bodyGradient.addColorStop(1, this.color);
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(cx, bottom - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spikes along the top
        ctx.fillStyle = '#C0392B';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(cx + i * 9 - 4, bottom - h + 4);
            ctx.lineTo(cx + i * 9, bottom - h - 5);
            ctx.lineTo(cx + i * 9 + 4, bottom - h + 4);
            ctx.closePath();
            ctx.fill();
        }

        // Eyes
        const look = Math.sign(this.velocityX) || 1;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(cx - 6, bottom - h * 0.55, 4.4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 6, bottom - h * 0.55, 4.4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(cx - 6 + look * 1.5, bottom - h * 0.55, 2.2, 0, Math.PI * 2);
        ctx.arc(cx + 6 + look * 1.5, bottom - h * 0.55, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Grin
        ctx.strokeStyle = '#7B241C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, bottom - h * 0.32, 6, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();

        ctx.restore();
    }
}

// Turtle Enemy Class - walks slowly, becomes a kickable shell when stomped
class TurtleEnemy extends Enemy {
    constructor(x, y, id = null) {
        super(x, y, id);
        this.velocityX = -1 * (CONFIG.enemySpeedScale || 1);
        this.color = '#228B22'; // Green turtle
        this.shellColor = '#006400'; // Dark green shell
        this.scoreValue = 100;
        this.inShell = false;
        this.shellTimer = 0;
        this.shellMaxTime = 300;   // 5 seconds tucked in before popping out
        this.kickVelocity = 9;
        this.isShellSliding = false;
        this.shellSlideTimer = 0;
        this.shellMaxSlideTime = 480;
        this.kickCooldown = 0;     // Stops one touch registering as many kicks
    }

    get walkSpeed() {
        return 1 * (CONFIG.enemySpeedScale || 1);
    }

    behave() {
        if (this.kickCooldown > 0) this.kickCooldown--;

        if (!this.inShell) return;

        this.shellTimer++;

        if (this.isShellSliding) {
            this.shellSlideTimer++;
            if (this.shellSlideTimer >= this.shellMaxSlideTime) {
                this.stopShell();
            }
            this.hitOtherEnemies();
        } else if (this.shellTimer >= this.shellMaxTime) {
            // Pop back out and start walking again
            this.inShell = false;
            this.shellTimer = 0;
            this.shellSlideTimer = 0;
            this.velocityX = -this.walkSpeed;
            createParticles(this.x + this.width / 2, this.y + this.height / 2, 8, this.color);
        }
    }

    onWallHit() {
        if (this.isShellSliding) sounds.bump();
    }

    /**
     * A turtle on its feet is careful about drops. A kicked shell is not: it
     * is a projectile, and it should sail off the edge and into the pit rather
     * than politely bouncing back off thin air.
     */
    avoidsLedges() {
        return !this.isShellSliding;
    }

    stopShell() {
        this.isShellSliding = false;
        this.velocityX = 0;
        this.shellSlideTimer = 0;
        this.shellTimer = 0;
        createParticles(this.x + this.width / 2, this.y + this.height / 2, 8, this.shellColor);
    }

    kickShell(fromLeft) {
        this.isShellSliding = true;
        this.shellSlideTimer = 0;
        this.shellTimer = 0;
        this.kickCooldown = 12;
        this.velocityX = fromLeft ? this.kickVelocity : -this.kickVelocity;
        sounds.kick();
        createParticles(this.x + this.width / 2, this.y + this.height / 2, 10, this.shellColor);
        screenShake(3, 8);
        haptics.medium();
    }

    /** A sliding shell mows down anything it touches. */
    hitOtherEnemies() {
        for (const enemy of enemies) {
            if (enemy === this || !enemy.alive) continue;
            if (!this.checkCollision(enemy)) continue;
            enemy.flip(enemy.scoreValue);
            screenShake(2, 8);
        }
    }

    handlePlayerCollision() {
        if (player.outOfLives || !player.checkCollision(this)) return;

        if (player.starPower) {
            this.die(true, 'star');
            return;
        }

        const stomped = this.isStompedBy(player);

        if (stomped) {
            player.velocityY = player.jumpHeld ? CONFIG.STOMP_BOUNCE_HELD : CONFIG.STOMP_BOUNCE;
            player.isJumping = false;
            player.squash = 1.2;

            if (!this.inShell) {
                // First stomp tucks it into the shell
                this.inShell = true;
                this.shellTimer = 0;
                this.shellSlideTimer = 0;
                this.velocityX = 0;
                this.isShellSliding = false;
                this.kickCooldown = 12;
                player.awardCombo(this.x + this.width / 2, this.y, this.scoreValue);
                sounds.stomp();
                createParticles(this.x + this.width / 2, this.y + this.height / 2, 10, this.shellColor);
                screenShake(3, 10);
                haptics.medium();
            } else if (this.isShellSliding) {
                // Stomping a moving shell stops it dead
                this.stopShell();
                sounds.stomp();
            } else if (this.kickCooldown === 0) {
                this.kickShell(player.x < this.x);
            }
            return;
        }

        if (this.inShell && !this.isShellSliding) {
            // Walking into a resting shell kicks it
            if (this.kickCooldown === 0) this.kickShell(player.x < this.x);
            return;
        }

        // Walking turtle, or a shell already sliding into us
        player.hit();
    }

    revive() {
        super.revive();
        this.inShell = false;
        this.isShellSliding = false;
        this.shellTimer = 0;
        this.shellSlideTimer = 0;
        this.velocityX = -this.walkSpeed;
    }

    draw() {
        const pos = this.beginDraw();
        if (!pos) return;
        const { screenX, screenY } = pos;

        const cx = screenX + this.width / 2;

        drawGroundShadow(this, cx);

        if (this.inShell) {
            const shellHeight = this.height * 0.62;
            const shellCY = screenY + this.height - shellHeight / 2;
            const spin = this.isShellSliding ? this.animTime * 0.25 * Math.sign(this.velocityX || 1) : 0;

            const shellGradient = ctx.createRadialGradient(cx - 5, shellCY - 5, 2, cx, shellCY, this.width / 2);
            shellGradient.addColorStop(0, '#4CAF50');
            shellGradient.addColorStop(1, this.shellColor);
            ctx.fillStyle = shellGradient;
            ctx.beginPath();
            ctx.ellipse(cx, shellCY, this.width / 2.1, shellHeight / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shell plates rotate while sliding
            ctx.save();
            ctx.translate(cx, shellCY);
            ctx.rotate(spin);
            ctx.strokeStyle = 'rgba(0,60,0,0.6)';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * this.width / 2.4, Math.sin(angle) * shellHeight / 2.2);
                ctx.stroke();
            }
            ctx.restore();

            // Rim
            ctx.strokeStyle = '#F5DEB3';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(cx, shellCY, this.width / 2.1, shellHeight / 2, 0, 0, Math.PI * 2);
            ctx.stroke();

            if (this.isShellSliding) {
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 2;
                for (let i = 1; i <= 3; i++) {
                    const offsetX = (this.velocityX > 0 ? -1 : 1) * (this.width / 2 + i * 7);
                    ctx.beginPath();
                    ctx.moveTo(cx + offsetX, shellCY - 4);
                    ctx.lineTo(cx + offsetX + (this.velocityX > 0 ? -5 : 5), shellCY + 4);
                    ctx.stroke();
                }
            } else if (this.shellTimer > this.shellMaxTime - 90 && Math.floor(this.animTime / 5) % 2 === 0) {
                // Warn that it is about to hatch back out
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(cx, shellCY, this.width / 1.9, shellHeight / 1.7, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
            return;
        }

        // --- Walking turtle ---
        const look = Math.sign(this.velocityX) || 1;
        const legSwing = Math.sin(this.animTime * 0.16) * 4;

        // Legs
        ctx.strokeStyle = '#66BB6A';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - 7, screenY + this.height * 0.72);
        ctx.lineTo(cx - 9 + legSwing, screenY + this.height - 2);
        ctx.moveTo(cx + 7, screenY + this.height * 0.72);
        ctx.lineTo(cx + 9 - legSwing, screenY + this.height - 2);
        ctx.stroke();

        // Body parts stack back to front: neck, then shell over its root, then
        // the head in front. Drawing the neck after the shell made it look
        // like it sprouted from the middle of the shell.
        const shellCX = cx - look * 5;
        const shellCY = screenY + this.height * 0.5;
        const shellRX = this.width / 2.7;
        const shellRY = this.height / 2.7;
        const headX = cx + look * 11;
        const headY = screenY + this.height * 0.42;

        // Neck - the inner end is hidden by the shell painted over it
        ctx.fillStyle = '#7CB342';
        ctx.beginPath();
        ctx.roundRect(Math.min(shellCX, headX), headY - 3.5, Math.abs(headX - shellCX), 7, 3.5);
        ctx.fill();

        const shellGradient = ctx.createRadialGradient(shellCX - 4, shellCY - 6, 2, shellCX, shellCY, shellRX * 1.4);
        shellGradient.addColorStop(0, '#4CAF50');
        shellGradient.addColorStop(1, this.shellColor);
        ctx.fillStyle = shellGradient;
        ctx.beginPath();
        ctx.ellipse(shellCX, shellCY, shellRX, shellRY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#F5DEB3';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Shell plates
        ctx.fillStyle = 'rgba(0,80,0,0.45)';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(shellCX + Math.cos(angle) * 6, shellCY + Math.sin(angle) * 4.5, 2.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Head, clear of the shell's leading edge
        ctx.fillStyle = '#8BC34A';
        ctx.beginPath();
        ctx.ellipse(headX, headY, 7.5, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snout
        ctx.fillStyle = '#A5D96A';
        ctx.beginPath();
        ctx.ellipse(headX + look * 4, headY + 2, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(headX + look * 1.5, headY - 2, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B2A4A';
        ctx.beginPath();
        ctx.arc(headX + look * 2.5, headY - 2, 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ============================================================================
//  BLOCKS - the question and brick blocks that make a Mario level a Mario level
// ============================================================================

class Block {
    /**
     * @param {string} type     'question' | 'brick' | 'solid'
     * @param {string|null} contents 'coin' | 'mushroom' | 'star'
     * @param {number} count    How many times a question block can be hit
     */
    constructor(x, y, type = 'brick', contents = null, count = 1) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.BLOCK_SIZE;
        this.height = CONFIG.BLOCK_SIZE;
        this.type = type;
        this.contents = contents;
        this.count = contents ? count : 0;
        this.used = false;
        this.destroyed = false;
        this.bump = 0;       // Vertical offset of the bump animation
        this.bumpVelocity = 0;
        this.flash = 0;      // Frames of contact highlight
        this.animTime = Math.random() * 100;
    }

    update() {
        this.animTime++;
        if (this.flash > 0) this.flash--;
        if (this.bump !== 0 || this.bumpVelocity !== 0) {
            this.bump += this.bumpVelocity;
            this.bumpVelocity += CONFIG.BLOCK_BUMP_GRAVITY;
            if (this.bump >= 0) {
                this.bump = 0;
                this.bumpVelocity = 0;
            }
        }
    }

    /** Called by the collision resolver when something head-butts this block. */
    onBump(byPlayer) {
        if (this.destroyed) return;

        // A block that is still bouncing has already been counted. Without
        // this, a slow frame that runs several simulation steps at once could
        // register one jump as two hits and empty a block early.
        if (this.bump !== 0 || this.bumpVelocity !== 0) return;

        // Anything standing on top gets knocked over.
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const standing = enemy.y + enemy.height >= this.y - 6 &&
                             enemy.y + enemy.height <= this.y + 8 &&
                             enemy.x + enemy.width > this.x &&
                             enemy.x < this.x + this.width;
            if (standing) enemy.flip();
        }

        if (this.used) {
            sounds.bump();
            this.startBump();
            return;
        }

        if (this.contents && this.count > 0) {
            this.count--;
            this.releaseContents(byPlayer);
            if (this.count === 0) this.used = true;
            this.startBump();
            return;
        }

        if (this.type === 'brick') {
            if (byPlayer && byPlayer.health > 1) {
                this.shatter();
            } else {
                sounds.bump();
                this.startBump();
            }
            return;
        }

        sounds.bump();
        this.startBump();
    }

    startBump() {
        this.bump = -1;
        this.bumpVelocity = CONFIG.BLOCK_BUMP_SPEED;
        this.flash = CONFIG.BLOCK_FLASH_FRAMES;

        // A puff along the underside at the instant of contact, so the hit
        // reads immediately rather than only once the block has travelled.
        const cy = this.y + this.height;
        for (let i = 0; i < 5; i++) {
            spawnParticle(new Particle(
                this.x + 6 + Math.random() * (this.width - 12), cy,
                (Math.random() - 0.5) * 3, 0.6 + Math.random(),
                'rgba(255,255,255,0.85)', 2 + Math.random() * 2, 12, 0.06
            ));
        }
    }

    releaseContents(byPlayer) {
        const cx = this.x + this.width / 2;

        if (this.contents === 'coin') {
            gameState.coins++;
            gameState.score += 200;
            updateHUD();
            sounds.coin();
            createFloatingText(cx, this.y - 20, '+200', '#FFD700', 18);
            // A coin pops out of the top of the block
            for (let i = 0; i < 6; i++) {
                spawnParticle(new Particle(cx, this.y, (Math.random() - 0.5) * 2, -4 - Math.random() * 2, '#FFD700', 3, 26));
            }
            haptics.success();
            if (multiplayerState.connected) multiplayer.updateLeaderboard();
            return;
        }

        // A mushroom or a star sprouts out of the top and walks away.
        const wantsStar = this.contents === 'star' || (this.contents === 'mushroom' && byPlayer && byPlayer.health > 1 && Math.random() < 0.25);
        powerUps.push(new PowerUp(cx - CONFIG.POWERUP_SIZE / 2, this.y - CONFIG.POWERUP_SIZE, wantsStar ? 'star' : 'mushroom'));
        sounds.sprout();
    }

    shatter() {
        this.destroyed = true;
        gameState.score += 50;
        updateHUD();
        sounds.brick();
        haptics.medium();
        screenShake(3, 8);

        // Four tumbling shards
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        for (let i = 0; i < 12; i++) {
            spawnParticle(new Particle(
                cx + (Math.random() - 0.5) * this.width,
                cy + (Math.random() - 0.5) * this.height,
                (Math.random() - 0.5) * 6,
                -3 - Math.random() * 4,
                i % 2 ? '#C1440E' : '#8B4513',
                3 + Math.random() * 3,
                40
            ));
        }
    }

    draw() {
        if (this.destroyed) return;

        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y + this.bump;
        if (screenX < -60 || screenX > view.w + 60) return;

        ctx.save();

        if (this.flash > 0) {
            ctx.save();
            ctx.globalAlpha = (this.flash / CONFIG.BLOCK_FLASH_FRAMES) * 0.9;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(screenX - 3, screenY - 3, this.width + 6, this.height + 6, 6);
            ctx.fill();
            ctx.restore();
        }

        if (this.type === 'question' && !this.used) {
            const pulse = 0.5 + Math.sin(this.animTime * 0.08) * 0.5;
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + this.height);
            gradient.addColorStop(0, '#FFD966');
            gradient.addColorStop(1, '#E8A317');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(screenX, screenY, this.width, this.height, 4);
            ctx.fill();

            ctx.strokeStyle = '#8B5A00';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Corner rivets
            ctx.fillStyle = '#8B5A00';
            [[6, 6], [this.width - 6, 6], [6, this.height - 6], [this.width - 6, this.height - 6]].forEach(([rx, ry]) => {
                ctx.beginPath();
                ctx.arc(screenX + rx, screenY + ry, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.fillStyle = `rgba(255,255,255,${0.55 + pulse * 0.45})`;
            ctx.font = `bold ${this.height * 0.6}px "Trebuchet MS", Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', screenX + this.width / 2, screenY + this.height / 2 + 1);
        } else if (this.used || this.type === 'solid') {
            // Spent and solid blocks are cut from whatever this world is made
            // of, so a cave column is rock and a castle column is masonry.
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + this.height);
            gradient.addColorStop(0, theme.block[0]);
            gradient.addColorStop(1, theme.block[1]);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(screenX, screenY, this.width, this.height, 4);
            ctx.fill();
            ctx.strokeStyle = theme.blockEdge;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.fillRect(screenX + 5, screenY + 5, this.width - 10, this.height - 10);
        } else {
            // Brick
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + this.height);
            gradient.addColorStop(0, theme.brick[0]);
            gradient.addColorStop(1, theme.brick[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(screenX, screenY, this.width, this.height);

            ctx.strokeStyle = theme.mortar;
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX + 1, screenY + 1, this.width - 2, this.height - 2);

            // Two courses of bricks
            ctx.beginPath();
            ctx.moveTo(screenX, screenY + this.height / 2);
            ctx.lineTo(screenX + this.width, screenY + this.height / 2);
            ctx.moveTo(screenX + this.width / 2, screenY);
            ctx.lineTo(screenX + this.width / 2, screenY + this.height / 2);
            ctx.moveTo(screenX + this.width / 4, screenY + this.height / 2);
            ctx.lineTo(screenX + this.width / 4, screenY + this.height);
            ctx.moveTo(screenX + this.width * 0.75, screenY + this.height / 2);
            ctx.lineTo(screenX + this.width * 0.75, screenY + this.height);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(screenX + 2, screenY + 2, this.width - 4, 3);
        }

        ctx.restore();
    }
}

// ============================================================================
//  POWER-UPS
// ============================================================================

class PowerUp {
    constructor(x, y, type = 'mushroom') {
        this.x = x;
        this.y = y;
        this.width = CONFIG.POWERUP_SIZE;
        this.height = CONFIG.POWERUP_SIZE;
        this.type = type;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.collected = false;
        this.animTime = 0;
        this.sproutTime = 24; // Frames spent rising out of the block
    }

    update() {
        this.animTime++;

        // Rise gently out of the block before it starts moving.
        if (this.sproutTime > 0) {
            this.sproutTime--;
            this.y -= 0.7;
            if (this.sproutTime === 0) {
                this.velocityX = CONFIG.POWERUP_SPEED;
            }
            return;
        }

        this.velocityY = Math.min(this.velocityY + CONFIG.GRAVITY, CONFIG.MAX_FALL_SPEED);

        const hit = moveAndCollide(this);
        if (hit.hitWall !== 0) this.velocityX = -this.velocityX;

        // Turn back at a drop rather than walking off it. A power-up that
        // throws itself into a pit a second after you earned it is just a
        // reward taken away again.
        if (this.onGround && this.velocityX !== 0 &&
            !hasFloorAhead(this, Math.sign(this.velocityX))) {
            this.velocityX = -this.velocityX;
        }

        // Stars bounce along; mushrooms just walk.
        if (this.type === 'star' && this.onGround) {
            this.velocityY = -8;
        }

        if (this.x <= 0 || this.x + this.width >= CONFIG.WORLD_WIDTH) {
            this.velocityX = -this.velocityX;
            this.x = clamp(this.x, 0, CONFIG.WORLD_WIDTH - this.width);
        }

        // Fell in a pit
        if (this.y > CONFIG.WORLD_HEIGHT + 120) {
            this.collected = true;
            return;
        }

        if (!player.outOfLives && player.checkCollision(this)) {
            this.collected = true;
            if (this.type === 'star') {
                player.giveStar();
            } else {
                player.grow();
            }
            gameState.score += 500;
            createFloatingText(this.x + this.width / 2, this.y, '+500', '#FFD700', 18);
            updateHUD();
            if (multiplayerState.connected) multiplayer.updateLeaderboard();
        }
    }

    draw() {
        if (this.collected) return;

        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;
        if (screenX < -60 || screenX > view.w + 60) return;

        drawGroundShadow(this, screenX + this.width / 2);

        ctx.save();
        const cx = screenX + this.width / 2;
        const cy = screenY + this.height / 2;

        if (this.type === 'star') {
            const hue = (this.animTime * 8) % 360;
            ctx.translate(cx, cy);
            ctx.rotate(Math.sin(this.animTime * 0.08) * 0.35);

            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            ctx.shadowBlur = 14;
            ctx.fillStyle = `hsl(${hue}, 100%, 62%)`;
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const radius = i % 2 === 0 ? this.width / 2 : this.width / 4.6;
                const angle = (Math.PI / 5) * i - Math.PI / 2;
                const px = Math.cos(angle) * radius;
                const py = Math.sin(angle) * radius;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(-3.5, 0, 1.6, 2.6, 0, 0, Math.PI * 2);
            ctx.ellipse(3.5, 0, 1.6, 2.6, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Stem
            ctx.fillStyle = '#FFF3D6';
            ctx.beginPath();
            ctx.roundRect(cx - 7, cy, 14, this.height / 2 - 1, 3);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(cx - 3.5, cy + 5, 1.4, 2.4, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 3.5, cy + 5, 1.4, 2.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cap
            const capGradient = ctx.createLinearGradient(0, screenY, 0, cy);
            capGradient.addColorStop(0, '#FF6B6B');
            capGradient.addColorStop(1, '#C0392B');
            ctx.fillStyle = capGradient;
            ctx.beginPath();
            ctx.ellipse(cx, cy, this.width / 2, this.height / 2, 0, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(cx - this.width / 2, cy - 1, this.width, 2);

            // Spots
            ctx.fillStyle = '#FFF3D6';
            ctx.beginPath();
            ctx.arc(cx - 6, cy - 6, 3.4, 0, Math.PI * 2);
            ctx.arc(cx + 6, cy - 4, 2.6, 0, Math.PI * 2);
            ctx.arc(cx, cy - 10, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ============================================================================
//  FLAGPOLE - the goal at the end of a single-player level
// ============================================================================

class Flagpole {
    constructor(x, groundY) {
        this.width = 12;
        this.poleHeight = 300;
        this.x = x;
        this.y = groundY - this.poleHeight;
        this.height = this.poleHeight;
        this.flagY = this.y + 12;      // Current flag height (animates down)
        this.targetFlagY = this.flagY;
        this.reached = false;
    }

    update() {
        this.flagY = lerp(this.flagY, this.targetFlagY, 0.12);

        if (this.reached || multiplayerState.connected) return;

        const hitbox = { x: this.x - 6, y: this.y, width: this.width + 12, height: this.poleHeight };
        if (player.checkCollision(hitbox)) {
            this.reached = true;
            // Higher grabs are worth more, exactly like the original.
            const grabHeight = clamp(1 - (player.y - this.y) / this.poleHeight, 0, 1);
            this.targetFlagY = this.y + this.poleHeight - 40;
            levelComplete(grabHeight);
        }
    }

    draw() {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;
        if (screenX < -120 || screenX > view.w + 120) return;

        ctx.save();

        // Base block, centred under the pole
        const baseX = screenX + this.width / 2 - 22;
        ctx.fillStyle = '#4A4A4A';
        ctx.beginPath();
        ctx.roundRect(baseX, screenY + this.poleHeight - 26, 44, 26, 4);
        ctx.fill();
        ctx.fillStyle = '#6E6E6E';
        ctx.fillRect(baseX + 4, screenY + this.poleHeight - 22, 36, 6);

        // Pole
        const poleGradient = ctx.createLinearGradient(screenX, 0, screenX + this.width, 0);
        poleGradient.addColorStop(0, '#7FB77E');
        poleGradient.addColorStop(0.5, '#DFF6DD');
        poleGradient.addColorStop(1, '#4E7A4C');
        ctx.fillStyle = poleGradient;
        ctx.fillRect(screenX, screenY, this.width, this.poleHeight);

        // Ball on top
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, screenY - 6, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2 - 3, screenY - 9, 3, 0, Math.PI * 2);
        ctx.fill();

        // Flag
        const flagScreenY = this.flagY - gameState.camera.y;
        ctx.fillStyle = '#E52521';
        ctx.beginPath();
        ctx.moveTo(screenX + this.width, flagScreenY);
        ctx.lineTo(screenX + this.width + 44, flagScreenY + 14);
        ctx.lineTo(screenX + this.width, flagScreenY + 28);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(screenX + this.width + 14, flagScreenY + 14, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ============================================================================
//  PORTAL (enemy spawn pipe)
// ============================================================================

class Portal {
    constructor(x, y, enemyType = 'normal') {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PORTAL_WIDTH;
        this.height = CONFIG.PORTAL_HEIGHT;
        this.enemyType = enemyType; // 'normal', 'jumping', or 'turtle'
        this.spawnCooldown = 300 + Math.random() * 300; // 5-10 seconds startup delay
        this.animation = 0;
        this.spawning = false; // Spawning animation state
        this.spawnProgress = 0; // 0 to 1
    }

    update() {
        this.animation += 0.1;

        // Update spawn animation
        if (this.spawning) {
            this.spawnProgress += 0.05;
            if (this.spawnProgress >= 1) {
                // Spawn well above the pipe opening to avoid collision
                const spawnX = this.x + this.width / 2 - CONFIG.ENEMY_SIZE / 2;
                const spawnY = this.y - CONFIG.ENEMY_SIZE - 20;

                if (multiplayerState.connected) {
                    multiplayer.spawnEnemy(spawnX, spawnY, this.enemyType);
                } else {
                    enemies.push(createEnemy(this.enemyType, spawnX, spawnY));
                }

                createParticles(this.x + this.width / 2, this.y, 12, '#9B59B6');
                sounds.sprout();
                this.spawning = false;
                this.spawnProgress = 0;
                this.spawnCooldown = CONFIG.PORTAL_SPAWN_MIN + Math.random() * CONFIG.PORTAL_SPAWN_RANGE;
            }
            return;
        }

        this.spawnCooldown--;

        // In multiplayer only the spawn master spawns enemies
        const canSpawn = !multiplayerState.connected || multiplayerState.isSpawnMaster;
        if (this.spawnCooldown > 0 || !canSpawn) return;

        // Limit total enemies per type
        const totalEnemies = enemies.filter(e => e.alive && enemyTypeOf(e) === this.enemyType).length;
        if (totalEnemies >= CONFIG.MAX_ENEMIES_PER_TYPE) {
            this.spawnCooldown = 120; // Check again in 2 seconds
            return;
        }

        // Don't drop an enemy into anybody's lap
        let blocked = this.spawnWouldAmbush(
            player.x, player.y, player.width, player.height,
            player.velocityX, player.direction
        );

        if (!blocked && multiplayerState.connected) {
            multiplayerState.remotePlayers.forEach((remotePlayer) => {
                const big = (remotePlayer.health === undefined ? 2 : remotePlayer.health) > 1;
                const w = big ? CONFIG.PLAYER_WIDTH : CONFIG.SMALL_PLAYER_WIDTH;
                const h = big ? CONFIG.PLAYER_SIZE : CONFIG.SMALL_PLAYER_HEIGHT;
                // Remote velocity is not synced, so assume they might be running.
                if (this.spawnWouldAmbush(remotePlayer.x, remotePlayer.y, w, h, 0, remotePlayer.direction)) {
                    blocked = true;
                }
            });
        }

        if (blocked) {
            this.spawnCooldown = 90; // Someone is too close, look again shortly
        } else {
            this.spawning = true;
            this.spawnProgress = 0;
        }
    }

    /**
     * True when an enemy appearing here would be unfair: right beside a player
     * standing still, or in the stretch of level a moving player is about to
     * cover. The old rule was a flat 200px circle, which ignores which way you
     * are heading and, at running speed, is well under a second of warning.
     */
    spawnWouldAmbush(px, py, pw, ph, vx, facing) {
        const spawnX = this.x + this.width / 2;
        const spawnY = this.y - CONFIG.ENEMY_SIZE / 2;
        const dx = spawnX - (px + pw / 2);
        const dy = spawnY - (py + ph / 2);

        // Close on any side, however they are moving.
        if (Math.hypot(dx, dy) < CONFIG.SPAWN_SAFE_RADIUS) return true;

        // Beyond that, only the band roughly level with the player can be run into.
        if (Math.abs(dy) > CONFIG.SPAWN_SAFE_RADIUS) return false;

        const heading = vx !== 0 ? Math.sign(vx) : (facing || 0);
        if (heading === 0 || Math.sign(dx) !== heading) return false;

        const speed = Math.abs(vx) || CONFIG.RUN_SPEED;
        const reach = CONFIG.SPAWN_SAFE_RADIUS + speed * CONFIG.SPAWN_LOOKAHEAD_FRAMES;
        return Math.abs(dx) < reach;
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }

    draw() {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;
        if (screenX < -120 || screenX > view.w + 120) return;

        ctx.save();

        // Emerging enemy is drawn behind the pipe rim
        if (this.spawning && this.spawnProgress > 0) {
            ctx.save();
            const spawnY = screenY - (CONFIG.ENEMY_SIZE * this.spawnProgress) + 10;
            ctx.globalAlpha = this.spawnProgress;
            ctx.fillStyle = this.enemyType === 'jumping' ? '#FF6B6B'
                : this.enemyType === 'turtle' ? '#228B22' : '#8B4513';
            ctx.beginPath();
            ctx.arc(screenX + this.width / 2, spawnY, CONFIG.ENEMY_SIZE / 2.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (Math.random() < 0.25) {
                createSparkle(this.x + this.width / 2 + (Math.random() - 0.5) * 20, this.y, '#9B59B6');
            }
        }

        // Pipe shaft
        const shaftGradient = ctx.createLinearGradient(screenX, 0, screenX + this.width, 0);
        shaftGradient.addColorStop(0, '#1B7A2E');
        shaftGradient.addColorStop(0.35, '#5CE05C');
        shaftGradient.addColorStop(0.6, '#2ECC40');
        shaftGradient.addColorStop(1, '#14612A');
        ctx.fillStyle = shaftGradient;
        ctx.fillRect(screenX + 5, screenY + 14, this.width - 10, this.height - 14);

        // Rim
        const rimGradient = ctx.createLinearGradient(screenX, 0, screenX + this.width, 0);
        rimGradient.addColorStop(0, '#1B7A2E');
        rimGradient.addColorStop(0.35, '#7BF07B');
        rimGradient.addColorStop(0.6, '#39D64B');
        rimGradient.addColorStop(1, '#14612A');
        ctx.fillStyle = rimGradient;
        ctx.beginPath();
        ctx.roundRect(screenX - 2, screenY, this.width + 4, 18, 3);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,50,0,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 5, screenY + 16, this.width - 10, this.height - 16);

        // Dark opening
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.beginPath();
        ctx.ellipse(screenX + this.width / 2, screenY + 4, this.width / 2.4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing portal glow inside the opening
        const glow = Math.sin(this.animation) * 0.3 + 0.55;
        ctx.fillStyle = `rgba(155, 89, 182, ${glow * 0.7})`;
        ctx.beginPath();
        ctx.ellipse(screenX + this.width / 2, screenY + 4, this.width / 3.2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

function enemyTypeOf(enemy) {
    if (enemy instanceof JumpingEnemy) return 'jumping';
    if (enemy instanceof TurtleEnemy) return 'turtle';
    return 'normal';
}

function createEnemy(type, x, y) {
    const enemy = type === 'jumping' ? new JumpingEnemy(x, y)
        : type === 'turtle' ? new TurtleEnemy(x, y)
        : new Enemy(x, y);
    enemy.spawnX = x;
    enemy.spawnY = y;
    return enemy;
}

// ============================================================================
//  COINS
// ============================================================================

class Coin {
    constructor(x, y, index) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.COIN_SIZE;
        this.height = CONFIG.COIN_SIZE;
        this.collected = false;
        this.rotation = Math.random() * Math.PI * 2;
        this.respawnTime = null;
        this.index = index; // For Firebase identification
        this.pendingCollect = false; // Guards against firing the async claim twice
        this.bob = Math.random() * Math.PI * 2;
    }

    update() {
        this.rotation += 0.09;
        this.bob += 0.05;

        // Check if coin should respawn
        if (this.collected && this.respawnTime && Date.now() >= this.respawnTime) {
            this.collected = false;
            this.respawnTime = null;
            if (multiplayerState.connected && multiplayerState.coinsRef) {
                multiplayerState.coinsRef.child(`coin_${this.index}`).remove();
            }
        }

        if (this.collected || this.pendingCollect || player.outOfLives) return;
        if (!player.checkCollision(this)) return;

        if (multiplayerState.connected) {
            // Claim through Firebase so two players can't bank the same coin
            this.pendingCollect = true;
            multiplayer.collectCoin(this.index).then(success => {
                this.pendingCollect = false;
                if (success) this.award();
            }).catch(() => {
                this.pendingCollect = false;
            });
        } else {
            this.award();
        }
    }

    award() {
        this.collected = true;
        gameState.coins++;
        gameState.score += 50;

        // Every 100 coins is an extra life, just like the real thing.
        if (gameState.coins > 0 && gameState.coins % 100 === 0) {
            gameState.lives++;
            sounds.oneUp();
            createFloatingText(this.x + this.width / 2, this.y - 24, '1-UP!', '#6BCF7F', 24);
        }

        updateHUD();
        sounds.coin();
        createParticles(this.x + this.width / 2, this.y + this.height / 2, 8, '#FFD700');
        haptics.success();
        if (multiplayerState.connected) multiplayer.updateLeaderboard();
    }

    draw() {
        if (this.collected) return;

        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y + Math.sin(this.bob) * 3;
        if (screenX < -50 || screenX > view.w + 50) return;

        ctx.save();
        ctx.translate(screenX + this.width / 2, screenY + this.height / 2);

        // Glow
        const glowSize = this.width / 2 + 6 + Math.sin(this.bob * 2) * 2;
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        glow.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
        glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Spinning coin: the width oscillates to fake a 3D rotation
        const spin = Math.cos(this.rotation);
        const halfWidth = Math.max(1.5, (this.width / 2) * Math.abs(spin));

        const face = ctx.createLinearGradient(-halfWidth, 0, halfWidth, 0);
        face.addColorStop(0, '#B8860B');
        face.addColorStop(0.45, '#FFEC8B');
        face.addColorStop(1, '#DAA520');
        ctx.fillStyle = face;
        ctx.beginPath();
        ctx.ellipse(0, 0, halfWidth, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8B6508';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (halfWidth > this.width / 5) {
            ctx.fillStyle = 'rgba(139, 101, 8, 0.55)';
            ctx.beginPath();
            ctx.ellipse(0, 0, halfWidth * 0.45, this.height / 3.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ============================================================================
//  PLATFORMS
// ============================================================================

class Platform {
    /**
     * @param {string} variant 'brick' | 'ground' | 'cloud' | 'metal'
     * Cloud platforms are one-way: you can jump up through them. What a cloud
     * actually looks like is up to the theme - planks underground, ice shelves
     * in the mountains, scorched stone in the castle.
     */
    constructor(x, y, width, height, variant = 'brick') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.variant = variant;
        this.oneWay = variant === 'cloud';
    }

    draw() {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        // Off-screen reject - the level is much wider than the viewport
        if (screenX + this.width < -20 || screenX > view.w + 20) return;
        if (screenY > view.h + 20 || screenY + this.height < -20) return;

        ctx.save();

        if (this.variant === 'cloud') {
            // Drawn unclipped so the puffs can billow past the collision box
            this.drawOneWay(screenX, screenY);
        } else if (this.variant === 'metal') {
            this.drawMetal(screenX, screenY);
        } else {
            ctx.beginPath();
            ctx.rect(screenX, screenY, this.width, this.height);
            ctx.clip();
            if (this.variant === 'ground') {
                this.drawGround(screenX, screenY);
            } else {
                this.drawBrick(screenX, screenY);
            }
        }

        ctx.restore();

        this.drawOwner(screenX, screenY);
    }

    /**
     * Paints a captured ledge in its owner's colour. A wash rather than a fill,
     * so the brick or the planks still read through it and the level does not
     * turn into a bar chart, plus a solid bar along the standing surface -
     * which is the edge you actually aim at from across a gap.
     */
    drawOwner(screenX, screenY) {
        const palette = territoryPalette(territoryOwnerOf(this));
        if (!palette) return;

        ctx.save();

        ctx.globalAlpha = 0.34;
        ctx.fillStyle = palette.shirt;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // The lip, at full strength. Read from a distance this is the whole
        // signal: whose ledge is that one over there.
        ctx.globalAlpha = 1;
        ctx.fillStyle = palette.shirt;
        ctx.fillRect(screenX, screenY - 3, this.width, 4);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fillRect(screenX, screenY - 3, this.width, 1);

        ctx.restore();
    }

    drawGround(screenX, screenY) {
        const soil = ctx.createLinearGradient(0, screenY, 0, screenY + this.height);
        soil.addColorStop(0, theme.soil[0]);
        soil.addColorStop(0.25, theme.soil[1]);
        soil.addColorStop(1, theme.soil[2]);
        ctx.fillStyle = soil;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Surface cap - grass, sand, frost or scorched rock
        ctx.fillStyle = theme.turf[0];
        ctx.fillRect(screenX, screenY, this.width, 10);
        ctx.fillStyle = theme.turf[1];
        ctx.fillRect(screenX, screenY, this.width, 4);

        const start = Math.floor(this.x / 16) * 16;

        // Grass blades along the top edge
        if (theme.blades) {
            ctx.strokeStyle = theme.turf[0];
            ctx.lineWidth = 2;
            for (let wx = start; wx < this.x + this.width; wx += 16) {
                const sx = wx - gameState.camera.x;
                ctx.beginPath();
                ctx.moveTo(sx, screenY);
                ctx.lineTo(sx + 3, screenY - 6);
                ctx.lineTo(sx + 6, screenY);
                ctx.stroke();
            }
        }

        // Pebbles for texture
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        for (let wx = start; wx < this.x + this.width; wx += 34) {
            const sx = wx - gameState.camera.x;
            ctx.beginPath();
            ctx.arc(sx + 12, screenY + 24 + ((wx / 34) % 3) * 7, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawBrick(screenX, screenY) {
        const stone = ctx.createLinearGradient(0, screenY, 0, screenY + this.height);
        stone.addColorStop(0, theme.brick[0]);
        stone.addColorStop(1, theme.brick[1]);
        ctx.fillStyle = stone;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        ctx.strokeStyle = 'rgba(90, 45, 20, 0.65)';
        ctx.lineWidth = 2;

        const brickWidth = CONFIG.BLOCK_SIZE;
        const brickHeight = CONFIG.BLOCK_SIZE / 2;

        for (let by = 0; by < this.height; by += brickHeight) {
            const offset = (by / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
            for (let bx = -brickWidth; bx < this.width; bx += brickWidth) {
                ctx.strokeRect(screenX + bx + offset, screenY + by, brickWidth, brickHeight);
            }
        }

        // Lit top edge and shaded underside sell the depth
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(screenX, screenY, this.width, 3);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(screenX, screenY + this.height - 4, this.width, 4);
    }

    /** One-way platforms, dressed for whichever world they are standing in. */
    drawOneWay(screenX, screenY) {
        switch (theme.oneWay) {
            case 'plank': return this.drawPlankPlatform(screenX, screenY);
            case 'ice': return this.drawIcePlatform(screenX, screenY);
            case 'ember': return this.drawEmberPlatform(screenX, screenY);
            default: return this.drawCloudPlatform(screenX, screenY);
        }
    }

    drawCloudPlatform(screenX, screenY) {
        const midY = screenY + this.height / 2;

        // Billowing top made of overlapping puffs
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        for (let bx = 10; bx <= this.width - 10; bx += 22) {
            const radius = 11 + ((bx / 22) % 3) * 3;
            ctx.moveTo(screenX + bx + radius, midY);
            ctx.arc(screenX + bx, midY, radius, 0, Math.PI * 2);
        }
        ctx.rect(screenX, screenY, this.width, this.height);
        ctx.fill();

        // Shaded underside so it reads as something you land on
        ctx.fillStyle = 'rgba(163, 196, 234, 0.95)';
        ctx.beginPath();
        ctx.roundRect(screenX, screenY + this.height - 5, this.width, 7, 3);
        ctx.fill();

        // Bright rim along the standing surface
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.roundRect(screenX, screenY - 1, this.width, 4, 2);
        ctx.fill();
    }

    // Mine scaffolding: boards with a shadowed gap between them.
    drawPlankPlatform(screenX, screenY) {
        ctx.fillStyle = '#6B4A2F';
        ctx.fillRect(screenX, screenY, this.width, this.height);
        ctx.fillStyle = '#8A6340';
        ctx.fillRect(screenX, screenY, this.width, 4);
        ctx.strokeStyle = 'rgba(35, 20, 10, 0.65)';
        ctx.lineWidth = 2;
        for (let bx = 0; bx < this.width; bx += 40) {
            ctx.beginPath();
            ctx.moveTo(screenX + bx, screenY);
            ctx.lineTo(screenX + bx, screenY + this.height);
            ctx.stroke();
        }
        // Iron studs at each end
        ctx.fillStyle = 'rgba(210, 210, 220, 0.7)';
        [6, this.width - 10].forEach(bx => {
            ctx.beginPath();
            ctx.arc(screenX + bx, screenY + this.height / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // A shelf of clear ice: pale, translucent, with a lit top edge.
    drawIcePlatform(screenX, screenY) {
        ctx.fillStyle = 'rgba(196, 230, 255, 0.85)';
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, this.width, this.height + 6, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillRect(screenX, screenY, this.width, 3);
        // Icicles hanging off the underside
        ctx.fillStyle = 'rgba(210, 238, 255, 0.9)';
        for (let bx = 8; bx < this.width - 6; bx += 26) {
            const drop = 7 + ((bx / 26) % 3) * 5;
            ctx.beginPath();
            ctx.moveTo(screenX + bx - 4, screenY + this.height + 4);
            ctx.lineTo(screenX + bx, screenY + this.height + 4 + drop);
            ctx.lineTo(screenX + bx + 4, screenY + this.height + 4);
            ctx.fill();
        }
    }

    // Scorched stone with heat still glowing through the cracks.
    drawEmberPlatform(screenX, screenY) {
        ctx.fillStyle = '#2E1C18';
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, this.width, this.height + 4, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 140, 50, 0.85)';
        ctx.fillRect(screenX, screenY, this.width, 3);
        ctx.fillStyle = 'rgba(255, 90, 20, 0.5)';
        for (let bx = 10; bx < this.width - 6; bx += 30) {
            ctx.fillRect(screenX + bx, screenY + this.height - 2, 12, 3);
        }
    }

    // Riveted steel - the look of anything that moves under its own power.
    drawMetal(screenX, screenY) {
        const plate = ctx.createLinearGradient(0, screenY, 0, screenY + this.height);
        plate.addColorStop(0, '#B9C2CC');
        plate.addColorStop(0.5, '#7C8896');
        plate.addColorStop(1, '#49535F');
        ctx.fillStyle = plate;
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, this.width, this.height, 4);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(screenX + 3, screenY + 2, this.width - 6, 2);

        // Bolts, spaced so a long platform reads as one built thing
        ctx.fillStyle = 'rgba(30, 36, 44, 0.75)';
        for (let bx = 8; bx < this.width - 4; bx += 24) {
            ctx.beginPath();
            ctx.arc(screenX + bx, screenY + this.height / 2 + 1, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Warning stripe underneath, the way service platforms are painted
        ctx.fillStyle = 'rgba(240, 190, 60, 0.9)';
        for (let bx = 0; bx < this.width; bx += 16) {
            ctx.fillRect(screenX + bx, screenY + this.height - 4, 8, 4);
        }
    }
}

/**
 * A platform that runs a fixed patrol and carries whatever is standing on it.
 * Movement is linear and deterministic - no sine, no randomness - so every
 * player, and every replay of a level, sees the same platform in the same
 * place at the same moment.
 */
class MovingPlatform extends Platform {
    /**
     * @param {object} opts axis 'x'|'y', range (px each way from the start),
     *   speed (px per step), offset (fraction 0-1 along the run to start at),
     *   dir (1 or -1).
     */
    constructor(x, y, width, opts = {}) {
        super(x, y, width, PLATFORM_THICKNESS, 'metal');
        this.axis = opts.axis === 'y' ? 'y' : 'x';
        this.range = opts.range === undefined ? 160 : opts.range;
        this.speed = opts.speed === undefined ? 1.1 : opts.speed;
        this.homeX = x;
        this.homeY = y;
        this.dir = opts.dir === -1 ? -1 : 1;
        this.carries = true;
        this.dx = 0;
        this.dy = 0;

        // Start part-way along the run so a row of platforms can be staggered.
        // 0 is the laid-out position, 1 and -1 are the ends of the patrol.
        const offset = clamp(opts.offset || 0, -1, 1) * this.range;
        if (this.axis === 'x') this.x = x + offset;
        else this.y = y + offset;
    }

    // The whole stretch of world this platform sweeps through, which is what
    // level checks care about - not wherever it happens to be right now.
    get travel() {
        const spanX = this.axis === 'x' ? this.range : 0;
        const spanY = this.axis === 'y' ? this.range : 0;
        return {
            x: this.homeX - spanX,
            y: this.homeY - spanY,
            width: this.width + spanX * 2,
            height: this.height + spanY * 2,
        };
    }

    update() {
        const key = this.axis === 'x' ? 'x' : 'y';
        const home = this.axis === 'x' ? this.homeX : this.homeY;
        const before = this[key];

        let next = before + this.dir * this.speed;
        if (next > home + this.range) {
            next = home + this.range;
            this.dir = -1;
        } else if (next < home - this.range) {
            next = home - this.range;
            this.dir = 1;
        }

        this[key] = next;
        this.dx = this.axis === 'x' ? next - before : 0;
        this.dy = this.axis === 'y' ? next - before : 0;
    }
}

// ============================================================================
//  HAZARDS - lava and spikes. Not solid: you pass straight into them, which
//  is rather the point.
// ============================================================================

class Hazard {
    /** @param {string} variant 'lava' | 'spikes' */
    constructor(x, y, width, height, variant = 'spikes') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.variant = variant;
        this.animation = 0;
    }

    update() {
        this.animation += 0.05;

        if (!player || player.dying || player.outOfLives) return;
        if (!player.checkCollision(this)) return;

        if (this.variant === 'lava') {
            // A star throws you clear of the lava rather than saving you in it.
            if (player.immune) {
                player.velocityY = CONFIG.SPRING_POWER;
                return;
            }
            player.health = 1;
            sounds.sizzle();
            screenShake(8, 20);
            createParticles(player.x + player.width / 2, this.y, 14, '#FF7A18');
            player.startDeath();
        } else {
            if (player.immune) return;
            createParticles(player.x + player.width / 2, player.y + player.height, 8, '#C0C6D0');
            player.hit();
        }
    }

    draw() {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;
        if (screenX + this.width < -20 || screenX > view.w + 20) return;

        ctx.save();
        if (this.variant === 'lava') this.drawLava(screenX, screenY);
        else this.drawSpikes(screenX, screenY);
        ctx.restore();
    }

    drawLava(screenX, screenY) {
        const molten = ctx.createLinearGradient(0, screenY, 0, screenY + this.height);
        molten.addColorStop(0, '#FFD24A');
        molten.addColorStop(0.35, '#FF7A18');
        molten.addColorStop(1, '#8E1B05');
        ctx.fillStyle = molten;
        ctx.fillRect(screenX, screenY + 6, this.width, this.height - 6);

        // A slow rolling surface, drawn from the shared animation clock so it
        // never depends on frame rate.
        ctx.fillStyle = '#FFC24A';
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + 10);
        for (let bx = 0; bx <= this.width; bx += 10) {
            const wave = Math.sin(this.animation * 2 + (this.x + bx) / 40) * 4;
            ctx.lineTo(screenX + bx, screenY + 8 + wave);
        }
        ctx.lineTo(screenX + this.width, screenY + 16);
        ctx.lineTo(screenX, screenY + 16);
        ctx.closePath();
        ctx.fill();

        // Glow above the pool
        const glow = ctx.createLinearGradient(0, screenY - 40, 0, screenY + 10);
        glow.addColorStop(0, 'rgba(255, 110, 20, 0)');
        glow.addColorStop(1, 'rgba(255, 140, 40, 0.35)');
        ctx.fillStyle = glow;
        ctx.fillRect(screenX, screenY - 40, this.width, 50);

        // Bubbles
        ctx.fillStyle = 'rgba(255, 230, 150, 0.8)';
        for (let bx = 20; bx < this.width; bx += 70) {
            const t = (this.animation * 0.6 + bx / 70) % 1;
            const radius = 3 * (1 - t) + 1;
            ctx.beginPath();
            ctx.arc(screenX + bx, screenY + 14 - t * 10, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawSpikes(screenX, screenY) {
        const tooth = 20;
        ctx.fillStyle = '#8A94A6';
        ctx.strokeStyle = 'rgba(20, 24, 34, 0.6)';
        ctx.lineWidth = 1.5;
        for (let bx = 0; bx + tooth <= this.width; bx += tooth) {
            ctx.beginPath();
            ctx.moveTo(screenX + bx, screenY + this.height);
            ctx.lineTo(screenX + bx + tooth / 2, screenY);
            ctx.lineTo(screenX + bx + tooth, screenY + this.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Highlight down the lit side of each tooth
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.beginPath();
            ctx.moveTo(screenX + bx + tooth / 2, screenY);
            ctx.lineTo(screenX + bx + tooth / 2 - 3, screenY + this.height);
            ctx.lineTo(screenX + bx + tooth / 2 + 1, screenY + this.height);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#8A94A6';
        }
        // Base rail so the teeth do not float
        ctx.fillStyle = '#5A6478';
        ctx.fillRect(screenX, screenY + this.height - 4, this.width, 4);
    }
}

// ============================================================================
//  SPRINGS - a bounce pad. Not solid either: it catches you on the way down
//  and throws you back up, higher if you are holding jump as you land.
// ============================================================================

class Spring {
    constructor(x, surfaceY) {
        this.width = 40;
        this.height = 26;
        this.x = x;
        this.y = surfaceY - this.height;
        this.compression = 0;   // 1 = fully squashed, eases back to 0
        this.cooldown = 0;
    }

    update() {
        this.compression = lerp(this.compression, 0, 0.15);
        if (this.cooldown > 0) this.cooldown--;

        if (!player || player.dying || player.outOfLives) return;
        if (this.cooldown > 0 || player.velocityY < 0) return;

        // Only the top of the pad launches you; brushing the side does nothing.
        const head = { x: this.x, y: this.y - 6, width: this.width, height: 14 };
        if (!player.checkCollision(head)) return;

        const held = player.jumpHeld;
        player.y = this.y - player.height;
        player.velocityY = held ? CONFIG.SPRING_POWER_HELD : CONFIG.SPRING_POWER;
        player.onGround = false;
        player.isJumping = true;
        player.springBounce = true;
        player.jumpTime = 0;
        player.squash = 1.35;
        this.compression = 1;
        this.cooldown = 6;
        sounds.spring();
        haptics.medium();
        createJumpDust(this.x + this.width / 2, this.y + this.height);
    }

    draw() {
        const screenX = this.x - gameState.camera.x;
        if (screenX + this.width < -20 || screenX > view.w + 20) return;

        const squash = this.compression * 12;
        const topY = this.y - gameState.camera.y + squash;
        const baseY = this.y + this.height - gameState.camera.y;

        ctx.save();
        // Base plate
        ctx.fillStyle = '#4A4A55';
        ctx.beginPath();
        ctx.roundRect(screenX, baseY - 6, this.width, 6, 2);
        ctx.fill();

        // Coil
        ctx.strokeStyle = '#C0392B';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const coils = 3;
        for (let i = 0; i <= coils; i++) {
            const t = i / coils;
            const y = baseY - 6 - (baseY - 6 - (topY + 8)) * t;
            ctx.moveTo(screenX + 6, y);
            ctx.lineTo(screenX + this.width - 6, y - 4);
        }
        ctx.stroke();

        // Top plate
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.roundRect(screenX - 2, topY, this.width + 4, 10, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(screenX + 2, topY + 2, this.width, 2);
        ctx.restore();
    }
}

// ============================================================================
//  WORLD STATE
// ============================================================================

let player;
let enemies = [];
let coins = [];
let platforms = [];
let portals = [];
let blocks = [];
let powerUps = [];
let hazards = [];
let springs = [];
let movers = [];        // The subset of platforms that move, kept for the tick
let flagpole = null;

// ============================================================================
//  CAMERA
//  Dead-zone follow with look-ahead: the view leads the direction you are
//  running so you can see what you are about to land on.
// ============================================================================

function updateCamera(instant = false) {
    const centerX = player.x + player.width / 2;
    const lookAhead = clamp(player.velocityX * 14, -CONFIG.CAMERA_LOOKAHEAD, CONFIG.CAMERA_LOOKAHEAD);
    const targetX = centerX - view.w / 2 + lookAhead;

    // Vertically the camera only moves once the player leaves a central band,
    // so ordinary jumping does not slosh the whole screen around.
    const playerScreenY = player.y - gameState.camera.y;
    const deadTop = view.h * 0.33;
    const deadBottom = view.h * 0.62;
    let targetY = gameState.camera.y;
    if (playerScreenY < deadTop) targetY = player.y - deadTop;
    else if (playerScreenY > deadBottom) targetY = player.y - deadBottom;

    const maxX = Math.max(0, CONFIG.WORLD_WIDTH - view.w);
    const smoothing = instant ? 1 : CONFIG.CAMERA_SMOOTHING;
    gameState.camera.x = clamp(lerp(gameState.camera.x, targetX, smoothing), 0, maxX);

    if (view.h >= CONFIG.WORLD_HEIGHT) {
        // Taller viewport than world (a phone held upright): centre the level
        // rather than pinning it to the top with a void underneath, biased down
        // a little so the action sits clear of the on-screen buttons.
        gameState.camera.y = (CONFIG.WORLD_HEIGHT - view.h) / 2 + CONFIG.CAMERA_GROUND_BIAS;
    } else {
        const maxY = CONFIG.WORLD_HEIGHT - view.h;
        gameState.camera.y = clamp(lerp(gameState.camera.y, targetY, instant ? 1 : 0.1), 0, maxY);
    }

    // Screen shake decays instead of stopping abruptly
    const shake = gameState.screenShake;
    if (shake.duration > 0) {
        shake.duration--;
        const falloff = shake.intensity * (shake.duration / Math.max(1, shake.maxDuration || shake.duration + 1));
        gameState.camera.x += (Math.random() - 0.5) * falloff * 2;
        gameState.camera.y += (Math.random() - 0.5) * falloff * 2;
        if (shake.duration === 0) shake.intensity = 0;
    }
}

// ============================================================================
//  LEVEL CONSTRUCTION
// ============================================================================

const GROUND_Y = CONFIG.WORLD_HEIGHT - 50;
// Deep enough that the dirt still fills the bottom of a tall portrait screen.
const GROUND_DEPTH = 420;

// ---------------------------------------------------------------------------
//  Levels are laid out on a 40px grid - one cell is exactly the player's width
//  and a big player's height. Building on the grid is what keeps every gap
//  either genuinely passable or honestly solid: a hand-placed level ends up
//  with 20 and 30px slots that look like openings but are too tight to walk
//  into. Tiers are spaced GRID * 3 apart, comfortably inside the ~158px a
//  standing jump clears, so every layer is reachable from the one below.
// ---------------------------------------------------------------------------
const GRID = 40;
const TIER = {
    ground: GROUND_Y,                 // 550
    low: GROUND_Y - GRID * 3,         // 430
    mid: GROUND_Y - GRID * 6,         // 310
    high: GROUND_Y - GRID * 9,        // 190
};
const PLATFORM_THICKNESS = 20;
const CLOUD_THICKNESS = 14;
// Blocks hang one body-height clear of the ground: you walk under them and
// can still head-butt them from below.
const BLOCK_ROW_Y = GROUND_Y - GRID * 4;   // 390, so the row spans 390-430

/** Level data says 'low' or a raw pixel height; both mean a y coordinate. */
function tierY(value) {
    return typeof value === 'string' ? TIER[value] : value;
}

// ============================================================================
//  LEVEL DESIGNS
//  A campaign, not a single stage on repeat. Each entry is pure data: where
//  the ground breaks, what to stand on, what wants to kill you, and what the
//  whole thing looks and sounds like. Every design is checked by the geometry
//  suite in tests.html, so a level that reads well here also plays.
//
//  Fields, all optional except ground/flag/width:
//    ground   [x, width]                 solid stretches; the gaps are pits
//    solids   [tier, x, width]           standing platforms
//    oneWay   [x, width, tier]           jump up through these
//    movers   {x, y, width, axis, range, speed, offset}  carries you along
//    walls    [x, blocksTall]            block pillars rising from the ground
//    blocks   {x, y, items}              question/brick rows at head height
//    hazards  [variant, x, width, y]     'lava' or 'spikes'
//    springs  [x, tier]                  bounce pads
//    enemies  [type, x, tier]
//    portals  [type, x, tier]            pipes that keep spawning enemies
//    coins    {x, y, count, spacing}     extra trails on top of the automatic ones
//    stair    {x, steps}                 the run-in to the flag
// ============================================================================

const LEVELS = [
    // ------------------------------------------------------------------
    //  1. Where everyone starts. Wide ledges, short pits, one enemy type
    //     at a time - room to learn what a jump feels like.
    // ------------------------------------------------------------------
    {
        name: 'Green Hills',
        blurb: 'Reach the flag!',
        theme: 'overworld',
        width: 3600,
        time: 300,
        ground: [[0, 840], [960, 720], [1800, 760], [2680, 920]],
        solids: [
            ['low', 240, 200], ['low', 560, 160], ['low', 1040, 200], ['low', 1400, 160],
            ['low', 1880, 200], ['low', 2240, 160], ['low', 2760, 200],
            ['mid', 400, 160], ['mid', 800, 160], ['mid', 1280, 160], ['mid', 1640, 160],
            ['mid', 2120, 160], ['mid', 2480, 160], ['mid', 2960, 160],
        ],
        oneWay: [[280, 160], [880, 160], [1520, 160], [2160, 160], [2720, 160]],
        blocks: [
            // The first mushroom sits in a pocket: a power-up released here
            // walks right into the pipe at x=460 and back into the world edge,
            // so it can never reach the pit at 840. The block by that pit holds
            // a coin instead, which stays put.
            { x: 120, items: [['brick', null], ['question', 'mushroom'], ['brick', null]] },
            { x: 760, items: [['question', 'coin']] },
            // The star sat 80px from the pit at 1680; from here it has 640px of run.
            { x: 960, items: [['question', 'star'], ['brick', null]] },
            { x: 1280, items: [['brick', null], ['question', 'coin', 3], ['brick', null]] },
            { x: 1560, items: [['brick', null], ['question', 'coin']] },
            { x: 2400, items: [['brick', null], ['question', 'coin'], ['brick', null]] },
            { x: 2680, items: [['question', 'mushroom'], ['brick', null]] },
        ],
        enemies: [
            ['normal', 480, 'ground'], ['normal', 620, 'low'], ['normal', 1120, 'low'],
            ['normal', 1460, 'ground'], ['normal', 2000, 'low'], ['normal', 2300, 'low'],
            ['normal', 2840, 'ground'],
            ['jumping', 1240, 'ground'], ['jumping', 2520, 'mid'],
            ['turtle', 700, 'ground'], ['turtle', 1920, 'low'], ['turtle', 3000, 'ground'],
        ],
        portals: [['normal', 460, 'ground'], ['jumping', 1920, 'low'], ['turtle', 2160, 'ground']],
        stair: { x: 3200, steps: 4 },
        flag: 3440,
    },

    // ------------------------------------------------------------------
    //  2. The same rules, further apart. Wider pits, and bounce pads that
    //     throw you into the cloud line where the coins are.
    // ------------------------------------------------------------------
    {
        name: 'Cobalt Coast',
        blurb: 'Mind the gaps - bounce pads ahead',
        theme: 'coast',
        width: 4000,
        time: 300,
        ground: [[0, 720], [920, 560], [1680, 640], [2520, 480], [3160, 840]],
        solids: [
            ['low', 200, 160], ['low', 1000, 160], ['low', 1760, 200], ['low', 2600, 160],
            ['low', 3280, 160],
            ['mid', 400, 160], ['mid', 1240, 200], ['mid', 2000, 160], ['mid', 2800, 200],
            ['mid', 3400, 120],
        ],
        oneWay: [[280, 160], [1080, 200], [1840, 160], [2640, 200], [3360, 160]],
        blocks: [
            { x: 280, items: [['brick', null], ['question', 'mushroom'], ['brick', null]] },
            // On top of the ledge, not stacked on the pipe below it: a pipe
            // with a ledge and a block row over it walls off the ground route.
            { x: 1040, items: [['question', 'coin', 3], ['brick', null]] },
            { x: 1840, items: [['question', 'star'], ['brick', null]] },
            { x: 2560, items: [['brick', null], ['question', 'coin'], ['brick', null]] },
            { x: 3200, items: [['question', 'mushroom'], ['brick', null]] },
        ],
        springs: [[120, 'ground'], [2160, 'ground'], [2760, 'ground']],
        enemies: [
            ['normal', 220, 'low'], ['normal', 1100, 'ground'], ['turtle', 1800, 'low'],
            ['normal', 2000, 'ground'], ['jumping', 2700, 'ground'], ['turtle', 3300, 'low'],
            ['normal', 3400, 'ground'],
        ],
        portals: [['normal', 1200, 'ground'], ['jumping', 2560, 'ground'], ['turtle', 3480, 'ground']],
        stair: { x: 3600, steps: 4 },
        flag: 3840,
    },

    // ------------------------------------------------------------------
    //  3. Underground. The floor bites, rock pillars break up every run-up,
    //     and a kicked shell finally has walls to come back off.
    // ------------------------------------------------------------------
    {
        name: 'Crystal Caverns',
        blurb: 'Watch your footing',
        theme: 'cave',
        width: 4000,
        time: 280,
        ground: [[0, 600], [760, 880], [1800, 520], [2440, 720], [3320, 680]],
        solids: [
            ['low', 160, 160], ['low', 840, 200], ['low', 1880, 160], ['low', 2520, 200],
            ['low', 3400, 160],
            ['mid', 360, 160], ['mid', 1120, 200], ['mid', 2080, 160], ['mid', 2760, 200],
            ['mid', 3560, 120],
        ],
        oneWay: [[600, 160], [1440, 200], [2280, 160], [3040, 200]],
        walls: [[400, 2], [1200, 3], [2080, 2], [2880, 3], [3600, 2]],
        blocks: [
            { x: 240, items: [['brick', null], ['question', 'mushroom'], ['brick', null]] },
            { x: 1440, items: [['question', 'coin', 3], ['brick', null]] },
            { x: 2600, items: [['brick', null], ['question', 'star'], ['brick', null]] },
            { x: 3040, items: [['question', 'coin'], ['brick', null]] },
        ],
        hazards: [['spikes', 880, 120], ['spikes', 2160, 120], ['spikes', 3440, 80]],
        enemies: [
            ['turtle', 300, 'ground'], ['normal', 900, 'low'], ['turtle', 1300, 'ground'],
            ['jumping', 1900, 'ground'], ['normal', 2100, 'mid'], ['turtle', 2540, 'low'],
            ['normal', 3000, 'ground'], ['jumping', 3500, 'ground'],
        ],
        portals: [['turtle', 1080, 'ground'], ['normal', 2440, 'ground'], ['jumping', 3320, 'ground']],
        stair: { x: 3720, steps: 4 },
        flag: 3920,
    },

    // ------------------------------------------------------------------
    //  4. Almost no floor at all. Three chasms, crossed on platforms that
    //     will not wait for you.
    // ------------------------------------------------------------------
    {
        name: 'Skyward Steps',
        blurb: 'The floor is optional',
        theme: 'sky',
        width: 4400,
        time: 300,
        ground: [[0, 480], [1200, 320], [2400, 320], [3560, 840]],
        solids: [['low', 160, 160], ['low', 3680, 160], ['mid', 2480, 160]],
        oneWay: [
            [240, 160], [1240, 200], [2440, 200], [3760, 200],
            // The stepping stones across the three gaps.
            [560, 160, 'low'], [1560, 120, 'low'], [2040, 120, 'mid'],
            [2760, 160, 'low'], [3200, 160, 'low'],
        ],
        movers: [
            { x: 880, y: 'low', width: 120, axis: 'x', range: 120, speed: 1.2 },
            { x: 1800, y: 'mid', width: 120, axis: 'y', range: 100, speed: 0.9 },
            { x: 2240, y: 'low', width: 120, axis: 'x', range: 80, speed: 1.4, offset: 1 },
            { x: 3000, y: 'low', width: 120, axis: 'y', range: 120, speed: 1 },
            { x: 3480, y: 'low', width: 120, axis: 'x', range: 80, speed: 1.5 },
        ],
        blocks: [
            { x: 1240, items: [['question', 'mushroom'], ['brick', null]] },
            { x: 3640, items: [['brick', null], ['question', 'star'], ['brick', null]] },
        ],
        springs: [[320, 'ground'], [1360, 'ground'], [4000, 'ground']],
        enemies: [
            ['jumping', 300, 'ground'], ['jumping', 1300, 'ground'], ['normal', 2500, 'ground'],
            ['jumping', 3700, 'ground'], ['normal', 3900, 'ground'], ['turtle', 3980, 'ground'],
        ],
        portals: [['jumping', 1220, 'ground'], ['normal', 3880, 'ground']],
        stair: { x: 4040, steps: 4 },
        flag: 4280,
    },

    // ------------------------------------------------------------------
    //  5. Night, and nothing to grip. Momentum carries further than you
    //     mean it to, which is the whole level.
    // ------------------------------------------------------------------
    {
        name: 'Frostbite Pass',
        blurb: 'Slippery going',
        theme: 'ice',
        width: 4400,
        time: 300,
        grip: 0.35,
        ground: [[0, 720], [880, 680], [1720, 640], [2560, 720], [3440, 960]],
        solids: [
            ['low', 200, 160], ['low', 960, 200], ['low', 1800, 160], ['low', 2640, 200],
            ['low', 3520, 160],
            ['mid', 440, 160], ['mid', 1240, 200], ['mid', 2040, 200], ['mid', 2920, 160],
            ['mid', 3760, 160],
        ],
        oneWay: [[320, 160], [1120, 160], [1920, 200], [2760, 160], [3640, 200]],
        movers: [
            { x: 1440, y: 'low', width: 120, axis: 'x', range: 100, speed: 1.3 },
            { x: 2320, y: 'mid', width: 120, axis: 'y', range: 110, speed: 0.9 },
            { x: 3200, y: 'low', width: 160, axis: 'x', range: 120, speed: 1.5 },
        ],
        blocks: [
            { x: 280, items: [['brick', null], ['question', 'mushroom'], ['brick', null]] },
            { x: 1000, items: [['question', 'coin', 3], ['brick', null]] },
            { x: 1840, items: [['question', 'star'], ['brick', null]] },
            { x: 2200, items: [['brick', null], ['question', 'coin']] },
            { x: 2640, items: [['question', 'mushroom'], ['brick', null], ['question', 'coin']] },
        ],
        hazards: [['spikes', 600, 80], ['spikes', 2000, 120], ['spikes', 3000, 80]],
        springs: [[1160, 'ground'], [1960, 'ground'], [3720, 'ground']],
        enemies: [
            ['turtle', 300, 'ground'], ['normal', 1100, 'low'], ['turtle', 1300, 'ground'],
            ['jumping', 1900, 'ground'], ['normal', 2100, 'mid'], ['turtle', 2700, 'ground'],
            ['normal', 2900, 'ground'], ['jumping', 3600, 'ground'], ['turtle', 4000, 'ground'],
        ],
        portals: [['turtle', 1200, 'ground'], ['normal', 2600, 'ground'], ['jumping', 3800, 'ground']],
        stair: { x: 4040, steps: 4 },
        flag: 4280,
    },

    // ------------------------------------------------------------------
    //  6. The last one, and it uses everything: lava under every gap,
    //     spikes on the flat, and moving platforms over the worst of it.
    // ------------------------------------------------------------------
    {
        name: 'Castle Inferno',
        blurb: 'Do not fall',
        theme: 'castle',
        width: 4800,
        time: 280,
        ground: [[0, 600], [760, 520], [1440, 600], [2200, 480], [2840, 560], [3560, 1240]],
        solids: [
            ['low', 200, 160], ['low', 880, 160], ['low', 1520, 200], ['low', 2280, 160],
            ['low', 2920, 200], ['low', 3640, 160],
            ['mid', 400, 160], ['mid', 1160, 160], ['mid', 1800, 200], ['mid', 2560, 160],
            ['mid', 3200, 200], ['mid', 4000, 160],
        ],
        oneWay: [[280, 160], [1040, 200], [1880, 160], [2640, 200], [3400, 160], [4120, 160]],
        walls: [[1120, 2], [2480, 2], [3800, 3], [4200, 2]],
        movers: [
            { x: 640, y: 'low', width: 120, axis: 'x', range: 80, speed: 1.4 },
            { x: 2040, y: 'mid', width: 120, axis: 'y', range: 100, speed: 1 },
            { x: 3280, y: 'low', width: 160, axis: 'x', range: 120, speed: 1.6 },
        ],
        blocks: [
            { x: 240, items: [['brick', null], ['question', 'mushroom'], ['brick', null]] },
            { x: 1560, items: [['question', 'coin', 3], ['brick', null]] },
            { x: 2320, items: [['question', 'star'], ['brick', null]] },
            { x: 2960, items: [['brick', null], ['question', 'coin'], ['brick', null]] },
            { x: 3680, items: [['question', 'mushroom'], ['brick', null]] },
            { x: 4240, items: [['brick', null], ['question', 'coin'], ['brick', null]] },
        ],
        // 'lava' with no y fills the pit it is placed over.
        hazards: [
            ['lava', 600, 160], ['lava', 1280, 160], ['lava', 2040, 160],
            ['lava', 2680, 160], ['lava', 3400, 160],
            ['spikes', 1600, 80], ['spikes', 2960, 80], ['spikes', 4360, 120],
        ],
        springs: [[120, 'ground'], [1040, 'ground'], [2440, 'ground'], [4160, 'ground']],
        enemies: [
            ['normal', 300, 'ground'], ['jumping', 900, 'ground'], ['turtle', 1200, 'ground'],
            ['normal', 1600, 'ground'], ['jumping', 1850, 'mid'], ['turtle', 2280, 'low'],
            ['normal', 2560, 'ground'], ['jumping', 2900, 'ground'], ['turtle', 2920, 'low'],
            ['normal', 3700, 'ground'], ['jumping', 3900, 'ground'], ['turtle', 4300, 'ground'],
        ],
        portals: [['jumping', 1440, 'ground'], ['turtle', 2840, 'ground'], ['normal', 4080, 'ground']],
        stair: { x: 4480, steps: 5 },
        flag: 4720,
    },
];

/**
 * Which design a level number lands on, and which lap of the campaign it is.
 * Levels loop: finishing the castle sends you back to the hills, faster and
 * with less time on the clock. Multiplayer always builds the first design, so
 * every player in a session is standing in the same world.
 */
function levelPlan(level = gameState.level) {
    if (multiplayerState.connected) {
        // The round counter decides the world, so every client in the session
        // is standing in the same one. Before the first snapshot lands there is
        // nothing to go on, and the hills are as good a guess as any.
        const spot = roundDesign(multiplayerState.round ? multiplayerState.round.index : 0);
        return {
            design: spot.design,
            index: spot.index,
            lap: spot.lap,
            label: `${spot.lap}-${spot.index + 1}`,
        };
    }
    const index = (level - 1) % LEVELS.length;
    const lap = Math.floor((level - 1) / LEVELS.length) + 1;
    return { design: LEVELS[index], index, lap, label: `${lap}-${index + 1}` };
}

// The name shown in the HUD and on the game over screen: 1-1, 1-2, ... 2-1.
function worldLabel(level = gameState.level) {
    return levelPlan(level).label;
}

function buildGround(design) {
    for (const [x, width] of design.ground) {
        platforms.push(new Platform(x, GROUND_Y, width, GROUND_DEPTH, 'ground'));
    }
}

function buildStaircase(startX, steps) {
    for (let i = 0; i < steps; i++) {
        for (let j = 0; j <= i; j++) {
            blocks.push(new Block(startX + i * GRID, GROUND_Y - (j + 1) * GRID, 'solid'));
        }
    }
}

// A column of solid blocks standing on the ground - something to climb, or to
// bounce a kicked shell off.
function buildWall(x, blocksTall) {
    for (let i = 1; i <= blocksTall; i++) {
        blocks.push(new Block(x, GROUND_Y - i * GRID, 'solid'));
    }
}

function buildCoinArc(centerX, baseY, count, spacing = 34) {
    const start = centerX - ((count - 1) * spacing) / 2;
    for (let i = 0; i < count; i++) {
        // A gentle arch, the way coin trails sit over a jump
        const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
        const lift = (1 - t * t) * 34;
        addCoin(start + i * spacing, baseY - lift);
    }
}

let coinIndex = 0;
function addCoin(x, y) {
    coins.push(new Coin(x, y, coinIndex++));
}

function initLevel() {
    const plan = levelPlan();
    const design = plan.design;

    // Use multiplayer color if connected
    const playerColor = multiplayerState.connected ? multiplayerState.playerColor : PLAYER_COLORS[0];
    const keptContinue = player ? player.hasUsedContinue : false;

    player = new Player(80, GROUND_Y - 120, playerColor);
    player.hasUsedContinue = keptContinue;

    enemies = [];
    coins = [];
    platforms = [];
    portals = [];
    blocks = [];
    powerUps = [];
    particles = [];
    floatingTexts = [];
    hazards = [];
    springs = [];
    movers = [];
    flagpole = null;
    coinIndex = 0;

    // Everything about the setting comes from the design: how wide the world
    // is, how long you have, what it looks like, how well you can stand up in
    // it, and what is playing while you do.
    theme = THEMES[design.theme] || THEMES.overworld;
    CONFIG.WORLD_WIDTH = design.width;
    CONFIG.LEVEL_TIME = design.time;
    CONFIG.surfaceGrip = design.grip === undefined ? 1 : design.grip;
    gameState.levelName = design.name;
    gameState.worldLabel = plan.label;
    music.setTrack(theme.track);

    gameState.camera = { x: 0, y: 0 };
    gameState.screenShake = { intensity: 0, duration: 0, maxDuration: 0 };
    gameState.levelCleared = false;
    // Later laps of the campaign are tighter on time as well as quicker.
    gameState.levelTime = Math.max(180, CONFIG.LEVEL_TIME - (plan.lap - 1) * 30);
    gameState.time = gameState.levelTime;
    gameState.timeTicker = 0;

    // Enemies get a little quicker each level, and the climb carries across
    // laps - but it is capped, so lap five is hard rather than impossible.
    CONFIG.enemySpeedScale = Math.min(1.9, 1 + (gameState.level - 1) * 0.07);

    // The parallax backdrop is sized to the world, so it has to be rebuilt
    // whenever the world changes size.
    initClouds();

    buildGround(design);

    for (const [tier, x, width] of design.solids || []) {
        platforms.push(new Platform(x, tierY(tier), width, PLATFORM_THICKNESS, 'brick'));
    }
    for (const [x, width, tier] of design.oneWay || []) {
        platforms.push(new Platform(x, tierY(tier || 'high'), width, CLOUD_THICKNESS, 'cloud'));
    }
    for (const spec of design.movers || []) {
        const mover = new MovingPlatform(spec.x, tierY(spec.y), spec.width, spec);
        platforms.push(mover);
        movers.push(mover);
    }

    for (const [x, blocksTall] of design.walls || []) {
        buildWall(x, blocksTall);
    }

    for (const row of design.blocks || []) {
        const rowY = row.y === undefined ? BLOCK_ROW_Y : tierY(row.y);
        row.items.forEach(([type, contents, count], i) => {
            blocks.push(new Block(row.x + i * GRID, rowY, type, contents, count || 1));
        });
    }

    for (const [variant, x, width, y] of design.hazards || []) {
        if (variant === 'lava') {
            // Lava fills the chasm it is placed over, with a lip showing above
            // the ground line so you can see what you are jumping across.
            hazards.push(new Hazard(x, y === undefined ? GROUND_Y - 10 : y, width, 80, 'lava'));
        } else {
            hazards.push(new Hazard(x, y === undefined ? GROUND_Y - 20 : y, width, 20, 'spikes'));
        }
    }

    for (const [x, tier] of design.springs || []) {
        springs.push(new Spring(x, tierY(tier || 'ground')));
    }

    // Staircase up to the goal, like the run-in at the end of a Mario level
    if (design.stair) buildStaircase(design.stair.x, design.stair.steps);

    for (const [type, x, tier] of design.portals || []) {
        portals.push(new Portal(x, tierY(tier) - CONFIG.PORTAL_HEIGHT, type));
    }

    // In multiplayer the spawn master fills the level through the portals.
    if (!multiplayerState.connected) {
        const roster = design.enemies || [];
        for (const [type, x, tier] of roster) {
            enemies.push(createEnemy(type, x, tierY(tier) - CONFIG.ENEMY_SIZE));
        }

        // From the second lap on, the level gets reinforcements. They double up
        // on positions the design already vouches for, so nothing lands in a
        // wall or over a pit.
        const extra = Math.min(4, (plan.lap - 1) * 2);
        for (let i = 0; i < extra && roster.length; i++) {
            const [, x, tier] = roster[(i * 3) % roster.length];
            enemies.push(createEnemy(i % 2 ? 'turtle' : 'jumping', x, tierY(tier) - CONFIG.ENEMY_SIZE));
        }

        flagpole = new Flagpole(design.flag, GROUND_Y);
    }

    buildCoins(design);

    // Which round this level was built for, so a snapshot that only confirms
    // the world we are already standing in does not rebuild it underneath us.
    gameState.roundIndexBuilt = multiplayerState.round ? multiplayerState.round.index : null;

    // Number the ledges for territory. The level is built from data in a fixed
    // order and without a single Math.random, so this index is the same on
    // every client - which is what lets a tile be identified across the network
    // by nothing more than its position in this array.
    indexTerritory();

    updateCamera(true);
    updateHUD();
}

function buildCoins(design) {
    // Coins are placed off the level as built rather than off the data, so a
    // new platform anywhere - moving ones included - is paid for automatically.
    for (const platform of platforms) {
        if (platform.variant === 'ground') continue;

        if (platform.oneWay) {
            // A line along the top of every one-way ledge
            const count = Math.max(1, Math.floor(platform.width / 32) - 1);
            for (let i = 0; i < count; i++) {
                addCoin(platform.x + 26 + i * 32, platform.y - 46);
            }
        } else {
            // An arc floating above everything you can stand on. Moving
            // platforms are paid over the middle of their run.
            const home = platform.homeX === undefined ? platform.x : platform.homeX;
            const homeY = platform.homeY === undefined ? platform.y : platform.homeY;
            buildCoinArc(home + platform.width / 2, homeY - 70, 5);
        }
    }

    // Rewards for clearing each pit - but only the ones you cross in one jump.
    // A chasm bridged by platforms already pays out through them.
    const ground = design.ground;
    for (let i = 0; i < ground.length - 1; i++) {
        const gapStart = ground[i][0] + ground[i][1];
        const gapEnd = ground[i + 1][0];
        if (gapEnd - gapStart > 300) continue;
        buildCoinArc((gapStart + gapEnd) / 2, GROUND_Y - 120, 3, 40);
    }

    // A row over each block row, so bumping them is on the way to something
    for (const row of design.blocks || []) {
        const rowY = row.y === undefined ? BLOCK_ROW_Y : tierY(row.y);
        addCoin(row.x + (row.items.length * GRID) / 2 - CONFIG.COIN_SIZE / 2, rowY - 60);
    }

    // Anything the design asks for by hand
    for (const trail of design.coins || []) {
        buildCoinArc(trail.x, trail.y, trail.count, trail.spacing || 34);
    }
}

// ============================================================================
//  HUD
// ============================================================================

const hud = {};
function cacheHudElements() {
    ['score', 'coins', 'lives', 'level', 'time', 'combo'].forEach(id => {
        hud[id] = document.getElementById(id);
    });
    // The clock's caption changes with the mode - "Time" on a level timer,
    // "Round" or "Next" on the shared multiplayer clock.
    hud.timeLabel = document.getElementById('time-label');
    hud.mode = document.getElementById('round-mode');
}
cacheHudElements();

/**
 * The clock in the HUD, and whether it should be shouting. Single player counts
 * the level timer down in bare seconds. Multiplayer shows the shared round
 * clock, and once the round is settled it counts down to the next world
 * instead, so the wait is never dead air.
 *
 * Returns true when the reading is urgent enough to highlight.
 */
function updateClockDisplay() {
    const setLabel = (text) => { if (hud.timeLabel) hud.timeLabel.textContent = text; };

    if (!multiplayerState.connected) {
        hud.time.textContent = Math.max(0, Math.ceil(gameState.time));
        setLabel('Time');
        return gameState.time <= 60;
    }

    const view = roundView();
    if (!view) {
        // Connected, but the first round snapshot has not arrived yet.
        hud.time.textContent = '--';
        setLabel('Round');
        return false;
    }

    if (view.phase === ROUND_PHASE.ACTIVE) {
        hud.time.textContent = formatClock(view.remainingMs);
        setLabel('Round');
        return view.remainingMs <= ROUND.URGENT_MS;
    }

    hud.time.textContent = view.phase === ROUND_PHASE.INTERMISSION
        ? formatClock(view.remainingMs)
        : '0:00';
    setLabel('Next');
    return false;
}

function updateHUD() {
    if (hud.score) hud.score.textContent = gameState.score;
    if (hud.coins) hud.coins.textContent = gameState.coins;
    if (hud.lives) hud.lives.textContent = Math.max(0, gameState.lives);
    if (hud.level) hud.level.textContent = gameState.worldLabel || worldLabel();
    if (hud.time) {
        hud.time.parentElement.classList.toggle('urgent', updateClockDisplay());
    }
    if (hud.mode) {
        // Only shown when it is not the default game, so the HUD does not carry
        // a chip saying "Score attack" through every ordinary round.
        const territory = isTerritoryRound();
        hud.mode.parentElement.classList.toggle('hidden', !territory);
        if (territory) hud.mode.textContent = `Territory ${Math.round(myTerritoryShare() * 100)}%`;
    }

    if (hud.combo) {
        const active = player && player.combo > 1;
        hud.combo.parentElement.classList.toggle('hidden', !active);
        if (active) hud.combo.textContent = player.combo + 'x';
    }
}

/**
 * Shows or hides a full-screen menu. Also flags the body so the HUD and touch
 * pad get out of the way - they used to sit on top of the start screen.
 */
function setScreenVisible(id, visible) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !visible);
    document.body.classList.toggle('menu-open', !!document.querySelector('.screen:not(.hidden)'));
}

function showBanner(title, subtitle = '', duration = 2200) {
    const banner = document.getElementById('banner');
    if (!banner) return;
    banner.querySelector('.banner-title').textContent = title;
    banner.querySelector('.banner-subtitle').textContent = subtitle;
    banner.classList.remove('hidden');
    clearTimeout(showBanner.timer);
    showBanner.timer = setTimeout(() => banner.classList.add('hidden'), duration);
}

// ============================================================================
//  LEVEL FLOW
// ============================================================================

function levelComplete(grabHeight = 0.5) {
    if (gameState.levelCleared) return;
    gameState.levelCleared = true;

    const heightBonus = Math.round(1000 + grabHeight * 4000);
    const timeBonus = Math.max(0, Math.floor(gameState.time)) * 50;
    gameState.score += heightBonus + timeBonus;
    updateHUD();

    player.controlLock = 600;
    player.velocityX = 0;
    sounds.levelComplete();
    haptics.success();
    music.stop();

    createFloatingText(player.x + player.width / 2, player.y - 30, `+${heightBonus}`, '#FFD700', 26);
    showBanner(`${gameState.worldLabel} ${gameState.levelName} - Clear!`, `Time bonus +${timeBonus}`, 2600);

    for (let i = 0; i < 40; i++) {
        setTimeout(() => {
            createParticles(
                player.x + (Math.random() - 0.5) * 200,
                player.y - Math.random() * 120,
                6,
                ['#FFD700', '#FF6B6B', '#4ECDC4', '#6BCF7F'][i % 4]
            );
        }, i * 40);
    }

    setTimeout(() => {
        if (!gameState.running) return;
        const wasLap = levelPlan().lap;
        gameState.level++;
        gameState.lives++; // A life for finishing the level
        initLevel();

        const plan = levelPlan();
        if (plan.lap > wasLap) {
            // Round the campaign and back to the start, but not as it was.
            showBanner(`Lap ${plan.lap}!`, 'Same worlds, meaner', 2400);
        } else {
            showBanner(`${plan.label}  ${plan.design.name}`, plan.design.blurb, 1900);
        }
        music.start();
    }, 2800);
}

function timeUp() {
    gameState.time = 0;
    showBanner('Time Up!', '', 1800);
    player.health = 1;
    player.startDeath();
    gameState.time = gameState.levelTime;
}

// ============================================================================
//  MULTIPLAYER ROUND FLOW
// ============================================================================

/**
 * Which world a round counter lands on, and which lap of the six it is. The
 * counter only ever goes up, so round 7 is the hills again on lap 2.
 */
function roundDesign(counter) {
    const safe = Math.max(0, Math.floor(counter || 0));
    const index = safe % LEVELS.length;
    return { design: LEVELS[index], index, lap: Math.floor(safe / LEVELS.length) + 1 };
}

/**
 * Where the shared clock has got to. Every client works this out from the one
 * timestamp in the round node, so nobody has to broadcast "the round ended" -
 * and a client that joins halfway through gets the right world with the right
 * time left on it without any catch-up traffic at all.
 *
 * Returns null until the first snapshot arrives.
 */
function roundView(now) {
    const round = multiplayerState.round;
    if (!round) return null;

    const at = now === undefined ? multiplayer.serverNow() : now;
    const elapsed = at - round.startedAt;

    if (elapsed < round.duration) {
        return {
            phase: ROUND_PHASE.ACTIVE,
            index: round.index,
            // A startedAt in the future - a clock that has drifted since the
            // offset was last read - would otherwise show more time left than
            // the round has.
            remainingMs: Math.min(round.duration, round.duration - elapsed),
        };
    }

    const intoBreak = elapsed - round.duration;
    if (intoBreak < ROUND.INTERMISSION_MS) {
        return {
            phase: ROUND_PHASE.INTERMISSION,
            index: round.index,
            remainingMs: ROUND.INTERMISSION_MS - intoBreak,
        };
    }

    return { phase: ROUND_PHASE.EXPIRED, index: round.index, remainingMs: 0 };
}

// ---------------------------------------------------------------------------
//  TERRITORY
// ---------------------------------------------------------------------------

/**
 * Numbers every ledge in the level. The tile id is simply the platform's
 * position in the array, which works as a network identity only because levels
 * are built from data in a fixed order with no randomness anywhere in the
 * layout - so every client numbers them identically without agreeing on
 * anything first.
 *
 * The ground is never capturable. See the note on TERRITORY.
 */
function indexTerritory() {
    let count = 0;
    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        platform.tileId = i;
        platform.capturable = platform.variant !== 'ground';
        if (platform.capturable) count++;
    }
    territoryState.tileCount = count;
    territoryState.dirty = true;
}

function tileKey(tileId) {
    return `tile_${tileId}`;
}

function tileIdFromKey(key) {
    const id = Number.parseInt(String(key).replace('tile_', ''), 10);
    return Number.isInteger(id) ? id : null;
}

// The palette to paint a tile in. Remembered per uid rather than looked up from
// the live player list, so a player who quits mid-round leaves their colour on
// the board rather than having their ledges turn grey.
function territoryPalette(uid) {
    if (!uid) return null;
    if (uid === multiplayerState.playerId) return multiplayerState.playerColor || PLAYER_COLORS[0];

    const remembered = territoryState.colors.get(uid);
    if (remembered) return remembered;

    const live = multiplayerState.remotePlayers.get(uid);
    return (live && live.color) || null;
}

function territoryOwnerOf(platform) {
    if (!platform || !platform.capturable) return null;
    return territoryState.owners.get(platform.tileId) || null;
}

/**
 * How the map is split up, best share first. Recomputed only when ownership
 * actually changes - this is read every frame by the HUD, and counting tiles
 * sixty times a second to produce the same answer is waste.
 */
function territoryShares() {
    if (!territoryState.dirty) return territoryState.shares;
    territoryState.dirty = false;

    const counts = new Map();
    territoryState.owners.forEach((uid, tileId) => {
        // Ownership can outlive a rebuild by a few frames, so ignore anything
        // that is not a tile in the level currently standing.
        const platform = platforms[tileId];
        if (!platform || !platform.capturable) return;
        counts.set(uid, (counts.get(uid) || 0) + 1);
    });

    const total = territoryState.tileCount || 1;
    const shares = [];
    counts.forEach((tiles, uid) => {
        const isSelf = uid === multiplayerState.playerId;
        const live = multiplayerState.remotePlayers.get(uid);
        shares.push({
            id: uid,
            name: isSelf
                ? (multiplayerState.playerName || 'You')
                : (live ? live.name : 'Left'),
            isSelf,
            tiles,
            share: tiles / total,
            palette: territoryPalette(uid),
        });
    });

    shares.sort((a, b) => b.tiles - a.tiles || String(a.name).localeCompare(String(b.name)));
    territoryState.shares = shares;
    return shares;
}

function myTerritoryShare() {
    const mine = territoryShares().find(entry => entry.isSelf);
    return mine ? mine.share : 0;
}

function myTerritoryTiles() {
    const mine = territoryShares().find(entry => entry.isSelf);
    return mine ? mine.tiles : 0;
}

function setTileOwner(tileId, uid) {
    if (tileId === null) return;

    const before = territoryState.owners.get(tileId) || null;
    if (before === (uid || null)) return;

    if (uid) territoryState.owners.set(tileId, uid);
    else territoryState.owners.delete(tileId);
    territoryState.dirty = true;

    // The map changing is the only thing that moves a territory board, and
    // player position updates - which drive the score board - say nothing about
    // it. The board's own signature check stops this rebuilding the DOM when
    // the standings have not actually moved.
    if (multiplayerState.connected) multiplayer.updateLeaderboard();
}

/**
 * Take the ledge under your feet. Called every frame the player is standing on
 * something, not just on the landing frame, so walking from one ledge to the
 * next takes the second one too - "last touched" means touched, not landed on.
 * It short-circuits on tiles we already hold, which is what keeps standing
 * still from being a write every frame.
 */
function claimGround(surface) {
    if (!surface || !surface.capturable) return;
    if (!multiplayerState.connected || !isTerritoryRound()) return;
    if (roundIsSettled()) return;
    if (!player || player.outOfLives || player.dying) return;

    const held = territoryState.owners.get(surface.tileId);
    if (held === multiplayerState.playerId) return;

    // Taking a ledge off somebody is worth more than colouring in a loose one.
    if (held) {
        gameState.score += TERRITORY.STEAL_POINTS;
        createFloatingText(
            surface.x + surface.width / 2,
            surface.y - 18,
            `+${TERRITORY.STEAL_POINTS}`,
            '#FFFFFF',
            16
        );
    }

    // Applied locally first: the paint should land under your feet on the frame
    // you touch it, not a round trip later.
    setTileOwner(surface.tileId, multiplayerState.playerId);
    createSparkle(surface.x + surface.width / 2, surface.y - 6, '#FFFFFF');
    multiplayer.claimTile(surface.tileId);
}

/**
 * Holding pays. Without this the whole game is one fast lap at the death -
 * last touch wins, so whoever laps last takes everything and the previous two
 * minutes were decoration. Paying per second held makes defending a corner of
 * the map worth as much as sprinting round it, which is also what gives
 * stomping somebody off their ledge a point.
 */
function payTerritoryHolders(now) {
    if (now - territoryState.lastPaidAt < 1000) return;
    territoryState.lastPaidAt = now;

    const tiles = myTerritoryTiles();
    if (!tiles) return;

    gameState.score += tiles * TERRITORY.HOLD_POINTS_PER_TILE;
}

/**
 * Which game a round counter plays. Derived rather than stored: same counter,
 * same answer on every client, with no field to validate or keep in step.
 *
 * The lap is folded in because there is an even number of worlds. A plain
 * `counter % 2` would pin each world to one game forever - Green Hills score
 * attack, Cobalt Coast territory, for all eternity - so the shift makes every
 * world alternate between the two as the campaign comes round again.
 */
function roundMode(counter) {
    const safe = Math.max(0, Math.floor(counter || 0));
    const lapShift = Math.floor(safe / LEVELS.length);
    return (safe + lapShift) % 2 === 0 ? ROUND_MODES.SCORE : ROUND_MODES.TERRITORY;
}

// The game being played right now. Single player is never a territory round.
function currentRoundMode() {
    if (!multiplayerState.connected || !multiplayerState.round) return ROUND_MODES.SCORE;
    return roundMode(multiplayerState.round.index);
}

function isTerritoryRound() {
    return currentRoundMode() === ROUND_MODES.TERRITORY;
}

// True once the whistle has blown and the world is waiting on the next one.
function roundIsSettled() {
    const view = roundView();
    return !!view && view.phase !== ROUND_PHASE.ACTIVE;
}

// m:ss. The single-player clock counts bare seconds, but a round is minutes
// long and "150" does not read as two and a half minutes at a glance.
function formatClock(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Everyone in the session, ourselves included, best score first. Ties break on
 * name so the board reads the same on every screen rather than falling out of
 * whatever order the players arrived in.
 */
function roundStandings() {
    const board = [{
        id: multiplayerState.playerId,
        name: multiplayerState.playerName || 'You',
        score: gameState.score,
        isSelf: true,
    }];

    multiplayerState.remotePlayers.forEach((data, id) => {
        board.push({
            id,
            name: data.name || 'Player',
            score: data.score || 0,
            isSelf: false,
        });
    });

    board.sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)));
    return board;
}

/**
 * The whistle. Freezes the standings, says who took the world, and holds
 * everyone safe while the board is up - a turtle wandering into you during the
 * intermission would be a death you were given no way to avoid.
 */
function settleRound() {
    const territory = isTerritoryRound();
    const standings = territory ? territoryShares() : roundStandings();
    multiplayerState.roundResult = standings;

    const winner = standings[0];

    // A territory round is won on the map, not on the scoreboard - but the
    // scoreboard is the one currency the session and the all-time table share,
    // so the final share is paid out into it.
    if (territory) {
        const mine = standings.find(entry => entry.isSelf);
        if (mine) {
            const bonus = Math.round(mine.share * TERRITORY.WIN_BONUS);
            if (bonus > 0) {
                gameState.score += bonus;
                createFloatingText(
                    player.x + player.width / 2, player.y - 30,
                    `+${bonus}`, '#FFD700', 24
                );
            }
        }
    }

    // A visible separator, not spaces: the banner is HTML, so runs of
    // whitespace collapse and the places run into one another.
    const podium = standings.slice(0, 3)
        .map((entry, i) => territory
            ? `${i + 1}. ${entry.name} ${Math.round(entry.share * 100)}%`
            : `${i + 1}. ${entry.name} ${entry.score}`)
        .join('  ·  ');

    if (winner && winner.isSelf && standings.length > 1) {
        sounds.levelComplete();
        haptics.success();
    }

    const plan = levelPlan();
    showBanner(
        `${plan.design.name} - ${winner ? winner.name : 'nobody'} takes it`,
        podium,
        ROUND.INTERMISSION_MS
    );

    // tick() freezes the world for the duration, so there is nothing to
    // protect the player from here - only a stride to tidy up, so the freeze
    // frame is not caught mid-run.
    if (player) player.velocityX = 0;
}

/**
 * A new world has been opened by the spawn master. Everyone rebuilds against
 * it - the round node is the only thing that decides which level is standing.
 */
function onRoundStarted(previous) {
    multiplayerState.roundPhaseSeen = ROUND_PHASE.ACTIVE;
    multiplayerState.roundResult = null;

    // Territory belongs to the world it was painted on. The spawn master clears
    // the shared copy; this is the local one, cleared straight away so the new
    // world does not open wearing the last one's colours for a second.
    territoryState.owners.clear();
    territoryState.shares = [];
    territoryState.dirty = true;
    territoryState.lastPaidAt = multiplayer.serverNow();

    if (!gameState.running || !multiplayerState.connected) return;

    // A round boundary is an amnesty: anyone who ran out of lives is back in
    // for the new world rather than watching it from the out-of-lives screen.
    if (player && player.outOfLives) {
        clearCountdowns();
        setScreenVisible('out-of-lives-screen', false);
        gameState.lives = Math.max(gameState.lives, 3);
    }

    // startGame() builds a level before the first snapshot can arrive, so the
    // first round usually finds the right world already standing.
    if (gameState.roundIndexBuilt !== multiplayerState.round.index) {
        initLevel();
    }

    // initLevel() builds a fresh player, so the grace period has to be granted
    // here rather than at the whistle - the object it was set on is gone.
    if (player) player.setInvulnerable(true, 2500);

    // The two boards share a panel, and a round can swap which one is showing.
    // Position updates would get round to it, but only once somebody moves.
    multiplayerState.lastLeaderboardSignature = '';
    multiplayer.updateLeaderboard();

    const plan = levelPlan();
    const label = previous
        ? `Round ${multiplayerState.round.index + 1}  ${plan.design.name}`
        : plan.design.name;
    // Not the level's own blurb: those tell a solo player to reach the flag,
    // and there is no flag here. The round is the objective, so it says which
    // round this is.
    const clock = formatClock(multiplayerState.round.duration);
    showBanner(label, isTerritoryRound()
        ? `Territory - ${clock} - paint the ledges`
        : `Score attack - ${clock} - highest score takes it`, 2200);
    music.start();
}

/**
 * Drives the round clock forward once per tick. The phase is derived, not
 * stored, so this only has to notice when it changes and act once.
 */
function updateRound() {
    const view = roundView();
    if (!view) return;

    if (view.phase !== multiplayerState.roundPhaseSeen) {
        if (view.phase === ROUND_PHASE.INTERMISSION) settleRound();
        multiplayerState.roundPhaseSeen = view.phase;
    }

    if (view.phase === ROUND_PHASE.ACTIVE && isTerritoryRound()) {
        payTerritoryHolders(multiplayer.serverNow());
    }

    if (view.phase !== ROUND_PHASE.EXPIRED || !multiplayerState.isSpawnMaster) return;

    // Only the master opens the next world, and a failed write should not be
    // retried sixty times a second while the network is down.
    const now = Date.now();
    if (now - (multiplayerState.lastAdvanceAttempt || 0) < 1000) return;
    multiplayerState.lastAdvanceAttempt = now;
    multiplayer.advanceRound(view.index);
}

// ============================================================================
//  SIMULATION TICK
// ============================================================================

/**
 * Moves whatever is standing on a moving platform along with it. A rider that
 * would be shoved into a wall is left behind instead - being carried into
 * solid rock and stuck there is worse than sliding off the end.
 */
function carryRiders() {
    const riders = [player, ...enemies];

    for (const rider of riders) {
        const ride = rider && rider.ridingPlatform;
        if (!ride || (!ride.dx && !ride.dy)) continue;
        if (rider.dying || rider.outOfLives) continue;

        const moved = {
            x: rider.x + ride.dx,
            y: rider.y + ride.dy,
            width: rider.width,
            height: rider.height,
        };
        const blocked = solidCache.some(solid =>
            solid !== ride && !solid.oneWay && overlaps(moved, solid));
        if (blocked) {
            rider.ridingPlatform = null;
            continue;
        }

        rider.x = moved.x;
        rider.y = moved.y;
    }
}

function tick() {
    rebuildSolids();

    // The round clock is read before anything moves, so the whistle takes
    // effect on the same frame it blows rather than a frame late.
    if (multiplayerState.connected) updateRound();

    // Between rounds the whole world holds still while the standings are up.
    // Locking the controls alone is not enough: a player left airborne over a
    // pit when the whistle blew would fall into it, and a pit kills whatever
    // your health and invulnerability say.
    const roundBreak = multiplayerState.connected && roundIsSettled();

    // Moving platforms go first, and take their passengers with them, so the
    // player's own step below starts from a position that is already correct.
    if (!roundBreak) {
        movers.forEach(mover => mover.update());
        if (movers.length) carryRiders();
    }

    blocks.forEach(block => block.update());
    if (!(player.dying && !multiplayerState.connected) && !roundBreak) {
        portals.forEach(portal => portal.update());
    }

    // The player moves first so every collision below reads a current position.
    if (!roundBreak) player.update();

    // While the player is dying the level holds its breath, the way it does
    // in the games this is modelled on. Multiplayer keeps running because the
    // world there belongs to everyone, not just to whoever just died - except
    // between rounds, when it belongs to nobody.
    const frozen = (player.dying && !multiplayerState.connected) || roundBreak;

    if (!frozen) {
        enemies.forEach(enemy => enemy.update());
        powerUps.forEach(item => item.update());
        coins.forEach(coin => coin.update());
        springs.forEach(spring => spring.update());
        hazards.forEach(hazard => hazard.update());
        if (flagpole) flagpole.update();
    } else {
        // Lava keeps rolling while the world holds its breath - a still pool
        // during a death animation looks like the game has frozen.
        hazards.forEach(hazard => { hazard.animation += 0.05; });
    }

    powerUps = powerUps.filter(item => !item.collected);

    // Drop single-player enemies that have finished their death animation and
    // have no respawn queued, so the array cannot grow without bound.
    if (!multiplayerState.connected) {
        enemies = enemies.filter(e => e.alive || e.deathTimer > 0 || e.respawnTime);
    }

    updateCamera();
    updateParticles();
    updateFloatingTexts();

    // Countdown timer (single player only)
    if (!multiplayerState.connected && !gameState.levelCleared && !player.dying) {
        gameState.timeTicker++;
        if (gameState.timeTicker >= CONFIG.TIME_TICK_FRAMES) {
            gameState.timeTicker = 0;
            gameState.time--;
            if (gameState.time === 60) {
                showBanner('Hurry Up!', '', 1200);
                playSound(880, 0.15, 'square', 0.2);
            }
            if (gameState.time <= 0) timeUp();
            updateHUD();
        }
    }

    // Sync player position and health to Firebase (throttled)
    if (multiplayerState.connected) {
        multiplayer.syncPlayerPosition(player.x, player.y, player.direction, player.health, player.invulnerable, player.outOfLives);
        multiplayer.interpolateRemotePlayers();
    }

    updateHUD();
}

// ============================================================================
//  RENDERING
// ============================================================================

function render() {
    ctx.clearRect(0, 0, view.w, view.h);

    drawBackground();

    platforms.forEach(platform => platform.draw());
    portals.forEach(portal => portal.draw());
    blocks.forEach(block => block.draw());
    springs.forEach(spring => spring.draw());
    if (flagpole) flagpole.draw();

    coins.forEach(coin => coin.draw());
    powerUps.forEach(item => item.draw());
    enemies.forEach(enemy => enemy.draw());

    // Remote players render behind the local player so you never lose yourself
    if (multiplayerState.connected && multiplayerState.remotePlayers.size > 0) {
        multiplayerState.remotePlayers.forEach(playerData => drawRemotePlayer(playerData));
    }

    if (player.outOfLives) {
        drawGraveMarker(player.deathX, player.deathY);
    } else {
        player.draw();
    }

    // Lava and spikes sit in front of everything that can fall into them, so
    // the glow reads over the top of a body dropping through it.
    hazards.forEach(hazard => hazard.draw());

    drawParticles();
    drawFloatingTexts();
    drawGoalArrow();

    if (gameState.paused) drawPauseVeil();
}

// A subtle arrow pointing at the flagpole once you are close to the end.
function drawGoalArrow() {
    if (!flagpole || gameState.levelCleared) return;
    const distance = flagpole.x - (player.x + player.width);
    if (distance < 0 || distance > 1400) return;
    if (flagpole.x - gameState.camera.x < view.w) return;

    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    const y = view.h * 0.28 + Math.sin(Date.now() / 300) * 5;
    ctx.beginPath();
    ctx.moveTo(view.w - 26, y);
    ctx.lineTo(view.w - 46, y - 11);
    ctx.lineTo(view.w - 46, y + 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 11px "Trebuchet MS", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(distance)}m`, view.w - 52, y + 4);
    ctx.restore();
}

function drawPauseVeil() {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 14, 30, 0.55)';
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.restore();
}

// ---------------------------------------------------------------------------
//  Parallax backdrop
// ---------------------------------------------------------------------------

let cloudPositions = [];
let hillPositions = [];
let bushPositions = [];

function initClouds() {
    cloudPositions = [];
    hillPositions = [];
    bushPositions = [];

    // Deterministic layout so every player in a session sees the same world.
    let seed = 1337;
    const rand = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };

    for (let i = 0; i < 22; i++) {
        cloudPositions.push({
            x: rand() * CONFIG.WORLD_WIDTH,
            y: rand() * 180 + 20,
            scale: rand() * 0.6 + 0.6,
            speed: rand() * 0.08 + 0.03,
        });
    }

    for (let i = 0; i < 16; i++) {
        hillPositions.push({
            x: i * 320 + rand() * 120,
            scale: rand() * 0.5 + 0.8,
            far: i % 2 === 0,
        });
    }

    for (let i = 0; i < 30; i++) {
        bushPositions.push({
            x: i * 160 + rand() * 90,
            scale: rand() * 0.45 + 0.7,
        });
    }
}

function drawBackground() {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, view.h);
    sky.addColorStop(0, theme.sky[0]);
    sky.addColorStop(0.45, theme.sky[1]);
    sky.addColorStop(1, theme.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, view.w, view.h);

    drawSkyLight();

    switch (theme.backdrop) {
        case 'hills': drawMountains(); break;
        case 'peaks': drawMountains(true); break;
        case 'cave': drawCaveWalls(); break;
        case 'pillars': drawCastlePillars(); break;
        default: break;
    }

    if (theme.clouds) drawClouds();
    drawScenery();

    // Everything below the ground line is dark earth. Ground segments paint
    // over it, so the gaps between them read as real chasms rather than a
    // window onto the sky.
    const undergroundY = GROUND_Y - gameState.camera.y;
    if (undergroundY < view.h) {
        const depths = ctx.createLinearGradient(0, undergroundY, 0, view.h);
        depths.addColorStop(0, theme.deep[0]);
        depths.addColorStop(1, theme.deep[1]);
        ctx.fillStyle = depths;
        ctx.fillRect(0, undergroundY, view.w, view.h - undergroundY);
    }
}

// Whatever is lighting this world: a sun, a winter moon, or the glow of
// something molten off-screen.
function drawSkyLight() {
    const light = theme.light;
    if (!light || light.kind === 'none') return;

    if (light.kind === 'ember') {
        // No disc - just heat rising from below the horizon.
        const glowY = view.h * 0.9;
        const heat = ctx.createRadialGradient(view.w / 2, glowY, 20, view.w / 2, glowY, view.w * 0.8);
        heat.addColorStop(0, light.core);
        heat.addColorStop(0.5, light.halo);
        heat.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = heat;
        ctx.fillRect(0, 0, view.w, view.h);
        return;
    }

    const x = view.w * 0.78 - gameState.camera.x * 0.03;
    const y = view.h * 0.16 - gameState.camera.y * 0.05;
    const glow = ctx.createRadialGradient(x, y, 6, x, y, 90);
    glow.addColorStop(0, light.core);
    glow.addColorStop(0.25, light.halo);
    glow.addColorStop(1, 'rgba(255, 236, 139, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 90, 0, Math.PI * 2);
    ctx.fill();

    if (light.kind === 'moon') {
        // A crescent: the disc with a bite taken out by the sky behind it.
        ctx.save();
        ctx.fillStyle = 'rgba(240, 248, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x + 12, y - 8, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawMountains(snowy = false) {
    const horizon = GROUND_Y - gameState.camera.y * 0.55;

    for (const hill of hillPositions) {
        const factor = hill.far ? 0.18 : 0.34;
        const x = hill.x - gameState.camera.x * factor;
        if (x < -400 || x > view.w + 400) continue;

        const w = 260 * hill.scale;
        const h = (hill.far ? 200 : 140) * hill.scale;
        const baseY = horizon + (hill.far ? -10 : 6);

        ctx.save();
        ctx.fillStyle = hill.far ? theme.far : theme.near;
        ctx.beginPath();
        if (snowy) {
            // Sharp alpine ridges rather than rolling hills
            ctx.moveTo(x - w / 2, baseY);
            ctx.lineTo(x - w * 0.14, baseY - h);
            ctx.lineTo(x + w * 0.06, baseY - h * 0.72);
            ctx.lineTo(x + w / 2, baseY);
        } else {
            ctx.moveTo(x - w / 2, baseY);
            ctx.quadraticCurveTo(x - w / 4, baseY - h, x, baseY - h);
            ctx.quadraticCurveTo(x + w / 4, baseY - h, x + w / 2, baseY);
        }
        ctx.closePath();
        ctx.fill();

        if (hill.far || snowy) {
            // Snow cap
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.beginPath();
            ctx.moveTo(x - w * 0.11, baseY - h * 0.78);
            ctx.quadraticCurveTo(x, baseY - h * 1.02, x + w * 0.11, baseY - h * 0.78);
            ctx.quadraticCurveTo(x, baseY - h * 0.68, x - w * 0.11, baseY - h * 0.78);
            ctx.fill();
        }
        ctx.restore();
    }
}

// Underground: teeth of rock closing in from the top and bottom of the frame.
function drawCaveWalls() {
    const baseY = GROUND_Y - gameState.camera.y * 0.55;

    ctx.save();
    for (const hill of hillPositions) {
        const factor = hill.far ? 0.2 : 0.4;
        const x = hill.x - gameState.camera.x * factor;
        if (x < -400 || x > view.w + 400) continue;

        const w = 200 * hill.scale;
        const h = (hill.far ? 260 : 170) * hill.scale;
        ctx.fillStyle = hill.far ? theme.far : theme.near;

        // Stalagmite from the floor
        ctx.beginPath();
        ctx.moveTo(x - w / 2, baseY);
        ctx.lineTo(x, baseY - h);
        ctx.lineTo(x + w / 2, baseY);
        ctx.closePath();
        ctx.fill();

        // ...and its opposite hanging from the roof
        const topY = -gameState.camera.y * factor;
        ctx.beginPath();
        ctx.moveTo(x - w * 0.35, topY);
        ctx.lineTo(x + w * 0.1, topY + h * 0.75);
        ctx.lineTo(x + w * 0.45, topY);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

// The castle: buttresses marching past behind the action.
function drawCastlePillars() {
    const baseY = GROUND_Y - gameState.camera.y * 0.55;

    ctx.save();
    for (const hill of hillPositions) {
        const factor = hill.far ? 0.2 : 0.38;
        const x = hill.x - gameState.camera.x * factor;
        if (x < -300 || x > view.w + 300) continue;

        const w = 110 * hill.scale;
        const h = (hill.far ? 300 : 220) * hill.scale;
        ctx.fillStyle = hill.far ? theme.far : theme.near;
        ctx.fillRect(x - w / 2, baseY - h, w, h);

        // Battlements along the top
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x - w / 2 + i * (w / 3), baseY - h - 12, w / 5, 12);
        }
        // Arrow slit
        ctx.fillStyle = 'rgba(255, 150, 60, 0.35)';
        ctx.fillRect(x - 4, baseY - h * 0.6, 8, 30);
    }
    ctx.restore();
}

function drawClouds() {
    ctx.save();
    ctx.fillStyle = theme.clouds;

    for (const cloud of cloudPositions) {
        const x = cloud.x - gameState.camera.x * 0.45;
        const y = cloud.y - gameState.camera.y * 0.25;

        if (x > -140 && x < view.w + 140 && y > -80 && y < view.h + 80) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(cloud.scale, cloud.scale);
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.arc(25, 2, 26, 0, Math.PI * 2);
            ctx.arc(54, 0, 20, 0, Math.PI * 2);
            ctx.arc(28, -14, 21, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        cloud.x -= cloud.speed;
        if (cloud.x < -200) cloud.x = CONFIG.WORLD_WIDTH + 100;
    }

    ctx.restore();
}

// The line of things sitting on the horizon, whatever this world grows.
function drawScenery() {
    if (theme.scenery === 'none') return;

    const baseY = GROUND_Y - gameState.camera.y + 2;
    ctx.save();
    ctx.fillStyle = theme.sceneryColor;

    for (const bush of bushPositions) {
        const x = bush.x - gameState.camera.x * 0.75;
        if (x < -140 || x > view.w + 140) continue;
        const s = bush.scale;

        switch (theme.scenery) {
            case 'palms':
                // Trunk with a spray of fronds
                ctx.fillRect(x, baseY - 60 * s, 6 * s, 60 * s);
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.ellipse(x + 3 * s + i * 16 * s, baseY - 62 * s, 18 * s, 6 * s,
                        i * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'crystals':
                // Glowing shards pushing up out of the rock
                for (let i = 0; i < 3; i++) {
                    const cx = x + i * 20 * s;
                    const h = (26 + i * 12) * s;
                    ctx.beginPath();
                    ctx.moveTo(cx - 7 * s, baseY);
                    ctx.lineTo(cx, baseY - h);
                    ctx.lineTo(cx + 7 * s, baseY);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'drifts':
                // Banked snow
                ctx.beginPath();
                ctx.ellipse(x + 24 * s, baseY, 46 * s, 16 * s, 0, Math.PI, 0);
                ctx.fill();
                break;
            default:
                ctx.beginPath();
                ctx.arc(x, baseY, 22 * s, Math.PI, 0);
                ctx.arc(x + 26 * s, baseY, 28 * s, Math.PI, 0);
                ctx.arc(x + 54 * s, baseY, 20 * s, Math.PI, 0);
                ctx.fill();
        }
    }

    ctx.restore();
}

// ============================================================================
//  MAIN LOOP - fixed timestep so the game runs identically at 30, 60 or 144Hz
// ============================================================================

let rafId = null;
let lastFrameTime = 0;
let accumulator = 0;

function frame(now) {
    if (!gameState.running) {
        rafId = null;
        return;
    }
    rafId = requestAnimationFrame(frame);

    let delta = now - lastFrameTime;
    lastFrameTime = now;
    if (!isFinite(delta) || delta < 0) delta = STEP_MS;

    if (!gameState.paused) {
        accumulator += Math.min(delta, STEP_MS * MAX_STEPS_PER_FRAME * 2);

        let steps = 0;
        while (accumulator >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
            tick();
            accumulator -= STEP_MS;
            steps++;
        }
        // If we are hopelessly behind (background tab, slow device), drop the
        // backlog rather than spiralling.
        if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;
    }

    render();
}

function gameLoop() {
    if (rafId !== null) return; // Never run two loops at once
    lastFrameTime = performance.now();
    accumulator = 0;
    rafId = requestAnimationFrame(frame);
}

function stopLoop() {
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}

function setPaused(paused) {
    if (!gameState.running) return;
    if (gameState.paused === paused) return;

    gameState.paused = paused;
    setScreenVisible('pause-screen', paused);

    if (paused) {
        music.stop();
    } else {
        lastFrameTime = performance.now();
        accumulator = 0;
        music.start();
    }
}

function toggleMute() {
    gameState.muted = !gameState.muted;
    const button = document.getElementById('btn-mute');
    if (button) {
        button.textContent = gameState.muted ? '🔇' : '🔊';
        button.setAttribute('aria-label', gameState.muted ? 'Unmute' : 'Mute');
    }
    if (gameState.muted) {
        music.stop();
    } else {
        unlockAudio();
        if (gameState.running && !gameState.paused) music.start();
    }
    try {
        localStorage.setItem('mario-clone-muted', gameState.muted ? '1' : '0');
    } catch (e) { /* Private browsing - not worth failing over. */ }
}

// Pause automatically when the tab goes away, and clear stuck keys.
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        Object.keys(gameState.keys).forEach(key => { gameState.keys[key] = false; });
        setPaused(true);
    }
});

// ============================================================================
//  INPUT
// ============================================================================

const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];

window.addEventListener('keydown', (e) => {
    if (e.repeat && GAME_KEYS.includes(e.key)) {
        e.preventDefault();
        return;
    }

    gameState.keys[e.key] = true;

    if (GAME_KEYS.includes(e.key)) e.preventDefault();

    // Prevent Command/Ctrl + Arrow shortcuts that cause stuck keys
    if ((e.metaKey || e.ctrlKey) && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setPaused(!gameState.paused);
    }
    if (e.key === 'm' || e.key === 'M') {
        toggleMute();
    }

    unlockAudio();
});

window.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
    // Shift changes the reported key names, so clear the movement keys too.
    if (e.key === 'Shift') gameState.keys['Shift'] = false;
});

// Clear all keys when window loses focus (prevents stuck keys)
window.addEventListener('blur', () => {
    Object.keys(gameState.keys).forEach(key => {
        gameState.keys[key] = false;
    });
});

// Touch Controls - Position-based tracking
function setupTouchControls() {
    const leftBtn = document.getElementById('btn-left');
    const rightBtn = document.getElementById('btn-right');
    const jumpBtn = document.getElementById('btn-jump');
    const runBtn = document.getElementById('btn-run');

    const buttons = [
        { el: leftBtn, id: 'btn-left', control: 'left' },
        { el: rightBtn, id: 'btn-right', control: 'right' },
        { el: jumpBtn, id: 'btn-jump', control: 'jump' },
        { el: runBtn, id: 'btn-run', control: 'run' },
    ].filter(b => b.el);

    if (buttons.length === 0) return;

    buttons.forEach(b => b.el.addEventListener('contextmenu', e => e.preventDefault()));

    function controlAt(touch) {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!element) return null;
        for (const b of buttons) {
            if (element === b.el || element.closest('#' + b.id)) return b.control;
        }
        return null;
    }

    function isTouchOnControls(touch) {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!element) return false;
        // Don't interfere with menu buttons
        if (element.closest('.screen') || element.closest('.menu-btn')) return false;
        return !!element.closest('#touch-controls');
    }

    function updateControls(touches) {
        gameState.touchControls.left = false;
        gameState.touchControls.right = false;
        gameState.touchControls.jump = false;
        gameState.touchControls.run = false;

        for (let i = 0; i < touches.length; i++) {
            const control = controlAt(touches[i]);
            if (control) gameState.touchControls[control] = true;
        }

        buttons.forEach(b => b.el.classList.toggle('pressed', gameState.touchControls[b.control]));
    }

    document.addEventListener('touchstart', (e) => {
        unlockAudio();
        if (Array.from(e.touches).some(isTouchOnControls)) {
            e.preventDefault();
            updateControls(e.touches);
        }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (Array.from(e.touches).some(isTouchOnControls)) {
            e.preventDefault();
            updateControls(e.touches);
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => updateControls(e.touches));
    document.addEventListener('touchcancel', () => updateControls([]));

    // Mouse support for testing on desktop
    buttons.forEach(b => {
        const set = (value) => {
            gameState.touchControls[b.control] = value;
            b.el.classList.toggle('pressed', value);
        };
        b.el.addEventListener('mousedown', (e) => { e.preventDefault(); unlockAudio(); set(true); });
        b.el.addEventListener('mouseup', () => set(false));
        b.el.addEventListener('mouseleave', () => set(false));
    });

    window.addEventListener('blur', () => updateControls([]));
}

// ============================================================================
//  GAME LIFECYCLE
// ============================================================================

let startingGame = false;

const GAME_MODE = { SINGLE: 'single', MULTI: 'multi' };

// The start screen's one-line explanation slot: why multiplayer is unavailable,
// or that a join failed and the run is solo. Cleared on the next start.
function showModeNote(message) {
    const note = document.getElementById('mode-note');
    if (!note) return;
    note.textContent = message || '';
    note.classList.toggle('hidden', !message);
}

async function startGame(mode) {
    if (startingGame) return;
    startingGame = true;

    // "Play Again" repeats whatever was chosen on the menu.
    const requestedMode = mode || gameState.mode || GAME_MODE.SINGLE;
    gameState.mode = requestedMode;

    try {
        unlockAudio();
        stopLoop();
        clearCountdowns();

        // Get player name from input
        const nameInput = document.getElementById('player-name');
        const playerName = (nameInput && nameInput.value.trim()) || 'Player';

        // Connect to multiplayer. Single player never touches the network at
        // all - no sign-in, no reads, no writes.
        let joinFailed = false;
        if (requestedMode === GAME_MODE.MULTI && !multiplayerState.connected) {
            const connected = multiplayer.db && await multiplayer.connect(playerName);
            if (!connected) {
                console.warn('Failed to connect to multiplayer, continuing in single player mode');
                joinFailed = true;
                // Left on the start screen for when they come back to it.
                showModeNote('Could not reach the multiplayer server. That run was solo.');
            }
        }

        gameState.running = true;
        gameState.paused = false;
        gameState.score = 0;
        gameState.coins = 0;
        gameState.lives = 3;
        gameState.level = 1;

        ['start-screen', 'game-over-screen', 'out-of-lives-screen', 'pause-screen']
            .forEach(id => setScreenVisible(id, false));

        initClouds();
        initLevel();
        player.hasUsedContinue = false;

        updateHUD();
        const plan = levelPlan();
        const subtitle = multiplayerState.connected ? 'Multiplayer'
            : joinFailed ? 'Multiplayer unavailable - playing solo'
            : plan.design.blurb;
        showBanner(`${plan.label}  ${plan.design.name}`, subtitle, joinFailed ? 2600 : 1800);
        gameLoop();
        music.start();
    } catch (error) {
        console.error('Error starting game:', error);
        showBanner('Something went wrong', error.message, 4000);
    } finally {
        startingGame = false;
    }
}

function gameOver() {
    gameState.running = false;
    gameState.paused = false;
    stopLoop();
    music.stop();
    clearCountdowns();

    const finalScore = document.getElementById('final-score');
    if (finalScore) finalScore.textContent = gameState.score;

    const finalCoins = document.getElementById('final-coins');
    if (finalCoins) finalCoins.textContent = gameState.coins;

    const finalLevel = document.getElementById('final-level');
    if (finalLevel) finalLevel.textContent = gameState.worldLabel || worldLabel();

    setScreenVisible('game-over-screen', true);

    // Bank the run before tearing the connection down.
    multiplayer.submitAllTimeScore();

    // Disconnect from multiplayer
    if (multiplayerState.connected) {
        multiplayer.disconnect();
    }

    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard) leaderboard.classList.add('hidden');
}

// Continuous gameplay - out of lives screen
let continueCountdownInterval = null;
let respawnCountdownInterval = null;

function clearCountdowns() {
    if (continueCountdownInterval) clearInterval(continueCountdownInterval);
    if (respawnCountdownInterval) clearInterval(respawnCountdownInterval);
    continueCountdownInterval = null;
    respawnCountdownInterval = null;
}

function showOutOfLivesScreen() {
    const outOfLivesScreen = document.getElementById('out-of-lives-screen');
    const continueBtn = document.getElementById('continue-btn');
    const continueHint = document.getElementById('continue-hint');
    const respawnCountdownEl = document.getElementById('respawn-countdown');
    const continueCountdownEl = document.getElementById('continue-countdown');
    if (!outOfLivesScreen) return;

    clearCountdowns();
    setScreenVisible('out-of-lives-screen', true);

    // Check if continue was already used
    if (player.hasUsedContinue) {
        if (continueBtn) continueBtn.style.display = 'none';
        if (continueHint) continueHint.style.display = 'none';
    } else if (continueBtn && continueCountdownEl) {
        continueBtn.style.display = 'block';
        if (continueHint) continueHint.style.display = 'block';
        continueBtn.disabled = false;
        continueBtn.textContent = 'Continue';

        let continueTime = 5;
        continueCountdownEl.textContent = continueTime;

        continueCountdownInterval = setInterval(() => {
            continueTime--;
            continueCountdownEl.textContent = Math.max(0, continueTime);
            if (continueTime <= 0) {
                clearInterval(continueCountdownInterval);
                continueCountdownInterval = null;
                continueBtn.disabled = true;
            }
        }, 1000);
    }

    if (respawnCountdownEl) {
        let respawnTime = 10;
        respawnCountdownEl.textContent = respawnTime;
        respawnCountdownInterval = setInterval(() => {
            respawnTime--;
            respawnCountdownEl.textContent = Math.max(0, respawnTime);
            if (respawnTime <= 0) {
                clearInterval(respawnCountdownInterval);
                respawnCountdownInterval = null;
                autoRejoin();
            }
        }, 1000);
    }
}

function reviveAt(spawnPos) {
    player.x = spawnPos.x;
    player.y = spawnPos.y;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isJumping = false;
    player.combo = 0;
    player.setInvulnerable(true, 3000);
    updateCamera(true);
}

function useContinue() {
    if (player.hasUsedContinue) return;

    player.hasUsedContinue = true;
    player.outOfLives = false;
    gameState.lives = 3;
    player.health = 2;
    updateHUD();

    clearCountdowns();

    setScreenVisible('out-of-lives-screen', false);

    reviveAt(player.getRandomRespawnLocation());
    sounds.powerUp();
    showBanner('Back in!', '3 lives restored', 1600);
}

function restartFromZero() {
    gameState.score = 0;
    gameState.lives = 3;
    player.health = 2;
    player.hasUsedContinue = false;
    player.outOfLives = false;
    updateHUD();

    clearCountdowns();

    setScreenVisible('out-of-lives-screen', false);

    reviveAt(player.getRandomRespawnLocation());

    if (multiplayerState.connected) {
        multiplayer.updateLeaderboard();
    }
}

function autoRejoin() {
    // Auto rejoin after countdown expires
    restartFromZero();
}

// ============================================================================
//  UI WIRING
//  Every lookup is guarded so game.js also loads on pages that only include
//  part of the markup (the test harness, for example).
// ============================================================================

function onActivate(element, handler) {
    if (!element) return;
    let handledTouch = false;
    element.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handledTouch = true;
        setTimeout(() => { handledTouch = false; }, 500);
        handler(e);
    });
    element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (handledTouch) return; // Don't run twice from a synthesized click
        handler(e);
    });
}

function handleStartGame(e, mode) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    unlockAudio();
    startGame(mode);
}

// Returns to the start screen so the mode can be changed between runs.
function returnToMenu() {
    gameState.running = false;
    gameState.paused = false;
    stopLoop();
    music.stop();
    clearCountdowns();

    if (multiplayerState.connected) multiplayer.disconnect();

    ['game-over-screen', 'out-of-lives-screen', 'pause-screen']
        .forEach(id => setScreenVisible(id, false));
    setScreenVisible('start-screen', true);

    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard) leaderboard.classList.add('hidden');
}

onActivate(document.getElementById('multiplayer-btn'), (e) => handleStartGame(e, GAME_MODE.MULTI));
onActivate(document.getElementById('single-player-btn'), (e) => handleStartGame(e, GAME_MODE.SINGLE));
onActivate(document.getElementById('restart-btn'), handleStartGame);
onActivate(document.getElementById('main-menu-btn'), returnToMenu);
onActivate(document.getElementById('continue-btn'), () => {
    const button = document.getElementById('continue-btn');
    if (button && !button.disabled) useContinue();
});
onActivate(document.getElementById('restart-from-zero-btn'), restartFromZero);
onActivate(document.getElementById('resume-btn'), () => setPaused(false));
onActivate(document.getElementById('quit-btn'), () => {
    setPaused(false);
    gameOver();
});
onActivate(document.getElementById('btn-mute'), toggleMute);
onActivate(document.getElementById('btn-pause'), () => setPaused(!gameState.paused));

// Enter starts the game from the name field. The name only matters in
// multiplayer, so that is what Enter starts.
const nameInput = document.getElementById('player-name');
if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleStartGame(e, GAME_MODE.MULTI);
    });
}

// If the Firebase SDK never loaded there is nothing to join, so say so on the
// menu rather than letting the button fail on click. A sign-in or rules
// failure cannot be detected up front - that surfaces as a fallback at start.
if (!multiplayer.db) {
    const multiplayerBtn = document.getElementById('multiplayer-btn');
    if (multiplayerBtn) multiplayerBtn.disabled = true;
    showModeNote('Multiplayer is unavailable - the game could not reach Firebase.');
}

// ============================================================================
//  INITIALIZE
// ============================================================================

try {
    gameState.muted = localStorage.getItem('mario-clone-muted') === '1';
} catch (e) { /* localStorage can be unavailable - default to sound on. */ }

const muteButton = document.getElementById('btn-mute');
if (muteButton) muteButton.textContent = gameState.muted ? '🔇' : '🔊';

setupTouchControls();
initClouds();
updateHUD();
// The start screen is up on load, so hide the in-game chrome behind it.
document.body.classList.toggle('menu-open', !!document.querySelector('.screen:not(.hidden)'));

// Load all-time leaderboard on page load
if (multiplayer.db) {
    multiplayer.loadAllTimeLeaderboard();
}

// Add CanvasRenderingContext2D.roundRect polyfill for older browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        const r = typeof radius === 'number' ? radius : 0;
        const rr = Math.min(r, width / 2, height / 2);
        this.beginPath();
        this.moveTo(x + rr, y);
        this.arcTo(x + width, y, x + width, y + height, rr);
        this.arcTo(x + width, y + height, x, y + height, rr);
        this.arcTo(x, y + height, x, y, rr);
        this.arcTo(x, y, x + width, y, rr);
        this.closePath();
        return this;
    };
}
