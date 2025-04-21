window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // Startposition des Spielers
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
  let enemies = [];
  let collectibles = [];

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
      const y = (canvas.height - groundHeight - player.height) - verticalOffset;
      platforms.push({ x, y, width, height: 10 });
      holes.push({ x, width });
      lastX = x + width;
    }

    // Gegner generieren (1-2)
    const enemyCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < enemyCount; i++) {
      const ex = canvas.width - Math.random() * (canvas.width / 2);
      enemies.push({
        x: ex,
        y: startY,
        width: 32,
        height: 32,
        dx: -2,
        dy: 0,
        jumpPower: -10,
        onGround: true,
        jumpCooldown: 0
      });
    }

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
  const projectiles = [];

  // Tastenstatus
  const keys = {};
  document.addEventListener('keydown', e => {
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

  // Initiales Level
  generateLevel();

  function gameLoop() {
    // Spielerbewegung
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

    // Fallphysik
    player.dy += gravity;
    let oldY = player.y;
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
    const overHole = holes.some(h => player.x + player.width > h.x && player.x < h.x + h.width);
    if (!overHole && player.y + player.height >= canvas.height - groundHeight) {
      player.y = groundY;
      player.dy = 0;
      player.onGround = true;
    }
    if (player.y > canvas.height) {
      resetGame();
    }

    // Projektile update & Kollision mit Gegnern
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
          enemies.splice(j, 1);
          projectiles.splice(i, 1);
          break;
        }
      }
    }

    // Gegner update
    enemies.forEach(e => {
      e.x += e.dx;
      if (e.onGround && e.jumpCooldown <= 0) {
        e.dy = e.jumpPower;
        e.onGround = false;
        e.jumpCooldown = 100 + Math.random() * 100;
      }
      e.jumpCooldown--;
      e.dy += gravity;
      oldY = e.y;
      e.y += e.dy;
      if (e.dy > 0) {
        for (const p of platforms) {
          if (
            oldY + e.height <= p.y &&
            e.y + e.height >= p.y &&
            e.x + e.width > p.x &&
            e.x < p.x + p.width
          ) {
            e.y = p.y - e.height;
            e.dy = 0;
            e.onGround = true;
            break;
          }
        }
      }
      if (e.y + e.height >= canvas.height - groundHeight) {
        e.y = groundY;
        e.dy = 0;
        e.onGround = true;
      }
      if (e.x + e.width < 0) {
        e.x = canvas.width + Math.random() * 50;
        e.y = startY;
      }
      if (
        player.x < e.x + e.width &&
        player.x + player.width > e.x &&
        player.y < e.y + e.height &&
        player.y + player.height > e.y
      ) {
        resetGame();
      }
    });

    // Collectibles Kollision
    collectibles = collectibles.filter(item => {
      if (
        player.x < item.x + item.width &&
        player.x + player.width > item.x &&
        player.y < item.y + item.height &&
        player.y + player.height > item.y
      ) {
        score++;
        return false;
      }
      return true;
    });

    // Zeichnen
    // Hintergrund
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

    // Projektile
    projectiles.forEach(proj => {
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fillStyle = proj.color;
      ctx.fill();
    });

    // Gegner
    enemies.forEach(e => {
      ctx.fillStyle = 'green';
      ctx.fillRect(e.x, e.y, e.width, e.height);
    });

    // Collectibles zeichnen
    collectibles.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.fillRect(item.x, item.y, item.width, item.height);
    });

    // Score anzeigen
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, 10, 20);

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
