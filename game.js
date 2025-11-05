// Game Configuration
const CONFIG = {
    GRAVITY: 0.6,
    JUMP_POWER: -12,
    MOVE_SPEED: 5,
    MAX_FALL_SPEED: 15,
    PLAYER_SIZE: 40,
    ENEMY_SIZE: 35,
    COIN_SIZE: 25,
    BLOCK_SIZE: 40,
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
        this.direction = 1;
        this.jumpCount = 0;
        this.invulnerable = false;
    }

    update() {
        // Horizontal movement
        if (gameState.keys['ArrowLeft'] || gameState.touchControls.left) {
            this.velocityX = -CONFIG.MOVE_SPEED;
            this.direction = -1;
        } else if (gameState.keys['ArrowRight'] || gameState.touchControls.right) {
            this.velocityX = CONFIG.MOVE_SPEED;
            this.direction = 1;
        } else {
            this.velocityX = 0;
        }

        // Jumping
        if ((gameState.keys['ArrowUp'] || gameState.keys[' '] || gameState.touchControls.jump) && this.onGround) {
            this.velocityY = CONFIG.JUMP_POWER;
            this.onGround = false;
            sounds.jump();
            gameState.touchControls.jump = false;
        }

        // Apply gravity
        this.velocityY += CONFIG.GRAVITY;
        if (this.velocityY > CONFIG.MAX_FALL_SPEED) {
            this.velocityY = CONFIG.MAX_FALL_SPEED;
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Keep player on screen
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        // Ground collision
        if (this.y + this.height >= canvas.height - 50) {
            this.y = canvas.height - 50 - this.height;
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
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }

    draw() {
        ctx.save();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height + 5, this.width / 2.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (red shirt)
        ctx.fillStyle = '#E52521';
        ctx.beginPath();
        ctx.roundRect(this.x + 5, this.y + 20, this.width - 10, this.height - 30, 5);
        ctx.fill();

        // Overalls (blue)
        ctx.fillStyle = '#2B5FD9';
        ctx.fillRect(this.x + 8, this.y + 25, this.width - 16, this.height - 35);

        // Head (skin color)
        ctx.fillStyle = '#FFD1A1';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 12, 12, 0, Math.PI * 2);
        ctx.fill();

        // Hat (red)
        ctx.fillStyle = '#E52521';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + 8, 14, 8, 0, Math.PI, 2 * Math.PI);
        ctx.fill();
        ctx.fillRect(this.x + this.width / 2 - 8, this.y + 4, 16, 6);

        // Hat logo (M)
        ctx.fillStyle = 'white';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('M', this.x + this.width / 2, this.y + 9);

        // Eyes
        ctx.fillStyle = 'black';
        const eyeOffset = this.direction > 0 ? 2 : -2;
        ctx.fillRect(this.x + this.width / 2 - 3 + eyeOffset, this.y + 13, 2, 2);
        ctx.fillRect(this.x + this.width / 2 + 3 + eyeOffset, this.y + 13, 2, 2);

        // Mustache
        ctx.fillStyle = '#5C3C1C';
        ctx.fillRect(this.x + this.width / 2 - 6, this.y + 17, 12, 3);

        // Buttons
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 30, 2, 0, Math.PI * 2);
        ctx.fill();

        // Shoes (brown)
        ctx.fillStyle = '#5C3C1C';
        ctx.fillRect(this.x + 5, this.y + this.height - 8, 12, 8);
        ctx.fillRect(this.x + this.width - 17, this.y + this.height - 8, 12, 8);

        ctx.restore();
    }

    hit() {
        if (this.invulnerable) return;

        gameState.lives--;
        document.getElementById('lives').textContent = gameState.lives;
        sounds.die();

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
        this.alive = true;
    }

    update() {
        this.x += this.velocityX;

        if (this.x < 0 || this.x + this.width > canvas.width) {
            this.velocityX *= -1;
        }

        // Check collision with player
        if (this.alive && player.checkCollision(this)) {
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= this.y + 10) {
                // Player jumped on enemy
                this.alive = false;
                player.velocityY = -8;
                gameState.score += 100;
                document.getElementById('score').textContent = gameState.score;
                sounds.stomp();
            } else if (!player.invulnerable) {
                // Enemy hit player
                player.hit();
            }
        }
    }

    draw() {
        if (!this.alive) return;

        ctx.save();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height + 3, this.width / 2.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (brown mushroom)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 3, this.width / 2.2, 0, Math.PI, true);
        ctx.fill();

        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 3, this.width / 2.2, 0, Math.PI);
        ctx.fill();

        // Spots
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 8, this.y + 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 + 8, this.y + 8, 4, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        ctx.fillStyle = '#FFE4B5';
        ctx.fillRect(this.x + this.width / 2 - 6, this.y + this.height / 3, 12, this.height / 1.5);

        // Eyes (angry)
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + this.width / 2 - 8, this.y + this.height / 2, 4, 4);
        ctx.fillRect(this.x + this.width / 2 + 4, this.y + this.height / 2, 4, 4);

        // Eyebrows (angry)
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2 - 10, this.y + this.height / 2 - 2);
        ctx.lineTo(this.x + this.width / 2 - 4, this.y + this.height / 2 - 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2 + 4, this.y + this.height / 2 - 1);
        ctx.lineTo(this.x + this.width / 2 + 10, this.y + this.height / 2 - 2);
        ctx.stroke();

        // Feet
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + this.width / 2 - 10, this.y + this.height - 6, 7, 6);
        ctx.fillRect(this.x + this.width / 2 + 3, this.y + this.height - 6, 7, 6);

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
        }
    }

    draw() {
        if (this.collected) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

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
        // Brick texture
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Brick pattern
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;

        const brickWidth = CONFIG.BLOCK_SIZE;
        const brickHeight = CONFIG.BLOCK_SIZE / 2;

        for (let bx = 0; bx < this.width; bx += brickWidth) {
            for (let by = 0; by < this.height; by += brickHeight) {
                const offset = (by / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
                ctx.strokeRect(this.x + bx + offset, this.y + by, brickWidth, brickHeight);

                // Highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(this.x + bx + offset + 2, this.y + by + 2, brickWidth - 4, 3);

                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(this.x + bx + offset + 2, this.y + by + brickHeight - 5, brickWidth - 4, 3);
            }
        }
    }
}

