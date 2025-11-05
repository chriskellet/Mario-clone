// Game Configuration
const CONFIG = {
    GRAVITY: 0.6,
    JUMP_POWER: -10,  // Balanced jump height
    JUMP_HOLD_GRAVITY: 0.25,  // Reduced gravity while holding jump
    MAX_JUMP_HOLD_TIME: 12,  // Frames you can hold jump for higher jump
    MOVE_SPEED: 5,
    ACCELERATION: 0.5,
    FRICTION: 0.85,
    MAX_FALL_SPEED: 15,
    PLAYER_SIZE: 40,
    ENEMY_SIZE: 35,
    COIN_SIZE: 25,
    BLOCK_SIZE: 40,
    WORLD_WIDTH: 3000,  // Large scrollable world
    WORLD_HEIGHT: 600,  // Fixed world height
};

// Game State
const gameState = {
    running: false,
    score: 0,
    coins: 0,
    lives: 3,
    level: 1,
    keys: {},
    touchControls: { left: false, right: false, jump: false },
    camera: { x: 0, y: 0 },
    screenShake: { intensity: 0, duration: 0 },
};

// Particle System
class Particle {
    constructor(x, y, vx, vy, color, size, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.age = 0;
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3; // Gravity
        this.age++;
        this.alpha = 1 - (this.age / this.lifetime);
        return this.age < this.lifetime;
    }

    draw() {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let particles = [];

function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 2;
        const size = 2 + Math.random() * 3;
        particles.push(new Particle(x, y, vx, vy, color, size, 30));
    }
}

function createJumpDust(x, y) {
    for (let i = 0; i < 5; i++) {
        const vx = (Math.random() - 0.5) * 4;
        const vy = Math.random() * 2;
        particles.push(new Particle(x, y, vx, vy, '#E0E0E0', 3, 15));
    }
}

function updateParticles() {
    particles = particles.filter(p => p.update());
}

function drawParticles() {
    particles.forEach(p => p.draw());
}

function screenShake(intensity, duration) {
    gameState.screenShake.intensity = intensity;
    gameState.screenShake.duration = duration;
}

// Haptic Feedback System
const haptics = {
    supported: 'vibrate' in navigator,

    light: () => {
        if (haptics.supported) {
            navigator.vibrate(10);  // Very short, light tap
        }
    },

    medium: () => {
        if (haptics.supported) {
            navigator.vibrate(25);  // Medium tap
        }
    },

    heavy: () => {
        if (haptics.supported) {
            navigator.vibrate(50);  // Strong impact
        }
    },

    success: () => {
        if (haptics.supported) {
            navigator.vibrate([10, 30, 20]);  // Two quick taps
        }
    },

    error: () => {
        if (haptics.supported) {
            navigator.vibrate([30, 50, 30]);  // Buzz pattern
        }
    }
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    const aspectRatio = 16 / 9;

    let width = maxWidth;
    let height = maxWidth / aspectRatio;

    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }

    canvas.width = Math.min(800, width);
    canvas.height = Math.min(600, height);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Audio Setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

const sounds = {
    jump: () => {
        playSound(400, 0.1, 'square');
        setTimeout(() => playSound(600, 0.1, 'square'), 50);
    },
    coin: () => {
        playSound(800, 0.1, 'sine');
        setTimeout(() => playSound(1000, 0.15, 'sine'), 50);
    },
    stomp: () => {
        playSound(200, 0.1, 'sawtooth');
    },
    powerUp: () => {
        playSound(500, 0.1);
        setTimeout(() => playSound(600, 0.1), 80);
        setTimeout(() => playSound(700, 0.1), 160);
        setTimeout(() => playSound(800, 0.2), 240);
    },
    die: () => {
        playSound(400, 0.1);
        setTimeout(() => playSound(350, 0.1), 100);
        setTimeout(() => playSound(300, 0.2), 200);
        setTimeout(() => playSound(200, 0.3), 300);
    },
};

