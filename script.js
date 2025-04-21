window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // Sprite-Sheet
  const playerSheet = new Image();
  playerSheet.src = 'sprites/cat_sheet.png'; // 4 Frames: sit, walk1, walk2, jump
  const FRAME_W = 32;
  const FRAME_H = 32;
  const FRAME_COUNT = 4;
  let currentFrame = 0;
  let frameTimer = 0;
  const FRAME_DURATION = 200; // ms

  // Startposition des Spielers
  const startX = 50;
  const startY = canvas.height - groundHeight - FRAME_H;

  // Spielerobjekt
  const player = {
    x: startX,
    y: startY,
    width: FRAME_W,
    height: FRAME_H,
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
  let projectiles = [];
  let score = 0;

  // Generiert ein neues Level
  function generateLevel() {
    platforms = [];
    holes = [];
    enemies = [];
    collectibles = [];
    projectiles = [];
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

    // Plattformen & Löcher
    for (let i = 0; i < count; i++) {
      const width = 80 + Math.random() * 40;
      const gap = minGap + Math.random() * (maxGap - minGap);
      let x = lastX + gap;
      if (x + width > canvas.width - 10) x = canvas.width - 10 - width;
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
      y: startY,
      width: FRAME_W,
      height: FRAME_H,
      dx: -2,
      dy: 0,
      jumpPower: -10,
      onGround: true,
      jumpCooldown: 0
    });

    // Collectibles (1-2) auf Plattformen
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

  // Tasten-Handling
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
          y: player.y + player.height/2,
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

  // Reset-Funktion
  function resetGame() {
    player.x = startX;
    player.y = startY;
    player.dx = 0;
    player.dy = 0;
    player.onGround = true;
    currentBackground = 0;
    score = 0;
    generateLevel();
  }

  generateLevel();

  let lastTime = performance.now();
  function gameLoop(now) {
    const delta = now - lastTime;
    lastTime = now;

    // Spieler horizontal
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

    // Schwerkraft
    player.dy += gravity;
    const oldPY = player.y;
    player.y += player.dy;
    player.onGround = false;

    // Plattform-Kollision Spieler
    if (player.dy > 0) {
      for (const p of platforms) {
        if (oldPY + player.height <= p.y &&
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

    // Boden-Kollision & Fall-Reset
    const groundY = canvas.height - groundHeight - player.height;
    const overHole = holes.some(h => player.x + player.width > h.x && player.x < h.x + h.width);
    if (!overHole && player.y + player.height >= canvas.height - groundHeight) {
      player.y = groundY;
      player.dy = 0;
      player.onGround = true;
    }
    if (player.y > canvas.height) {
      resetGame();
      requestAnimationFrame(gameLoop);
      return;
    }

    // Projektile updaten & Gegner-Kollision
    for (let i = projectiles.length-1; i>=0; i--) {
      const proj = projectiles[i];
      proj.dy += gravity;
      proj.x += proj.dx; proj.y += proj.dy;
      if (proj.x>canvas.width||proj.y>canvas.height) { projectiles.splice(i,1); continue; }
      for (let j=enemies.length-1;j>=0;j--) {
        const e = enemies[j];
        if (proj.x>e.x&&proj.x<e.x+e.width&&proj.y>e.y&&proj.y<e.y+e.height) {
          score++;
          enemies.splice(j,1);
          projectiles.splice(i,1);
          break;
        }
      }
    }

    // Gegner update & Spieler-Kollision
    for (const e of enemies) {
      e.x += e.dx;
      if (e.onGround && e.jumpCooldown<=0) {
        e.dy = e.jumpPower; e.onGround=false;
        e.jumpCooldown = 100 + Math.random()*100;
      }
      e.jumpCooldown--;
      e.dy += gravity;
      const oldEY = e.y; e.y += e.dy;
      if (e.dy>0) {
        for(const p of platforms) {
          if(oldEY+e.height<=p.y&&e.y+e.height>=p.y&&e.x+e.width>p.x&&e.x<p.x+p.width){
            e.y=p.y-e.height; e.dy=0; e.onGround=true; break;
          }
        }
      }
      if(e.y+e.height>=canvas.height-groundHeight){ e.y=groundY; e.dy=0; e.onGround=true;}
      if(e.x+e.width<0){ e.x=canvas.width+Math.random()*50; e.y=startY;}
      if(player.x<e.x+e.width&&player.x+player.width>e.x&&player.y<e.y+e.height&&player.y+player.height>e.y){
        resetGame(); requestAnimationFrame(gameLoop); return;
      }
    }

    // Collectibles-Kollision
    collectibles = collectibles.filter(item=>{
      if(player.x<item.x+item.width&&player.x+player.width>item.x&&player.y<item.y+item.height&&player.y+player.height>item.y){
        score++; return false;
      }
      return true;
    });

    // Animations-Logik
    if (!player.onGround) {
      currentFrame = 3;
    } else if (player.dx!==0) {
      frameTimer += delta;
      if (frameTimer>=FRAME_DURATION) {
        frameTimer -= FRAME_DURATION;
        currentFrame = currentFrame===1?2:1;
      }
    } else {
      currentFrame = 0;
    }

    // Zeichnen
    // Hintergrund
    ctx.fillStyle = backgrounds[currentBackground];
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Boden mit Löchern
    ctx.fillStyle='#444';
    let lastX=0;
    for(const h of holes){
      ctx.fillRect(lastX,canvas.height-groundHeight,h.x-lastX,groundHeight);
      lastX = h.x+h.width;
    }
    ctx.fillRect(lastX,canvas.height-groundHeight,canvas.width-lastX,groundHeight);

    // Plattformen
    ctx.fillStyle='#888';
    for(const p of platforms){
      ctx.fillRect(p.x,p.y,p.width,p.height);
    }

    // Collectibles
    for(const c of collectibles){
      ctx.fillStyle=c.color;
      ctx.fillRect(c.x,c.y,c.width,c.height);
    }

    // Projektile
    for(const proj of projectiles){
      ctx.beginPath();
      ctx.arc(proj.x,proj.y,proj.radius,0,Math.PI*2);
      ctx.fillStyle=proj.color; ctx.fill();
    }

    // Gegner
    for(const e of enemies){
      ctx.fillStyle='green';
      ctx.fillRect(e.x,e.y,e.width,e.height);
    }

    // Spieler mit Sprite
    ctx.drawImage(
      playerSheet,
      currentFrame*FRAME_W,0,
      FRAME_W,FRAME_H,
      player.x,player.y,
      FRAME_W,FRAME_H
    );

    // Score
    ctx.fillStyle='white';
    ctx.font='16px Arial';
    ctx.fillText('Score: '+score,10,20);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
