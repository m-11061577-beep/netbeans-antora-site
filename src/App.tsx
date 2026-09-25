import { useCallback, useState } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Myths from "./components/Myths";
import Games from "./components/Games";
import Scanner from "./components/Scanner";
import { Section } from "./components/ui";
import type { DiagnosticReport } from "./engine/types";

export default function App() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);

  const scrollToScan = useCallback(() => {
    document.getElementById("scan")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => document.getElementById("scan")?.scrollIntoView({ behavior: "smooth" }), 350);
  }, []);

  return (
    <div className="min-h-screen bg-night-950 text-slate-100">
      <Nav onCta={scrollToScan} />

      <Hero onCta={scrollToScan} />

      <Section
        id="scan"
        eyebrow="STEP 1"
        title="Deep Hardware Scan"
        sub="One tap. ~25 seconds. Real numbers from your real silicon — CPU cores, GPU shader throughput, thermal behavior, memory bandwidth. Nothing leaves your device."
      >
        <Scanner onReport={setReport} />
      </Section>

      <Section
        id="bench"
        eyebrow="WHAT IT MEASURES"
        title="A real engine, not a placebo"
        sub="Fake 'booster' apps show a spinning circle and claim they freed 2GB of RAM. NITRO BOOST measures your hardware and shows its work."
      >
        <Features />
      </Section>

      <Section
        id="plan"
        eyebrow="STEP 2"
        title="Your boost plan"
        sub={
          report
            ? `Generated from your measured scores. Bottleneck: ${report.plan.bottleneck}. Estimated fps gain: +${report.plan.estimatedFpsGainPct}%.`
            : "Run the scan above — your personalized fix list appears here, ranked by impact for your exact bottleneck."
        }
      >
        {report ? (
          <div className="card-steel rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-2xl font-black text-gradient-ember">+{report.plan.estimatedFpsGainPct}%</span>
              <span className="text-slate-400 text-sm">estimated fps gain · bottleneck: <b className="text-ember-400 uppercase">{report.plan.bottleneck}</b></span>
            </div>
            <ul className="space-y-3">
              {report.plan.actions.map((a, i) => (
                <li key={a.id} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-lg bg-ember-500/15 text-ember-400 grid place-items-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-sm">{a.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{a.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="card-steel rounded-2xl p-10 text-center text-slate-500">
            <div className="text-4xl mb-3">🛠️</div>
            Awaiting scan data — your plan is generated from real measurements, not guesses.
          </div>
        )}
      </Section>

      <Section
        id="games"
        eyebrow="GAME LOADOUTS"
        title="Tuned per title, calibrated to your device"
        sub="Every preset carries the settings that actually move fps for that game engine, and your scan personalizes the fps estimate."
      >
        <Games verdicts={report ? Object.fromEntries(report.games.map((g) => [g.game.id, { verdict: g.verdict, fpsEstimate: g.fpsEstimate }])) : null} />
      </Section>

      <Section
        id="myths"
        eyebrow="THE HONEST SECTION"
        title="Why most 'booster' apps lie to you"
        sub="And what genuinely works. No placebo, no snake oil — this page tells you exactly what a phone can and cannot do."
      >
        <Myths />
      </Section>

      <footer className="border-t border-night-700/60 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center text-sm text-slate-500">
          <div className="flex items-center justify-center gap-2 font-bold text-slate-300 mb-2">
            <span className="w-6 h-6 rounded-md bg-gradient-to-br from-ember-400 to-ember-700 grid place-items-center text-night-950 text-xs">⚡</span>
            NITRO<span className="text-gradient-ember">BOOST</span>
          </div>
          <p className="max-w-xl mx-auto">
            A free, private, on-device performance engine. No root, no anti-cheat risk, no data
            collection. Built for gamers who are done with lag.
          </p>
        </div>
      </footer>
    </div>
  );
}
