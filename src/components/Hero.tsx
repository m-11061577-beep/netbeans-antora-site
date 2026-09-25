import { useEffect, useState } from "react";

export default function Hero({ onCta }: { onCta: () => void }) {
  const [fps, setFps] = useState(58);
  useEffect(() => {
    const id = setInterval(() => {
      setFps(55 + Math.round(Math.sin(Date.now() / 700) * 4 + Math.random() * 3));
    }, 350);
    return () => clearInterval(id);
  }, []);

  return (
    <div id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-ember-600/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-ember-400 border border-ember-500/30 bg-ember-500/5 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-ember-400 animate-pulse" />
              REAL HARDWARE ENGINE — NO PLACEBOS
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
              Kill the lag.
              <br />
              <span className="text-gradient-ember">Unlock every frame</span>
              <br />
              your phone is hiding.
            </h1>
            <p className="mt-6 text-slate-400 text-lg max-w-lg">
              NITRO BOOST scans your actual silicon — every CPU core, your exact GPU, real thermal
              behavior, memory bandwidth — then benchmarks it under fire and hands you a
              personalized fix list for even the heaviest HD games.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onCta} className="btn-ember text-white font-bold px-6 py-3.5 rounded-xl text-base">
                ⚡ Run free scan & benchmark
              </button>
              <a href="#myths" className="btn-ghost text-slate-200 font-semibold px-6 py-3.5 rounded-xl">
                Why this works
              </a>
            </div>
            <div className="mt-8 flex gap-6 text-sm text-slate-500">
              <div><span className="text-slate-200 font-bold">5</span> real benchmark suites</div>
              <div><span className="text-slate-200 font-bold">7</span> game loadouts</div>
              <div><span className="text-slate-200 font-bold">100%</span> on-device</div>
            </div>
          </div>

          <div className="relative">
            <div className="card-steel rounded-3xl p-6 animate-float-slow max-w-sm mx-auto shadow-glowlg">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono text-slate-500">LIVE TELEMETRY</div>
                <div className="w-2 h-2 rounded-full bg-volt-400 animate-pulse" />
              </div>
              <div className="text-center py-2">
                <div className="text-6xl font-black text-gradient-ember font-mono">{fps}</div>
                <div className="text-xs tracking-[0.3em] text-slate-500 mt-1">FPS UNLOCKED</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                {[
                  ["CPU", "86", "text-volt-300"],
                  ["GPU", "72", "text-ember-300"],
                  ["TEMP", "41°", "text-volt-300"],
                ].map(([k, v, c]) => (
                  <div key={k} className="bg-night-800/80 rounded-xl py-3 border border-night-700">
                    <div className={`text-lg font-bold font-mono ${c}`}>{v}</div>
                    <div className="text-[10px] text-slate-500 tracking-widest">{k}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-16 rounded-xl bg-night-900 border border-night-700 relative overflow-hidden p-2">
                <div className="flex items-end gap-1 h-full">
                  {[35, 55, 42, 68, 58, 74, 62, 80, 70, 88, 76, 92, 84, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-gradient-to-t from-ember-700 to-ember-400"
                      style={{ height: `${h}%`, opacity: 0.35 + (i / 14) * 0.65 }}
                    />
                  ))}
                </div>
                <div className="absolute inset-x-2 top-1/2 h-px bg-volt-500/40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
