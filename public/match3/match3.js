"use strict";
// Gem Swap: 8x8 match-3 with bonus gems.
// Bonuses: match 4 -> line blaster (clears its row or column), L/T shape -> bomb (clears 3x3),
// match 5 in a line -> rainbow (swap with any gem to clear every gem of that colour).
const N = 8, C = 6, S = 80, MOVES = 30;
const COLORS = ["#ff5a5f", "#ffb400", "#3ddc84", "#3fa7ff", "#b26bff", "#ff7ad9"];
const cv = document.getElementById("c"), g = cv.getContext("2d");
const hud = document.getElementById("hud"), msg = document.getElementById("msg");
let board, score, moves, best = Number(localStorage.getItem("m3Best") || 0), sel = null, busy = false, flash = [];

const rnd = () => Math.floor(Math.random() * C);
const gem = (c, kind = null) => ({ c, kind }); // kind: null | "row" | "col" | "bomb" | "rainbow"
const inB = (r, c) => r >= 0 && c >= 0 && r < N && c < N;

function newGame() {
  board = []; score = 0; moves = MOVES; sel = null; busy = false;
  for (let r = 0; r < N; r++) { board.push([]); for (let c = 0; c < N; c++) {
    let k; do k = rnd(); while ((c >= 2 && board[r][c-1].c === k && board[r][c-2].c === k) || (r >= 2 && board[r-1][c].c === k && board[r-2][c].c === k));
    board[r].push(gem(k)); } }
  if (!hasMove()) return newGame();
  msg.textContent = "Tap two neighbouring gems, or swipe, to swap."; render();
}

// Find runs of 3+; returns {cells:Set("r,c"), spawns:[{r,c,gem}]}
function findMatches(swapA, swapB) {
  const runs = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N;) {
    let e = c; const k = board[r][c]?.c;
    while (e + 1 < N && k != null && k >= 0 && board[r][e+1]?.c === k) e++;
    if (k >= 0 && e - c >= 2) runs.push({ dir: "h", cells: Array.from({ length: e - c + 1 }, (_, i) => [r, c + i]) });
    c = e + 1;
  }
  for (let c = 0; c < N; c++) for (let r = 0; r < N;) {
    let e = r; const k = board[r][c]?.c;
    while (e + 1 < N && k != null && k >= 0 && board[e+1][c]?.c === k) e++;
    if (k >= 0 && e - r >= 2) runs.push({ dir: "v", cells: Array.from({ length: e - r + 1 }, (_, i) => [r + i, c]) });
    r = e + 1;
  }
  const cells = new Set(), spawns = [], key = (r, c) => r + "," + c;
  const used = new Set();
  // Intersections of h and v runs -> bomb
  for (const a of runs) if (a.dir === "h") for (const b of runs) if (b.dir === "v") {
    const hit = a.cells.find(([r, c]) => b.cells.some(([r2, c2]) => r === r2 && c === c2));
    if (hit && !used.has(a) && !used.has(b)) { used.add(a); used.add(b); spawns.push({ r: hit[0], c: hit[1], gem: gem(board[hit[0]][hit[1]].c, "bomb") }); }
  }
  for (const run of runs) {
    run.cells.forEach(([r, c]) => cells.add(key(r, c)));
    if (used.has(run) || run.cells.length < 4) continue;
    // place bonus at the swapped cell if it's in the run, else the middle
    const pick = run.cells.find(([r, c]) => (swapA && swapA[0] === r && swapA[1] === c) || (swapB && swapB[0] === r && swapB[1] === c)) || run.cells[run.cells.length >> 1];
    const k = board[pick[0]][pick[1]].c;
    spawns.push({ r: pick[0], c: pick[1], gem: run.cells.length >= 5 ? gem(-1, "rainbow") : gem(k, run.dir === "h" ? "col" : "row") });
  }
  return { cells, spawns };
}

// Expand a set of cleared cells by triggering any bonus gems inside it.
function detonate(cells) {
  const queue = [...cells], seen = new Set(cells);
  const add = (r, c) => { const k = r + "," + c; if (inB(r, c) && !seen.has(k)) { seen.add(k); queue.push(k); } };
  while (queue.length) {
    const [r, c] = queue.pop().split(",").map(Number), t = board[r][c];
    if (!t) continue;
    if (t.kind === "row") for (let i = 0; i < N; i++) add(r, i);
    if (t.kind === "col") for (let i = 0; i < N; i++) add(i, c);
    if (t.kind === "bomb") for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) add(r + dr, c + dc);
    if (t.kind === "rainbow") { const k = rnd(); for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (board[i][j]?.c === k) add(i, j); }
  }
  return seen;
}

function clearCells(cells, spawns, combo) {
  const spawnKeys = new Set(spawns.map(s => s.r + "," + s.c));
  let n = 0;
  for (const k of cells) { if (spawnKeys.has(k)) continue; const [r, c] = k.split(",").map(Number); if (board[r][c]) { board[r][c] = null; n++; } }
  for (const s of spawns) board[s.r][s.c] = s.gem;
  score += n * 10 * combo;
  flash = [...cells];
}

function collapse() {
  for (let c = 0; c < N; c++) {
    let w = N - 1;
    for (let r = N - 1; r >= 0; r--) if (board[r][c]) { const t = board[r][c]; board[r][c] = null; board[w--][c] = t; }
    for (; w >= 0; w--) board[w][c] = gem(rnd());
  }
}

