import type { BoostAction, BoostPlan, BenchResults, DeviceProfile, GameProfile } from "./types";

function r(v: number, d = 0) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

export function computeScore(bench: BenchResults, device: DeviceProfile): {
  overall: number; cpu: number; gpu: number; stability: number; memory: number; rank: string;
} {
  const cpu = Math.min(100, Math.log10(Math.max(1, bench.cpu.multiOpsPerSec / 5e5)) * 44);
  const gpu = Math.min(100, (bench.gpu.shaderScore / 42) * 100);
  const stability = Math.max(0, 100 - bench.thermal.driftPct * 4.2 - bench.gpu.jankPct * 1.4);
  const memory = Math.min(100, (bench.memory.transferOpsPerSec / 4.2e5) * 100);
  const overall = Math.round(cpu * 0.3 + gpu * 0.35 + stability * 0.2 + memory * 0.15);
  void device;
  return { overall, cpu: Math.round(cpu), gpu: Math.round(gpu), stability: Math.round(stability), memory: Math.round(memory), rank: "" };
}

export function rankFor(overall: number): string {
  if (overall >= 85) return "S";
  if (overall >= 72) return "A";
  if (overall >= 58) return "B";
  if (overall >= 44) return "C";
  if (overall >= 30) return "D";
  return "F";
}

export function detectBottleneck(b: BenchResults): BoostPlan["bottleneck"] {
  if (b.thermal.verdict === "hot" || b.thermal.verdict === "critical") return "thermal";
  const cpuS = Math.min(100, Math.log10(Math.max(1, b.cpu.multiOpsPerSec / 5e5)) * 44);
  const gpuS = Math.min(100, (b.gpu.shaderScore / 42) * 100);
  const memS = Math.min(100, (b.memory.transferOpsPerSec / 4.2e5) * 100);
  if (memS < 40) return "memory";
  const min = Math.min(cpuS, gpuS);
  if (min < 55) return cpuS <= gpuS ? "cpu" : "gpu";
  return "balanced";
}

