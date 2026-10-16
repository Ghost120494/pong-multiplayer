import { initState, step } from "./core";
let a = initState(), b = initState();
for (let i = 0; i < 5000; i++) { const inp: any = [{ targetY: (i*7)%500 }, { dir: i%90<45?1:-1 }]; a = step(a, inp, 1/60); b = step(b, inp, 1/60); }
console.log(JSON.stringify(a) === JSON.stringify(b) ? "deterministic OK" : "MISMATCH", a.score);
