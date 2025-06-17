const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const scoreElem = document.getElementById('score');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
nextCtx.scale(30, 30);

const colors = [
  null,
  '#FF0D72', // T
  '#0DC2FF', // J
  '#0DFF72', // L
  '#F538FF', // O
  '#FF8E0D', // S
  '#FFE138', // Z
  '#3877FF', // I
];

const tetrominoes = {
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0],
  ],
  O: [
    [4, 4],
    [4, 4],
  ],
  S: [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ],
  Z: [
    [6, 6, 0],
    [0, 6, 6],
    [0, 0, 0],
  ],
  I: [
    [0, 0, 0, 0],
    [7, 7, 7, 7],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
};

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

let arena = createMatrix(COLS, ROWS);

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
};

let score = 0;

function updateScore() {
  scoreElem.textContent = score;
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (
        m[y][x] !== 0 &&
        (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function arenaSweep() {
  let rowCount = 0;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) continue outer;
    }
    arena.splice(y, 1);
    arena.unshift(new Array(COLS).fill(0));
    y++;
    rowCount++;
  }
  if (rowCount > 0) {
    score += rowCount;
    updateScore();
  }
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function hardDrop() {
  while (!collide(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--;
  merge(arena, player);
  arenaSweep();
  playerReset();
  dropCounter = 0;
}

function drawMatrix(matrix, offset, ctxToUse) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctxToUse.fillStyle = colors[value];
        ctxToUse.fillRect(x + offset.x, y + offset.y, 1, 1);
        ctxToUse.strokeStyle = 'black';
        ctxToUse.lineWidth = 0.1;
        ctxToUse.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, COLS, ROWS);

  drawMatrix(arena, { x: 0, y: 0 }, ctx);
  drawMatrix(player.matrix, player.pos, ctx);
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

let isPaused = true; 
let animationId = null;

function update(time = 0) {
  if (isPaused) {
    animationId = requestAnimationFrame(update);
    return;
  }

  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  animationId = requestAnimationFrame(update);
}

function randomPiece() {
  const pieces = 'TJLOSZI';
  return pieces[Math.floor(Math.random() * pieces.length)];
}

let nextPieceType = randomPiece();

function drawNextPiece() {
  nextCtx.fillStyle = '#000';
  nextCtx.fillRect(0, 0, 4, 4);
  const matrix = tetrominoes[nextPieceType];
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        nextCtx.fillStyle = colors[value];
        nextCtx.fillRect(x, y, 1, 1);
        nextCtx.strokeStyle = 'black';
        nextCtx.lineWidth = 0.1;
        nextCtx.strokeRect(x, y, 1, 1);
      }
    });
  });
}

function playerReset() {
  player.matrix = tetrominoes[nextPieceType];
  player.pos.y = 0;
  player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);

  nextPieceType = randomPiece();
  drawNextPiece();

  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    alert('ゲームオーバー');
    score = 0;
    updateScore();
    isPaused = true; 
  }
}

function restartGame() {
  arena.forEach(row => row.fill(0));
  score = 0;
  updateScore();
  playerReset();
  drawNextPiece();
  isPaused = true; 
}

document.addEventListener('keydown', event => {
  if (isPaused) return; 

  if (event.key === 'ArrowLeft') {
    playerMove(-1);
  } else if (event.key === 'ArrowRight') {
    playerMove(1);
  } else if (event.key === 'ArrowDown') {
    playerDrop();
  } else if (event.key === 'ArrowUp') {
    playerRotate(1);
  } else if (event.key === 'z') {
    playerRotate(-1);
  } else if (event.key === ' ') {
    event.preventDefault();
    hardDrop();
  }
});


document.getElementById('start-btn').addEventListener('click', () => {
  if (isPaused) {
    isPaused = false;
    lastTime = performance.now();
  }
});

document.getElementById('pause-btn').addEventListener('click', () => {
  isPaused = true;
});

document.getElementById('restart-btn').addEventListener('click', () => {
  restartGame();
});


playerReset();
updateScore();
drawNextPiece();
update();