export function buildPlan(
  bench: BenchResults,
  device: DeviceProfile,
  game: GameProfile | null
): BoostPlan {
  const bottleneck = detectBottleneck(bench);
  const actions: BoostAction[] = [];

  const cpuS = Math.min(100, Math.log10(Math.max(1, bench.cpu.multiOpsPerSec / 5e5)) * 44);
  const gpuS = Math.min(100, (bench.gpu.shaderScore / 42) * 100);

  if (bench.thermal.verdict === "hot" || bench.thermal.verdict === "critical") {
    actions.push({
      id: "thermal",
      title: "THERMAL THROTTLE DETECTED — this is your lag",
      detail: `Your device lost ${r(bench.thermal.droppedFpsPct, 0)}% of its frame rate during the sustained load test. When phones overheat they cut CPU/GPU clocks hard, so every HD game collapses after 10–20 minutes.`,
      impact: 10,
      risk: "none",
      steps: [
        "Play without a case — cases trap 10–15°C during long matches",
        "Keep the phone out of direct sun; ambient temp > 30°C can halve sustained clocks",
        "A $10 clip-on semiconductor cooler is the single biggest fps upgrade money can buy on phones",
        "Charge to 100% BEFORE playing — charging while gaming is the #1 heat source",
        "If the game lets you cap fps (e.g. 40/45), a stable cap beats a dropping 60",
      ],
    });
  }

  if (bottleneck === "memory" || device.deviceMemoryGb !== null && device.deviceMemoryGb <= 4) {
    actions.push({
      id: "ram",
      title: "RAM pressure — background apps are eating your frames",
      detail: `Measured memory pressure is high${device.deviceMemoryGb ? ` on a ${device.deviceMemoryGb}GB device` : ""}. Android keeps apps alive until RAM runs out; when it does, the game's own memory gets compressed or killed mid-match (the classic 'sudden stutter + reload').`,
      impact: bottleneck === "memory" ? 9 : 7,
      risk: "none",
      steps: [
        "Enable Developer Options → 'Don't keep activities' OFF, but 'Background process limit' → 'No background processes' before ranked sessions",
        "Reboot the phone before long sessions — cached leaks from days-old apps cost real fps",
        "Turn off Live Widgets and Always-On wallpapers (they wake the CPU hundreds of times a minute)",
        "Disable app preloading in Google Play settings (Play Protect → gear → uncheck preloading)",
      ],
    });
  }

  if (bottleneck === "cpu" || bench.cpu.scalingEfficiency < 65 || cpuS < 55) {
    actions.push({
      id: "cpu",
      title: "CPU scheduler inefficiency detected",
      detail: `Your big cores only run ${r(bench.cpu.scalingEfficiency)}% as fast as the scheduler should allow. Games that are CPU-bound (MOBAs, Free Fire, emulators) will stutter when threads land on little cores.`,
      impact: 8,
      risk: "low",
      steps: [
        "Enable Developer Options → 'Game Driver Preferences' and force the game to your GPU's vendor driver",
        "Disable battery saver entirely while gaming — it pins work to little cores",
        "Use the phone's built-in Game Mode / Game Booster and set it to Performance (not Balanced)",
        "Lock fps in-game to 60 and let the freed CPU headroom feed physics/netcode instead",
      ],
    });
  }

  if (bottleneck === "gpu" || gpuS < 55) {
    actions.push({
      id: "gpu",
      title: "GPU is the bottleneck for HD titles",
      detail: `Your ${device.gpu.vendor} ${device.gpu.renderer} sustained ${r(bench.gpu.fpsSteady)} fps in the stress scene. HD games will demand more than it can give at native resolution — the fix is to feed it fewer pixels, not fewer effects.`,
      impact: 9,
      risk: "none",
      steps: [
        "Drop in-game Render Quality/Resolution first — pixel count is 60-70% of GPU cost on mobile",
        "Keep shadows OFF before touching texture quality (shadows cost more than they look)",
        "Never use Dynamic Resolution / 'Auto' — it oscillates and causes visible jank",
        "Force 16:9 or 4:3 aspect ratio where supported — fewer pixels than 20:9",
      ],
    });
  }

  if (bench.gpu.jankPct > 12) {
    actions.push({
      id: "jank",
      title: "Frame pacing instability (jank)",
      detail: `${r(bench.gpu.jankPct)}% of frames during the test missed their vsync window. This is why the game feels 'choppy even when fps looks fine' in overlays.`,
      impact: 7,
      risk: "low",
      steps: [
        "In Developer Options, set 'Animator duration scale' to 0.5x (not off) — surfaces animate faster",
        "Try the game's Vulkan backend where available — better frame pacing on Adreno & Mali",
        "If on 60/90/120Hz screen, keep the game's fps cap at HALF or EXACTLY your panel refresh",
      ],
    });
  }

  if (bench.cpu.schedulerJitterMs > 6) {
    actions.push({
      id: "jitter",
      title: "Background jitter — something is stealing your CPU",
      detail: `Timers drifted ${r(bench.cpu.schedulerJitterMs, 1)}ms on average. A quiet phone drifts < 2ms. Something (sync, notifications, an app) wakes the CPU during frames.`,
      impact: 6,
      risk: "none",
      steps: [
        "Do Not Disturb ON while playing — notification churn causes real frame drops",
        "Settings → Accounts → turn off auto-sync for accounts you don't need",
        "Uninstall 'cleaner/battery saver' apps — they run loops every second and CAUSE lag",
        "Check Digital Wellbeing for apps active during your gaming hours",
      ],
    });
  }

  if (game) {
    actions.push({
      id: "game-tips",
      title: `${game.name} — title-specific loadout`,
      detail: `${game.category} · ${game.gpuBound > 0.55 ? "GPU-bound" : game.cpuBound > 0.55 ? "CPU-bound" : "balanced"} · needs ~${game.ramNeedGb}GB RAM free`,
      impact: 8,
      risk: "none",
      steps: game.tips,
    });
  }

  const thermalComponent = bench.thermal.verdict === "hot" || bench.thermal.verdict === "critical" ? 14
    : bench.thermal.verdict === "warm" ? 8 : 3;
  const ramComponent = bottleneck === "memory" ? 12 : device.deviceMemoryGb !== null && device.deviceMemoryGb <= 4 ? 8 : 5;
  const schedComponent = bench.cpu.scalingEfficiency < 65 || bottleneck === "cpu" ? 9 : 4;
  const gpuComponent = bottleneck === "gpu" ? 11 : 6;
  const base = game ? 10 : 4;

  return {
    headline:
      bottleneck === "thermal" ? "Your phone is overheating and cutting its own speed"
      : bottleneck === "memory" ? "Background apps are strangling your RAM"
      : bottleneck === "cpu" ? "Your CPU scheduler isn't using its fast cores"
      : bottleneck === "gpu" ? "Your GPU runs out of steam on HD scenes"
      : "Your device is well balanced — squeeze the last drops",
    estimatedFpsGainPct: Math.min(65, base + thermalComponent + ramComponent + schedComponent + gpuComponent),
    bottleneck,
    actions,
  };
}

export function gameVerdict(
  bench: BenchResults,
  device: DeviceProfile,
  game: GameProfile
): { verdict: string; fpsEstimate: [number, number] } {
  const cpuS = Math.min(100, Math.log10(Math.max(1, bench.cpu.multiOpsPerSec / 5e5)) * 44);
  const gpuS = Math.min(100, (bench.gpu.shaderScore / 42) * 100);
  const combined = cpuS * (1 - game.gpuBound) + gpuS * game.gpuBound;
  const thermalPenalty = 1 - (game.thermalLoad - 0.4 > 0 ? (game.thermalLoad - 0.4) * 0.28 : 0) * (bench.thermal.driftPct / 25);
  const load = Math.max(0.25, combined / 100);
  const hdPenalty = game.hdTier >= 4 && load < 0.75 ? (0.75 - load) * 60 : 0;
  const raw = load * 120 * thermalPenalty - hdPenalty;
  const ramTight = device.deviceMemoryGb !== null && device.deviceMemoryGb < game.ramNeedGb;
  const lo = Math.max(8, Math.round(raw * (ramTight ? 0.7 : 0.85)));
  const hi = Math.max(lo + 5, Math.round(raw * (ramTight ? 1.0 : 1.2)));
  const clamp = (x: number) => Math.min(140, x);
  return {
    verdict: hi < 35 ? "Struggles" : hi < 55 ? "Playable with tweaks" : hi < 75 ? "Smooth" : "Overkill",
    fpsEstimate: [clamp(lo), clamp(hi)],
  };
}
