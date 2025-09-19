const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restartButton');
const snowContainer = document.getElementById("snow");
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");
let musicOn = true;

/* CONFIGURAÇÕES */
let gameSpeed = 5; // variável de velocidade
const BASE_SPAWN_INTERVAL = 70;
const SPAWN_JITTER = 40;
const MIN_DISTANCE_BETWEEN = 160;
const ANIM_INTERVAL = 8;

/* PLAYER (DINO) */
let character = { x: 50, width: 60, height: 90, y: 0, velocityY: 0, isJumping: false };
const dino1 = new Image(); 
const dino2 = new Image();
dino1.src = './src/Dino.png';
dino2.src = './src/Dino2.png';
let currentDino = dino1;  
let animCounter = 0;

/* SOM DO PULO */
const jumpSound = new Audio("./src/Jump.mp3");

/* OBSTÁCULOS */
const obstacleTypes = [  
  { src: './src/cacto.png', minH: 100, maxH: 80, minW: 40, maxW: 40 },
  { src: './src/osso.png', minH: 80, maxH: 80, minW: 80, maxW: 80 },
  { src: './src/pedra.png', minH: 80, maxH: 80, minW: 100 , maxW: 100 },
  { src: './src/cobra.png', minH: 70, maxH: 70, minW: 60, maxW: 60 },
  { src: './src/espinhos.png', minH: 55, maxH: 55, minW: 80, maxW: 80 }
];
const obstacleImages = [];
obstacleTypes.forEach(type => {
  const img = new Image();
  img.src = type.src;
  img.onerror = () => console.warn(`Falha ao carregar ${type.src}`);
  obstacleImages.push(img);
});

let obstacles = [];
let score = 0;
let isGameOver = false;
let spawnTimer = 0;
let nextSpawnInterval = BASE_SPAWN_INTERVAL + Math.floor(Math.random()*SPAWN_JITTER);

/* FUNÇÕES */
function rightmostObstacleX(){
  if (obstacles.length === 0) return -Infinity;
  return obstacles.reduce((m,o)=> Math.max(m,o.x), -Infinity);
}

function spawnObstacle(){
  const idx = Math.floor(Math.random()*obstacleTypes.length);
  const type = obstacleTypes[idx];
  const w = type.minW + Math.floor(Math.random()*(type.maxW - type.minW));
  const h = type.minH + Math.floor(Math.random()*(type.maxH - type.minH));
  obstacles.push({ x: canvas.width, y: canvas.height - h, width: w, height: h, type: idx, passed:false });
}

function animateCharacter(){
  if (!character.isJumping){
    animCounter++;
    if (animCounter >= ANIM_INTERVAL){
      currentDino = (currentDino === dino1) ? dino2 : dino1;
      animCounter = 0;
    }
  }
}

function drawCharacter(){
  if (currentDino && currentDino.complete && currentDino.naturalHeight !== 0){
    ctx.drawImage(currentDino, character.x, character.y, character.width, character.height);
  } else {
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(character.x, character.y, character.width, character.height);
  }
}

function drawObstacles(){
  obstacles.forEach(ob => {
    const img = obstacleImages[ob.type];
    if (img && img.complete && img.naturalHeight !== 0){
      ctx.drawImage(img, ob.x, ob.y, ob.width, ob.height);
    } else {
      ctx.fillStyle = 'green';
      ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    }
  });
}

/* Criar neve/cinzas com cor */
function createSnowflakes(count=50, color="white"){
  snowContainer.innerHTML = ""; 
  for (let i=0; i<count; i++){
    const flake = document.createElement("div");
    flake.classList.add("snowflake");
    flake.textContent = "•";
    flake.style.left = Math.random() * 100 + "%";
    flake.style.fontSize = (Math.random()*10 + 10) + "px";
    flake.style.animationDuration = (5 + Math.random()*5) + "s";
    flake.style.animationDelay = (Math.random()*5) + "s";
    flake.style.color = color;
    snowContainer.appendChild(flake);
  }
}