const wait = ms => new Promise(r => setTimeout(r, ms));
async function resolve(a, b, preset) {
  let combo = 1, first = true;
  while (true) {
    let { cells, spawns } = findMatches(first ? a : null, first ? b : null);
    if (preset) { preset.forEach(k => cells.add(k)); preset = null; }
    if (!cells.size) break;
    cells = detonate(cells);
    // don't destroy freshly spawned bonuses
    clearCells(cells, spawns, combo); render(); await wait(180);
    flash = []; collapse(); render(); await wait(140);
    combo++; first = false;
  }
  if (combo > 2) msg.textContent = `Combo x${combo - 1}!`;
}

async function trySwap(a, b) {
  if (busy || moves <= 0) return;
  busy = true; sel = null;
  const A = board[a[0]][a[1]], B = board[b[0]][b[1]];
  board[a[0]][a[1]] = B; board[b[0]][b[1]] = A; render(); await wait(120);
  let preset = null;
  // Rainbow swap: clear every gem of the other gem's colour (two rainbows clear the board).
  if (A.kind === "rainbow" || B.kind === "rainbow") {
    const other = A.kind === "rainbow" ? B : A; preset = new Set();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
      if (other.kind === "rainbow" || board[r][c].c === other.c) preset.add(r + "," + c);
    preset.add(a.join(",")); preset.add(b.join(","));
    board[a[0]][a[1]].kind = board[a[0]][a[1]].kind === "rainbow" ? null : board[a[0]][a[1]].kind;
    board[b[0]][b[1]].kind = board[b[0]][b[1]].kind === "rainbow" ? null : board[b[0]][b[1]].kind;
  } else if (A.kind && B.kind) {
    preset = new Set([a.join(","), b.join(",")]); // two bonuses swapped together both fire
  } else if (!findMatches().cells.size) {
    board[a[0]][a[1]] = A; board[b[0]][b[1]] = B; busy = false; msg.textContent = "No match there."; return render();
  }
  moves--; msg.textContent = "";
  await resolve(a, b, preset);
  if (score > best) { best = score; localStorage.setItem("m3Best", best); }
  if (moves <= 0) msg.textContent = `Out of moves! Final score ${score}.`;
  else if (!hasMove()) { msg.textContent = "No moves left, shuffling..."; shuffle(); }
  busy = false; render();
}

function hasMove() {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (board[r][c].kind) return true;
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc; if (!inB(r2, c2)) continue;
      [board[r][c], board[r2][c2]] = [board[r2][c2], board[r][c]];
      const ok = findMatches().cells.size > 0;
      [board[r][c], board[r2][c2]] = [board[r2][c2], board[r][c]];
      if (ok) return true;
    }
  }
  return false;
}
function shuffle() { do { const all = board.flat(); for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; } board = Array.from({ length: N }, (_, r) => all.slice(r * N, r * N + N)); } while (findMatches().cells.size || !hasMove()); }

function render() {
  hud.textContent = `Score ${score} · Moves ${moves} · Best ${best}`;
  g.clearRect(0, 0, 640, 640);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x = c * S, y = r * S, t = board[r][c];
    g.fillStyle = (r + c) % 2 ? "#1a1a24" : "#1f1f2b"; g.fillRect(x, y, S, S);
    if (flash.includes(r + "," + c)) { g.fillStyle = "#fff3"; g.fillRect(x, y, S, S); }
    if (!t) continue;
    const cx = x + S / 2, cy = y + S / 2, R = S * 0.36;
    if (t.kind === "rainbow") {
      for (let i = 0; i < C; i++) { g.fillStyle = COLORS[i]; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, i * Math.PI / 3, (i + 1) * Math.PI / 3); g.fill(); }
    } else {
      g.fillStyle = COLORS[t.c]; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#fff5"; g.beginPath(); g.arc(cx - R * 0.35, cy - R * 0.35, R * 0.28, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 5;
      if (t.kind === "row") { g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.stroke(); }
      if (t.kind === "col") { g.beginPath(); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke(); }
      if (t.kind === "bomb") { g.beginPath(); g.arc(cx, cy, R * 0.45, 0, Math.PI * 2); g.stroke(); }
    }
    if (sel && sel[0] === r && sel[1] === c) { g.strokeStyle = "#fff"; g.lineWidth = 4; g.strokeRect(x + 3, y + 3, S - 6, S - 6); }
  }
}

function cellAt(e) { const b = cv.getBoundingClientRect(); return [Math.floor((e.clientY - b.top) / b.height * N), Math.floor((e.clientX - b.left) / b.width * N)]; }
let down = null;
cv.addEventListener("pointerdown", e => { down = { cell: cellAt(e), x: e.clientX, y: e.clientY }; });
cv.addEventListener("pointerup", e => {
  if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y, a = down.cell; down = null;
  if (!inB(a[0], a[1])) return;
  if (Math.hypot(dx, dy) > 20) { // swipe
    const b = Math.abs(dx) > Math.abs(dy) ? [a[0], a[1] + Math.sign(dx)] : [a[0] + Math.sign(dy), a[1]];
    if (inB(b[0], b[1])) trySwap(a, b); return;
  }
  if (sel && Math.abs(sel[0] - a[0]) + Math.abs(sel[1] - a[1]) === 1) trySwap(sel, a);
  else { sel = sel && sel[0] === a[0] && sel[1] === a[1] ? null : a; render(); }
});
document.getElementById("restart").addEventListener("click", () => { if (!busy) newGame(); });
newGame();
