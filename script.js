window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Physik & Grunddaten
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // Sprite‑Sheet laden (4×32×32)
  const playerSheet = new Image();
  playerSheet.src = 'sprites/cat_sheet.png'; // transparenter Hintergrund notwendig

  // Frame‑Setup
  const FRAME_W = 32, FRAME_H = 32, FRAME_COUNT = 4;
  let currentFrame = 0, frameTimer = 0;
  const FRAME_DURATION = 200; // ms

  // Spieler‑Start
  const startX = 50;
  const startY = canvas.height - groundHeight - FRAME_H;
  const player = { x: startX, y: startY, width: FRAME_W, height: FRAME_H,
                   dx: 0, dy: 0, speed: 3, jumpPower: -12, onGround: true };

  // Level‑Arrays
  let platforms = [], holes = [], enemies = [], collectibles = [], projectiles = [];
  let score = 0;

  // Level generieren (implementiere deine Logik)
  function generateLevel() {
    // ... deine Level‑Generierung hier (wie gehabt) ...
  }

  // Tasten
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

  function resetGame() {
    player.x = startX; player.y = startY; player.dx = 0; player.dy = 0;
    player.onGround = true; currentBackground = 0; score = 0;
    projectiles.length = 0; generateLevel();
  }

  // Warten, bis Sprite‑Sheet geladen ist
  playerSheet.onload = () => {
    generateLevel();
    requestAnimationFrame(gameLoop);
  };

  let lastTime = performance.now();
  function gameLoop(now) {
    const delta = now - lastTime; lastTime = now;

    // — Bewegung & Physik (Spieler, Projektile, Gegner etc.) wie vorher —

    // — Hier alle Update‑Funktionen (Bewegung, Kollision, Reset) aufrufen —

    // Animations‑Frame berechnen
    if (!player.onGround) {
      currentFrame = 3;
    } else if (player.dx !== 0) {
      frameTimer += delta;
      if (frameTimer >= FRAME_DURATION) {
        frameTimer -= FRAME_DURATION;
        currentFrame = currentFrame === 1 ? 2 : 1;
      }
    } else {
      currentFrame = 0;
    }

    // — Zeichnen der Szene (Hintergrund, Boden, Plattformen, Gegner, Items, Projektile) —

    // Spieler sprite zeichnen (transparenter Hintergrund)
    ctx.drawImage(
      playerSheet,
      currentFrame * FRAME_W, 0, FRAME_W, FRAME_H,
      player.x, player.y, FRAME_W, FRAME_H
    );

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, 10, 20);

    // Nächste Iteration
    requestAnimationFrame(gameLoop);
  }
});