// Player Class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER_SIZE;
        this.height = CONFIG.PLAYER_SIZE;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.wasOnGround = false;
        this.direction = 1;
        this.jumpCount = 0;
        this.invulnerable = false;
        this.isJumping = false;
        this.jumpTime = 0;
    }

    update() {
        // Horizontal movement with momentum
        if (gameState.keys['ArrowLeft'] || gameState.touchControls.left) {
            this.velocityX -= CONFIG.ACCELERATION;
            if (this.velocityX < -CONFIG.MOVE_SPEED) {
                this.velocityX = -CONFIG.MOVE_SPEED;
            }
            this.direction = -1;
        } else if (gameState.keys['ArrowRight'] || gameState.touchControls.right) {
            this.velocityX += CONFIG.ACCELERATION;
            if (this.velocityX > CONFIG.MOVE_SPEED) {
                this.velocityX = CONFIG.MOVE_SPEED;
            }
            this.direction = 1;
        } else {
            // Apply friction when no input
            this.velocityX *= CONFIG.FRICTION;
            // Stop completely if moving very slowly
            if (Math.abs(this.velocityX) < 0.1) {
                this.velocityX = 0;
            }
        }

        // Jumping - check if button is pressed
        const jumpPressed = gameState.keys['ArrowUp'] || gameState.keys[' '] || gameState.touchControls.jump;

        // Start jump
        if (jumpPressed && this.onGround && !this.isJumping) {
            this.velocityY = CONFIG.JUMP_POWER;
            this.onGround = false;
            this.isJumping = true;
            this.jumpTime = 0;
            sounds.jump();
            createJumpDust(this.x + this.width / 2, this.y + this.height);
            haptics.light();  // Light haptic on jump
        }

        // Variable jump height - hold button for higher jump
        if (this.isJumping && jumpPressed && this.velocityY < 0 && this.jumpTime < CONFIG.MAX_JUMP_HOLD_TIME) {
            // Apply reduced gravity while holding jump button
            this.velocityY += CONFIG.JUMP_HOLD_GRAVITY;
            this.jumpTime++;
        } else {
            // Apply normal gravity
            this.velocityY += CONFIG.GRAVITY;
            if (this.onGround) {
                this.isJumping = false;
                this.jumpTime = 0;
            }
        }

        // Cap fall speed
        if (this.velocityY > CONFIG.MAX_FALL_SPEED) {
            this.velocityY = CONFIG.MAX_FALL_SPEED;
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Keep player in world bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CONFIG.WORLD_WIDTH) this.x = CONFIG.WORLD_WIDTH - this.width;

        // Store previous ground state
        this.wasOnGround = this.onGround;

        // Reset onGround flag
        this.onGround = false;

        // Ground collision
        const groundY = CONFIG.WORLD_HEIGHT - 50;
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
        }

        // Platform collisions
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                }
            }
        });

        // Detect landing - trigger haptic when transitioning from air to ground
        if (this.onGround && !this.wasOnGround) {
            haptics.medium();  // Medium haptic on landing
        }

        // Update camera to follow player
        updateCamera();
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }

    draw() {
        ctx.save();

        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        // Blinking effect when invulnerable
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(screenX + this.width / 2, screenY + this.height + 5, this.width / 2.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (red shirt)
        ctx.fillStyle = '#E52521';
        ctx.beginPath();
        ctx.roundRect(screenX + 5, screenY + 20, this.width - 10, this.height - 30, 5);
        ctx.fill();

        // Overalls (blue)
        ctx.fillStyle = '#2B5FD9';
        ctx.fillRect(screenX + 8, screenY + 25, this.width - 16, this.height - 35);

        // Head (skin color)
        ctx.fillStyle = '#FFD1A1';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, screenY + 12, 12, 0, Math.PI * 2);
        ctx.fill();

        // Hat (red)
        ctx.fillStyle = '#E52521';
        ctx.beginPath();
        ctx.ellipse(screenX + this.width / 2, screenY + 8, 14, 8, 0, Math.PI, 2 * Math.PI);
        ctx.fill();
        ctx.fillRect(screenX + this.width / 2 - 8, screenY + 4, 16, 6);

        // Hat logo (M)
        ctx.fillStyle = 'white';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('M', screenX + this.width / 2, screenY + 9);

        // Eyes
        ctx.fillStyle = 'black';
        const eyeOffset = this.direction > 0 ? 2 : -2;
        ctx.fillRect(screenX + this.width / 2 - 3 + eyeOffset, screenY + 13, 2, 2);
        ctx.fillRect(screenX + this.width / 2 + 3 + eyeOffset, screenY + 13, 2, 2);

        // Mustache
        ctx.fillStyle = '#5C3C1C';
        ctx.fillRect(screenX + this.width / 2 - 6, screenY + 17, 12, 3);

        // Buttons
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, screenY + 30, 2, 0, Math.PI * 2);
        ctx.fill();

        // Shoes (brown)
        ctx.fillStyle = '#5C3C1C';
        ctx.fillRect(screenX + 5, screenY + this.height - 8, 12, 8);
        ctx.fillRect(screenX + this.width - 17, screenY + this.height - 8, 12, 8);

        ctx.restore();
    }

    hit() {
        if (this.invulnerable) return;

        gameState.lives--;
        document.getElementById('lives').textContent = gameState.lives;
        sounds.die();
        haptics.error();  // Error pattern when taking damage

        if (gameState.lives <= 0) {
            gameOver();
        } else {
            this.invulnerable = true;
            setTimeout(() => {
                this.invulnerable = false;
            }, 2000);
        }
    }
}

