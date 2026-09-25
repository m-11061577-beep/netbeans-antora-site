import type { ReactNode } from "react";

export function ScoreGauge({
  value,
  size = 168,
  stroke = 12,
  label,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 72 ? "#34d399" : pct >= 45 ? "#f97316" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1a2230" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-extrabold" style={{ color }}>{Math.round(pct)}</div>
        {label && <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>}
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export function MiniBar({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const color = value >= 72 ? "bg-volt-500" : value >= 45 ? "bg-ember-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-semibold text-slate-200">
          {Math.round(value)}
          {suffix ?? ""}
        </span>
      </div>
      <div className="h-2 rounded-full bg-night-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000`}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  sub,
  children,
  className = "",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  sub?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`max-w-6xl mx-auto px-4 py-16 ${className}`}>
      <div className="mb-8">
        {eyebrow && (
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-ember-500 mb-2">{eyebrow}</div>
        )}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h2>
        {sub && <p className="text-slate-400 mt-2 max-w-2xl">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

export function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="card-steel rounded-xl px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{k}</div>
      <div className="text-sm font-semibold text-slate-200 truncate">{v}</div>
    </div>
  );
}
