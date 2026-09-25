const FEATURES = [
  {
    icon: "🧬",
    title: "Full silicon fingerprint",
    body: "Detects your exact GPU model and tier, every CPU core, RAM class, refresh path and screen metrics — not a generic 'Android device'.",
  },
  {
    icon: "🔥",
    title: "Real CPU stress",
    body: "Web Workers saturate each core with a floating-point kernel and measure per-core throughput, big/little split and scheduler behavior.",
  },
  {
    icon: "🎮",
    title: "GPU shader stress scene",
    body: "A live WebGL scene renders 240 animated shader triangles at native-ish resolution, measuring steady fps, fill rate and frame-time jank.",
  },
  {
    icon: "🌡️",
    title: "Thermal drift detection",
    body: "Compares early vs. late frame times under sustained load to expose throttling — the #1 hidden cause of mid-match lag on HD games.",
  },
  {
    icon: "🎯",
    title: "Per-game fps estimates",
    body: "Your scores feed a model tuned per title — PUBGM, CODM, Genshin, MLBB, Free Fire, Wild Rift and HD ports — with realistic fps ranges.",
  },
  {
    icon: "🛠️",
    title: "Actionable boost plan",
    body: "Ranked fixes matched to YOUR bottleneck: thermal, RAM pressure, scheduler, GPU. Every step root-free and anti-cheat-safe.",
  },
];

export default function Features() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {FEATURES.map((f) => (
        <div key={f.title} className="card-steel rounded-2xl p-6">
          <div className="text-3xl mb-3">{f.icon}</div>
          <h3 className="font-bold text-lg mb-2">{f.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
        </div>
      ))}
    </div>
  );
}
