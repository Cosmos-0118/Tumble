import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="pointer-events-none fixed bottom-3 right-4 sm:bottom-5 sm:right-6 z-50 flex items-center gap-2.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
      <Link to="/terms" className="pointer-events-auto hover:text-neutral-200 transition-colors">
        Terms
      </Link>
      <span className="opacity-50">·</span>
      <Link to="/privacy" className="pointer-events-auto hover:text-neutral-200 transition-colors">
        Privacy
      </Link>
      <span className="opacity-50">·</span>
      <span className="tabular-nums opacity-60">© {new Date().getFullYear()} Dhanush S</span>
    </footer>
  );
}
