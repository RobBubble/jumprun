window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // Lade statisches Cat-Sprite (32×32 px)
  const catSprite = new Image();
  catSprite.src = 'sprites/single_cat.png';
  const SPRITE_SIZE = 32;

  // Startposition des Spielers
  const startX = 50;
  const startY = canvas.height - groundHeight - SPRITE_SIZE;

  // Spielerobjekt
  const player = {
    x: startX,
    y: startY,
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
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
  const projectiles = [];

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
      const y = groundY - verticalOffset;
      platforms.push({ x, y, width, height: 10 });
      holes.push({ x, width });
      lastX = x + width;
    }

    // Ein Gegner pro Szene
    const ex = canvas.width - Math.random() * (canvas.width / 2);
    enemies.push({
      x: ex,
      y: groundY,
      width: SPRITE_SIZE,
      height: SPRITE_SIZE,
      dx: -2,
      dy: 0,
      jumpPower: -10,
      onGround: true,
      jumpCooldown: 80
    });

    // Collectibles generieren (1-2) auf zufälligen Plattformen
    const itemCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < itemCount; i++) {
      const plat = platforms[Math.floor(Math.random() * platforms.length)];
      collectibles.push({ x: plat.x + plat.width / 2 - 8, y: plat.y - 16, width: 16, height: 16, color: 'gold' });
    }
  }

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
        projectiles.push({ x: player.x + player.width, y: player.y + player.height / 2, dx: 8, dy: -8, radius: 5, color: 'yellow' });
      }
    }
    keys[e.code] = true;
  });
  document.addEventListener('keyup', e => { keys[e.code] = false; });

  // Spiel zurücksetzen nur bei Fallen oder Gegnerkontakt
  function resetGame() {
    player.x = startX;
    player.y = startY;
    player.dx = 0;
    player.dy = 0;
    player.onGround = true;
    currentBackground = 0; // reset background to first
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

    // Szene verlassen rechts -> neues Level & Background wechseln
    if (player.x + player.width > canvas.width) {
      currentBackground = (currentBackground + 1) % backgrounds.length;
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
      platforms.forEach(p => {
        if (oldY + player.height <= p.y && player.y + player.height >= p.y && player.x + player.width > p.x && player.x < p.x + p.width) {
          player.y = p.y - player.height; player.dy = 0; player.onGround = true;
        }
      });
    }

    // Boden-Kollision
    const groundY = canvas.height - groundHeight - player.height;
    const overHole = holes.some(h => player.x + player.width > h.x && player.x < h.x + h.width);
    if (!overHole && player.y + player.height >= canvas.height - groundHeight) {
      player.y = groundY; player.dy = 0; player.onGround = true;
    }

    // Fallen außerhalb des Bildschirms
    if (player.y > canvas.height) { resetGame(); return; }

    // Projektile updaten & Kollision mit Gegnern
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      proj.dy += gravity; proj.x += proj.dx; proj.y += proj.dy;
      if (proj.x > canvas.width || proj.y > canvas.height) { projectiles.splice(i,1); continue; }
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (proj.x > e.x && proj.x < e.x + e.width && proj.y > e.y && proj.y < e.y + e.height) {
          score++; enemies.splice(j,1); projectiles.splice(i,1); break;
        }
      }
    }

    // Gegner aktualisieren & Kollision mit Spieler
    enemies.forEach(e => {
      e.x += e.dx;
      // Jump logic
      if (e.onGround && e.jumpCooldown <= 0) {
        e.dy = e.jumpPower;
        e.onGround = false;
        e.jumpCooldown = 80 + Math.random()*40;
      }
      e.jumpCooldown--;
      e.dy += gravity; e.y += e.dy;
      // Plattformen
      if (e.dy > 0) platforms.forEach(p => {
        if (e.y + e.height >= p.y && e.x+e.width>p.x && e.x<p.x+p.width) {
          e.y = p.y - e.height; e.dy=0; e.onGround=true;
        }
      });
      // Boden
      if (e.y+e.height>=canvas.height-groundHeight) { e.y=canvas.height-groundHeight-e.height; e.dy=0; e.onGround=true; }
      // Respawn
      if (e.x+e.width<0) { e.x=canvas.width; e.y=canvas.height-groundHeight-e.height; }
      // Collision player
      if (player.x<e.x+e.width&&player.x+player.width>e.x&&player.y<e.y+e.height&&player.y+player.height>e.y) { resetGame(); return; }
    });

    // Collectibles Kollision und Score-Erhöhung
    collectibles = collectibles.filter(item => {
      if (player.x<item.x+item.width&&player.x+player.width>item.x&&player.y<item.y+item.height&&player.y+player.height>item.y) { score++; return false; }
      return true;
    });

    // Zeichnen
    ctx.fillStyle=backgrounds[currentBackground]; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#444'; let last=0; holes.forEach(h=>{ctx.fillRect(last,canvas.height-groundHeight,h.x-last,groundHeight); last=h.x+h.width;}); ctx.fillRect(last,canvas.height-groundHeight,canvas.width-last,groundHeight);
    ctx.fillStyle='#888'; platforms.forEach(p=>ctx.fillRect(p.x,p.y,p.width,p.height));
    ctx.drawImage(catSprite,0,0,SPRITE_SIZE,SPRITE_SIZE,player.x,player.y,SPRITE_SIZE,SPRITE_SIZE);
    ctx.fillStyle='yellow'; projectiles.forEach(pr=>{ctx.beginPath();ctx.arc(pr.x,pr.y,pr.radius,0,Math.PI*2);ctx.fill();});
    ctx.fillStyle='green'; enemies.forEach(e=>ctx.fillRect(e.x,e.y,e.width,e.height));
    collectibles.forEach(c=>{ctx.fillStyle=c.color;ctx.fillRect(c.x,c.y,c.width,c.height);});
    ctx.fillStyle='white'; ctx.font='16px Arial'; ctx.fillText('Score:'+score,10,20);
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
});
