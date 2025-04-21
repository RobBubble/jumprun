window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // === Einstellungen ===
  const gravity = 0.5;
  const groundHeight = 50;
  const backgrounds = ['#222', '#2E8B57', '#8B4513', '#4B0082'];
  let currentBackground = 0;

  // === Sprite-Sheet ===
  const playerSheet = new Image();
  let spriteLoaded = false;
  playerSheet.src = 'sprites/cat_sheet.png';
  playerSheet.onload = () => {
    spriteLoaded = true;
    console.log("✅ Sprite geladen:", playerSheet.width, "x", playerSheet.height);
  };
  playerSheet.onerror = () => {
    console.error("❌ Fehler beim Laden des Sprite-Sheets!");
  };

  // === Animation ===
  const FRAME_W = 32, FRAME_H = 32, FRAME_COUNT = 4;
  let currentFrame = 0, frameTimer = 0;
  const FRAME_DURATION = 200;

  // === Spieler ===
  const startX = 50, startY = canvas.height - groundHeight - FRAME_H;
  const player = {
    x: startX, y: startY,
    width: FRAME_W, height: FRAME_H,
    dx: 0, dy: 0,
    speed: 3, jumpPower: -12,
    onGround: true
  };

  // === Level-Daten ===
  let platforms = [], holes = [], enemies = [], collectibles = [], projectiles = [];
  let score = 0;

  // --- Level erzeugen ---
  function generateLevel() {
    platforms = []; holes = []; enemies = []; collectibles = []; projectiles = [];
    const groundY = canvas.height - groundHeight - player.height;
    const count = Math.floor(Math.random() * 3) + 2;
    const maxFrames = Math.abs(player.jumpPower)/gravity*2;
    const maxDist = player.speed * maxFrames;
    const minGap = 50, maxGap = maxDist*0.8;
    const maxJumpH = (player.jumpPower*player.jumpPower)/(2*gravity);
    const minY = 20, maxY = maxJumpH*0.8;
    let lastX = startX + player.width + 20;
    for (let i=0; i<count; i++){
      const w = 80 + Math.random()*40;
      const gap = minGap + Math.random()*(maxGap-minGap);
      let x = lastX + gap;
      if (x+w > canvas.width-10) x = canvas.width-10-w;
      const yOff = minY + Math.random()*(maxY-minY);
      const y = groundY - yOff;
      platforms.push({x,y,width:w,height:10});
      holes.push({x,width:w});
      lastX = x+w;
    }
    const ex = canvas.width - Math.random()* (canvas.width/2);
    enemies = [{ x:ex, y:startY, width:32, height:32, dx:-2, dy:0, jumpPower:-10, onGround:true, jumpCooldown:0 }];
    const itemCount = Math.floor(Math.random()*2)+1;
    collectibles = [];
    for(let i=0;i<itemCount;i++){
      const p = platforms[Math.floor(Math.random()*platforms.length)];
      collectibles.push({x:p.x+p.width/2-8,y:p.y-16,width:16,height:16,color:'gold'});
    }
  }

  // --- Reset ---
  function resetGame() {
    console.log("🔄 Reset Game");
    player.x = startX; player.y = startY; player.dx = 0; player.dy = 0; player.onGround = true;
    currentBackground = 0; score = 0; projectiles = [];
    generateLevel();
  }

  // === Steuerung ===
  const keys = {};
  document.addEventListener('keydown', e => {
    if (!keys[e.code]) {
      if ((e.code==='ArrowUp'||e.code==='KeyW') && player.onGround) {
        player.dy = player.jumpPower; player.onGround = false;
      }
      if (e.code==='Space') {
        projectiles.push({ x:player.x+player.width, y:player.y+player.height/2, dx:8, dy:-8, radius:5, color:'yellow' });
      }
    }
    keys[e.code] = true;
  });
  document.addEventListener('keyup', e => keys[e.code] = false);

  // Initial
  generateLevel();
  let lastTime = performance.now();

  // === Game Loop ===
  function gameLoop(time) {
    const delta = time - lastTime; lastTime = time;
    try {
      // -- Update Spieler --
      player.dx = 0;
      if (keys['ArrowLeft']||keys['KeyA']) player.dx = -player.speed;
      if (keys['ArrowRight']||keys['KeyD']) player.dx = player.speed;
      player.x += player.dx;
      if (player.x<0) player.x=0;
      if (player.x+player.width>canvas.width) {
        currentBackground = (currentBackground+1)%backgrounds.length;
        player.x=0; generateLevel();
      }
      player.dy += gravity;
      const oldY = player.y;
      player.y += player.dy;
      player.onGround = false;
      // Plattformen
      if (player.dy>0) {
        for (const p of platforms) {
          if (oldY+player.height<=p.y && player.y+player.height>=p.y &&
              player.x+player.width>p.x && player.x<p.x+p.width) {
            player.y=p.y-player.height; player.dy=0; player.onGround=true; break;
          }
        }
      }
      // Boden / Löcher
      const groundY = canvas.height-groundHeight-player.height;
      const overHole = holes.some(h=>player.x+player.width>h.x && player.x<h.x+h.width);
      if (!overHole && player.y+player.height>=canvas.height-groundHeight) {
        player.y=groundY; player.dy=0; player.onGround=true;
      }
      if (player.y>canvas.height) { resetGame(); }

      // -- Update Projektile --
      for (let i=projectiles.length-1;i>=0;i--){
        const pr=projectiles[i];
        pr.dy+=gravity; pr.x+=pr.dx; pr.y+=pr.dy;
        if (pr.x>canvas.width||pr.y>canvas.height) projectiles.splice(i,1);
      }

      // -- Update Gegner --
      for (const e of enemies) {
        e.x+=e.dx;
        if (e.onGround && e.jumpCooldown<=0) {
          e.dy=e.jumpPower; e.onGround=false; e.jumpCooldown=80+Math.random()*100;
        }
        e.jumpCooldown--; e.dy+=gravity;
        const oldEY=e.y; e.y+=e.dy;
        if (e.dy>0) {
          for (const p of platforms) {
            if (oldEY+e.height<=p.y && e.y+e.height>=p.y &&
                e.x+e.width>p.x && e.x<p.x+p.width) {
              e.y=p.y-e.height; e.dy=0; e.onGround=true; break;
            }
          }
        }
        if (e.y+e.height>=canvas.height-groundHeight) {
          e.y=groundY; e.dy=0; e.onGround=true;
        }
        if (e.x+e.width<0) { e.x=canvas.width+Math.random()*50; e.y=startY; }
        // Kollision Spieler
        if (player.x<e.x+e.width&&player.x+player.width>e.x&&
            player.y<e.y+e.height&&player.y+player.height>e.y) {
          resetGame(); break;
        }
      }

      // -- Update Collectibles --
      collectibles = collectibles.filter(item => {
        if (player.x<item.x+item.width&&player.x+player.width>item.x&&
            player.y<item.y+item.height&&player.y+player.height>item.y) {
          score++; return false;
        }
        return true;
      });

      // -- Animation --
      if (!player.onGround) {
        currentFrame = FRAME_COUNT-1;
      } else if (player.dx!==0) {
        frameTimer += delta;
        if (frameTimer>=FRAME_DURATION) {
          frameTimer -= FRAME_DURATION;
          currentFrame = currentFrame===1?2:1;
        }
      } else { currentFrame = 0; }

      // -- Zeichnen --
      ctx.fillStyle=backgrounds[currentBackground];
      ctx.fillRect(0,0,canvas.width,canvas.height);

      // Boden mit Löchern
      ctx.fillStyle='#444'; let lx=0;
      for (const h of holes) {
        ctx.fillRect(lx,canvas.height-groundHeight,h.x-lx,groundHeight);
        lx=h.x+h.width;
      }
      ctx.fillRect(lx,canvas.height-groundHeight,canvas.width-lx,groundHeight);

      // Plattformen
      ctx.fillStyle='#888';
      for (const p of platforms) ctx.fillRect(p.x,p.y,p.width,p.height);

      // Collectibles
      for (const c of collectibles) {
        ctx.fillStyle=c.color; ctx.fillRect(c.x,c.y,c.width,c.height);
      }

      // Projektile
      for (const pr of projectiles) {
        ctx.beginPath();
        ctx.arc(pr.x,pr.y,pr.radius,0,Math.PI*2);
        ctx.fillStyle=pr.color; ctx.fill();
      }

      // Gegner
      ctx.fillStyle='green';
      for (const e of enemies) ctx.fillRect(e.x,e.y,e.width,e.height);

      // Spieler-Sprite oder Platzhalter
      if (spriteLoaded) {
        ctx.drawImage(
          playerSheet,
          currentFrame*FRAME_W,0,FRAME_W,FRAME_H,
          player.x,player.y,FRAME_W,FRAME_H
        );
      } else {
        ctx.fillStyle='magenta';
        ctx.fillRect(player.x,player.y,FRAME_W,FRAME_H);
      }

      // Score
      ctx.fillStyle='white';
      ctx.font='16px Arial';
      ctx.fillText('Score: ' + score,10,20);
    } catch (err) {
      console.error("Error in gameLoop:", err);
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);

});