// Enemy Class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.ENEMY_SIZE;
        this.height = CONFIG.ENEMY_SIZE;
        this.velocityX = -2;
        this.velocityY = 0;
        this.alive = true;
        this.onGround = false;
    }

    update() {
        if (!this.alive) return;

        // Apply gravity
        this.velocityY += CONFIG.GRAVITY;
        if (this.velocityY > CONFIG.MAX_FALL_SPEED) {
            this.velocityY = CONFIG.MAX_FALL_SPEED;
        }

        // Horizontal movement
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Reset onGround flag
        this.onGround = false;

        // World bounds - reverse direction at edges
        if (this.x < 0) {
            this.x = 0;
            this.velocityX *= -1;
        }
        if (this.x + this.width > CONFIG.WORLD_WIDTH) {
            this.x = CONFIG.WORLD_WIDTH - this.width;
            this.velocityX *= -1;
        }

        // Ground collision
        const groundY = CONFIG.WORLD_HEIGHT - 50;
        if (this.y + this.height >= groundY) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
        }

        // Platform collisions
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                // Landing on platform from above
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                }
                // Hitting platform from side - reverse direction
                else if (Math.abs(this.velocityY) < 2) {
                    this.velocityX *= -1;
                }
            }
        });

        // Reverse direction if at edge of platform
        if (this.onGround) {
            const checkX = this.velocityX > 0 ? this.x + this.width + 5 : this.x - 5;
            const checkY = this.y + this.height + 10;
            let onPlatform = false;

            // Check if there's ground ahead
            if (checkY >= groundY) {
                onPlatform = true;
            } else {
                platforms.forEach(platform => {
                    if (checkX >= platform.x && checkX <= platform.x + platform.width &&
                        checkY >= platform.y && checkY <= platform.y + platform.height) {
                        onPlatform = true;
                    }
                });
            }

            if (!onPlatform) {
                this.velocityX *= -1;
            }
        }

        // Check collision with player
        if (this.alive && player.checkCollision(this)) {
            // Check if player is stomping enemy (coming from above)
            if (player.velocityY > 0 && player.y < this.y + this.height / 2) {
                // Player jumped on enemy
                this.alive = false;
                player.velocityY = -8;
                gameState.score += 100;
                document.getElementById('score').textContent = gameState.score;
                sounds.stomp();
                createParticles(this.x + this.width / 2, this.y + this.height / 2, 12, '#8B4513');
                screenShake(3, 10);
                haptics.heavy();  // Heavy haptic for stomping enemy
            } else {
                // Enemy hit player from side or below
                player.hit();
            }
        }
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }

    draw() {
        if (!this.alive) return;

        ctx.save();

        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(screenX + this.width / 2, screenY + this.height + 3, this.width / 2.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (brown mushroom)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, screenY + this.height / 3, this.width / 2.2, 0, Math.PI, true);
        ctx.fill();

        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, screenY + this.height / 3, this.width / 2.2, 0, Math.PI);
        ctx.fill();

        // Spots
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2 - 8, screenY + 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2 + 8, screenY + 8, 4, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        ctx.fillStyle = '#FFE4B5';
        ctx.fillRect(screenX + this.width / 2 - 6, screenY + this.height / 3, 12, this.height / 1.5);

        // Eyes (angry)
        ctx.fillStyle = 'black';
        ctx.fillRect(screenX + this.width / 2 - 8, screenY + this.height / 2, 4, 4);
        ctx.fillRect(screenX + this.width / 2 + 4, screenY + this.height / 2, 4, 4);

        // Eyebrows (angry)
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX + this.width / 2 - 10, screenY + this.height / 2 - 2);
        ctx.lineTo(screenX + this.width / 2 - 4, screenY + this.height / 2 - 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + this.width / 2 + 4, screenY + this.height / 2 - 1);
        ctx.lineTo(screenX + this.width / 2 + 10, screenY + this.height / 2 - 2);
        ctx.stroke();

        // Feet
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX + this.width / 2 - 10, screenY + this.height - 6, 7, 6);
        ctx.fillRect(screenX + this.width / 2 + 3, screenY + this.height - 6, 7, 6);

        ctx.restore();
    }
}

