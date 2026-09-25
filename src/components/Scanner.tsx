import { useCallback, useState } from "react";
import { runFullBenchmark, type Phase } from "../engine/benchmarks";
import { scanDevice } from "../engine/device";
import { buildPlan, computeScore, rankFor, gameVerdict } from "../engine/plan";
import { GAME_PRESETS } from "../engine/games";
import type { DiagnosticReport } from "../engine/types";
import { MiniBar, ScoreGauge, Stat } from "./ui";

type Stage = "idle" | "benchmarking" | "report";

const PHASES: Phase[] = ["cpu-single", "cpu-multi", "gpu", "thermal", "memory"];

const PHASE_LABEL: Record<Phase, string> = {
  "cpu-single": "CPU single-core",
  "cpu-multi": "CPU multi-core",
  gpu: "GPU stress",
  thermal: "Thermal drift",
  memory: "Memory",
  idle: "Idle",
  done: "Done",
};

export default function Scanner({ onReport }: { onReport: (r: DiagnosticReport | null) => void }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [phase, setPhase] = useState<Phase>("idle");
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState(0);
  const [fpsNow, setFpsNow] = useState(0);
  const [report, setReport] = useState<DiagnosticReport | null>(null);

  const start = useCallback(async () => {
    setStage("benchmarking");
    setProgress(0);
    setNote("Fingerprinting hardware…");

    const device = await scanDevice();
    const bench = await runFullBenchmark(
      Math.min(device.cores, 12),
      (ph, n) => {
        setPhase(ph);
        setNote(n);
      },
      (p) => setProgress(p),
      (fps) => setFpsNow(fps)
    );

    const scores = computeScore(bench, device);
    scores.rank = rankFor(scores.overall);
    const plan = buildPlan(bench, device, null);
    const games = GAME_PRESETS.map((g) => ({ game: g, ...gameVerdict(bench, device, g) }));
    const r: DiagnosticReport = { device, bench, scores, plan, games };
    setReport(r);
    setStage("report");
    onReport(r);
  }, [onReport]);

  const retry = () => {
    setReport(null);
    setStage("idle");
    setProgress(0);
    onReport(null);
  };

  if (stage === "report" && report) {
    const d = report.device;
    const s = report.scores;
    const plan = report.plan;
    const b = report.bench;
    return (
      <div className="space-y-6">
        <div className="card-steel rounded-3xl p-6">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <ScoreGauge value={s.overall} label="NITRO SCORE" sub={`Rank ${s.rank}`} />
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat k="OS" v={d.osHint} />
                <Stat k="GPU" v={d.gpu.renderer.slice(0, 24)} />
                <Stat k="GPU tier" v={d.gpu.tier} />
                <Stat k="Cores" v={String(d.cores)} />
                <Stat k="RAM" v={d.deviceMemoryGb ? `≥${d.deviceMemoryGb} GB` : "unknown"} />
                <Stat k="Screen" v={`${d.screenH}p @${d.dpr}x`} />
                <Stat k="Single core" v={`${(b.cpu.singleOpsPerSec / 1e6).toFixed(2)}M op/s`} />
                <Stat k="Multi core" v={`${(b.cpu.multiOpsPerSec / 1e6).toFixed(1)}M op/s`} />
                <Stat k="GPU steady" v={`${b.gpu.fpsSteady} fps`} />
                <Stat k="Jank" v={`${b.gpu.jankPct}%`} />
                <Stat k="Thermal" v={b.thermal.verdict} />
                <Stat k="Jitter" v={`${b.cpu.schedulerJitterMs} ms`} />
              </div>
            </div>
            <div className="w-full lg:w-52 space-y-4 shrink-0">
              <MiniBar label="CPU" value={s.cpu} />
              <MiniBar label="GPU" value={s.gpu} />
              <MiniBar label="Stability" value={s.stability} />
              <MiniBar label="Memory" value={s.memory} />
            </div>
          </div>

          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-ember-600/10 to-transparent border border-ember-500/20">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-lg font-bold">
                Bottleneck: <span className="text-ember-400 uppercase">{plan.bottleneck}</span>
              </div>
              <div className="text-sm text-slate-400">
                · Est. fps gain if you apply the plan:{" "}
                <span className="text-volt-300 font-mono font-bold">+{plan.estimatedFpsGainPct}%</span>
              </div>
            </div>
            <p className="text-slate-300 mt-2">{plan.headline}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {plan.actions.map((a) => (
            <div key={a.id} className="card-steel rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-slate-100 leading-snug">{a.title}</h3>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-ember-500/10 text-ember-400 border border-ember-500/20 shrink-0">
                  IMPACT {a.impact}/10 · {a.risk.toUpperCase()} RISK
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-3">{a.detail}</p>
              <ul className="space-y-2">
                {a.steps.map((st, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <span className="text-ember-500 font-mono shrink-0">{i + 1}.</span>
                    {st}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button onClick={retry} className="btn-ghost text-slate-300 px-5 py-2.5 rounded-xl text-sm font-medium">
          ↺ Run scan again
        </button>
      </div>
    );
  }

  if (stage === "benchmarking") {
    const passed = PHASES.indexOf(phase);
    return (
      <div className="card-steel rounded-3xl p-6 sm:p-10">
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-sm text-ember-400">{note}</div>
          {phase === "gpu" || phase === "thermal" ? (
            <div className="font-mono text-3xl font-black text-gradient-ember">{fpsNow} fps</div>
          ) : null}
        </div>
        <div className="h-3 rounded-full bg-night-700 overflow-hidden mb-8">
          <div
            className="h-full bg-gradient-to-r from-ember-600 via-ember-500 to-ember-300 transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PHASES.map((ph, i) => {
            const active = ph === phase;
            const done = passed > i || phase === "done";
            return (
              <div
                key={ph}
                className={`px-3 py-3 rounded-lg border text-xs font-mono text-center transition-all ${
                  done
                    ? "bg-volt-500/10 border-volt-500/40 text-volt-300"
                    : active
                    ? "bg-ember-500/10 border-ember-500/50 text-ember-300 animate-flicker"
                    : "bg-night-800 border-night-700 text-slate-500"
                }`}
              >
                {done ? "✓ " : active ? "▸ " : ""}{PHASE_LABEL[ph]}
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-slate-600 mt-6">
          Keep this tab in the foreground — backgrounding the page skews results.
        </p>
      </div>
    );
  }

  return (
    <div className="card-steel rounded-3xl p-6 sm:p-10 text-center">
      <div className="text-6xl mb-4">⚡</div>
      <h3 className="text-2xl font-extrabold mb-2">Deep Hardware Scan</h3>
      <p className="text-slate-400 max-w-lg mx-auto mb-8">
        Fingerprints your exact silicon, hammers every CPU core, runs a GPU shader stress scene,
        measures thermal drift under sustained load, and tests memory bandwidth. Takes ~25 seconds.
        Everything runs on your device — nothing is uploaded. Root-free, anti-cheat-safe.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8 text-xs font-mono">
        {["CPU single", "CPU multi", "GPU stress", "Thermal", "Memory"].map((x) => (
          <div key={x} className="px-3 py-2 rounded-lg bg-night-800 border border-night-700 text-slate-400">
            {x}
          </div>
        ))}
      </div>
      <button onClick={start} className="btn-ember text-white font-bold px-8 py-4 rounded-2xl text-lg animate-pulse-ring">
        START FULL SCAN
      </button>
    </div>
  );
}
