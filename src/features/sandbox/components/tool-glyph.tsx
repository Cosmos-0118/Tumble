import { Tool } from "../types";

export function ToolGlyph({ id }: { id: Tool }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "ball":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="6" />
        </svg>
      );
    case "ramp":
      return (
        <svg {...common}>
          <path d="M4 18 L20 8" />
        </svg>
      );
    case "bumper":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "funnel":
      return (
        <svg {...common}>
          <path d="M4 6 L12 14 L20 6" />
        </svg>
      );
    case "spinner":
      return (
        <svg {...common}>
          <path d="M4 12 L20 12" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "duplicator":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9 12h6M12 9v6" />
        </svg>
      );
    case "select":
      return (
        <svg {...common}>
          <path d="M5 3 L5 17 L9 13 L12 20 L14 19 L11 12 L17 12 Z" />
        </svg>
      );
    case "rotate":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 1 0 3-6.2" />
          <path d="M3 3v5h5" />
        </svg>
      );
    case "erase":
      return (
        <svg {...common}>
          <path d="M6 18 L18 6" />
          <path d="M6 6 L18 18" />
        </svg>
      );
  }
}
