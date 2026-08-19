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
    STAR_DURATION: 600,        // 10 seconds of invincibility
    ENEMY_RESPAWN_MS: 8000,
    MAX_ENEMIES_PER_TYPE: 3,
    PORTAL_SPAWN_MIN: 900,     // 15s between spawns at the very least
    PORTAL_SPAWN_RANGE: 600,   // ...up to 25s
    SPAWN_SAFE_RADIUS: 260,    // Never appear this close to a player
    SPAWN_LOOKAHEAD_FRAMES: 45, // ...nor within 0.75s of travel ahead of one
    enemySpeedScale: 1,        // Raised each level by initLevel()

    // --- World ---
    WORLD_WIDTH: 3600,         // Large scrollable world
    WORLD_HEIGHT: 600,         // Fixed world height
    LEVEL_TIME: 300,           // Seconds on the level clock
    TIME_TICK_FRAMES: 24,      // Frames per unit of level time
};

// Game State
const gameState = {
    running: false,
    paused: false,
    muted: false,
    score: 0,
    coins: 0,
    lives: 3,
    level: 1,
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
    leaderboardRef: null,
    enemiesRef: null,
    portalRef: null,
    hitsRef: null, // For PvP hit messages
    lastProcessedHit: null, // Track last hit to prevent duplicates
    isSpawnMaster: false, // True if this client controls enemy spawning
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

    async connect(playerName) {
        if (!this.db) return false;

        try {
            // Generate unique player ID
            multiplayerState.playerId = this.db.ref().child('players').push().key;
            multiplayerState.playerName = playerName || 'Anonymous';

            // Assign color based on player ID hash
            const colorIndex = Math.abs(this.hashCode(multiplayerState.playerId)) % PLAYER_COLORS.length;
            multiplayerState.playerColor = PLAYER_COLORS[colorIndex];

            // Set up Firebase references
            multiplayerState.playersRef = this.db.ref('players');
            multiplayerState.playerRef = multiplayerState.playersRef.child(multiplayerState.playerId);
            multiplayerState.coinsRef = this.db.ref('coins');
            multiplayerState.leaderboardRef = this.db.ref('leaderboard');
            multiplayerState.enemiesRef = this.db.ref('enemies');
            multiplayerState.portalRef = this.db.ref('portals');
            multiplayerState.hitsRef = this.db.ref('hits');

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
            });

            // Set up disconnect cleanup
            multiplayerState.playerRef.onDisconnect().remove();

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

    listenForPlayers() {
        multiplayerState.playersRef.on('value', (snapshot) => {
            const players = snapshot.val();
            if (!players) return;

            Object.entries(players).forEach(([id, data]) => {
                if (id !== multiplayerState.playerId) {
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
                        existingPlayer.timestamp = data.timestamp || Date.now();
                    } else {
                        // New player - initialize with current position
                        multiplayerState.remotePlayers.set(id, {
                            name: data.name || 'Unknown Player',
                            color: PLAYER_COLORS.find(c => c.name === data.color) || PLAYER_COLORS[0],
                            x: data.x || 0,
                            y: data.y || 0,
                            targetX: data.x || 0,
                            targetY: data.y || 0,
                            direction: data.direction || 1,
                            score: data.score || 0,
                            health: data.health || 2,
                            invulnerable: data.invulnerable || false,
                            outOfLives: data.outOfLives || false,
                            timestamp: data.timestamp || Date.now(),
                        });
                    }
                }
            });

            // Remove disconnected players
            const playerIds = new Set(Object.keys(players));
            for (const [id] of multiplayerState.remotePlayers) {
                if (!playerIds.has(id)) {
                    multiplayerState.remotePlayers.delete(id);
                }
            }

            // Determine spawn master with AFK detection
            // Normally: player with lowest ID alphabetically
            // BUT: if that player is AFK (no updates for 15+ seconds), active players can claim the role
            const allPlayerIds = Array.from(playerIds).sort();
            const nominalSpawnMasterId = allPlayerIds[0];
            const nominalSpawnMaster = players[nominalSpawnMasterId];
            const now = Date.now();
            const spawnMasterInactivityThreshold = 15000; // 15 seconds

            // Check if the nominal Spawn Master is inactive
            const spawnMasterLastUpdate = nominalSpawnMaster?.timestamp || 0;
            const spawnMasterInactive = (now - spawnMasterLastUpdate) > spawnMasterInactivityThreshold;

            let actualSpawnMasterId;
            if (spawnMasterInactive) {
                // Nominal Spawn Master is AFK/abandoned - find the most recently active player to take over
                // This ensures an active player becomes Spawn Master, not another AFK player
                let mostRecentPlayerId = nominalSpawnMasterId;
                let mostRecentTimestamp = 0;

                for (const [id, data] of Object.entries(players)) {
                    const timestamp = data.timestamp || 0;
                    if (timestamp > mostRecentTimestamp) {
                        mostRecentTimestamp = timestamp;
                        mostRecentPlayerId = id;
                    }
                }
                actualSpawnMasterId = mostRecentPlayerId;
            } else {
                // Nominal Spawn Master is active - use them
                actualSpawnMasterId = nominalSpawnMasterId;
            }

            const wasSpawnMaster = multiplayerState.isSpawnMaster;
            multiplayerState.isSpawnMaster = (actualSpawnMasterId === multiplayerState.playerId);

            // Log spawn master changes
            if (multiplayerState.isSpawnMaster && !wasSpawnMaster) {
                if (spawnMasterInactive && nominalSpawnMasterId !== multiplayerState.playerId) {
                    console.log('🎮 Previous spawn master is AFK - you are now the spawn master (controlling enemy spawns and cleanup)');
                } else {
                    console.log('🎮 You are now the spawn master - controlling enemy spawns and cleanup');
                }
            } else if (!multiplayerState.isSpawnMaster && wasSpawnMaster) {
                console.log('🎮 Spawn master role transferred to another player');
            }

            // Spawn master cleans up inactive players
            if (multiplayerState.isSpawnMaster) {
                this.cleanupInactivePlayers(players);
            }

            // Update leaderboard display
            this.updateLeaderboardUI();
        });
    }

    async cleanupInactivePlayers(players) {
        if (!multiplayerState.isSpawnMaster) return;

        const now = Date.now();

        // Throttle cleanup - only run every 30 seconds
        if (now - multiplayerState.lastCleanupTime < multiplayerState.cleanupInterval) {
            return;
        }

        multiplayerState.lastCleanupTime = now;
        const inactivityThreshold = 10000; // 10 seconds of inactivity (reduced from 60s to handle abandoned players faster)

        for (const [playerId, playerData] of Object.entries(players)) {
            // Skip our own player
            if (playerId === multiplayerState.playerId) continue;

            const lastUpdate = playerData.timestamp || 0;
            const timeSinceUpdate = now - lastUpdate;

            // If player hasn't updated in 10 seconds, remove them
            if (timeSinceUpdate > inactivityThreshold) {
                console.log(`🧹 Cleaning up inactive player: ${playerData.name} (inactive for ${Math.round(timeSinceUpdate / 1000)}s)`);

                try {
                    // Remove player from players list
                    await multiplayerState.playersRef.child(playerId).remove();

                    // Remove player from leaderboard
                    await multiplayerState.leaderboardRef.child(playerId).remove();
                } catch (error) {
                    console.error('Failed to cleanup inactive player:', error);
                }
            }
        }
    }

    listenForCoins() {
        multiplayerState.coinsRef.on('value', (snapshot) => {
            const coinData = snapshot.val();
            if (!coinData) return;

            // Update coin collected states
            coins.forEach((coin, index) => {
                const coinKey = `coin_${index}`;
                if (coinData[coinKey]) {
                    coin.collected = true;
                    coin.respawnTime = coinData[coinKey].respawnTime;
                }
            });
        });
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
        });
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

    async updateLeaderboard() {
        if (!multiplayerState.connected) return;

        try {
            await multiplayerState.leaderboardRef.child(multiplayerState.playerId).set({
                name: multiplayerState.playerName,
                score: gameState.score,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
            });

            // Update all-time leaderboard if score is high enough
            this.updateAllTimeLeaderboard(multiplayerState.playerName, gameState.score);
        } catch (error) {
            console.error('Failed to update leaderboard:', error);
        }
    }

    async updateAllTimeLeaderboard(playerName, score) {
        if (!this.db) return;

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

                return currentData;
            });
        } catch (error) {
            console.error('Failed to update all-time leaderboard:', error);
        }
    }

    loadAllTimeLeaderboard() {
        if (!this.db) return;

        const allTimeRef = this.db.ref('allTimeLeaderboard');
        allTimeRef.orderByChild('score').limitToLast(10).on('value', (snapshot) => {
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
            const entries = Object.values(data).sort((a, b) => b.score - a.score).slice(0, 10);

            // Render top 10
            allTimeList.innerHTML = entries.map((entry, index) => `
                <div class="all-time-entry">
                    <span class="rank">${this.getRankEmoji(index + 1)}</span>
                    <span class="name">${entry.name}</span>
                    <span class="score">${entry.score}</span>
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

        // Render leaderboard
        leaderboardList.innerHTML = top5.map((player, index) => `
            <div class="leaderboard-entry ${player.isYou ? 'you' : ''}">
                <span class="rank">#${index + 1}</span>
                <span class="name">${player.name}${player.isYou ? ' (You)' : ''}</span>
                <span class="score">${player.score}</span>
            </div>
        `).join('');

        // Show leaderboard if we have players
        const leaderboard = document.getElementById('leaderboard');
        if (leaderboard && allPlayers.length > 0) {
            leaderboard.classList.remove('hidden');
        }
    }

    async respawnPlayer() {
        if (!multiplayerState.connected) return;

        // Apply 20% score penalty
        const penalty = Math.floor(gameState.score * 0.2);
        gameState.score = Math.max(0, gameState.score - penalty);
        document.getElementById('score').textContent = gameState.score;

        // Update Firebase
        await this.updateLeaderboard();

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
};

// ---------------------------------------------------------------------------
//  Background music: a short original chiptune loop, scheduled ahead of time
//  through the Web Audio clock so it never drifts with frame rate.
// ---------------------------------------------------------------------------
const music = {
    timer: null,
    nextNoteTime: 0,
    step: 0,
    tempo: 0.13, // seconds per step

    // Bright major-key loop (32 steps). 0 = rest.
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

            if (this.melody[i]) playNote(this.melody[i], offset, this.tempo * 0.85, 'square', 0.055);
            if (this.bass[i]) playNote(this.bass[i], offset, this.tempo * 0.9, 'triangle', 0.075);

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

        const moving = input.left !== input.right;
        this.skidding = false;

        if (moving) {
            const wanted = input.right ? 1 : -1;
            const turning = this.velocityX !== 0 && Math.sign(this.velocityX) !== wanted;

            // Turning around on the ground gives a fast, visible skid - this is
            // most of what makes Mario's momentum readable.
            if (turning && this.onGround) {
                this.velocityX += wanted * CONFIG.TURN_DECELERATION;
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
            this.velocityX *= this.onGround ? CONFIG.FRICTION : CONFIG.AIR_FRICTION;
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
            // Releasing early cuts the jump short.
            if (this.isJumping && !input.jump && this.velocityY < CONFIG.JUMP_CUT_THRESHOLD) {
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

    getRandomRespawnLocation() {
        // In the multiplayer arena, dropping back in anywhere keeps things
        // moving. In single player that felt random and disorienting, so
        // respawn where the player last had their feet on solid ground.
        if (!multiplayerState.connected) {
            if (this.safeGround) return { ...this.safeGround };
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

        // Sync enemy position to Firebase (throttled)
        if (this.alive && multiplayerState.connected && this.id) {
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

        // Shell first, then the head on top of it. Painting the shell last
        // buried all but a few pixels of the head behind it.
        const shellCX = cx - look * 5;
        const shellCY = screenY + this.height * 0.5;
        const shellRX = this.width / 2.7;
        const shellRY = this.height / 2.7;

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

        // Neck, then head, clear of the shell's leading edge
        const headX = cx + look * 11;
        const headY = screenY + this.height * 0.42;
        ctx.fillStyle = '#8BC34A';
        ctx.beginPath();
        ctx.roundRect(Math.min(shellCX, headX), headY - 3.5, Math.abs(headX - shellCX), 7, 3);
        ctx.fill();

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
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + this.height);
            gradient.addColorStop(0, '#A0763F');
            gradient.addColorStop(1, '#6E4B22');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(screenX, screenY, this.width, this.height, 4);
            ctx.fill();
            ctx.strokeStyle = '#4A3113';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.fillRect(screenX + 5, screenY + 5, this.width - 10, this.height - 10);
        } else {
            // Brick
            const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + this.height);
            gradient.addColorStop(0, '#D2691E');
            gradient.addColorStop(1, '#A0522D');
            ctx.fillStyle = gradient;
            ctx.fillRect(screenX, screenY, this.width, this.height);

            ctx.strokeStyle = 'rgba(60,25,10,0.7)';
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
     * @param {string} variant 'brick' | 'ground' | 'cloud'
     * Cloud platforms are one-way: you can jump up through them.
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
            this.drawCloudPlatform(screenX, screenY);
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
    }

    drawGround(screenX, screenY) {
        const soil = ctx.createLinearGradient(0, screenY, 0, screenY + this.height);
        soil.addColorStop(0, '#A9663A');
        soil.addColorStop(0.25, '#8B4513');
        soil.addColorStop(1, '#5C3010');
        ctx.fillStyle = soil;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Grass cap
        ctx.fillStyle = '#3FA34D';
        ctx.fillRect(screenX, screenY, this.width, 10);
        ctx.fillStyle = '#5FD068';
        ctx.fillRect(screenX, screenY, this.width, 4);

        // Grass blades along the top edge
        ctx.strokeStyle = '#3FA34D';
        ctx.lineWidth = 2;
        const start = Math.floor(this.x / 16) * 16;
        for (let wx = start; wx < this.x + this.width; wx += 16) {
            const sx = wx - gameState.camera.x;
            ctx.beginPath();
            ctx.moveTo(sx, screenY);
            ctx.lineTo(sx + 3, screenY - 6);
            ctx.lineTo(sx + 6, screenY);
            ctx.stroke();
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
        stone.addColorStop(0, '#E08A4A');
        stone.addColorStop(1, '#A0522D');
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
//  The level is laid out on a 40px grid - one cell is exactly the player's
//  width and a big player's height. Building on the grid is what keeps every
//  gap either genuinely passable or honestly solid: a hand-placed level ends
//  up with 20 and 30px slots that look like openings but are too tight to
//  walk into. Tiers are spaced GRID * 3 apart, comfortably inside the ~158px
//  a standing jump clears, so every layer is reachable from the one below.
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

// Solid stretches of ground; the gaps between them are the pits.
const GROUND_SEGMENTS = [
    { x: 0, width: 840 },
    { x: 960, width: 720 },
    { x: 1800, width: 760 },
    { x: 2680, width: 920 },
];

// [x, width] per tier. Nothing overlaps and every span is a multiple of GRID.
const PLATFORM_LAYOUT = [
    // Lower tier - one jump from the ground
    ['low', 240, 200], ['low', 560, 160], ['low', 1040, 200], ['low', 1400, 160],
    ['low', 1880, 200], ['low', 2240, 160], ['low', 2760, 200],
    // Middle tier - staggered so it never sits directly on the tier below
    ['mid', 400, 160], ['mid', 800, 160], ['mid', 1280, 160], ['mid', 1640, 160],
    ['mid', 2120, 160], ['mid', 2480, 160], ['mid', 2960, 160],
];

// One-way cloud platforms you can jump up through
const CLOUD_LAYOUT = [
    [280, 160], [880, 160], [1520, 160], [2160, 160], [2720, 160],
];

// Rows of blocks at head height, in bands clear of the platforms above them
const BLOCK_ROWS = [
    { x: 120, items: [['brick', null], ['question', 'coin'], ['brick', null]] },
    { x: 760, items: [['question', 'mushroom']] },
    { x: 1280, items: [['brick', null], ['question', 'coin', 3], ['brick', null]] },
    { x: 1560, items: [['question', 'star'], ['brick', null]] },
    { x: 2400, items: [['brick', null], ['question', 'coin'], ['brick', null]] },
    { x: 2680, items: [['question', 'mushroom'], ['brick', null]] },
];

// [type, x, tier the enemy starts on]
const ENEMY_LAYOUT = [
    ['normal', 480, 'ground'], ['normal', 620, 'low'], ['normal', 1120, 'low'],
    ['normal', 1460, 'ground'], ['normal', 2000, 'low'], ['normal', 2300, 'low'],
    ['normal', 2840, 'ground'],
    ['jumping', 1240, 'ground'], ['jumping', 2520, 'mid'],
    ['turtle', 700, 'ground'], ['turtle', 1920, 'low'], ['turtle', 3000, 'ground'],
];

// [type, x, tier the pipe stands on]
const PORTAL_LAYOUT = [
    ['normal', 460, 'ground'], ['jumping', 1920, 'low'], ['turtle', 2160, 'ground'],
];

const STAIRCASE_X = 3200;
const STAIRCASE_STEPS = 4;
const FLAGPOLE_X = 3440;

function buildGround() {
    for (const segment of GROUND_SEGMENTS) {
        platforms.push(new Platform(segment.x, GROUND_Y, segment.width, GROUND_DEPTH, 'ground'));
    }
}

function buildStaircase(startX, steps) {
    for (let i = 0; i < steps; i++) {
        for (let j = 0; j <= i; j++) {
            blocks.push(new Block(startX + i * GRID, GROUND_Y - (j + 1) * GRID, 'solid'));
        }
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
    flagpole = null;
    coinIndex = 0;

    gameState.camera = { x: 0, y: 0 };
    gameState.screenShake = { intensity: 0, duration: 0, maxDuration: 0 };
    gameState.levelCleared = false;
    gameState.time = CONFIG.LEVEL_TIME;
    gameState.timeTicker = 0;

    // Enemies get a little quicker each level.
    CONFIG.enemySpeedScale = 1 + (gameState.level - 1) * 0.12;

    buildGround();

    for (const [tier, x, width] of PLATFORM_LAYOUT) {
        platforms.push(new Platform(x, TIER[tier], width, PLATFORM_THICKNESS, 'brick'));
    }
    for (const [x, width] of CLOUD_LAYOUT) {
        platforms.push(new Platform(x, TIER.high, width, CLOUD_THICKNESS, 'cloud'));
    }

    for (const row of BLOCK_ROWS) {
        row.items.forEach(([type, contents, count], i) => {
            blocks.push(new Block(row.x + i * GRID, BLOCK_ROW_Y, type, contents, count || 1));
        });
    }

    // Staircase up to the goal, like the run-in at the end of a Mario level
    buildStaircase(STAIRCASE_X, STAIRCASE_STEPS);

    for (const [type, x, tier] of PORTAL_LAYOUT) {
        portals.push(new Portal(x, TIER[tier] - CONFIG.PORTAL_HEIGHT, type));
    }

    // In multiplayer the spawn master fills the level through the portals.
    if (!multiplayerState.connected) {
        for (const [type, x, tier] of ENEMY_LAYOUT) {
            enemies.push(createEnemy(type, x, TIER[tier] - CONFIG.ENEMY_SIZE));
        }
        // Later levels get reinforcements spread across the level.
        const extra = Math.min(4, gameState.level - 1);
        for (let i = 0; i < extra; i++) {
            enemies.push(createEnemy(i % 2 ? 'turtle' : 'jumping', 640 + i * 640, TIER.low - CONFIG.ENEMY_SIZE));
        }

        flagpole = new Flagpole(FLAGPOLE_X, GROUND_Y);
    }

    buildCoins();

    updateCamera(true);
    updateHUD();
}

function buildCoins() {
    // An arc floating above every platform, low tier and mid tier alike
    for (const [tier, x, width] of PLATFORM_LAYOUT) {
        buildCoinArc(x + width / 2, TIER[tier] - 70, 5);
    }

    // A line along every cloud platform
    for (const [x, width] of CLOUD_LAYOUT) {
        for (let i = 0; i < 4; i++) {
            addCoin(x + 26 + i * 32, TIER.high - 46);
        }
    }

    // Rewards for clearing each pit
    for (let i = 0; i < GROUND_SEGMENTS.length - 1; i++) {
        const gapStart = GROUND_SEGMENTS[i].x + GROUND_SEGMENTS[i].width;
        const gapEnd = GROUND_SEGMENTS[i + 1].x;
        buildCoinArc((gapStart + gapEnd) / 2, GROUND_Y - 120, 3, 40);
    }

    // A row over each block row, so bumping them is on the way to something
    for (const row of BLOCK_ROWS) {
        addCoin(row.x + (row.items.length * GRID) / 2 - CONFIG.COIN_SIZE / 2, BLOCK_ROW_Y - 60);
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
}
cacheHudElements();

function updateHUD() {
    if (hud.score) hud.score.textContent = gameState.score;
    if (hud.coins) hud.coins.textContent = gameState.coins;
    if (hud.lives) hud.lives.textContent = Math.max(0, gameState.lives);
    if (hud.level) hud.level.textContent = gameState.level;
    if (hud.time) {
        hud.time.textContent = multiplayerState.connected ? '--' : Math.max(0, Math.ceil(gameState.time));
        hud.time.parentElement.classList.toggle('urgent', !multiplayerState.connected && gameState.time <= 60);
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
    showBanner(`Level ${gameState.level} Clear!`, `Time bonus +${timeBonus}`, 2600);

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
        gameState.level++;
        gameState.lives++; // A life for finishing the level
        initLevel();
        showBanner(`Level ${gameState.level}`, 'Go!', 1600);
        music.start();
    }, 2800);
}

function timeUp() {
    gameState.time = 0;
    showBanner('Time Up!', '', 1800);
    player.health = 1;
    player.startDeath();
    gameState.time = CONFIG.LEVEL_TIME;
}

// ============================================================================
//  SIMULATION TICK
// ============================================================================

function tick() {
    rebuildSolids();

    blocks.forEach(block => block.update());
    if (!(player.dying && !multiplayerState.connected)) {
        portals.forEach(portal => portal.update());
    }

    // The player moves first so every collision below reads a current position.
    player.update();

    // While the player is dying the level holds its breath, the way it does
    // in the games this is modelled on. Multiplayer keeps running because the
    // world there belongs to everyone, not just to whoever just died.
    const frozen = player.dying && !multiplayerState.connected;

    if (!frozen) {
        enemies.forEach(enemy => enemy.update());
        powerUps.forEach(item => item.update());
        coins.forEach(coin => coin.update());
        if (flagpole) flagpole.update();
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
    sky.addColorStop(0, '#3E7CC4');
    sky.addColorStop(0.45, '#79B7EC');
    sky.addColorStop(1, '#CDEBFF');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, view.w, view.h);

    // Sun, fixed high in the sky with only a hint of parallax
    const sunX = view.w * 0.78 - gameState.camera.x * 0.03;
    const sunY = view.h * 0.16 - gameState.camera.y * 0.05;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 90);
    sunGlow.addColorStop(0, 'rgba(255, 249, 196, 0.95)');
    sunGlow.addColorStop(0.25, 'rgba(255, 236, 139, 0.45)');
    sunGlow.addColorStop(1, 'rgba(255, 236, 139, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
    ctx.fill();

    drawMountains();
    drawClouds();
    drawBushes();

    // Everything below the ground line is dark earth. Ground segments paint
    // over it, so the gaps between them read as real chasms rather than a
    // window onto the sky.
    const undergroundY = GROUND_Y - gameState.camera.y;
    if (undergroundY < view.h) {
        const depths = ctx.createLinearGradient(0, undergroundY, 0, view.h);
        depths.addColorStop(0, '#4A2A12');
        depths.addColorStop(1, '#1B0F06');
        ctx.fillStyle = depths;
        ctx.fillRect(0, undergroundY, view.w, view.h - undergroundY);
    }
}

function drawMountains() {
    const horizon = GROUND_Y - gameState.camera.y * 0.55;

    for (const hill of hillPositions) {
        const factor = hill.far ? 0.18 : 0.34;
        const x = hill.x - gameState.camera.x * factor;
        if (x < -400 || x > view.w + 400) continue;

        const w = 260 * hill.scale;
        const h = (hill.far ? 200 : 140) * hill.scale;
        const baseY = horizon + (hill.far ? -10 : 6);

        ctx.save();
        ctx.fillStyle = hill.far ? 'rgba(88, 132, 176, 0.55)' : 'rgba(74, 154, 96, 0.75)';
        ctx.beginPath();
        ctx.moveTo(x - w / 2, baseY);
        ctx.quadraticCurveTo(x - w / 4, baseY - h, x, baseY - h);
        ctx.quadraticCurveTo(x + w / 4, baseY - h, x + w / 2, baseY);
        ctx.closePath();
        ctx.fill();

        if (hill.far) {
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

function drawClouds() {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';

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

function drawBushes() {
    const baseY = GROUND_Y - gameState.camera.y + 2;
    ctx.save();
    ctx.fillStyle = 'rgba(46, 125, 62, 0.85)';

    for (const bush of bushPositions) {
        const x = bush.x - gameState.camera.x * 0.75;
        if (x < -140 || x > view.w + 140) continue;

        const s = bush.scale;
        ctx.beginPath();
        ctx.arc(x, baseY, 22 * s, Math.PI, 0);
        ctx.arc(x + 26 * s, baseY, 28 * s, Math.PI, 0);
        ctx.arc(x + 54 * s, baseY, 20 * s, Math.PI, 0);
        ctx.fill();
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

async function startGame() {
    if (startingGame) return;
    startingGame = true;

    try {
        unlockAudio();
        stopLoop();
        clearCountdowns();

        // Get player name from input
        const nameInput = document.getElementById('player-name');
        const playerName = (nameInput && nameInput.value.trim()) || 'Player';

        // Connect to multiplayer
        if (multiplayer.db && !multiplayerState.connected) {
            const connected = await multiplayer.connect(playerName);
            if (!connected) {
                console.warn('Failed to connect to multiplayer, continuing in single player mode');
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
        showBanner('Level 1', multiplayerState.connected ? 'Multiplayer' : 'Reach the flag!', 1800);
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
    if (finalLevel) finalLevel.textContent = gameState.level;

    setScreenVisible('game-over-screen', true);

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

function handleStartGame(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    unlockAudio();
    startGame();
}

onActivate(document.getElementById('start-btn'), handleStartGame);
onActivate(document.getElementById('restart-btn'), handleStartGame);
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

// Enter starts the game from the name field
const nameInput = document.getElementById('player-name');
if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleStartGame(e);
    });
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
