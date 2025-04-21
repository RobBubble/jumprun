const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Spielerobjekt
const player = {
  x: 50,
  y: 300,
  width: 32,
  height: 32,
  color: "red",
  dx: 0,
  speed: 3
};

const keys = {};

// Tasten drücken
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Update & Zeichne Schleife
function gameLoop() {
  // Bewegung
  player.dx = 0;
  if (keys["ArrowLeft"] || keys["a"]) player.dx = -player.speed;
  if (keys["ArrowRight"] || keys["d"]) player.dx = player.speed;

  player.x += player.dx;

  // Canvas leeren
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Spieler zeichnen
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  requestAnimationFrame(gameLoop);
}

gameLoop();
