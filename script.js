window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Hintergrundmusik
const bgMusic = new Audio('audio/Pixelträume.mp3');
bgMusic.loop = true;        // Endlosschleife
bgMusic.volume = 0.5;       // Lautstärke 0.0–1.0 nach Bedarf anpassen

// Musik starten, sobald der Nutzer mit dem Dokument interagiert (Autoplay‑Richtlinien)
function tryPlayMusic() {
  bgMusic.play().catch(_ => {
    // Gegebenenfalls muss der Nutzer einmal klicken, bevor Audio läuft
    console.warn('Musik konnte nicht automatisch starten.');
  });
  // Entferne den Listener, damit wir’s nur einmal probieren
  window.removeEventListener('click', tryPlayMusic);
}

// Versuche direkt zu spielen, und wenn das scheitert,
// starte nach dem ersten Klick.
bgMusic.play().catch(_ => {
  window.addEventListener('click', tryPlayMusic);
});

  // Pixel-Art scharf halten
ctx.imageSmoothingEnabled = false;

  const backgroundImages = [];
for (let i = 0; i < 3; i++) {
  const img = new Image();
  img.src = `sprites/bg${i}.png`;
  backgroundImages.push(img);
}

  // Gegner‑Sprite laden
const enemyImage = new Image();
enemyImage.src = 'sprites/enemy_sprite_48.png';

// Spieler‑Sprite laden
const playerImage = new Image();
playerImage.src = 'sprites/cat_sprite_48.png';

  // Projektil‑Sprite laden
const projectileImage = new Image();
projectileImage.src = 'sprites/Kotze_30.png';

  // Collectible‑Sprite laden
const collectibleImage = new Image();
collectibleImage.src = 'sprites/Brot_24.png';

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;
  let currentBackground = 0;

  // Startposition des Spielers
  const startX = 50;
  const startY = canvas.height - groundHeight - 48;

  // Spielerobjekt
  const player = {
    x: startX,
    y: startY,
    width: 48,
    height: 48,
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

    // Ein Gegner pro Szene
    const ex = canvas.width - Math.random() * (canvas.width / 2);
    enemies.push({
      x: ex,
      y: startY,
      width: 48,
      height: 48,
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
        y: plat.y - 24,
        width: 24,
        height: 24,
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
          radius: 15,
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
      currentBackground = (currentBackground + 1) % backgroundImages.length;
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
          break;
        }
      }
    }

    // Gegner aktualisieren & Kollision mit Spieler
    for (const e of enemies) {
      // horizontale Bewegung
      e.x += e.dx;
      // Springen
      if (e.onGround && e.jumpCooldown <= 0) {
        e.dy = e.jumpPower;
        e.onGround = false;
        e.jumpCooldown = 100 + Math.random() * 100;
      }
      e.jumpCooldown--;
      // Fallphysik
      e.dy += gravity;
      const oldEY = e.y;
      e.y += e.dy;
      // Plattformkollision
      if (e.dy > 0) {
        for (const p of platforms) {
          if (
            oldEY + e.height <= p.y &&
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
      // Boden
      if (e.y + e.height >= canvas.height - groundHeight) {
        e.y = groundY;
        e.dy = 0;
        e.onGround = true;
      }
      // Respawn rechts
      if (e.x + e.width < 0) {
        e.x = canvas.width + Math.random() * 50;
        e.y = startY;
      }
      // Spieler-Kollision -> Reset, schedule next frame und Abbruch
      if (
        player.x < e.x + e.width &&
        player.x + player.width > e.x &&
        player.y < e.y + e.height &&
        player.y + player.height > e.y
      ) {
        resetGame();
        requestAnimationFrame(gameLoop);
        return;
      }
    }

    // Collectibles Kollision und Score-Erhöhung
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

// statt Farb‑Fill:
const bg = backgroundImages[currentBackground];
if (bg && bg.complete) {
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
}

    // Boden mit Löchern zeichnen
    ctx.fillStyle = '#F4A6B6';
    let lastXdraw = 0;
    holes.forEach(h => {
      ctx.fillRect(lastXdraw, canvas.height - groundHeight, h.x - lastXdraw, groundHeight);
      lastXdraw = h.x + h.width;
    });
    ctx.fillRect(lastXdraw, canvas.height - groundHeight, canvas.width - lastXdraw, groundHeight);

    // Plattformen
    ctx.fillStyle = '#A6F4E4';  
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

   // Spieler mit Katze zeichnen (sofern geladen)
if (playerImage.complete) {
  ctx.drawImage(
    playerImage,
    player.x, player.y,
    player.width, player.height
  );
}

projectiles.forEach(proj => {
  if (projectileImage.complete) {
    ctx.drawImage(
      projectileImage,
      proj.x - proj.radius,
      proj.y - proj.radius,
      proj.radius * 2,
      proj.radius * 2
    );
  }
});

  
  // Gegner mit Sprite zeichnen (statt grüner Würfel)
enemies.forEach(e => {
  if (enemyImage.complete) {
    ctx.drawImage(
      enemyImage,
      e.x, e.y,
      e.width, e.height
    );
  }
});

// Collectibles als Sprite zeichnen
collectibles.forEach(item => {
  if (collectibleImage.complete) {
    ctx.drawImage(
      collectibleImage,
      item.x, item.y,
      item.width, item.height
    );
  }
});

    // Score anzeigen
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Punkte: ' + score, 10, 20);

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
