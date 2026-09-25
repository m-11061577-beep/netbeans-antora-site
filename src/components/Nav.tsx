import { useEffect, useState } from "react";

export default function Nav({ onCta }: { onCta: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-night-950/85 backdrop-blur-md border-b border-night-700/60" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-ember-400 to-ember-700 grid place-items-center text-night-950 text-lg">
            ⚡
          </span>
          <span className="text-lg">
            NITRO<span className="text-gradient-ember">BOOST</span>
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#scan" className="hover:text-ember-400 transition-colors">Scan</a>
          <a href="#bench" className="hover:text-ember-400 transition-colors">Benchmarks</a>
          <a href="#plan" className="hover:text-ember-400 transition-colors">Boost Plan</a>
          <a href="#games" className="hover:text-ember-400 transition-colors">Games</a>
          <a href="#myths" className="hover:text-ember-400 transition-colors">Myths</a>
        </nav>
        <button
          onClick={onCta}
          className="btn-ember text-white text-sm font-semibold px-4 py-2 rounded-xl"
        >
          Boost my phone
        </button>
      </div>
    </header>
  );
}
