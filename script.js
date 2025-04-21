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

  // Plattformen in der Szene
  const platforms = [
    { x: 150, y: canvas.height - groundHeight - 80, width: 100, height: 10 },
    { x: 350, y: canvas.height - groundHeight - 120, width: 100, height: 10 },
    { x: 600, y: canvas.height - groundHeight - 60, width: 100, height: 10 }
  ];

  // Löcher direkt unter den Plattformen
  const holes = platforms.map(p => ({ x: p.x, width: p.width }));

  // Tastenzustände
  const keys = {};
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if ((e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') && player.onGround) {
      player.dy = player.jumpPower;
      player.onGround = false;
    }
  });
  document.addEventListener('keyup', e => { keys[e.code] = false; });

  function resetGame() {
    player.x = startX;
    player.y = startY;
    player.dx = 0;
    player.dy = 0;
    player.onGround = true;
    currentBackground = 0;
  }

  function gameLoop() {
    // Horizontalbewegung
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;

    // Bildschirmbegrenzung links
    if (player.x < 0) player.x = 0;
    // Bildschirm rechts verlassen → Hintergrundwechsel
    if (player.x + player.width > canvas.width) {
      currentBackground = (currentBackground + 1) % backgrounds.length;
      player.x = 0;
    }

    // Schwerkraft anwenden
    player.dy += gravity;
    const oldY = player.y;
    player.y += player.dy;
    player.onGround = false;

    // Plattform-Kollision (nur beim Fallen)
    if (player.dy > 0) {
      platforms.forEach(p => {
        if (
          oldY + player.height <= p.y &&
          player.y + player.height >= p.y &&
          player.x + player.width > p.x &&
          player.x < p.x + p.width
        ) {
          player.y = p.y - player.height;
          player.dy = 0;
          player.onGround = true;
        }
      });
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
    holes.forEach(h => {
      ctx.fillRect(lastX, canvas.height - groundHeight, h.x - lastX, groundHeight);
      lastX = h.x + h.width;
    });
    ctx.fillRect(lastX, canvas.height - groundHeight, canvas.width - lastX, groundHeight);

    // Plattformen
    ctx.fillStyle = '#888';
    platforms.forEach(p => {
      ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // Spieler
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