// Coin Class
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.COIN_SIZE;
        this.height = CONFIG.COIN_SIZE;
        this.collected = false;
        this.rotation = 0;
    }

    update() {
        this.rotation += 0.05;

        if (!this.collected && player.checkCollision(this)) {
            this.collected = true;
            gameState.coins++;
            gameState.score += 50;
            document.getElementById('coins').textContent = gameState.coins;
            document.getElementById('score').textContent = gameState.score;
            sounds.coin();
            createParticles(this.x + this.width / 2, this.y + this.height / 2, 8, '#FFD700');
            haptics.success();  // Success pattern for coin collection
        }
    }

    draw() {
        if (this.collected) return;

        ctx.save();

        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
        ctx.rotate(this.rotation);

        // Glow effect
        const glowSize = this.width / 2 + 5 + Math.sin(Date.now() / 200) * 3;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Coin
        const scale = Math.abs(Math.cos(this.rotation * 2)) * 0.5 + 0.5;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2 * scale, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 3 * scale, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Symbol
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);

        ctx.restore();
    }
}

// Platform Class
class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        // Brick texture
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Brick pattern
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        const brickWidth = CONFIG.BLOCK_SIZE;
        const brickHeight = CONFIG.BLOCK_SIZE / 2;

        for (let bx = 0; bx < this.width; bx += brickWidth) {
            for (let by = 0; by < this.height; by += brickHeight) {
                const offset = (by / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
                ctx.strokeRect(screenX + bx + offset, screenY + by, brickWidth, brickHeight);

                // Highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(screenX + bx + offset + 2, screenY + by + 2, brickWidth - 4, 3);

                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(screenX + bx + offset + 2, screenY + by + brickHeight - 5, brickWidth - 4, 3);
            }
        }
    }
}

// Game Objects
let player;
let enemies = [];
let coins = [];
let platforms = [];

// Camera system
function updateCamera() {
    // Center camera on player
    gameState.camera.x = player.x - canvas.width / 2 + player.width / 2;
    gameState.camera.y = player.y - canvas.height / 2 + player.height / 2;

    // Keep camera within world bounds
    gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, CONFIG.WORLD_WIDTH - canvas.width));
    gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, CONFIG.WORLD_HEIGHT - canvas.height));

    // Apply screen shake
    if (gameState.screenShake.duration > 0) {
        const shake = gameState.screenShake.intensity;
        gameState.camera.x += (Math.random() - 0.5) * shake;
        gameState.camera.y += (Math.random() - 0.5) * shake;
        gameState.screenShake.duration--;
    }
}

