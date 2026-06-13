interface StatProps {
  label: string;
  value: number;
  accent: string;
}

function Stat({ label, value, accent }: StatProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
        />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
          {label}
        </span>
      </div>
      <span className="text-sm font-bold tabular-nums tracking-tight text-white/90">{value}</span>
    </div>
  );
}

interface SandboxHudProps {
  ballCount: number;
  partsCount: number;
}

export function SandboxHud({ ballCount, partsCount }: SandboxHudProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-5">
      <div className="pointer-events-auto flex items-center justify-center rounded-full border border-white/10 bg-black/40 px-6 py-2.5 backdrop-blur-xl shadow-lg transition-all hover:bg-black/50">
        <h1 className="bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-xl font-extrabold tracking-tighter text-transparent drop-shadow-sm">
          Tumble
        </h1>
      </div>
      <div className="pointer-events-auto flex flex-row items-center gap-4 rounded-full border border-white/10 bg-black/40 px-5 py-2.5 backdrop-blur-xl shadow-lg transition-all hover:bg-black/50">
        <Stat label="Balls" value={ballCount} accent="var(--cyan)" />
        <div className="h-3 w-px bg-white/10" />
        <Stat label="Parts" value={partsCount} accent="var(--lime)" />
      </div>
    </header>
  );
}
