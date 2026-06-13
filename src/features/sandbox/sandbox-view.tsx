import { Link } from "@tanstack/react-router";
import { useSandbox } from "./hooks/use-sandbox";
import { SandboxHud } from "./components/sandbox-hud";
import { SandboxHelp } from "./components/sandbox-help";
import { SandboxToolbar } from "./components/sandbox-toolbar";

export default function SandboxView() {
  const {
    canvasRef,
    wrapperRef,
    tool,
    setTool,
    ballType,
    setBallType,
    dupSize,
    setDupSize,
    ballCount,
    partsCount,
    showHelp,
    rainBalls,
    clearBalls,
    clearAll,
  } = useSandbox();

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden">
      {/* Dotted professional background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-neutral-950 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* HUD top */}
      <SandboxHud ballCount={ballCount} partsCount={partsCount} />

      {/* Help hint */}
      <SandboxHelp showHelp={showHelp} />

      {/* Canvas */}
      <div ref={wrapperRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full cursor-crosshair touch-none" />
      </div>

      {/* Toolbar */}
      <SandboxToolbar
        tool={tool}
        setTool={setTool}
        ballType={ballType}
        setBallType={setBallType}
        dupSize={dupSize}
        setDupSize={setDupSize}
        rainBalls={rainBalls}
        clearBalls={clearBalls}
        clearAll={clearAll}
      />
    </div>
  );
}
export { SandboxView };
