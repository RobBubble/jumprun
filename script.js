window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // === Grundeinstellungen ===
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // === Laden des einzelnen Cat-Sprites ===
  const catSprite = new Image();
  catSprite.src = 'sprites/single_cat.png'; // 32×32 Pixel
  const SPRITE_SIZE = 32;

  // === Spieler ===
  const player = {
    x: 50,
    y: canvas.height - groundHeight - SPRITE_SIZE,
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    dx: 0,
    dy: 0,
    speed: 3,
    jumpPower: -12,
    onGround: true
  };

  // === Level-Daten ===
  let platforms = [], holes = [], enemies = [], collectibles = [], projectiles = [];
  let score = 0;

  function generateLevel() {
    platforms = [];
    holes = [];
    enemies = [];
    collectibles = [];
    projectiles = [];
    const groundY = canvas.height - groundHeight - player.height;

    // Plattformen und Löcher
    let lastX = player.x + player.width + 20;
    for (let i = 0; i < 3; i++) {
      const w = 80 + Math.random() * 40;
      let x = lastX + 50 + Math.random() * 80;
      if (x + w > canvas.width - 10) x = canvas.width - 10 - w;
      const y = groundY - (20 + Math.random() * 60);
      platforms.push({ x, y, width: w, height: 10 });
      holes.push({ x, width: w });
      lastX = x + w;
    }

    // Ein Gegner
    enemies = [{
      x: canvas.width - 60,
      y: groundY,
      width: SPRITE_SIZE,
      height: SPRITE_SIZE,
      dx: -2,
      dy: 0
    }];

    // Collectibles
    collectibles = [];
    for (let i = 0; i < 2; i++) {
      const p = platforms[Math.floor(Math.random() * platforms.length)];
      collectibles.push({
        x: p.x + p.width / 2 - 8,
        y: p.y - 16,
        width: 16,
        height: 16,
        color: 'gold'
      });
    }

    score = 0;
  }

  function resetGame() {
    player.x = 50;
    player.y = canvas.height - groundHeight - SPRITE_SIZE;
    player.dx = 0;
    player.dy = 0;
    player.onGround = true;
    currentBackground = 0;
    generateLevel();
  }

  // === Steuerung ===
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
          y: player.y + player.height / 2,
          dx: 8,
          dy: -8,
          radius: 5,
          color: 'yellow'
        });
      }
    }
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  // Initiales Level
  generateLevel();

  let lastTime = performance.now();
  function gameLoop(time) {
    const delta = time - lastTime;
    lastTime = time;

    // --- Update Spieler ---
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) resetGame();

    // Fall / Sprung
    player.dy += gravity;
    const oldY = player.y;
    player.y += player.dy;
    player.onGround = false;
    // Plattform-Kollision
    if (player.dy > 0) {
      for (const p of platforms) {
        if (
          oldY + player.height <= p.y &&
          player.y + player.height >= p.y &&
          player.x + player.width > p.x &&
          player.x < p.x + p.width
        ) {
          player.y = p.y - player.height;
          player.dy = 0;
          player.onGround = true;
          break;
        }
      }
    }
    // Boden & Löcher
    const groundY = canvas.height - groundHeight - player.height;
    const overHole = holes.some(h => player.x + player.width > h.x && player.x < h.x + h.width);
    if (!overHole && player.y + player.height >= canvas.height - groundHeight) {
      player.y = groundY;
      player.dy = 0;
      player.onGround = true;
    }
    if (player.y > canvas.height) resetGame();

    // --- Update Projektile ---
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const pr = projectiles[i];
      pr.dy = (pr.dy || pr.dy === 0 ? pr.dy : -8) + gravity;
      pr.x += pr.dx;
      pr.y += pr.dy;
      let hit = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (pr.x > e.x && pr.x < e.x + e.width &&
            pr.y > e.y && pr.y < e.y + e.height) {
          enemies.splice(j, 1);
          hit = true;
          break;
        }
      }
      if (hit || pr.x > canvas.width || pr.y > canvas.height) {
        projectiles.splice(i, 1);
      }
    }

    // --- Update Gegner ---
    for (const e of enemies) {
      e.x += e.dx;
      e.dy = (e.dy || 0) + gravity;
      e.y += e.dy;
      const gy = canvas.height - groundHeight - e.height;
      if (e.y >= gy) {
        e.y = gy;
        e.dy = 0;
      }
      if (e.x + e.width < 0) {
        e.x = canvas.width;
        e.y = gy;
      }
      // Kollision Spieler-Gegner
      if (
        player.x < e.x + e.width && player.x + player.width > e.x &&
        player.y < e.y + e.height && player.y + player.height > e.y
      ) {
        resetGame();
      }
    }

    // --- Update Collectibles ---
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const c = collectibles[i];
      if (
        player.x < c.x + c.width && player.x + player.width > c.x &&
        player.y < c.y + c.height && player.y + player.height > c.y
      ) {
        score++;
        collectibles.splice(i, 1);
      }
    }

    // --- Zeichnen ---
    // Hintergrund
    ctx.fillStyle = backgrounds[currentBackground];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Boden mit Löchern
    ctx.fillStyle = '#444';
    let lastXdraw = 0;
    for (const h of holes) {
      ctx.fillRect(lastXdraw, canvas.height - groundHeight, h.x - lastXdraw, groundHeight);
      lastXdraw = h.x + h.width;
    }
    ctx.fillRect(lastXdraw, canvas.height - groundHeight, canvas.width - lastXdraw, groundHeight);

    // Plattformen
    ctx.fillStyle = '#888';
    for (const p of platforms) {
      ctx.fillRect(p.x, p.y, p.width, p.height);
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

    // Collectibles
    for (const c of collectibles) {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.width, c.height);
    }

    // Spieler
    ctx.drawImage(
      catSprite,
      0, 0, SPRITE_SIZE, SPRITE_SIZE,
      player.x, player.y, SPRITE_SIZE, SPRITE_SIZE
    );

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, 10, 20);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
