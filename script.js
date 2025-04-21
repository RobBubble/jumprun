window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;

  // Lade Sprite-Sheet
  const playerSheet = new Image();
  playerSheet.src = 'sprites/cat_sheet.png'; // 4 Frames: sit, walk1, walk2, jump

  const FRAME_W = 32;
  const FRAME_H = 32;
  const FRAME_COUNT = 4;
  let currentFrame = 0;
  let frameTimer = 0;
  const FRAME_DURATION = 200; // ms pro Frame

  // Startposition des Spielers
  const startX = 50;
  const startY = canvas.height - groundHeight - FRAME_H;

  // Spielerobjekt
  const player = {
    x: startX,
    y: startY,
    width: FRAME_W,
    height: FRAME_H,
    dx: 0,
    dy: 0,
    speed: 3,
    jumpPower: -12,
    onGround: true
  };

  // Weitere Level-Arrays (Plattformen, etc.) hier übernehmen…
  let platforms = [];
  let holes = [];
  let enemies = [];
  let collectibles = [];
  let projectiles = [];
  let score = 0;
  let currentBackground = 0;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];

  // Level-Generierung-Funktion (wie vorher)
  function generateLevel() { /* … */ }

  generateLevel();

  // Tasten-Handling (wie vorher) …
  const keys = {};
  document.addEventListener('keydown', e => { /* … */ });
  document.addEventListener('keyup', e => { /* … */ });

  let lastTime = performance.now();
  function gameLoop(now) {
    const delta = now - lastTime;
    lastTime = now;

    // Bewegung & Physik (wie vorher) …

    // Animations-Logik
    // Auswahl des Frame-Index nach Zustand:
    if (!player.onGround) {
      currentFrame = 3; // Sprung-Frame
    } else if (player.dx !== 0) {
      // Laufzyklus zwischen Frame 1 und 2
      frameTimer += delta;
      if (frameTimer >= FRAME_DURATION) {
        frameTimer -= FRAME_DURATION;
        currentFrame = currentFrame === 1 ? 2 : 1;
      }
    } else {
      currentFrame = 0; // Sitzender/neutraler Frame
    }

    // Zeichnen
    // Hintergrund & Level-Elemente (wie vorher) …

    // Spieler mit aktuellem Frame aus dem Sheet zeichnen:
    ctx.drawImage(
      playerSheet,
      currentFrame * FRAME_W, 0, // Quelle: x-Offset
      FRAME_W, FRAME_H,          // Quelle: Breite/Höhe
      player.x, player.y,        // Zielposition
      FRAME_W, FRAME_H           // Zielgröße
    );

    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
});
