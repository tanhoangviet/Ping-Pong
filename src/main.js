const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreLeft = document.querySelector('#score-left');
const scoreRight = document.querySelector('#score-right');
const overlay = document.querySelector('#overlay');
const startButton = document.querySelector('#start-button');

const keys = new Set();
const state = {
  running: false,
  paused: false,
  winner: '',
  leftScore: 0,
  rightScore: 0,
  paddleSpeed: 8,
  winScore: 7,
  left: { x: 82, y: 260, w: 24, h: 128, color: '#7df9ff' },
  right: { x: 994, y: 260, w: 24, h: 128, color: '#ff7ac8' },
  ball: { x: 550, y: 325, z: 12, r: 15, vx: 6, vy: 3.2, spin: 0, trail: [] }
};

function resetBall(direction = Math.random() > 0.5 ? 1 : -1) {
  state.ball.x = canvas.width / 2;
  state.ball.y = canvas.height / 2;
  state.ball.z = 12;
  state.ball.vx = 6 * direction;
  state.ball.vy = (Math.random() * 4 - 2) || 2;
  state.ball.spin = 0;
  state.ball.trail = [];
}

function startMatch() {
  state.leftScore = 0;
  state.rightScore = 0;
  state.winner = '';
  state.running = true;
  state.paused = false;
  state.left.y = state.right.y = 260;
  resetBall();
  overlay.classList.add('hidden');
  updateScore();
}

function updateScore() {
  scoreLeft.textContent = state.leftScore;
  scoreRight.textContent = state.rightScore;
}

function endMatch(winner) {
  state.running = false;
  state.winner = winner;
  overlay.querySelector('h2').textContent = `${winner} wins!`;
  overlay.querySelector('p').textContent = 'Press Start Match to play again.';
  startButton.textContent = 'Rematch';
  overlay.classList.remove('hidden');
}

function movePaddles() {
  if (keys.has('w')) state.left.y -= state.paddleSpeed;
  if (keys.has('s')) state.left.y += state.paddleSpeed;
  if (keys.has('arrowup')) state.right.y -= state.paddleSpeed;
  if (keys.has('arrowdown')) state.right.y += state.paddleSpeed;
  state.left.y = Math.max(70, Math.min(canvas.height - state.left.h - 70, state.left.y));
  state.right.y = Math.max(70, Math.min(canvas.height - state.right.h - 70, state.right.y));
}

function overlaps(paddle) {
  const b = state.ball;
  return b.x + b.r > paddle.x && b.x - b.r < paddle.x + paddle.w && b.y + b.r > paddle.y && b.y - b.r < paddle.y + paddle.h;
}

function tick() {
  if (state.running && !state.paused) {
    movePaddles();
    const b = state.ball;
    b.trail.unshift({ x: b.x, y: b.y, z: b.z });
    b.trail = b.trail.slice(0, 14);
    b.x += b.vx;
    b.y += b.vy + b.spin;
    b.z = 12 + Math.sin(Date.now() / 95) * 5;
    b.spin *= 0.96;

    if (b.y < 78 || b.y > canvas.height - 78) {
      b.vy *= -1;
      b.y = Math.max(78, Math.min(canvas.height - 78, b.y));
    }

    if ((b.vx < 0 && overlaps(state.left)) || (b.vx > 0 && overlaps(state.right))) {
      const paddle = b.vx < 0 ? state.left : state.right;
      const center = paddle.y + paddle.h / 2;
      const impact = (b.y - center) / (paddle.h / 2);
      b.vx *= -1.07;
      b.vy = impact * 7;
      b.spin = impact * 0.8;
      b.x = b.vx > 0 ? paddle.x + paddle.w + b.r : paddle.x - b.r;
    }

    if (b.x < -30) {
      state.rightScore += 1;
      updateScore();
      state.rightScore >= state.winScore ? endMatch('Player 2') : resetBall(1);
    }
    if (b.x > canvas.width + 30) {
      state.leftScore += 1;
      updateScore();
      state.leftScore >= state.winScore ? endMatch('Player 1') : resetBall(-1);
    }
  }
  draw();
  requestAnimationFrame(tick);
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawCourt() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#202b68');
  gradient.addColorStop(0.5, '#171b3d');
  gradient.addColorStop(1, '#46245d');
  ctx.fillStyle = gradient;
  roundedRect(0, 0, canvas.width, canvas.height, 28);

  ctx.save();
  ctx.translate(0, 40);
  ctx.strokeStyle = 'rgba(125, 249, 255, 0.34)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 17; i++) {
    const y = 70 + i * 31;
    ctx.beginPath();
    ctx.moveTo(155 - i * 9, y);
    ctx.lineTo(945 + i * 9, y);
    ctx.stroke();
  }
  for (let i = 0; i < 13; i++) {
    const x = 170 + i * 64;
    ctx.beginPath();
    ctx.moveTo(x, 96);
    ctx.lineTo(x + (i - 6) * 18, 584);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(255,255,255,.72)';
  ctx.setLineDash([18, 16]);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 82);
  ctx.lineTo(canvas.width / 2, canvas.height - 82);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPaddle(p) {
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = p.color;
  roundedRect(p.x + 10, p.y + 10, p.w, p.h, 13);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  roundedRect(p.x + 15, p.y + 20, 6, p.h - 42, 6);
}

function drawBall() {
  const b = state.ball;
  b.trail.forEach((dot, i) => {
    ctx.globalAlpha = (1 - i / b.trail.length) * 0.35;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(dot.x, dot.y + dot.z, b.r * (1 - i / 22), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = 28;
  ctx.fillStyle = '#fff3a6';
  ctx.beginPath();
  ctx.arc(b.x, b.y - b.z, b.r + b.z * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCourt();
  drawPaddle(state.left);
  drawPaddle(state.right);
  drawBall();
  if (state.paused) {
    ctx.fillStyle = 'rgba(0,0,0,.34)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '800 62px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
  }
}

window.addEventListener('keydown', (event) => {
  keys.add(event.key.toLowerCase());
  if (event.code === 'Space' && state.running) state.paused = !state.paused;
});
window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
startButton.addEventListener('click', startMatch);
draw();
tick();
