import type { BenchResults, CpuBench, CpuCore, GpuBench, MemoryBench, ThermalBench } from "./types";

export type Phase = "idle" | "cpu-single" | "cpu-multi" | "gpu" | "thermal" | "memory" | "done";

const WORKER_SRC = `
function kernel(iter) {
  let x = 0.5, y = 0.1, acc = 0;
  for (let i = 0; i < iter; i++) {
    x = x * 1.0000001 - y * 0.0000001;
    y = y * 1.0000002 + x * 0.0000002;
    acc += Math.sqrt(x * x + y * y) + Math.sin(x) * 0.0001;
  }
  return acc;
}
self.onmessage = (e) => {
  if (e.data.type === "bench") {
    const t0 = performance.now();
    let ops = 0;
    let batchMs = 0;
    while (true) {
      const b0 = performance.now();
      kernel(60000);
      const b1 = performance.now();
      batchMs = b1 - b0;
      ops += 60000;
      if (b1 - t0 >= e.data.durationMs) break;
    }
    self.postMessage({ type: "bench", opsPerSec: ops / ((performance.now() - t0) / 1000), batchMs });
  } else if (e.data.type === "ping") {
    const delays = [];
    for (let i = 0; i < 40; i++) {
      const a = performance.now();
      setTimeout(() => {}, 0);
      // busy yield approximation: measure timer resolution
      let spin = 0;
      while (performance.now() - a < 1) spin++;
      delays.push(performance.now() - a);
    }
    const avg = delays.reduce((s, d) => s + d, 0) / delays.length;
    self.postMessage({ type: "ping", jitterMs: avg });
  }
};
`;

