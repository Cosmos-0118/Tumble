interface SandboxHelpProps {
  showHelp: boolean;
}

export function SandboxHelp({ showHelp }: SandboxHelpProps) {
  if (!showHelp) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center backdrop-blur-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Tap anywhere</p>
      <p className="mt-1 text-sm sm:text-base text-foreground/80">
        Drop balls · drag ramps · place a duplicator
      </p>
    </div>
  );
}
