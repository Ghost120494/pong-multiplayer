// Shared deterministic Pong core: runs identically on server and client.
export const W = 800, H = 500, PADDLE_H = 80, PADDLE_W = 10, BALL = 10;
export const PADDLE_SPEED = 500; // px/s, max even for touch, so a client can't teleport
export const BALL_SPEED0 = 320, BALL_SPEEDUP = 1.05, BALL_MAX = 900;

// Keyboard sends dir; touch sends targetY (paddle centre). Server only trusts these.
export interface Input { dir?: -1 | 0 | 1; targetY?: number }
export interface State {
  ball: { x: number; y: number; vx: number; vy: number };
  paddles: [number, number]; // top y of each paddle
  score: [number, number];
  serveDir: 1 | -1;
}

export function initState(): State {
  const s: State = { ball: { x: 0, y: 0, vx: 0, vy: 0 }, paddles: [(H - PADDLE_H) / 2, (H - PADDLE_H) / 2], score: [0, 0], serveDir: 1 };
  serve(s);
  return s;
}

function serve(s: State) {
  // Deterministic serve angle derived from total score (no Math.random, so replays match).
  const n = s.score[0] + s.score[1];
  const angle = ((n * 37) % 60 - 30) * Math.PI / 180;
  s.ball = { x: W / 2, y: H / 2, vx: Math.cos(angle) * BALL_SPEED0 * s.serveDir, vy: Math.sin(angle) * BALL_SPEED0 };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function movePaddle(y: number, inp: Input, dt: number): number {
  const max = PADDLE_SPEED * dt;
  let dy = 0;
  if (typeof inp.targetY === "number" && Number.isFinite(inp.targetY)) {
    dy = clamp(inp.targetY - PADDLE_H / 2 - y, -max, max);
  } else if (inp.dir === 1 || inp.dir === -1) {
    dy = inp.dir * max;
  }
  return clamp(y + dy, 0, H - PADDLE_H);
}

// Pure: returns a new state. dt should be a fixed step (e.g. 1/60) for determinism.
export function step(prev: State, inputs: [Input, Input], dt: number): State {
  const s: State = structuredClone(prev);
  s.paddles = [movePaddle(s.paddles[0], inputs[0] ?? {}, dt), movePaddle(s.paddles[1], inputs[1] ?? {}, dt)];
  const b = s.ball;
  b.x += b.vx * dt; b.y += b.vy * dt;
  if (b.y < 0) { b.y = -b.y; b.vy = -b.vy; }
  if (b.y > H - BALL) { b.y = 2 * (H - BALL) - b.y; b.vy = -b.vy; }

  const hit = (py: number) => b.y + BALL >= py && b.y <= py + PADDLE_H;
  const bounce = (py: number, dirOut: 1 | -1, edge: number) => {
    const rel = clamp((b.y + BALL / 2 - (py + PADDLE_H / 2)) / (PADDLE_H / 2), -1, 1);
    const speed = Math.min(Math.hypot(b.vx, b.vy) * BALL_SPEEDUP, BALL_MAX);
    const a = rel * (Math.PI / 4);
    b.vx = Math.cos(a) * speed * dirOut; b.vy = Math.sin(a) * speed; b.x = edge;
  };
  if (b.vx < 0 && b.x <= PADDLE_W && hit(s.paddles[0])) bounce(s.paddles[0], 1, PADDLE_W);
  if (b.vx > 0 && b.x + BALL >= W - PADDLE_W && hit(s.paddles[1])) bounce(s.paddles[1], -1, W - PADDLE_W - BALL);

  if (b.x + BALL < 0) { s.score[1]++; s.serveDir = -1; serve(s); }
  else if (b.x > W) { s.score[0]++; s.serveDir = 1; serve(s); }
  return s;
}

// Client helper: map a touch's clientY on the canvas to game-space targetY.
export function touchToTargetY(clientY: number, rect: { top: number; height: number }): number {
  return clamp(((clientY - rect.top) / rect.height) * H, 0, H);
}
