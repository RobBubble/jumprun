window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;

  // Hintergrundfarben
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // Spieler-Startdaten
  const startX = 50;
  const startY = canvas.height - groundHeight - 32;

  // Spielerobjekt
  const player = {
    x: startX,
    y: startY,
    width: 32,
    height: 32,
    color: "red",
    dx: 0,
    dy: 0,
    speed: 3,
    jumpPower: -12,
    onGround: true
  };

  // Plattformen (x, y, Breite, Höhe)
  const platforms = [
    { x: 150, y: canvas.height - groundHeight - 80, width: 100, height: 10 },
    { x: 350, y: canvas.height - groundHeight - 120, width: 100, height: 10 },
    { x: 600, y: canvas.height - groundHeight - 60, width: 100, height: 10 }
  ];

  // Löcher im Boden (x, Breite)
  const holes = [
    { x: 250, width: 50 },
    { x: 500, width: 50 }
  ];

  // Tastenzustände
  const keys = {};

  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    // Springen
    if ((e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') && player.onGround) {
      player.dy = player.jumpPower;
      player.onGround = false;
    }
  });
  document.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  function resetGame() {
    // Reset Spieler und Hintergrund
    player.x = startX;
    player.y = startY;
    player.dy = 0;
    player.onGround = true;
    currentBackground = 0;
  }

  function gameLoop() {
    // Bewegung horizontal
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;

    // Begrenzung links
    if (player.x < 0) player.x = 0;

    // Rechts raus → Level fortschritt
    if (player.x + player.width > canvas.width) {
      currentBackground = (currentBackground + 1) % backgrounds.length;
      player.x = 0;
    }

    // Schwerkraft
    player.dy += gravity;
    player.y += player.dy;

    // Plattform-Kollision
    let collided = false;
    platforms.forEach(plat => {
      if (player.dy >= 0 // nur beim Fallen
          && player.x + player.width > plat.x
          && player.x < plat.x + plat.width
          && player.y + player.height >= plat.y
          && player.y + player.height - player.dy < plat.y) {
        player.y = plat.y - player.height;
        player.dy = 0;
        player.onGround = true;
        collided = true;
      }
    });
    if (!collided) player.onGround = false;

    // Boden-Kollision (ohne Löcher)
    const groundY = canvas.height - groundHeight - player.height;
    // Prüfen, ob Spieler über einem Loch ist
    const overHole = holes.some(h => 
      player.x + player.width > h.x && player.x < h.x + h.width
    );
    if (!overHole && player.y >= groundY) {
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
    // Boden (mit Löchern)
    ctx.fillStyle = "#444";
    let lastX = 0;
    holes.forEach(h => {
      ctx.fillRect(lastX, canvas.height - groundHeight, h.x - lastX, groundHeight);
      lastX = h.x + h.width;
    });
    ctx.fillRect(lastX, canvas.height - groundHeight, canvas.width - lastX, groundHeight);

    // Plattformen
    ctx.fillStyle = "#888";
    platforms.forEach(plat => {
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    });

    // Spieler
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
