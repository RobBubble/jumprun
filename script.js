window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // === Physik & Einstellungen ===
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // === Sprite-Sheet laden ===
  const playerSheet = new Image();
  const TOTAL_FRAMES = 4;  // Anzahl der Frames im Sheet
  let FRAME_W = 0, FRAME_H = 0;
  let spriteLoaded = false;

  playerSheet.src = 'sprites/cat_sheet.png';
  playerSheet.onload = () => {
    // Dynamische Breite/Höhe pro Frame
    FRAME_W = playerSheet.width / TOTAL_FRAMES;
    FRAME_H = playerSheet.height;
    console.log(`✅ Sprite geladen: Gesamtgröße ${playerSheet.width}×${playerSheet.height}, Framegröße ${FRAME_W}×${FRAME_H}`);
    spriteLoaded = true;
    // Start des Spiels erst nach Laden
    init();
    requestAnimationFrame(gameLoop);
  };
  playerSheet.onerror = () => {
    console.error('❌ Sprite-Sheet nicht gefunden unter sprites/cat_sheet.png');
  };

  // === Animation ===
  let currentFrame = 0;
  let frameTimer = 0;
  const FRAME_DURATION = 200; // ms

  // === Spieler ===
  const startX = 50;
  let player = null; // wird in init gesetzt

  // === Level-Daten ===
  let platforms = [], holes = [], enemies = [], collectibles = [], projectiles = [];
  let score = 0;

  function init() {
    // Spieler-Objekt anlegen, jetzt mit korrekter FRAME_W/FRAME_H
    player = {
      x: startX,
      y: canvas.height - groundHeight - FRAME_H,
      width: FRAME_W,
      height: FRAME_H,
      dx: 0,
      dy: 0,
      speed: 3,
      jumpPower: -12,
      onGround: true
    };
    generateLevel();
    setupControls();
  }

  function generateLevel() {
    // (wie gehabt, nur nutze player.width/player.height für groundY)
    platforms = []; holes = []; enemies = []; collectibles = []; projectiles = [];
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

    // Ein Gegner
    const ex = canvas.width - Math.random() * (canvas.width / 2);
    enemies = [{
      x: ex, y: groundY,
      width: player.width, height: player.height,
      dx: -2, dy: 0, jumpPower: -10,
      onGround: true, jumpCooldown: 0
    }];

    // Collectibles
    const itemCount = Math.floor(Math.random() * 2) + 1;
    collectibles = [];
    for (let i = 0; i < itemCount; i++) {
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

  function setupControls() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }
  const keys = {};
  function onKeyDown(e) {
    if (!keys[e.code]) {
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && player.onGround) {
        player.dy = player.jumpPower;
        player.onGround = false;
      }
      if (e.code === 'Space') {
        projectiles.push({
          x: player.x + player.width,
          y: player.y + player.height / 2,
          dx: 8, dy: -8,
          radius: 5, color: 'yellow'
        });
      }
    }
    keys[e.code] = true;
  }
  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function resetGame() {
    player.x = startX;
    player.y = canvas.height - groundHeight - player.height;
    player.dx = player.dy = 0;
    player.onGround = true;
    currentBackground = 0;
    projectiles = [];
    generateLevel();
  }

  function gameLoop(time) {
    // === Update ===
    // Bewegung
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
      currentBackground = (currentBackground + 1) % backgrounds.length;
      resetGame();
    }

    // Fall
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

    // Boden/Löcher
    const groundY = canvas.height - groundHeight - player.height;
    const overHole = holes.some(h => player.x + player.width > h.x && player.x < h.x + h.width);
    if (!overHole && player.y + player.height >= canvas.height - groundHeight) {
      player.y = groundY;
      player.dy = 0;
      player.onGround = true;
    }
    if (player.y > canvas.height) {
      resetGame();
    }

    // (Hier folgen Gegner-, Projektile-, Collectible-Logiken unverändert…)

    // === Animations-Logik ===
    if (spriteLoaded) {
      if (!player.onGround) {
        currentFrame = TOTAL_FRAMES - 1;            // letzter Frame = Sprung
      } else if (player.dx !== 0) {
        frameTimer += (time - (gameLoop.lastTime || time));
        if (frameTimer >= FRAME_DURATION) {
          frameTimer -= FRAME_DURATION;
          currentFrame = currentFrame === 1 ? 2 : 1; // Laufzyklus zwischen 1-2
        }
      } else {
        currentFrame = 0;                           // Ruhe-Frame
      }
    }

    // === Zeichnen ===
    // Hintergrund
    ctx.fillStyle = backgrounds[currentBackground];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Boden mit Löchern, Plattformen, Gegner, Collectibles, Projektile (wie gehabt…)

    // Spieler zeichnen (only if loaded)
    if (spriteLoaded) {
      ctx.drawImage(
        playerSheet,
        currentFrame * FRAME_W, 0, FRAME_W, FRAME_H,
        player.x, player.y, FRAME_W, FRAME_H
      );
    } else {
      // Platzhalter
      ctx.fillStyle = 'magenta';
      ctx.fillRect(player.x, player.y, FRAME_W, FRAME_H);
    }

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, 10, 20);

    gameLoop.lastTime = time;
    requestAnimationFrame(gameLoop);
  }
});
