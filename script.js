window.addEventListener('load', () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  // Hintergrundmusik
  const bgMusic = new Audio('audio/Pixelträume.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.5;
  function tryPlayMusic() {
    bgMusic.play().catch(() => console.warn('Musik konnte nicht automatisch starten.'));
    window.removeEventListener('click', tryPlayMusic);
  }
  bgMusic.play().catch(() => window.addEventListener('click', tryPlayMusic));

  // Pixel-Art scharf halten
  ctx.imageSmoothingEnabled = false;

  // Hintergrundbilder
  const backgroundImages = [];
  for (let i = 0; i < 3; i++) {
    const img = new Image();
    img.src = `sprites/bg${i}.png`;
    backgroundImages.push(img);
  }

  // Gegner Sprite
  const enemyImage = new Image();
  enemyImage.src = 'sprites/enemy_sprite_48.png';

  // Spieler Sprites (Idle & Shooten)
  const playerImage = new Image();
  playerImage.src = 'sprites/cat_sprite_48.png';
  const playerShootImage = new Image();
  playerShootImage.src = 'sprites/cat_sprite_kotze.png';
  playerShootImage.onload = () => console.log('✅ Shoot-Sprite geladen:', playerShootImage.src);
  playerShootImage.onerror = () => console.error('❌ Shoot-Sprite NICHT gefunden:', playerShootImage.src);

  // Projektil Sprite
  const projectileImage = new Image();
  projectileImage.src = 'sprites/Kotze_30.png';

  // Collectible Sprite
  const collectibleImage = new Image();
  collectibleImage.src = 'sprites/Brot_24.png';

  // Einstellungen
  const gravity = 0.5;
  const groundHeight = 50;
  let currentBackground = 0;

  // Startposition Spieler
  const startX = 50;
  const startY = canvas.height - groundHeight - 48;

  // Spieler Objekt
  const player = {
    x: startX,
    y: startY,
    width: 48,
    height: 48,
    dx: 0,
    dy: 0,
    speed: 3,
    jumpPower: -12,
    onGround: true,
    currentSprite: playerImage,
    shootTimeout: null
  };

  // Level-Daten
  let platforms = [], holes = [], enemies = [], collectibles = [];
  let projectiles = [];
  let score = 0;

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
    const maxJumpHeight = (player.jumpPower ** 2) / (2 * gravity);
    const minHeightOffset = 20;
    const maxHeightOffset = maxJumpHeight * 0.8;
    let lastX = startX + player.width + 20;

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

    const ex = canvas.width - Math.random() * (canvas.width / 2);
    enemies.push({ x: ex, y: startY, width: 48, height: 48, dx: -2, dy: 0, jumpPower: -10, onGround: true, jumpCooldown: 0 });

    const itemCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < itemCount; i++) {
      const plat = platforms[Math.floor(Math.random() * platforms.length)];
      collectibles.push({ x: plat.x + plat.width/2 - 8, y: plat.y - 24, width: 24, height: 24, color: 'gold' });
    }
  }

  const keys = {};
  document.addEventListener('keydown', e => {
    if (!keys[e.code]) {
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && player.onGround) {
        player.dy = player.jumpPower;
        player.onGround = false;
      }
      if (e.code === 'Space') {
        projectiles.push({ x: player.x+player.width, y: player.y+player.height/2, dx:8, dy:-8, radius:15, color:'yellow' });
        player.currentSprite = playerShootImage;
        if (player.shootTimeout) clearTimeout(player.shootTimeout);
        player.shootTimeout = setTimeout(() => { player.currentSprite = playerImage; player.shootTimeout = null; }, 200);
      }
    }
    keys[e.code] = true;
  });
  document.addEventListener('keyup', e => { keys[e.code] = false; });

  function resetGame() {
    player.x = startX; player.y = startY; player.dx = 0; player.dy = 0; player.onGround = true;
    currentBackground = 0; projectiles = [];
    score = 0;
    generateLevel();
  }

  generateLevel();

  function gameLoop() {
    // Bewegung und Physik
    player.dx = 0;
    if (keys['ArrowLeft']||keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight']||keys['KeyD']) player.dx = player.speed;
    player.x += player.dx;
    if (player.x<0) player.x=0;
    if (player.x+player.width>canvas.width) { currentBackground=(currentBackground+1)%backgroundImages.length; player.x=0; generateLevel(); }

    player.dy+=gravity; const oldY = player.y; player.y+=player.dy; player.onGround = false;
    if (player.dy>0) for (const p of platforms) {
      if (oldY+player.height<=p.y && player.y+player.height>=p.y && player.x+player.width>p.x && player.x<p.x+p.width) {
        player.y=p.y-player.height; player.dy=0; player.onGround=true; break;
      }
    }
    const groundY = canvas.height-groundHeight-player.height;
    const overHole = holes.some(h=>player.x+player.width>h.x&&player.x<h.x+h.width);
    if (!overHole && player.y+player.height>=canvas.height-groundHeight) { player.y=groundY; player.dy=0; player.onGround=true; }
    if (player.y>canvas.height) { resetGame(); requestAnimationFrame(gameLoop); return; }

    // Update Projektile
    for (let i=projectiles.length-1;i>=0;i--) {
      const proj = projectiles[i]; proj.dy+=gravity; proj.x+=proj.dx; proj.y+=proj.dy;
      if (proj.x>canvas.width||proj.y>canvas.height) { projectiles.splice(i,1); continue; }
      for (let j=enemies.length-1;j>=0;j--) {
        const e=enemies[j]; if (proj.x>e.x&&proj.x<e.x+e.width&&proj.y>e.y&&proj.y<e.y+e.height) { score++; enemies.splice(j,1); projectiles.splice(i,1); break; }
      }
    }

    // Update Gegner
    for (const e of enemies) {
      e.x+=e.dx;
      if (e.onGround&&e.jumpCooldown<=0) { e.dy=e.jumpPower; e.onGround=false; e.jumpCooldown=100+Math.random()*100; }
      e.jumpCooldown--; e.dy+=gravity; const oldEY=e.y; e.y+=e.dy;
      if (e.dy>0) for (const p of platforms) {
        if (oldEY+e.height<=p.y&&e.y+e.height>=p.y&&e.x+e.width>p.x&&e.x<p.x+p.width) { e.y=p.y-e.height; e.dy=0; e.onGround=true; break; }
      }
      if (e.y+e.height>=canvas.height-groundHeight) { e.y=groundY; e.dy=0; e.onGround=true; }
      if (e.x+e.width<0) { e.x=canvas.width+Math.random()*50; e.y=startY; }
      if (player.x<e.x+e.width&&player.x+player.width>e.x&&player.y<e.y+e.height&&player.y+player.height>e.y) { resetGame(); requestAnimationFrame(gameLoop); return; }
    }

    // Collectibles
    collectibles = collectibles.filter(item=>{
      if (player.x<item.x+item.width&&player.x+player.width>item.x&&player.y<item.y+item.height&&player.y+player.height>item.y) { score++; return false; }
      return true;
    });

    // Draw Hintergrund
    const bg = backgroundImages[currentBackground]; if (bg.complete) ctx.drawImage(bg,0,0,canvas.width,canvas.height);

    // Draw Boden & Plattformen
    ctx.fillStyle='#F4A6B6'; let lastX=0; holes.forEach(h=>{ ctx.fillRect(lastX,canvas.height-groundHeight,h.x-lastX,groundHeight); lastX=h.x+h.width; }); ctx.fillRect(lastX,canvas.height-groundHeight,canvas.width-lastX,groundHeight);
    ctx.fillStyle='#A6F4E4'; platforms.forEach(p=>ctx.fillRect(p.x,p.y,p.width,p.height));

    // Draw Spieler
    if (player.currentSprite.complete) ctx.drawImage(player.currentSprite,player.x,player.y,player.width,player.height);

    // Draw Projektile
    projectiles.forEach(proj=>{ if (projectileImage.complete) ctx.drawImage(projectileImage,proj.x-proj.radius,proj.y-proj.radius,proj.radius*2,proj.radius*2); });

    // Draw Gegner   
    enemies.forEach(e=>{ if (enemyImage.complete) ctx.drawImage(enemyImage,e.x,e.y,e.width,e.height); });

    // Draw Collectibles
    collectibles.forEach(item=>{ if (collectibleImage.complete) ctx.drawImage(collectibleImage,item.x,item.y,item.width,item.height); });

    // Score
    ctx.fillStyle='white'; ctx.font='16px Arial'; ctx.fillText('Punkte: '+score,10,20);

    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});
