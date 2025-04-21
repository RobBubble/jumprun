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

  // Arrays für Plattformen und Löcher
  let platforms = [];
  let holes = [];

  // Generiert ein neues Level mit zufälligen Plattformen und Löchern
  function generateLevel() {
    platforms = [];
    holes = [];
    const groundY = canvas.height - groundHeight - player.height;
    const count = Math.floor(Math.random() * 3) + 2; // 2 bis 4 Plattformen

    for (let i = 0; i < count; i++) {
      const width = 80 + Math.random() * 40; // 80 bis 120px breit
      const x = Math.random() * (canvas.width - width);
      // Höhe so wählen, dass sie mit dem Sprung erreichbar ist (Diff 50-130px)
      const y = groundY - (50 + Math.random() * 80);

      platforms.push({ x, y, width, height: 10 });
      holes.push({ x, width });
    }
  }

  // Tastenzustände
  const keys = {};
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if ((e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') && player.onGround) {
      player.dy = player.jumpPower;
      player.onGround = false;
    }
  });
  document.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  // Spiel zurücksetzen (z.B. beim Fall ins Loch)
  function resetGame() {
    player.x = startX;
    player.y = startY;
    player.dx = 0;
    player.dy = 0;
    player.onGround = true;
    currentBackground = 0;
    generateLevel();
  }

  // Initiales Level generieren
  generateLevel();

  function gameLoop() {
    // Horizontalbewegung
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;

    // Bildschirmbegrenzung links
    if (player.x < 0) player.x = 0;
    // Bildschirm rechts verlassen → neuer Hintergrund und Level
    if (player.x + player.width > canvas.width) {
      currentBackground = (currentBackground + 1) % backgrounds.length;
      player.x = 0;
      generateLevel();
    }

    // Schwerkraft anwenden
    player.dy += gravity;
    const oldY = player.y;
    player.y += player.dy;
    player.onGround = false;

    // Plattform-Kollision (nur beim Fallen)
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

    // Boden-Kollision (außer über Löchern)
    const groundY = canvas.height - groundHeight - player.height;
    const overHole = holes.some(h =>
      player.x + player.width > h.x && player.x < h.x + h.width
    );
    if (!overHole && player.y + player.height >= canvas.height - groundHeight) {
      player.y = groundY;
      player.dy = 0;
      player.onGround = true;
    }

    // Fallen in ein Loch
    if (player.y > canvas.height) {
      resetGame();
    }

    // Zeichnen
    // Hintergrund
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
    for (const p of platforms) {
      ctx.fillRect(p.x, p.y, p.width, p.height);
    }

    // Spieler
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
