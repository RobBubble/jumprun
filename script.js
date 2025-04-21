window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // Lade Sprite-Sheet
  const playerSheet = new Image();
  playerSheet.src = 'sprites/cat_sheet.png'; // 4 Frames, transparent

  // Frame-Einstellungen
  const FRAME_W = 32, FRAME_H = 32, FRAME_COUNT = 4;
  let currentFrame = 0, frameTimer = 0;
  const FRAME_DURATION = 200; // ms pro Frame

  // Startposition des Spielers
  const startX = 50;
  const startY = 400 - groundHeight - FRAME_H;

  // Spieler-Objekt
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
  let platforms = [], holes = [], enemies = [], collectibles = [], projectiles = [];
  let score = 0;

  // Level generieren
  function generateLevel() {
    platforms = [];
    holes = [];
    enemies = [];
    collectibles = [];
    projectiles = [];

    const groundY = canvas.height - groundHeight - player.height;
    const count = Math.floor(Math.random() * 3) + 2;
    // Sprungreichweite, Abstände
    const maxFrames = Math.abs(player.jumpPower) / gravity * 2;
    const maxDist = player.speed * maxFrames;
    const minGap = 50, maxGap = maxDist * 0.8;
    const maxJumpH = (player.jumpPower * player.jumpPower) / (2 * gravity);
    const minYOffset = 20, maxYOffset = maxJumpH * 0.8;
    let lastX = startX + player.width + 20;

    // Plattformen & Löcher
    for (let i = 0; i < count; i++) {
      const w = 80 + Math.random() * 40;
      const gap = minGap + Math.random() * (maxGap - minGap);
      let x = lastX + gap;
      if (x + w > canvas.width - 10) x = canvas.width - 10 - w;
      const yOff = minYOffset + Math.random() * (maxYOffset - minYOffset);
      const y = groundY - yOff;
      platforms.push({ x, y, width: w, height: 10 });
      holes.push({ x, width: w });
      lastX = x + w;
    }
    // Ein Gegner
    const ex = canvas.width - Math.random() * (canvas.width/2);
    enemies.push({ x: ex, y: startY, width: 32, height: 32,
                   dx: -2, dy: 0, jumpPower: -10, onGround: true, jumpCooldown: 0 });

    // Collectibles
    const itemCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < itemCount; i++) {
      const plat = platforms[Math.floor(Math.random() * platforms.length)];
      collectibles.push({
        x: plat.x + plat.width/2 - 8,
        y: plat.y - 16, width: 16, height: 16, color: 'gold'
      });
    }
  }

  // Reset
  function resetGame() {
    player.x = startX; player.y = startY;
    player.dx = 0; player.dy = 0; player.onGround = true;
    currentBackground = 0; score = 0;
    projectiles = []; generateLevel();
  }

  // Tastenevents
  const keys = {};
  document.addEventListener('keydown', e => {
    if (!keys[e.code]) {
      if ((e.code==='ArrowUp' || e.code==='KeyW') && player.onGround) {
        player.dy = player.jumpPower; player.onGround = false;
      }
      if (e.code==='Space') {
        projectiles.push({
          x: player.x + player.width,
          y: player.y + player.height/2,
          dx: 8, dy: -8, radius:5, color:'yellow'
        });
      }
    }
    keys[e.code]=true;
  });
  document.addEventListener('keyup', e=>{ keys[e.code]=false; });

  // Spielstart, wenn Sprite geladen
  playerSheet.onload = () => {
    generateLevel();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  };

  let lastTime = 0;
  function gameLoop(time) {
    const delta = time - lastTime; lastTime = time;

    // Bewegung horizontal
    player.dx = 0;
    if (keys['ArrowLeft']||keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight']||keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) {
      currentBackground = (currentBackground+1)%backgrounds.length;
      player.x = 0; generateLevel();
    }

    // Schwerkraft
    player.dy += gravity;
    const oldPY = player.y;
    player.y += player.dy;
    player.onGround = false;

    // Plattformkollision
    if (player.dy>0) {
      for(const p of platforms) {
        if(oldPY+player.height<=p.y && player.y+player.height>=p.y &&
           player.x+player.width>p.x && player.x<p.x+p.width) {
          player.y = p.y-player.height; player.dy = 0; player.onGround = true;
          break;
        }
      }
    }
    // Boden/Löcher
    const groundY = canvas.height - groundHeight - player.height;
    const overHole = holes.some(h=> player.x+player.width>h.x && player.x<h.x+h.width);
    if (!overHole && player.y+player.height >= canvas.height-groundHeight) {
      player.y = groundY; player.dy = 0; player.onGround = true;
    }
    if (player.y>canvas.height) {
      resetGame(); requestAnimationFrame(gameLoop); return;
    }

    // Projektile
    for(let i=projectiles.length-1;i>=0;i--){
      const proj = projectiles[i];
      proj.dy+=gravity; proj.x+=proj.dx; proj.y+=proj.dy;
      if(proj.x>canvas.width||proj.y>canvas.height){ projectiles.splice(i,1); continue; }
      // Gegner-Treffer
      for(let j=enemies.length-1;j>=0;j--){
        const e=enemies[j];
        if(proj.x>e.x&&proj.x<e.x+e.width&&proj.y>e.y&&proj.y<e.y+e.height){
          score++; enemies.splice(j,1); projectiles.splice(i,1); break;
        }
      }
    }

    // Gegner
    for(const e of enemies){
      e.x+=e.dx;
      // Jump
      if(e.onGround && e.jumpCooldown<=0){
        e.dy=e.jumpPower; e.onGround=false; e.jumpCooldown=100+Math.random()*100;
      }
      e.jumpCooldown--; e.dy+=gravity;
      const oldEY=e.y; e.y+=e.dy;
      if(e.dy>0){
        for(const p of platforms){
          if(oldEY+e.height<=p.y && e.y+e.height>=p.y &&
             e.x+e.width>p.x && e.x<p.x+p.width){
            e.y=p.y-e.height; e.dy=0; e.onGround=true; break;
          }
        }
      }
      // Boden
      if(e.y+e.height>=canvas.height-groundHeight){
        e.y=groundY; e.dy=0; e.onGround=true;
      }
      // Links raus
      if(e.x+e.width<0){
        e.x=canvas.width+Math.random()*50; e.y=startY;
      }
      // Spieler-Kollision
      if(player.x<e.x+e.width&&player.x+player.width>e.x&&
         player.y<e.y+e.height&&player.y+player.height>e.y){
        resetGame(); requestAnimationFrame(gameLoop); return;
      }
    }

    // Collectibles
    collectibles = collectibles.filter(item=>{
      if(player.x<item.x+item.width&&player.x+player.width>item.x&&
         player.y<item.y+item.height&&player.y+player.height>item.y){
        score++; return false;
      }
      return true;
    });

    // Animationslogik
    if(!player.onGround){
      currentFrame=3;
    } else if(player.dx!==0){
      frameTimer+=delta;
      if(frameTimer>=FRAME_DURATION){ frameTimer-=FRAME_DURATION; currentFrame = currentFrame===1?2:1; }
    } else {
      currentFrame=0;
    }

    // Zeichnen
    // Hintergrund
    ctx.fillStyle = backgrounds[currentBackground];
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Boden mit Löchern
    ctx.fillStyle = '#444';
    let lx=0;
    for(const h of holes){
      ctx.fillRect(lx,canvas.height-groundHeight,h.x-lx,groundHeight);
      lx=h.x+h.width;
    }
    ctx.fillRect(lx,canvas.height-groundHeight,canvas.width-lx,groundHeight);

    // Plattformen
    ctx.fillStyle = '#888';
    for(const p of platforms){
      ctx.fillRect(p.x,p.y,p.width,p.height);
    }

    // Collectibles
    for(const c of collectibles){
      ctx.fillStyle=c.color; ctx.fillRect(c.x,c.y,c.width,c.height);
    }

    // Projektile
    for(const proj of projectiles){
      ctx.beginPath();
      ctx.arc(proj.x,proj.y,proj.radius,0,Math.PI*2);
      ctx.fillStyle=proj.color; ctx.fill();
    }

    // Gegner
    ctx.fillStyle='green';
    for(const e of enemies){
      ctx.fillRect(e.x,e.y,e.width,e.height);
    }

    // Spieler-Sprite
    ctx.drawImage(
      playerSheet,
      currentFrame*FRAME_W,0,FRAME_W,FRAME_H,
      player.x,player.y,FRAME_W,FRAME_H
    );

    // Score
    ctx.fillStyle='white'; ctx.font='16px Arial';
    ctx.fillText('Score: '+score,10,20);

    requestAnimationFrame(gameLoop);
  }
}

);