function spawnWorkers(n: number): Worker[] {
  const blob = new Blob([WORKER_SRC], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  return Array.from({ length: n }, () => new Worker(url));
}

function terminateAll(ws: Worker[]) {
  for (const w of ws) w.terminate();
}

function benchOneWorker(w: Worker, durationMs: number): Promise<{ opsPerSec: number; batchMs: number }> {
  return new Promise((resolve) => {
    w.onmessage = (e: MessageEvent) => {
      if (e.data.type === "bench") resolve({ opsPerSec: e.data.opsPerSec, batchMs: e.data.batchMs });
    };
    w.postMessage({ type: "bench", durationMs });
  });
}

export async function benchCpuSingle(onProgress: (p: number) => void): Promise<number> {
  const ws = spawnWorkers(1);
  onProgress(0.1);
  const res = await benchOneWorker(ws[0], 900);
  onProgress(1);
  terminateAll(ws);
  return res.opsPerSec;
}

export async function benchCpuMulti(
  coreCount: number,
  onProgress: (p: number, cores: CpuCore[]) => void
): Promise<CpuBench> {
  const n = Math.min(coreCount, 12);
  const ws = spawnWorkers(n);
  const results: { opsPerSec: number; batchMs: number }[] = [];
  const perCore: CpuCore[] = [];
  onProgress(0.05, []);

  await Promise.all(
    ws.map(
      (w, i) =>
        new Promise<void>((resolve) => {
          w.onmessage = (e: MessageEvent) => {
            if (e.data.type === "bench") {
              results[i] = { opsPerSec: e.data.opsPerSec, batchMs: e.data.batchMs };
              onProgress((results.filter(Boolean).length / n) * 0.9, perCore);
              resolve();
            }
          };
          w.postMessage({ type: "bench", durationMs: 1100 });
        })
    )
  );

  const total = results.reduce((s, r) => s + r.opsPerSec, 0);
  const single = results.reduce((a, b) => Math.max(a, b.opsPerSec), 0) || 1;
  results.forEach((r, i) => {
    perCore.push({
      index: i,
      pCores: r.opsPerSec > single * 0.72 ? 2 : r.opsPerSec > single * 0.45 ? 1 : 0,
      schedulerHint: r.batchMs > 12 ? 1 : 0,
      batchMs: Math.round(r.batchMs * 10) / 10,
      opsPerSec: Math.round(r.opsPerSec),
      loadFactor: Math.round((r.opsPerSec / single) * 100),
    });
  });

  terminateAll(ws);
  const scaling = (total / n / single) * 100;
  return {
    singleOpsPerSec: Math.round(single),
    multiOpsPerSec: Math.round(total),
    scalingEfficiency: Math.round(Math.min(100, scaling)),
    schedulerJitterMs: 0,
    cores: perCore,
  };
}

export async function benchCpuJitter(): Promise<number> {
  const ws = spawnWorkers(1);
  const jitter = await new Promise<number>((resolve) => {
    ws[0].onmessage = (e: MessageEvent) => {
      if (e.data.type === "ping") resolve(e.data.jitterMs);
    };
    ws[0].postMessage({ type: "ping" });
  });
  terminateAll(ws);
  return Math.round(jitter * 10) / 10;
}

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform float t;
uniform vec2 res;
void main() {
  vec2 uv = gl_FragCoord.xy / res.xy;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 p = uv * (2.0 + fi * 0.7) - 1.0;
    p += vec2(sin(t * (0.5 + fi * 0.13)), cos(t * (0.4 + fi * 0.11)));
    col += 0.12 * vec3(
      sin(p.x * 7.0 + t) + cos(p.y * 9.0 - t * 0.7),
      sin(p.x * 5.0 - t * 0.8) + cos(p.y * 6.0 + t),
      sin((p.x + p.y) * 4.0 + t * 0.5)
    );
  }
  float v = length(fract(col));
  gl_FragColor = vec4(col.r * v, col.g * v, col.b * v, 1.0);
}`;

const TRIANGLE_COUNT = 240;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export async function benchGpuStress(
  durationMs = 4200,
  onProgress?: (p: number, fpsNow: number) => void
): Promise<GpuBench> {
  const canvas = document.createElement("canvas");
  const scale = 0.85;
  const w = Math.max(480, Math.round((window.screen.width || 1280) * scale));
  const h = Math.max(360, Math.round((window.screen.height || 720) * scale));
  canvas.width = w;
  canvas.height = h;
  const gl = (canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  })) as WebGLRenderingContext | null;
  if (!gl) {
    return { fillRateMpix: 0, shaderScore: 0, jankPct: 0, fpsSteady: 0, trianglesPerSec: 0 };
  }

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  const tris: number[] = [];
  for (let i = 0; i < TRIANGLE_COUNT; i++) {
    const cx = Math.random() * 2 - 1, cy = Math.random() * 2 - 1;
    const s = 0.06 + Math.random() * 0.1;
    tris.push(cx - s, cy - s, cx + s, cy - s, cx, cy + s);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tris), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uT = gl.getUniformLocation(prog, "t");
  const uR = gl.getUniformLocation(prog, "res");
  gl.uniform2f(uR, w, h);

  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;z-index:9999;opacity:0.92;pointer-events:none";
  document.body.appendChild(canvas);

  const frameTimes: number[] = [];
  let raf = 0;
  const start = performance.now();
  let last = start;

  await new Promise<void>((resolve) => {
    const loop = (now: number) => {
      const elapsed = now - start;
      gl.uniform1f(uT, elapsed / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, TRIANGLE_COUNT * 3);
      frameTimes.push(now - last);
      last = now;
      const fps = 1000 / Math.max(1, frameTimes.slice(-30).reduce((s, x) => s + x, 0) / Math.min(30, frameTimes.length));
      onProgress?.(Math.min(1, elapsed / durationMs), Math.round(fps));
      if (elapsed >= durationMs) {
        cancelAnimationFrame(raf);
        resolve();
      } else {
        raf = requestAnimationFrame(loop);
      }
    };
    raf = requestAnimationFrame(loop);
  });

  const steady = frameTimes.slice(Math.floor(frameTimes.length * 0.3));
  const avg = steady.reduce((s, x) => s + x, 0) / Math.max(1, steady.length);
  const fpsSteady = 1000 / Math.max(1, avg);
  const sorted = [...steady].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] || 16.7;
  const jank = steady.filter((x) => x > median * 1.6).length / Math.max(1, steady.length);
  const mpix = (w * h) / 1e6;
  const fillRate = mpix * fpsSteady;

  canvas.remove();
  gl.getExtension("WEBGL_lose_context")?.loseContext();

  return {
    fillRateMpix: Math.round(fillRate),
    shaderScore: Math.round(fpsSteady * mpix * 10) / 10,
    jankPct: Math.round(jank * 1000) / 10,
    fpsSteady: Math.round(fpsSteady),
    trianglesPerSec: Math.round(fpsSteady * TRIANGLE_COUNT),
  };
}

export async function benchThermal(
  initialFps: number,
  durationMs = 6000,
  onProgress?: (p: number, fpsNow: number) => void
): Promise<ThermalBench> {
  // light sustained load: measure how fps degrades vs the stress test's initial rate
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 270;
  const gl = (canvas.getContext("webgl", { antialias: false, alpha: false })) as WebGLRenderingContext | null;
  let drawOk = false;
  if (gl) {
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const uT = gl.getUniformLocation(prog, "t");
    const uR = gl.getUniformLocation(prog, "res");
    gl.uniform2f(uR, 480, 270);
    drawOk = true;
    void uT;
  }

  const samples: number[] = [];
  const start = performance.now();
  let last = start;
  await new Promise<void>((resolve) => {
    const loop = (now: number) => {
      const elapsed = now - start;
      if (drawOk && gl) {
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      samples.push(now - last);
      last = now;
      onProgress?.(Math.min(1, elapsed / durationMs), Math.round(1000 / Math.max(1, now - start) * (elapsed / 1000) || 0));
      if (elapsed >= durationMs) resolve();
      else requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  const early = samples.slice(0, Math.floor(samples.length * 0.3));
  const late = samples.slice(Math.floor(samples.length * 0.7));
  const earlyFps = 1000 / Math.max(1, early.reduce((s, x) => s + x, 0) / Math.max(1, early.length));
  const lateFps = 1000 / Math.max(1, late.reduce((s, x) => s + x, 0) / Math.max(1, late.length));
  const droppedPct = Math.max(0, ((earlyFps - lateFps) / Math.max(1, earlyFps)) * 100);
  const sustained = Math.max(lateFps, 1000 / Math.max(1, samples.reduce((s, x) => s + x, 0) / Math.max(1, samples.length)));

  const driftPct = Math.min(100, droppedPct * 0.6 + (initialFps > 0 ? Math.max(0, ((initialFps - sustained) / initialFps)) * 100 * 0.4 : 0));
  const verdict: ThermalBench["verdict"] =
    driftPct > 28 ? "critical" : driftPct > 15 ? "hot" : driftPct > 6 ? "warm" : "cool";

  return {
    driftPct: Math.round(driftPct * 10) / 10,
    droppedFpsPct: Math.round(droppedPct * 10) / 10,
    verdict,
    sustainedFps: Math.round(sustained),
  };
}

export async function benchMemory(onProgress: (p: number) => void): Promise<MemoryBench> {
  const size = 1_500_000;
  const a = new Float64Array(size);
  const b = new Float64Array(size);
  for (let i = 0; i < size; i++) a[i] = i % 7;
  onProgress(0.2);
  const t0 = performance.now();
  let ops = 0;
  let iter = 0;
  while (performance.now() - t0 < 900) {
    for (let i = 0; i < size; i++) b[i] = a[i] * 2 + 1;
    ops += size;
    iter++;
    if (iter > 30) break;
  }
  const dt = (performance.now() - t0) / 1000;
  onProgress(0.8);
  const transferOps = ops / dt;
  const ok = iter > 0 && isFinite(transferOps);
  return {
    pressureScore: Math.min(100, (transferOps / 4.2e5) * 100),
    transferOpsPerSec: Math.round(transferOps),
    ok,
  };
}

export async function runFullBenchmark(
  cores: number,
  onPhase: (phase: Phase, note: string) => void,
  onProgress: (p: number) => void,
  onFps: (fps: number) => void
): Promise<BenchResults> {
  const phases: Phase[] = ["cpu-single", "cpu-multi", "gpu", "thermal", "memory"];
  const phaseWeight: Record<string, number> = {
    "cpu-single": 0.12,
    "cpu-multi": 0.22,
    gpu: 0.3,
    thermal: 0.22,
    memory: 0.14,
  };
  let done = 0;
  const bump = (local: number) => onProgress(Math.min(0.999, done + local * (phaseWeight[phases[Math.min(phases.length - 1, 0)]] ?? 0)));

  onPhase("cpu-single", "Probing single-core speed…");
  const single = await benchCpuSingle((p) => onProgress(done + p * phaseWeight["cpu-single"]));
  done += phaseWeight["cpu-single"];

  onPhase("cpu-multi", `Stressing ${cores} cores…`);
  const multi = await benchCpuMulti(cores, (p) => onProgress(done + p * phaseWeight["cpu-multi"]));
  multi.singleOpsPerSec = Math.round(single);
  done += phaseWeight["cpu-multi"];

  onPhase("gpu", "Running GPU stress scene…");
  const gpu = await benchGpuStress(4200, (_p, fps) => {
    onFps(fps);
    onProgress(done + Math.min(1, _p) * phaseWeight["gpu"]);
  });
  done += phaseWeight["gpu"];

  onPhase("thermal", "Measuring thermal drift…");
  const thermal = await benchThermal(gpu.fpsSteady, 6000, (p) => {
    onProgress(done + p * phaseWeight["thermal"]);
  });
  done += phaseWeight["thermal"];

  onPhase("memory", "Testing memory bandwidth…");
  const memory = await benchMemory((p) => onProgress(done + p * phaseWeight["memory"]));

  onPhase("cpu-single", "Checking scheduler jitter…");
  const jitter = await benchCpuJitter();
  multi.schedulerJitterMs = jitter;

  onPhase("done", "Complete");
  void bump;
  return { cpu: multi, gpu, thermal, memory, timestamp: Date.now() };
}
