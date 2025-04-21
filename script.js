window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;

  // Hintergrundfarben für verschiedene Level
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // Spielerobjekt
  const player = {
    x: 50,
    y: canvas.height - groundHeight - 32, // Start auf dem Boden
    width: 32,
    height: 32,
    color: "red",
    dx: 0,
    dy: 0,
    speed: 3,
    jumpPower: -12,
    onGround: true
  };

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

  function gameLoop() {
    // Bewegung links/rechts
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;

    // Begrenzung links
    if (player.x < 0) {
      player.x = 0;
    }

    // Bildschirm rechts verlassen: Hintergrund wechseln, Spieler zurücksetzen
    if (player.x + player.width > canvas.width) {
      currentBackground = (currentBackground + 1) % backgrounds.length;
      player.x = 0;
    }

    // Schwerkraft anwenden
    player.dy += gravity;
    player.y += player.dy;

    // Boden-Kollision
    const groundY = canvas.height - groundHeight - player.height;
    if (player.y >= groundY) {
      player.y = groundY;
      player.dy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // Zeichnen
    // Hintergrund
    ctx.fillStyle = backgrounds[currentBackground];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Boden
    ctx.fillStyle = "#444";
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    // Spieler
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