function initLevel() {
    player = new Player(100, 100);
    enemies = [];
    coins = [];
    platforms = [];
    particles = [];
    gameState.camera = { x: 0, y: 0 };
    gameState.screenShake = { intensity: 0, duration: 0 };

    const groundY = CONFIG.WORLD_HEIGHT - 50;

    // Create a varied level with better jump distances and recovery platforms
    // Lower platforms - closer together for easier jumps
    platforms.push(new Platform(250, groundY - 100, 180, 20));
    platforms.push(new Platform(500, groundY - 110, 200, 20));
    platforms.push(new Platform(800, groundY - 120, 180, 20));
    platforms.push(new Platform(1050, groundY - 100, 200, 20));
    platforms.push(new Platform(1350, groundY - 130, 180, 20));
    platforms.push(new Platform(1600, groundY - 110, 200, 20));
    platforms.push(new Platform(1900, groundY - 140, 180, 20));
    platforms.push(new Platform(2150, groundY - 120, 200, 20));
    platforms.push(new Platform(2450, groundY - 100, 180, 20));
    platforms.push(new Platform(2750, groundY - 110, 150, 20));

    // Mid-level platforms - easier spacing
    platforms.push(new Platform(200, groundY - 220, 160, 20));
    platforms.push(new Platform(420, groundY - 240, 170, 20));
    platforms.push(new Platform(660, groundY - 260, 160, 20));
    platforms.push(new Platform(900, groundY - 250, 180, 20));
    platforms.push(new Platform(1160, groundY - 270, 170, 20));
    platforms.push(new Platform(1420, groundY - 280, 180, 20));
    platforms.push(new Platform(1680, groundY - 270, 170, 20));
    platforms.push(new Platform(1930, groundY - 260, 180, 20));
    platforms.push(new Platform(2190, groundY - 250, 170, 20));
    platforms.push(new Platform(2440, groundY - 270, 160, 20));

    // High platforms (for portrait mode) - with better spacing
    platforms.push(new Platform(350, groundY - 360, 150, 20));
    platforms.push(new Platform(570, groundY - 380, 160, 20));
    platforms.push(new Platform(800, groundY - 400, 170, 20));
    platforms.push(new Platform(1040, groundY - 390, 160, 20));
    platforms.push(new Platform(1270, groundY - 410, 170, 20));
    platforms.push(new Platform(1510, groundY - 420, 160, 20));
    platforms.push(new Platform(1750, groundY - 410, 170, 20));
    platforms.push(new Platform(1990, groundY - 390, 160, 20));
    platforms.push(new Platform(2220, groundY - 400, 170, 20));
    platforms.push(new Platform(2460, groundY - 380, 160, 20));

    // Recovery/safety platforms - help if you fall
    platforms.push(new Platform(140, groundY - 150, 80, 20));
    platforms.push(new Platform(620, groundY - 170, 80, 20));
    platforms.push(new Platform(1180, groundY - 160, 80, 20));
    platforms.push(new Platform(1740, groundY - 180, 80, 20));
    platforms.push(new Platform(2300, groundY - 170, 80, 20));

    // Create enemies on various platforms
    enemies.push(new Enemy(300, groundY - 140));
    enemies.push(new Enemy(550, groundY - 150));
    enemies.push(new Enemy(850, groundY - 160));
    enemies.push(new Enemy(270, groundY - 260));
    enemies.push(new Enemy(500, groundY - 280));
    enemies.push(new Enemy(740, groundY - 300));
    enemies.push(new Enemy(1100, groundY - 140));
    enemies.push(new Enemy(1460, groundY - 320));
    enemies.push(new Enemy(1950, groundY - 160));
    enemies.push(new Enemy(2200, groundY - 160));

    // Create coins throughout the level at various heights
    for (let i = 0; i < 35; i++) {
        const x = 200 + i * 80;
        const heightVariation = Math.random() * 350 + 120;
        const y = groundY - heightVariation;
        coins.push(new Coin(x, y));
    }

    // Trail of coins on high platforms
    for (let i = 0; i < 12; i++) {
        const x = 380 + i * 190;
        const y = groundY - 440;
        coins.push(new Coin(x, y));
    }

    // Bonus coins between platforms
    for (let i = 0; i < 8; i++) {
        const x = 300 + i * 330;
        const y = groundY - 180;
        coins.push(new Coin(x, y));
    }
}

// Game Loop
function gameLoop() {
    if (!gameState.running) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    drawClouds();

    // Draw ground with camera offset
    const groundY = CONFIG.WORLD_HEIGHT - 50;
    const groundScreenY = groundY - gameState.camera.y;
    const groundScreenX = -gameState.camera.x;

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(groundScreenX, groundScreenY, CONFIG.WORLD_WIDTH, 50);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(groundScreenX, groundScreenY - 5, CONFIG.WORLD_WIDTH, 5);

    // Grass details (only draw visible portion)
    ctx.strokeStyle = '#32CD32';
    ctx.lineWidth = 2;
    const startGrass = Math.floor(gameState.camera.x / 15) * 15;
    const endGrass = startGrass + canvas.width + 30;
    for (let i = startGrass; i < endGrass; i += 15) {
        const screenX = i - gameState.camera.x;
        ctx.beginPath();
        ctx.moveTo(screenX, groundScreenY - 5);
        ctx.lineTo(screenX + 3, groundScreenY - 10);
        ctx.lineTo(screenX + 6, groundScreenY - 5);
        ctx.stroke();
    }

    // Update and draw platforms
    platforms.forEach(platform => platform.draw());

    // Update and draw coins
    coins.forEach(coin => {
        coin.update();
        coin.draw();
    });

    // Update and draw enemies
    enemies.forEach(enemy => {
        enemy.update();
        enemy.draw();
    });

    // Update and draw player
    player.update();
    player.draw();

    // Update and draw particles
    updateParticles();
    drawParticles();

    // Check win condition
    if (coins.every(coin => coin.collected)) {
        setTimeout(() => {
            gameState.level++;
            sounds.powerUp();
            alert(`Level ${gameState.level - 1} Complete!`);
            initLevel();
        }, 100);
    }

    requestAnimationFrame(gameLoop);
}

