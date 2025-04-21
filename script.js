window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // === Einstellungen ===
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // === Spritesheet laden ===
  const catSprite = new Image();
  const TOTAL_FRAMES = 4;
  let frameW, frameH;
  catSprite.src = 'sprites/cat_sheet.png';

  catSprite.onload = () => {
    // Dynamisch Frame-Größe bestimmen
    frameW = catSprite.width / TOTAL_FRAMES;
    frameH = catSprite.height;
    console.log('✅ Cat-Sheet loaded:', catSprite.width + '×' + catSprite.height,
                '→ frame:', frameW + '×' + frameH);
  };
  catSprite.onerror = () => {
    console.error('❌ Cat-Sheet nicht gefunden unter sprites/cat_sheet.png');
  };

  // ===== Spieler =====
  const SPRITE_SIZE = 32;
  const startX = 50;
  const startY = canvas.height - groundHeight - SPRITE_SIZE;
  const player = {
    x: startX, y: startY,
    width: SPRITE_SIZE, height: SPRITE_SIZE,
    dx: 0, dy: 0,
    speed: 3, jumpPower: -12,
    onGround: true
  };

  // ===== Level-Daten =====
  let platforms = [], holes = [], enemies = [], collectibles = [], projectiles = [];
  let score = 0;

  function generateLevel() {
    platforms = []; holes = []; enemies = []; collectibles = []; projectiles = [];
    const groundY = canvas.height - groundHeight - player.height;

    // Einige Plattformen
    let lastX = player.x + player.width + 20;
    for (let i = 0; i < 3; i++) {
      const w = 80 + Math.random() * 40;
      const gap = 50 + Math.random() * 80;
      let x = lastX + gap;
      if (x + w > canvas.width - 10) x = canvas.width - 10 - w;
      const y = groundY - (20 + Math.random() * 60);
      platforms.push({ x, y, width: w, height: 10 });
      holes.push({ x, width: w });
      lastX = x + w;
    }

    // Ein Gegner
    enemies = [{
      x: canvas.width - 60, y: groundY,
      width: SPRITE_SIZE, height: SPRITE_SIZE,
      dx: -2, dy: 0, jumpPower: -10, onGround: true, jumpCooldown: 0
    }];

    // 1-2 Collectibles
    collectibles = [];
    for (let i = 0; i < 2; i++) {
      const p = platforms[Math.floor(Math.random() * platforms.length)];
      collectibles.push({
        x: p.x + p.width/2 - 8,
        y: p.y - 16,
        width: 16, height: 16,
        color: 'gold'
      });
    }
    score = 0;
  }

  function resetGame() {
    player.x = startX;
    player.y = startY;
    player.dx = player.dy = 0;
    player.onGround = true;
    currentBackground = 0;
    generateLevel();
  }

  // ===== Steuerung =====
  const keys = {};
  window.addEventListener('keydown', e => {
    if (!keys[e.code]) {
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && player.onGround) {
        player.dy = player.jumpPower;
        player.onGround = false;
      }
      if (e.code === 'Space') {
        projectiles.push({
          x: player.x + player.width,
          y: player.y + player.height/2,
          dx: 8, dy: -8, radius: 5, color: 'yellow'
        });
      }
    }
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ===== Start =====
  generateLevel();
  let lastTime = performance.now();

  function gameLoop(time) {
    const delta = time - lastTime;
    lastTime = time;

    // -- Update Spieler --
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) resetGame();

    player.dy += gravity;
    const oldY = player.y;
    player.y += player.dy;
    player.onGround = false;
    // Kollision mit Plattformen
    if (player.dy > 0) {
      for (const p of platforms) {
        if (oldY + player.height <= p.y &&
            player.y + player.height >= p.y &&
            player.x + player.width > p.x &&
            player.x < p.x + p.width) {
          player.y = p.y - player.height;
          player.dy = 0;
          player.onGround = true;
          break;
        }
      }
    }
    // Boden/Löcher
    const groundY = canvas.height - groundHeight - player.height;
    const overHole = holes.some(h => player.x + player.width > h.x && player.x < h.x + h.width);
    if (!overHole && player.y + player.height >= canvas.height - groundHeight) {
      player.y = groundY;
      player.dy = 0;
      player.onGround = true;
    }
    if (player.y > canvas.height) resetGame();

    // -- Update sonstige Objekte (Gegner, Projektile, Collectibles) --
    // ... (bleibt unverändert)

    // -- Zeichnen --
    ctx.fillStyle = backgrounds[currentBackground];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Boden mit Löchern
    ctx.fillStyle = '#444';
    let lx = 0;
    for (const h of holes) {
      ctx.fillRect(lx, canvas.height - groundHeight, h.x - lx, groundHeight);
      lx = h.x + h.width;
    }
    ctx.fillRect(lx, canvas.height - groundHeight, canvas.width - lx, groundHeight);

    // Plattformen
    ctx.fillStyle = '#888';
    for (const p of platforms) {
      ctx.fillRect(p.x, p.y, p.width, p.height);
    }

    // Collectibles
    for (const c of collectibles) {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.width, c.height);
    }

    // Projektile
    for (const pr of projectiles) {
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
      ctx.fillStyle = pr.color;
      ctx.fill();
    }

    // Gegner
    ctx.fillStyle = 'green';
    for (const e of enemies) {
      ctx.fillRect(e.x, e.y, e.width, e.height);
    }

    // Spieler: erstes Frame zuschneiden und auf 32×32 skalieren
    if (frameW && frameH) {
      ctx.drawImage(
        catSprite,
        0, 0,            // Quelle: erstes Frame oben links
        frameW, frameH,  // Quelle: tatsächliche Frame-Größe
        player.x, player.y,
        player.width, player.height // Ziel: 32×32
      );
    }

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, 10, 20);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
