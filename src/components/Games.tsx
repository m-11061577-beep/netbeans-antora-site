import { useState } from "react";
import { GAME_PRESETS } from "../engine/games";

function tierLabel(t: number) {
  return "●".repeat(t) + "○".repeat(Math.max(0, 5 - t));
}

export default function Games({
  verdicts,
}: {
  verdicts: Record<string, { verdict: string; fpsEstimate: [number, number] }> | null;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {GAME_PRESETS.map((g) => {
        const v = verdicts?.[g.id];
        return (
          <div key={g.id} className="card-steel rounded-2xl p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-100 leading-tight">{g.name}</h3>
                <div className="text-xs text-slate-500 mt-1">{g.category}</div>
              </div>
              <div className="text-right">
                <div className="text-ember-400 text-xs tracking-wider">{tierLabel(g.hdTier)}</div>
                <div className="text-[10px] text-slate-600">HD tier</div>
              </div>
            </div>

            <div className="flex gap-2 mb-4 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-night-700/60 text-slate-400">
                {g.gpuBound > 0.55 ? "GPU-BOUND" : g.cpuBound > 0.55 ? "CPU-BOUND" : "BALANCED"}
              </span>
              <span className="px-2 py-0.5 rounded bg-night-700/60 text-slate-400">{g.ramNeedGb}GB RAM</span>
            </div>

            {v ? (
              <div className="mb-4 p-3 rounded-xl bg-night-900 border border-night-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Your estimate</span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      v.fpsEstimate[1] < 35 ? "text-red-400" : v.fpsEstimate[1] < 55 ? "text-ember-400" : "text-volt-300"
                    }`}
                  >
                    {v.fpsEstimate[0]}–{v.fpsEstimate[1]} fps
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">{v.verdict}</div>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-xl bg-night-900/60 border border-night-700/50 text-xs text-slate-600">
                Run the scan to see your personal fps estimate for this title
              </div>
            )}

            <button
              onClick={() => setOpen(open === g.id ? null : g.id)}
              className="btn-ghost mt-auto text-sm text-slate-300 px-3 py-2 rounded-lg font-medium"
            >
              {open === g.id ? "Hide loadout" : "View optimization loadout →"}
            </button>

            {open === g.id && (
              <ul className="mt-3 space-y-2">
                {g.tips.map((t, i) => (
                  <li key={i} className="text-sm text-slate-400 flex gap-2">
                    <span className="text-ember-500 shrink-0">▸</span>
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
