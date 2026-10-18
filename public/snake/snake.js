"use strict";
const N = 20, CELL = 20, c = document.getElementById("c"), g = c.getContext("2d");
const hud = document.getElementById("hud"), msg = document.getElementById("msg");
let best = Number(localStorage.getItem("snakeBest") || 0), snake, dir, queue, food, score, alive, running, timer;
function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]; dir = { x: 1, y: 0 }; queue = [];
  score = 0; alive = true; running = false; placeFood(); draw(); updateHud();
}
function placeFood() {
  do food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
  while (snake.some(s => s.x === food.x && s.y === food.y));
}
function updateHud() { hud.textContent = `Score ${score} · Best ${best}`; }
function turn(nx, ny) {
  const last = queue.length ? queue[queue.length - 1] : dir;
  if (nx === -last.x && ny === -last.y) return; // no reversing into yourself
  if (nx === last.x && ny === last.y) return;
  if (queue.length < 3) queue.push({ x: nx, y: ny });
  if (!alive) { reset(); }
  if (!running) start();
}
function start() { running = true; msg.textContent = ""; clearInterval(timer); timer = setInterval(tick, 110); }
function tick() {
  if (queue.length) dir = queue.shift();
  const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || snake.some(s => s.x === h.x && s.y === h.y)) return die();
  snake.unshift(h);
  if (h.x === food.x && h.y === food.y) { score++; if (score > best) { best = score; localStorage.setItem("snakeBest", best); } placeFood(); updateHud(); }
  else snake.pop();
  draw();
}
function die() { clearInterval(timer); alive = false; running = false; msg.textContent = "Game over. Press a direction or swipe to play again."; draw(); }
function draw() {
  g.fillStyle = "#111"; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#f55"; g.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
  snake.forEach((s, i) => { g.fillStyle = i ? (alive ? "#4c8" : "#666") : (alive ? "#7fd" : "#999"); g.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2); });
}
const KEYS = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
addEventListener("keydown", e => { const k = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (k) { e.preventDefault(); turn(k[0], k[1]); } });
let sx = 0, sy = 0;
c.addEventListener("pointerdown", e => { sx = e.clientX; sy = e.clientY; });
c.addEventListener("pointerup", e => {
  const dx = e.clientX - sx, dy = e.clientY - sy;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy));
});
reset();