// Game Objects
let player;
let enemies = [];
let coins = [];
let platforms = [];

function initLevel() {
    player = new Player(50, canvas.height - 150);
    enemies = [];
    coins = [];
    platforms = [];

    // Create platforms
    platforms.push(new Platform(200, canvas.height - 150, 200, 20));
    platforms.push(new Platform(500, canvas.height - 250, 200, 20));
    platforms.push(new Platform(100, canvas.height - 350, 150, 20));
    platforms.push(new Platform(400, canvas.height - 400, 180, 20));

    // Create enemies
    enemies.push(new Enemy(250, canvas.height - 190));
    enemies.push(new Enemy(550, canvas.height - 290));
    enemies.push(new Enemy(420, canvas.height - 440));

    // Create coins
    for (let i = 0; i < 8; i++) {
        const x = 150 + i * 80;
        const y = canvas.height - 200 - Math.random() * 200;
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

    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 55, canvas.width, 5);

    // Grass details
    ctx.strokeStyle = '#32CD32';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 15) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height - 55);
        ctx.lineTo(i + 3, canvas.height - 60);
        ctx.lineTo(i + 6, canvas.height - 55);
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
    for (let i = 0; i < 5; i++) {
        cloudPositions.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 200 + 20,
            scale: Math.random() * 0.5 + 0.5,
        });
    }
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    cloudPositions.forEach(cloud => {
        ctx.save();
        ctx.translate(cloud.x, cloud.y);
        ctx.scale(cloud.scale, cloud.scale);

        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.arc(25, 0, 25, 0, Math.PI * 2);
        ctx.arc(50, 0, 20, 0, Math.PI * 2);
        ctx.arc(25, -10, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        cloud.x -= 0.2;
        if (cloud.x < -100) {
            cloud.x = canvas.width + 50;
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

    // Left button
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.touchControls.left = true;
    });
    leftBtn.addEventListener('touchend', (e) => {
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

    // Jump button
    jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.touchControls.jump = true;
    });
    jumpBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        gameState.touchControls.jump = false;
    });

    // Mouse support for testing
    leftBtn.addEventListener('mousedown', () => gameState.touchControls.left = true);
    leftBtn.addEventListener('mouseup', () => gameState.touchControls.left = false);
    rightBtn.addEventListener('mousedown', () => gameState.touchControls.right = true);
    rightBtn.addEventListener('mouseup', () => gameState.touchControls.right = false);
    jumpBtn.addEventListener('mousedown', () => gameState.touchControls.jump = true);
    jumpBtn.addEventListener('mouseup', () => gameState.touchControls.jump = false);
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