let cloudPositions = [];

function initClouds() {
    cloudPositions = [];
    for (let i = 0; i < 15; i++) {
        cloudPositions.push({
            x: Math.random() * CONFIG.WORLD_WIDTH,
            y: Math.random() * 250 + 20,
            scale: Math.random() * 0.5 + 0.5,
            speed: Math.random() * 0.1 + 0.05,
        });
    }
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    cloudPositions.forEach(cloud => {
        // Parallax effect - clouds move slower than camera
        const parallaxX = cloud.x - gameState.camera.x * 0.5;
        const parallaxY = cloud.y - gameState.camera.y * 0.3;

        // Only draw if visible on screen
        if (parallaxX > -100 && parallaxX < canvas.width + 100 &&
            parallaxY > -50 && parallaxY < canvas.height + 50) {
            ctx.save();
            ctx.translate(parallaxX, parallaxY);
            ctx.scale(cloud.scale, cloud.scale);

            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.arc(25, 0, 25, 0, Math.PI * 2);
            ctx.arc(50, 0, 20, 0, Math.PI * 2);
            ctx.arc(25, -10, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        cloud.x -= cloud.speed;
        if (cloud.x < -100) {
            cloud.x = CONFIG.WORLD_WIDTH + 50;
        }
    });
}

// Input Handlers
window.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
});

// Touch Controls
function setupTouchControls() {
    const leftBtn = document.getElementById('btn-left');
    const rightBtn = document.getElementById('btn-right');
    const jumpBtn = document.getElementById('btn-jump');

    // Prevent context menu
    [leftBtn, rightBtn, jumpBtn].forEach(btn => {
        btn.addEventListener('contextmenu', e => e.preventDefault());
    });

    // Helper to clear all controls (fixes stuck controls)
    const clearAllControls = () => {
        gameState.touchControls.left = false;
        gameState.touchControls.right = false;
        gameState.touchControls.jump = false;
    };

    // Left button
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.touchControls.left = true;
    });
    leftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        gameState.touchControls.left = false;
    });
    leftBtn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        gameState.touchControls.left = false;
    });

    // Right button
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.touchControls.right = true;
    });
    rightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        gameState.touchControls.right = false;
    });
    rightBtn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        gameState.touchControls.right = false;
    });

    // Jump button
    jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.touchControls.jump = true;
    });
    jumpBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        gameState.touchControls.jump = false;
    });
    jumpBtn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        gameState.touchControls.jump = false;
    });

    // Global touchend/touchcancel as safety net
    document.addEventListener('touchend', () => {
        // Small delay to allow specific button handlers to fire first
        setTimeout(() => {
            // Only clear if no touches are active
            if (!document.querySelector(':active')) {
                clearAllControls();
            }
        }, 50);
    });

    document.addEventListener('touchcancel', clearAllControls);

    // Mouse support for testing
    leftBtn.addEventListener('mousedown', () => gameState.touchControls.left = true);
    leftBtn.addEventListener('mouseup', () => gameState.touchControls.left = false);
    leftBtn.addEventListener('mouseleave', () => gameState.touchControls.left = false);
    rightBtn.addEventListener('mousedown', () => gameState.touchControls.right = true);
    rightBtn.addEventListener('mouseup', () => gameState.touchControls.right = false);
    rightBtn.addEventListener('mouseleave', () => gameState.touchControls.right = false);
    jumpBtn.addEventListener('mousedown', () => gameState.touchControls.jump = true);
    jumpBtn.addEventListener('mouseup', () => gameState.touchControls.jump = false);
    jumpBtn.addEventListener('mouseleave', () => gameState.touchControls.jump = false);
}

// Game Controls
function startGame() {
    gameState.running = true;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.lives = 3;
    gameState.level = 1;

    document.getElementById('score').textContent = '0';
    document.getElementById('coins').textContent = '0';
    document.getElementById('lives').textContent = '3';

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');

    initClouds();
    initLevel();
    gameLoop();
}

function gameOver() {
    gameState.running = false;
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// UI Event Listeners
document.getElementById('start-btn').addEventListener('click', () => {
    // Resume audio context on user interaction
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    startGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    startGame();
});

// Initialize
setupTouchControls();
initClouds();

// Add CanvasRenderingContext2D.roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
}
