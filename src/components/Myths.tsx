const MYTHS = [
  {
    myth: "Booster apps overclock your CPU",
    truth: "No Android app can change clock speeds — the kernel owns that. What real boosters do: force-stop RAM-hogging apps so the scheduler never down-clocks under memory pressure, and toggle performance modes exposed by the maker.",
    verdict: "❌ Myth",
    color: "red",
  },
  {
    myth: "'Game mode' apps raise your fps",
    truth: "They only help by killing background apps and muting notifications. You can replicate 90% of that free: background process limit + Do Not Disturb. NITRO BOOST tells you exactly which of those matters for YOUR device.",
    verdict: "⚠️ Half-true",
    color: "ember",
  },
  {
    myth: "Gfx tools unlock 90/120fps in any game",
    truth: "They edit config files the game can detect; many get flagged by anti-cheat. The safe path: the game's own Extreme/Ultra frame rate options, plus a cooler phone so the cap actually holds.",
    verdict: "❌ Myth (risky)",
    color: "red",
  },
  {
    myth: "More fps = more heat = worse",
    truth: "Partially — that's why uncapped 120fps in HD games collapses to 40 after 15 minutes. A stable cap BELOW your throttle point delivers higher AVERAGE fps than an uncapped burst.",
    verdict: "✅ Fact",
    color: "volt",
  },
  {
    myth: "Clearing RAM daily speeds up the phone",
    truth: "Forcing apps closed makes Android re-load them from scratch later, which stutters your game mid-match. Kill only apps flagged by the scan, not everything.",
    verdict: "⚠️ Half-true",
    color: "ember",
  },
  {
    myth: "Rooting is the only way to really boost",
    truth: "Rooting voids warranty and breaks anti-cheat in PUBGM/CODM/FF. Every action in your boost plan is 100% root-free and anti-cheat-safe.",
    verdict: "❌ Myth",
    color: "red",
  },
] as const;

export default function Myths() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {MYTHS.map((m) => (
        <div key={m.myth} className="card-steel rounded-2xl p-5">
          <div className={`text-xs font-mono mb-2 ${m.color === "red" ? "text-red-400" : m.color === "ember" ? "text-ember-400" : "text-volt-300"}`}>
            {m.verdict}
          </div>
          <h3 className="font-bold text-slate-100 mb-2">{m.myth}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{m.truth}</p>
        </div>
      ))}
    </div>
  );
}
