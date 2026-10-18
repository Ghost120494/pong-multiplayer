
const N = 20, c = document.getElementById("c"), x = c.getContext("2d");
let cell, snake, dir, queue, food, score, best = +localStorage.snakeBest || 0, timer, alive = false;
function fit() { const s = Math.min(innerWidth, innerHeight - 40) | 0; cell = Math.floor(s / N); c.width = c.height = cell * N; c.style.marginTop = "40px"; draw(); }
addEventListener("resize", fit);
function place() { do food = { x: Math.random() * N | 0, y: Math.random() * N | 0 }; while (snake.some(p => p.x === food.x && p.y === food.y)); }
function start() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]; dir = { x: 1, y: 0 }; queue = []; score = 0; alive = true;
  place(); hud(); document.getElementById("over").style.display = "none"; clearInterval(timer); timer = setInterval(tick, 120);
}
function turn(nx, ny) { // queue up to 2 turns so quick swipes aren't lost; no reversing
  const last = queue.length ? queue[queue.length - 1] : dir;
  if ((nx !== -last.x || ny !== -last.y) && (nx !== last.x || ny !== last.y) && queue.length < 2) queue.push({ x: nx, y: ny });
}
function tick() {
  if (queue.length) dir = queue.shift();
  const h = { x: (snake[0].x + dir.x + N) % N, y: (snake[0].y + dir.y + N) % N }; // wraps at walls
  const eating = h.x === food.x && h.y === food.y;
  const body = eating ? snake : snake.slice(0, -1);
  if (body.some(p => p.x === h.x && p.y === h.y)) return die();
  snake = [h, ...body];
  if (eating) { score++; place(); hud(); clearInterval(timer); timer = setInterval(tick, Math.max(60, 120 - score * 2)); }
  draw();
}
function die() {
  alive = false; clearInterval(timer);
  if (score > best) { best = score; localStorage.snakeBest = best; }
  hud(); document.getElementById("title").textContent = "Game over: " + score; document.getElementById("go").textContent = "Play again";
  document.getElementById("over").style.display = "flex";
}
function hud() { document.getElementById("hud").textContent = `Score ${score || 0} · Best ${best}`; }
function draw() {
  if (!snake) return; x.fillStyle = "#111"; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "#f44"; x.fillRect(food.x * cell + 2, food.y * cell + 2, cell - 4, cell - 4);
  snake.forEach((p, i) => { x.fillStyle = i ? "#4c4" : "#8f8"; x.fillRect(p.x * cell + 1, p.y * cell + 1, cell - 2, cell - 2); });
}
const K = { ArrowUp: [0,-1], w: [0,-1], ArrowDown: [0,1], s: [0,1], ArrowLeft: [-1,0], a: [-1,0], ArrowRight: [1,0], d: [1,0] };
addEventListener("keydown", e => { const k = K[e.key]; if (k) { e.preventDefault(); if (!alive) start(); else turn(...k); } else if (e.key === " " && !alive) start(); });
let sx, sy; // swipe: turn as soon as the finger moves 20px, so it feels immediate
addEventListener("pointerdown", e => { sx = e.clientX; sy = e.clientY; });
addEventListener("pointermove", e => {
  if (sx == null || !alive) return; const dx = e.clientX - sx, dy = e.clientY - sy;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy)); sx = e.clientX; sy = e.clientY;
});
addEventListener("pointerup", () => sx = null);
document.getElementById("go").onclick = start;
fit(); hud();
