import { TOOLS } from "../constants";
import { Tool, BallType } from "../types";
import { ToolGlyph } from "./tool-glyph";

interface SandboxToolbarProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  ballType: BallType;
  setBallType: (bt: BallType) => void;
  dupSize: number;
  setDupSize: (size: number) => void;
  rainBalls: () => void;
  clearBalls: () => void;
  clearAll: () => void;
}

export function SandboxToolbar({
  tool,
  setTool,
  ballType,
  setBallType,
  dupSize,
  setDupSize,
  rainBalls,
  clearBalls,
  clearAll,
}: SandboxToolbarProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 p-3 sm:p-5">
      {tool === "ball" && (
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          {[
            { id: "normal", label: "Normal" },
            { id: "bouncy", label: "Bouncy" },
            { id: "perfect", label: "Perfect" },
          ].map((bt) => (
            <button
              key={bt.id}
              onClick={() => setBallType(bt.id as BallType)}
              className={`rounded-xl px-3 py-1.5 text-[10px] sm:text-xs font-medium transition-all ${
                ballType === bt.id
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              {bt.label}
            </button>
          ))}
        </div>
      )}
      {tool === "duplicator" && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Size
          </span>
          <input
            type="range"
            min={50}
            max={300}
            value={dupSize}
            onChange={(e) => setDupSize(Number(e.target.value))}
            className="w-40 accent-[color:var(--lime)]"
          />
          <span className="text-xs tabular-nums text-foreground/80 w-8 text-right">{dupSize}</span>
          <span className="hidden sm:inline text-[10px] text-muted-foreground">
            · tip: drag on canvas to size
          </span>
        </div>
      )}
      <div className="pointer-events-auto w-full max-w-[calc(100vw-1.5rem)] sm:max-w-fit overflow-x-auto">
        <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl mx-auto w-fit">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.hint}
              className={`group relative shrink-0 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium transition-all ${
                tool === t.id
                  ? "bg-foreground text-background shadow-lg"
                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <ToolGlyph id={t.id} />
                <span className="hidden sm:inline">{t.label}</span>
              </span>
            </button>
          ))}
          <div className="mx-1 h-6 w-px bg-white/10" />
          <button
            onClick={() => rainBalls()}
            className="shrink-0 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-foreground hover:bg-white/10"
          >
            Rain
          </button>
          <div className="mx-1 h-6 w-px bg-white/10" />
          <button
            onClick={clearBalls}
            className="shrink-0 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            Clear
          </button>
          <button
            onClick={clearAll}
            className="shrink-0 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
