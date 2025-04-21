const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Spielfeld
const gravity = 0.5;
const groundHeight = 50;

// Spielerobjekt
const player = {
  x: 50,
  y: 300,
  width: 32,
  height: 32,
  color: "red",
  dx: 0,
  dy: 0,
  speed: 3,
  jumpPower: -10,
  onGround: false
};

const keys = {};

// Tasten drücken
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if ((e.key === "ArrowUp" || e.key === "w" || e.key === " ") && player.onGround) {
    player.dy = player.jumpPower;
    player.onGround = false;
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Update & Zeichne Schleife
function gameLoop() {
  // Bewegung links/rechts
  player.dx = 0;
  if (keys["ArrowLeft"] || keys["a"]) player.dx = -player.speed;
  if (keys["ArrowRight"] || keys["d"]) player.dx = player.speed;

  player.x += player.dx;

  // Schwerkraft
  player.dy += gravity;
  player.y += player.dy;

  // Boden-Kollision
  const groundY = canvas.height - groundHeight - player.height;
  if (player.y >= groundY) {
    player.y = groundY;
    player.dy = 0;
    player.onGround = true;
  }

  // Canvas leeren
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Boden zeichnen
  ctx.fillStyle = "#444";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Spieler zeichnen
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  requestAnimationFrame(gameLoop);
}

gameLoop();
