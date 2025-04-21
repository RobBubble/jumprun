window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // Spieler-Startposition
  const startX = 50;
  const startY = canvas.height - groundHeight - 32;

  // Spielerobjekt
  const player = {
    x: startX,
    y: startY,
    width: 32,
    height: 32,
    color: 'red',
    dx: 0,
    dy: 0,
    speed: 3,
    jumpPower: -12,
    onGround: true
  };

  // Level-Daten
  let platforms = [];
  let holes = [];

  function generateLevel() {
    platforms = [];
    holes = [];
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

    for (let i = 0; i < count; i++) {
      const width = 80 + Math.random() * 40;
      const gap = minGap + Math.random() * (maxGap - minGap);
      let x = lastX + gap;
      if (x + width > canvas.width - 10) {
        x = canvas.width - 10 - width;
      }
      const verticalOffset = minHeightOffset + Math.random() * (maxHeightOffset - minHeightOffset);
      const y = (canvas.height - groundHeight - player.height) - verticalOffset;
      platforms.push({ x, y, width, height: 10 });
      holes.push({ x, width });
      lastX = x + width;
    }
  }

  // Projektil-Liste
  const projectiles = [];

  // Tastenstatus
  const keys = {};
  document.addEventListener('keydown', e => {
    if (!keys[e.code]) {
      // Springen nur bei ArrowUp oder W
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && player.onGround) {
        player.dy = player.jumpPower;
        player.onGround = false;
      }
      // Schießen mit Leertaste
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

  function resetGame() {
    player.x = startX;
    player.y = startY;
    player.dx = 0;
    player.dy = 0;
    player.onGround = true;
    currentBackground = 0;
    projectiles.length = 0;
    generateLevel();
  }

  generateLevel();

  function gameLoop() {
    // Spieler horizontal bewegen
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

    // Schwerkraft und Vertikalbewegung
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

    // Boden-Kollision
    const groundY = canvas.height - groundHeight - player.height;
    const overHole = holes.some(h => player.x + player.width > h.x && player.x < h.x + h.width);
    if (!overHole && player.y + player.height >= canvas.height - groundHeight) {
      player.y = groundY;
      player.dy = 0;
      player.onGround = true;
    }

    // Fallen ins Loch
    if (player.y > canvas.height) {
      resetGame();
    }

    // Projektile aktualisieren
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      proj.dy += gravity;
      proj.x += proj.dx;
      proj.y += proj.dy;
      // Entfernen wenn außerhalb
      if (proj.x > canvas.width || proj.y > canvas.height) {
        projectiles.splice(i, 1);
      }
    }

    // Zeichnen
    ctx.fillStyle = backgrounds[currentBackground];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Boden mit Löchern
    ctx.fillStyle = '#444';
    let lastXdraw = 0;
    holes.forEach(h => {
      ctx.fillRect(lastXdraw, canvas.height - groundHeight, h.x - lastXdraw, groundHeight);
      lastXdraw = h.x + h.width;
    });
    ctx.fillRect(lastXdraw, canvas.height - groundHeight, canvas.width - lastXdraw, groundHeight);

    // Plattformen
    ctx.fillStyle = '#888';
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

    // Spieler
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Projektile zeichnen
    projectiles.forEach(proj => {
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fillStyle = proj.color;
      ctx.fill();
    });

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