/* GAME LOOP */
function startGame(){
  character.y = canvas.height - character.height;
  obstacles = [];
  score = 0;
  isGameOver = false;
  spawnTimer = 0;
  nextSpawnInterval = BASE_SPAWN_INTERVAL + Math.floor(Math.random()*SPAWN_JITTER);
  currentDino = dino1;
  animCounter = 0;
  scoreDisplay.textContent = score;
  canvas.style.backgroundImage = "url('./src/stage1.png')";
  snowContainer.innerHTML = "";
  gameSpeed = 5;
  gameOverScreen.classList.remove('show');

  if(musicOn){
    bgMusic.currentTime = 0;
    bgMusic.play().catch(()=>console.log("Toque qualquer tecla para iniciar o áudio"));
  }

  requestAnimationFrame(gameLoop);
}

function gameLoop(){
  if (isGameOver) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // física
  character.y += character.velocityY;
  character.velocityY += 0.5;
  if (character.y > canvas.height - character.height){
    character.y = canvas.height - character.height;
    character.velocityY = 0;
    character.isJumping = false;
  }

  // spawn obstáculos
  spawnTimer++;
  if (spawnTimer >= nextSpawnInterval){
    const rightX = rightmostObstacleX();
    const gap = isFinite(rightX) ? (canvas.width - rightX) : Infinity;
    if (gap >= MIN_DISTANCE_BETWEEN){
      spawnObstacle();
      spawnTimer = 0;
      nextSpawnInterval = BASE_SPAWN_INTERVAL + Math.floor(Math.random()*SPAWN_JITTER);
    }
  }

  // mover obstáculos e pontuar
  obstacles.forEach(ob => {
    ob.x -= gameSpeed;
    if (!ob.passed && character.x > ob.x + ob.width){
      ob.passed = true;
      score++;
      scoreDisplay.textContent = score;

      // Mudança de estágio e velocidade
      if (score === 20){
        canvas.style.backgroundImage = "url('./src/stage2.png')";
        gameSpeed = 6;
      }
      if (score === 40){
        canvas.style.backgroundImage = "url('./src/stage3.png')";
        gameSpeed = 8;
      }
      if (score === 60){
        canvas.style.backgroundImage = "url('./src/stage4.png')";
        gameSpeed = 13;
      }
      if (score === 80){
        canvas.style.backgroundImage = "url('./src/stage5.png')";
        createSnowflakes(80, "white"); // neve branca
        gameSpeed = 15;
      }
      if (score === 100){
        canvas.style.backgroundImage = "url('./src/stage6.png')";
        createSnowflakes(80, "red"); // neve vermelha (cinzas do vulcão)
        gameSpeed = 18;
      }
      if (score === 120){
        canvas.style.backgroundImage = "url('./src/stage7.png')";
        createSnowflakes(100, "red"); // neve vermelha (cinzas do vulcão)
        gameSpeed = 25;
      }

      // Encerrar jogo ao atingir 100 pontos
      if (score >= 140 ){
        isGameOver = true;
        finalScoreDisplay.textContent = score;
        gameOverScreen.querySelector("h2").textContent = "Parabéns!";
        gameOverScreen.querySelector("p").textContent = "Você completou o jogo!";
        gameOverScreen.classList.add('show');
          bgMusic.pause();
  bgMusic.currentTime = 0;
        return;
      }
    }
  });
  obstacles = obstacles.filter(ob => ob.x > -ob.width-50);

  // colisão
  for (let ob of obstacles){
    if (character.x < ob.x + ob.width &&
        character.x + character.width > ob.x &&
        character.y < ob.y + ob.height &&
        character.y + character.height > ob.y){
      isGameOver = true;
      finalScoreDisplay.textContent = score;
      gameOverScreen.querySelector("h2").textContent = "Game Over";
      gameOverScreen.querySelector("p").textContent = "Sua pontuação final: " + score;
      gameOverScreen.classList.add('show');
      return;
    }
  }

  animateCharacter();
  drawCharacter();
  drawObstacles();

  requestAnimationFrame(gameLoop);
}

/* CONTROLE NO PC */
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !character.isJumping && !isGameOver){
    character.isJumping = true;
    character.velocityY = -15;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
});


/* CONTROLE NO CELULAR */

document.addEventListener('touchstart', () => {
  if (!character.isJumping && !isGameOver){
    character.isJumping = true;
    character.velocityY = -15;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
});

restartButton.addEventListener('click', startGame);

// Controle de música
musicToggle.addEventListener("click", () => {
  musicOn = !musicOn;
  if(musicOn){
    bgMusic.play();
    musicToggle.textContent = "🎵 Música: ON";
  } else {
    bgMusic.pause();
    musicToggle.textContent = "🎵 Música: OFF";
  }
});

/* INÍCIO */
startGame();