window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // Lade einzelnes Cat-Sprite (32×32 px)
  const catSprite = new Image();
  catSprite.src = 'sprites/single_cat.png';
  const SPRITE_SIZE = 32;

  // Spieler-Startposition
  const startX = 50;
  const startY = canvas.height - groundHeight - SPRITE_SIZE;

  // Spielerobjekt
  const player = {
    x: startX,
    y: startY,
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    dx: 0,
    dy: 0,
    speed: 3,
    jumpPower: -12,
    onGround: true
  };

  // Level-Daten
  let platforms = [];
  let holes = [];
  let enemies = [];
  let collectibles = [];
  const projectiles = [];

  // Score
  let score = 0;

  // Generiert ein neues Level
  function generateLevel() {
    platforms = [];
    holes = [];
    enemies = [];
    collectibles = [];
    const groundY = canvas.height - groundHeight - player.height;
    const count = Math.floor(Math.random() * 3) + 2;
    const maxFrames = Math.abs(player.jumpPower) / gravity * 2;
    const maxDist = player.speed * maxFrames;
    const minGap = 50;
    const maxGap = maxDist * 0.8;
    const maxJumpHeight = (player.jumpPower * player.jumpPower) / (2 * gravity);
    const minHeightOffset = 20;
    const maxHeightOffset = maxJumpHeight * 0.8;
    let lastX = startX + player.width + 20;

    // Plattformen und Löcher
    for (let i = 0; i < count; i++) {
      const width = 80 + Math.random() * 40;
      const gap = minGap + Math.random() * (maxGap - minGap);
      let x = lastX + gap;
      if (x + width > canvas.width - 10) {
        x = canvas.width - 10 - width;
      }
      const verticalOffset = minHeightOffset + Math.random() * (maxHeightOffset - minHeightOffset);
      const y = groundY - verticalOffset;
      platforms.push({ x, y, width, height: 10 });
      holes.push({ x, width });
      lastX = x + width;
    }

    // Ein Gegner pro Szene
    const ex = canvas.width - Math.random() * (canvas.width / 2);
    enemies.push({
      x: ex,
      y: startY,
      width: SPRITE_SIZE,
      height: SPRITE_SIZE,
      dx: -2,
      dy: 0,
      jumpPower: -10,
      onGround: true,
      jumpCooldown: 0
    });

    // Collectibles generieren (1-2) auf zufälligen Plattformen
    const itemCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < itemCount; i++) {
      const plat = platforms[Math.floor(Math.random() * platforms.length)];
      collectibles.push({
        x: plat.x + plat.width / 2 - 8,
        y: plat.y - 16,
        width: 16,
        height: 16,
        color: 'gold'
      });
    }
  }

  // Projektile-Liste
  // (jedes Element hat dx, dy, radius, color)

  // Tastenstatus
  const keys = {};
  document.addEventListener('keydown', e => {
    if (!keys[e.code]) {
      // Springen
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && player.onGround) {
        player.dy = player.jumpPower;
        player.onGround = false;
      }
      // Schießen
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
  document.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  // Spiel zurücksetzen
  function resetGame() {
    player.x = startX;
    player.y = startY;
    player.dx = 0;
    player.dy = 0;
    player.onGround = true;
    currentBackground = 0;
    projectiles.length = 0;
    score = 0;
    generateLevel();
  }

  // Initiales Level generieren
  generateLevel();

  function gameLoop() {
    // Spieler bewegen
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
      currentBackground = (currentBackground + 1) % backgrounds.length;
      player.x = 0;
      generateLevel();
    }

    // Fallphysik anwenden
    player.dy += gravity;
    const oldY = player.y;
    player.y += player.dy;
    player.onGround = false;

    // Spieler-Plattform-Kollision
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

    // Boden-Kollision
    const groundY = canvas.height - groundHeight - player.height;
    const overHole = holes.some(h =>
      player.x + player.width > h.x && player.x < h.x + h.width
    );
    if (!overHole && player.y + player.height >= canvas.height - groundHeight) {
      player.y = groundY;
      player.dy = 0;
      player.onGround = true;
    }

    // Fallen außerhalb des Bildschirms
    if (player.y > canvas.height) {
      resetGame();
      requestAnimationFrame(gameLoop);
      return;
    }

    // Projektile updaten & Kollision mit Gegnern
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      proj.dy += gravity;
      proj.x += proj.dx;
      proj.y += proj.dy;
      if (proj.x > canvas.width || proj.y > canvas.height) {
        projectiles.splice(i, 1);
        continue;
      }
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (
          proj.x > e.x && proj.x < e.x + e.width &&
          proj.y > e.y && proj.y < e.y + e.height
        ) {
          score++;
          enemies.splice(j, 1);
          projectiles.splice(i, 1);
          break;```

