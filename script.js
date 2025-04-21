window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Physik & Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // Sprite-Sheet laden
  const playerSheet = new Image();
  let spriteLoaded = false;
  playerSheet.src = 'sprites/cat_sheet.png';
  playerSheet.onload = () => {
    spriteLoaded = true;
    // Dynamisch Anzahl Frames bestimmen
    FRAME_COUNT = Math.floor(playerSheet.width / FRAME_W);
    console.log(`Sprite geladen: ${playerSheet.width}x${playerSheet.height}, Frames: ${FRAME_COUNT}`);
  };
  playerSheet.onerror = () => {
    console.error("Fehler beim Laden des Cat-Sprite-Sheets!");
  };

  // Frame-Einstellungen
  const FRAME_W = 32;
  const FRAME_H = 32;
  let FRAME_COUNT = 4; // default, wird überschrieben
  let currentFrame = 0;
  let frameTimer = 0;
  const FRAME_DURATION = 200; // ms pro Frame

  // Startposition des Spielers
  const startX = 50;
  const startY = canvas.height - groundHeight - FRAME_H;

  // Spieler-Objekt
  const player = {
    x: startX, y: startY,
    width: FRAME_W, height: FRAME_H,
    dx: 0, dy: 0,
    speed: 3, jumpPower: -12,
    onGround: true
  };

  // Level-Daten-Arrays
  let platforms = [], holes = [], enemies = [], collectibles = [], projectiles = [];
  let score = 0;

  // Level generieren
  function generateLevel() {
    platforms = [];
    holes = [];
    enemies = [];
    collectibles = [];
    projectiles = [];
    const groundY = canvas.height - groundHeight - player.height;
    const count = Math.floor(Math.random() * 3) + 2;
    const maxFrames = Math.abs(player.jumpPower) / gravity * 2;
    const maxDist = player.speed * maxFrames;
    const minGap = 50, maxGap = maxDist * 0.8;
    const maxJumpH = (player.jumpPower * player.jumpPower) / (2 * gravity);
    const minYOffset = 20, maxYOffset = maxJumpH * 0.8;
    let lastX = startX + player.width + 20;

    // Plattformen & Löcher
    for (let i = 0; i < count; i++) {
      const w = 80 + Math.random() * 40;
      const gap = minGap + Math.random() * (maxGap - minGap);
      let x = lastX + gap;
      if (x + w > canvas.width - 10) x = canvas.width - 10 - w;
      const yOff = minYOffset + Math.random() * (maxYOffset - minYOffset);
      const y = groundY - yOff;
      platforms.push({ x, y, width: w, height: 10 });
      holes.push({ x, width: w });
      lastX = x + w;
    }
    // Ein Gegner pro Szene
    const ex = canvas.width - Math.random() * (canvas.width / 2);
    enemies.push({ x: ex, y: startY, width: FRAME_W, height: FRAME_H,
                   dx: -2, dy: 0, jumpPower: -10, onGround: true, jumpCooldown: 0 });
    // Collectibles
    const itemCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < itemCount; i++) {
      const plat = platforms[Math.floor(Math.random() * platforms.length)];
      collectibles.push({
        x: plat.x + plat.width / 2 - 8,
        y: plat.y - 16, width: 16, height: 16, color: 'gold'
      });
    }
  }

  // Reset Funktion
  function resetGame() {
    player.x = startX; player.y = startY;
    player.dx = 0; player.dy = 0; player.onGround = true;
    currentBackground = 0; score = 0;
    projectiles = [];
    generateLevel();
  }

  // Tasten-Behandlung
  const keys = {};
  document.addEventListener('keydown', e => {
    if (!keys[e.code]) {
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && player.onGround) {
        player.dy = player.jumpPower; player.onGround = false;
      }
      if (e.code === 'Space') {
        projectiles.push({
          x: player.x + player.width,
          y: player.y + player.height / 2,
          dx: 8, dy: -8, radius: 5, color: 'yellow'
        });
      }
    }
    keys[e.code] = true;
  });
  document.addEventListener('keyup', e => { keys[e.code] = false; });

  // Initiales Level
  generateLevel();

  // Game Loop
  let lastTime = performance.now();
  function gameLoop(time) {
    const delta = time - lastTime; lastTime = time;

    // Bewegung & Physik
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
      currentBackground = (currentBackground + 1) % backgrounds.length;
      player.x = 0; generateLevel();
    }
    player.dy += gravity;
    const oldPY = player.y;
    player.y += player.dy; player.onGround = false;
    // Plattformkollision
    if (player.dy > 0) {
      for (const p of platforms) {
        if (oldPY + player.height <= p.y &&
            player.y + player.height >= p.y &&
            player.x + player.width > p.x &&
            player.x < p.x + p.width) {
          player.y = p.y - player.height; player.dy = 0; player.onGround = true; break;
        }
      }
    }
    // Boden & Löcher
    const groundY = canvas.height - groundHeight - player.height;
    const overHole = holes.some(h => player.x + player.width > h.x && player.x < h.x + h.width);
    if (!overHole && player.y + player.height >= canvas.height - groundHeight) {
      player.y = groundY; player.dy = 0; player.onGround = true;
    }
    if (player.y > canvas.height) { resetGame(); }

    // Projektile & Gegner-Logik (Dichotom ausgelassen hier: unverändert)

    // Animation
    if (!player.onGround) {
      currentFrame = FRAME_COUNT - 1; // Sprung-Frame als letztes
    } else if (player.dx !== 0) {
      frameTimer += delta;
      if (frameTimer >= FRAME_DURATION) {
        frameTimer -= FRAME_DURATION;
        currentFrame = currentFrame === 1 ? 2 : 1;
      }
    } else {
      currentFrame = 0; // Stand-Frame
    }

    // Zeichnen
    ctx.fillStyle = backgrounds[currentBackground];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Boden
    ctx.fillStyle = '#444';
    let lastX = 0;
    for (const h of holes) {
      ctx.fillRect(lastX, canvas.height - groundHeight, h.x - lastX, groundHeight);
      lastX = h.x + h.width;
    }
    ctx.fillRect(lastX, canvas.height - groundHeight, canvas.width - lastX, groundHeight);
    // Plattformen
    ctx.fillStyle = '#888';
    for (const p of platforms) ctx.fillRect(p.x, p.y, p.width, p.height);
    // Collectibles
    for (const c of collectibles) {
      ctx.fillStyle = c.color; ctx.fillRect(c.x, c.y, c.width, c.height);
    }
    // Projektile
    for (const proj of projectiles) {
      ctx.beginPath(); ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI*2);
      ctx.fillStyle = proj.color; ctx.fill();
    }
    // Gegner
    ctx.fillStyle = 'green';
    for (const e of enemies) ctx.fillRect(e.x, e.y, e.width, e.height);

    // Spieler (Sprite oder Placeholder)
    if (spriteLoaded) {
      ctx.drawImage(
        playerSheet,
        currentFrame * FRAME_W, 0, FRAME_W, FRAME_H,
        player.x, player.y, FRAME_W, FRAME_H
      );
    } else {
      ctx.fillStyle = 'magenta'; 
      ctx.fillRect(player.x, player.y, FRAME_W, FRAME_H);
    }
    // Score
    ctx.fillStyle = 'white'; ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, 10, 20);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
