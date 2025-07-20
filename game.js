class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.initSounds();
    }
    
    initSounds() {
        // Create synthetic sounds using Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.sounds = {
            drop: () => this.createDropSound(),
            perfect: () => this.createPerfectSound(),
            gameOver: () => this.createGameOverSound(),
            whoosh: () => this.createWhooshSound()
        };
    }
    
    createDropSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    createPerfectSound() {
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(523, this.audioContext.currentTime);
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(659, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 0.3);
        oscillator2.stop(this.audioContext.currentTime + 0.3);
    }
    
    createGameOverSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(55, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    createWhooshSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'white';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    play(soundName) {
        if (this.enabled && this.sounds[soundName]) {
            try {
                this.sounds[soundName]();
            } catch (e) {
                console.log('Sound error:', e);
            }
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
    }
}

class StackRage {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        
        this.gameState = 'waiting';
        this.score = 0;
        this.combo = 0;
        this.blocks = [];
        this.currentBlock = null;
        this.blockWidth = 80;
        this.blockHeight = 25;
        this.speed = 2;
        this.direction = 1;
        this.perfectThreshold = 3;
        this.cameraY = 0;
        this.targetCameraY = 0;
        
        this.soundManager = new SoundManager();
        this.setupCanvas();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupCanvas() {
        // Make canvas responsive
        const container = this.canvas.parentElement;
        const containerWidth = Math.min(350, window.innerWidth - 20);
        const containerHeight = Math.min(500, window.innerHeight * 0.7);
        
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        this.canvas.style.width = containerWidth + 'px';
        this.canvas.style.height = containerHeight + 'px';
    }
    
    init() {
        this.gameState = 'playing';
        this.score = 0;
        this.combo = 0;
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.speed = 2;
        this.direction = 1;
        
        this.blocks = [{
            x: this.canvas.width / 2 - this.blockWidth / 2,
            y: this.canvas.height - this.blockHeight,
            width: this.blockWidth,
            height: this.blockHeight,
            color: '#FF6B35'
        }];
        
        this.spawnNewBlock();
        this.updateScore();
        
        // Show game UI
        document.getElementById('gameTitle').style.display = 'block';
        document.getElementById('gameScore').style.display = 'block';
        document.getElementById('instructions').style.display = 'none';
    }
    
    setupEventListeners() {
        // Enhanced touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.dropBlock();
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.gameState === 'playing') {
                this.dropBlock();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault();
                this.dropBlock();
            }
        });
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    spawnNewBlock() {
        const lastBlock = this.blocks[this.blocks.length - 1];
        const colors = ['#FF6B35', '#E55A2B', '#D4491F', '#C23813', '#B02707'];
        
        this.currentBlock = {
            x: 0,
            y: lastBlock.y - this.blockHeight - 8,
            width: lastBlock.width,
            height: this.blockHeight,
            color: colors[Math.floor(Math.random() * colors.length)],
            moving: true
        };
        
        this.soundManager.play('whoosh');
    }
    
    updateCurrentBlock() {
        if (!this.currentBlock || !this.currentBlock.moving) return;
        
        this.currentBlock.x += this.speed * this.direction;
        
        if (this.currentBlock.x <= 0 || 
            this.currentBlock.x + this.currentBlock.width >= this.canvas.width) {
            this.direction *= -1;
        }
    }
    
    dropBlock() {
        if (this.gameState !== 'playing' || !this.currentBlock || !this.currentBlock.moving) return;
        
        this.currentBlock.moving = false;
        
        const lastBlock = this.blocks[this.blocks.length - 1];
        const overlap = this.calculateOverlap(this.currentBlock, lastBlock);
        
        if (overlap <= 0) {
            this.gameOver();
            return;
        }
        
        const leftOverhang = Math.max(0, lastBlock.x - this.currentBlock.x);
        const rightOverhang = Math.max(0, (this.currentBlock.x + this.currentBlock.width) - (lastBlock.x + lastBlock.width));
        
        const newWidth = this.currentBlock.width - leftOverhang - rightOverhang;
        const newX = this.currentBlock.x + leftOverhang;
        
        this.currentBlock.x = newX;
        this.currentBlock.width = newWidth;
        
        this.blocks.push(this.currentBlock);
        
        const perfectDrop = Math.abs(this.currentBlock.x - lastBlock.x) <= this.perfectThreshold;
        
        if (perfectDrop) {
            this.combo++;
            this.score += 10 + (this.combo * 5);
            this.addPerfectEffect();
            this.soundManager.play('perfect');
        } else {
            this.combo = 0;
            this.score += 1;
            this.soundManager.play('drop');
        }
        
        this.updateScore();
        this.increaseSpeed();
        this.updateCamera();
        
        setTimeout(() => {
            if (this.gameState === 'playing') {
                this.spawnNewBlock();
            }
        }, 200);
    }
    
    calculateOverlap(block1, block2) {
        const left = Math.max(block1.x, block2.x);
        const right = Math.min(block1.x + block1.width, block2.x + block2.width);
        return Math.max(0, right - left);
    }
    
    increaseSpeed() {
        this.speed = Math.min(5, 2 + (this.blocks.length - 1) * 0.08);
    }
    
    updateCamera() {
        if (this.blocks.length > 0) {
            const topBlock = this.blocks[this.blocks.length - 1];
            
            // When the top block gets too high, move camera down to follow it
            if (topBlock.y < this.canvas.height * 0.4) {
                this.targetCameraY = (this.canvas.height * 0.4) - topBlock.y;
            }
        }
    }
    
    smoothCamera() {
        const easing = 0.12;
        this.cameraY += (this.targetCameraY - this.cameraY) * easing;
    }
    
    addPerfectEffect() {
        const block = this.currentBlock;
        setTimeout(() => {
            if (this.ctx) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.8;
                this.ctx.fillStyle = '#FFD700';
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(block.x - 3, block.y - 3, block.width + 6, block.height + 6);
                this.ctx.restore();
            }
        }, 50);
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        document.getElementById('startScore').textContent = this.score;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'block';
        this.soundManager.play('gameOver');
    }
    
    render() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#B0E0E6');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(0, this.cameraY);
        
        // Draw all placed blocks with 3D effect
        this.blocks.forEach((block, index) => {
            // Main block
            this.ctx.fillStyle = block.color;
            this.ctx.fillRect(block.x, block.y, block.width, block.height);
            
            // 3D effect - top face
            this.ctx.fillStyle = this.lightenColor(block.color, 20);
            this.ctx.beginPath();
            this.ctx.moveTo(block.x, block.y);
            this.ctx.lineTo(block.x + 4, block.y - 4);
            this.ctx.lineTo(block.x + block.width + 4, block.y - 4);
            this.ctx.lineTo(block.x + block.width, block.y);
            this.ctx.closePath();
            this.ctx.fill();
            
            // 3D effect - right face
            this.ctx.fillStyle = this.darkenColor(block.color, 15);
            this.ctx.beginPath();
            this.ctx.moveTo(block.x + block.width, block.y);
            this.ctx.lineTo(block.x + block.width + 4, block.y - 4);
            this.ctx.lineTo(block.x + block.width + 4, block.y + block.height - 4);
            this.ctx.lineTo(block.x + block.width, block.y + block.height);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Block outline
            this.ctx.strokeStyle = this.darkenColor(block.color, 30);
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(block.x, block.y, block.width, block.height);
        });
        
        // Draw current moving block
        if (this.currentBlock) {
            this.ctx.fillStyle = this.currentBlock.color;
            this.ctx.fillRect(this.currentBlock.x, this.currentBlock.y, this.currentBlock.width, this.currentBlock.height);
            
            // 3D effect for moving block
            this.ctx.fillStyle = this.lightenColor(this.currentBlock.color, 20);
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentBlock.x, this.currentBlock.y);
            this.ctx.lineTo(this.currentBlock.x + 4, this.currentBlock.y - 4);
            this.ctx.lineTo(this.currentBlock.x + this.currentBlock.width + 4, this.currentBlock.y - 4);
            this.ctx.lineTo(this.currentBlock.x + this.currentBlock.width, this.currentBlock.y);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.fillStyle = this.darkenColor(this.currentBlock.color, 15);
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentBlock.x + this.currentBlock.width, this.currentBlock.y);
            this.ctx.lineTo(this.currentBlock.x + this.currentBlock.width + 4, this.currentBlock.y - 4);
            this.ctx.lineTo(this.currentBlock.x + this.currentBlock.width + 4, this.currentBlock.y + this.currentBlock.height - 4);
            this.ctx.lineTo(this.currentBlock.x + this.currentBlock.width, this.currentBlock.y + this.currentBlock.height);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.strokeStyle = this.darkenColor(this.currentBlock.color, 30);
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(this.currentBlock.x, this.currentBlock.y, this.currentBlock.width, this.currentBlock.height);
        }
        
        this.ctx.restore();
        
        // Draw UI elements on top
        if (this.combo > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.strokeStyle = '#FF6B35';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(`COMBO x${this.combo}!`, 10, 30);
            this.ctx.fillText(`COMBO x${this.combo}!`, 10, 30);
        }
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + 
               (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
               .toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R>255?255:R<0?0:R)*0x10000 + 
               (G>255?255:G<0?0:G)*0x100 + (B>255?255:B<0?0:B))
               .toString(16).slice(1);
    }
    
    gameLoop() {
        if (this.gameState === 'playing') {
            this.updateCurrentBlock();
        }
        
        this.smoothCamera();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

function startGame() {
    // Initialize audio context on user interaction
    if (game.soundManager.audioContext.state === 'suspended') {
        game.soundManager.audioContext.resume();
    }
    
    document.getElementById('startScreen').classList.add('hidden');
    game.init();
}

function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('gameTitle').style.display = 'none';
    document.getElementById('gameScore').style.display = 'none';
    document.getElementById('instructions').style.display = 'block';
    game.gameState = 'waiting';
}

// Initialize the game
let game = new StackRage();