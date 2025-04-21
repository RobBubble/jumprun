window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // Lade statisches Cat-Sprite (nur obere linke 32×32 Pixel)
  const catSprite = new Image();
  catSprite.src = 'sprites/cat_sheet.png';

  // Spielfeld-Objekte
  const SPRITE_SIZE = 32;
  let player = {
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
  let platforms = [], holes = [], enemies = [], collectibles = [], projectiles = [], score = 0;

  function generateLevel() {
    platforms = []; holes = []; enemies = []; collectibles = []; projectiles = [];
    const groundY = canvas.height - groundHeight - player.height;
    const count = Math.floor(Math.random() * 3) + 2;
    const maxJumpH = (player.jumpPower * player.jumpPower) / (2 * gravity);
    let lastX = player.x + player.width + 20;
    for (let i = 0; i < count; i++) {
      const w = 80 + Math.random() * 40;
      const gap = 50 + Math.random() * 100;
      let x = lastX + gap;
      if (x + w > canvas.width - 10) x = canvas.width - 10 - w;
      const y = groundY - (20 + Math.random() * (maxJumpH * 0.5));
      platforms.push({ x, y, width: w, height: 10 });
      holes.push({ x, width: w });
      lastX = x + w;
    }
    // Ein Gegner
    const ex = canvas.width - Math.random() * (canvas.width / 2);
    enemies = [{ x: ex, y: groundY, width: SPRITE_SIZE, height: SPRITE_SIZE, dx: -2, dy: 0, jumpPower: -10, onGround: true, jumpCooldown: 0 }];
    // Collectibles
    collectibles = [];
    for (let i = 0; i < 2; i++) {
      const plat = platforms[Math.floor(Math.random() * platforms.length)];
      collectibles.push({ x: plat.x + plat.width/2 - 8, y: plat.y - 16, width: 16, height: 16, color: 'gold' });
    }
    score = 0;
  }
  function resetGame() {
    player.x = 50;
    player.y = canvas.height - groundHeight - SPRITE_SIZE;
    player.dx = player.dy = 0;
    player.onGround = true;
    currentBackground = 0;
    generateLevel();
  }

  // Steuerung
  const keys = {};
  window.addEventListener('keydown', e => {
    if (!keys[e.code]) {
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && player.onGround) {
        player.dy = player.jumpPower;
        player.onGround = false;
      }
      if (e.code === 'Space') {
        projectiles.push({ x: player.x + player.width, y: player.y + player.height/2, dx: 8, dy: -8, radius: 5, color: 'yellow' });
      }
    }
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // Start
  generateLevel();
  let lastTime = performance.now();

  function gameLoop(time) {
    const delta = time - lastTime;
    lastTime = time;

    // Bewegung horizontal
    player.dx = 0;
    if (keys['ArrowLeft']||keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight']||keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
      currentBackground = (currentBackground + 1) % backgrounds.length;
      resetGame();
    }

    // Vertikale Bewegung
    player.dy += gravity;
    const oldY = player.y;
    player.y += player.dy;
    player.onGround = false;
    // Plattformkollision
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
    // Boden & Löcher
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

    // (Gegner-, Projektile-, Collectible-Update wie gehabt...) -- omitted for brevity --

    // Zeichnen
    ctx.fillStyle = backgrounds[currentBackground];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Boden mit Löchern
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
    for (const pr of projectiles) {
      ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI*2);
      ctx.fillStyle = pr.color; ctx.fill();
    }
    // Gegner
    ctx.fillStyle = 'green';
    for (const e of enemies) ctx.fillRect(e.x, e.y, e.width, e.height);

    // Spieler mit statischem Sprite (erster Frame)
    ctx.drawImage(catSprite,
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
