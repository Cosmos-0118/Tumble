import { ToolInfo } from "./types";

// pentatonic scale for satisfying tones spanning 5 octaves
export const PENTATONIC = [
  130.81,
  146.83,
  164.81,
  196.0,
  220.0, // C3
  261.63,
  293.66,
  329.63,
  392.0,
  440.0, // C4
  523.25,
  587.33,
  659.25,
  783.99,
  880.0, // C5
  1046.5,
  1174.66,
  1318.51,
  1567.98,
  1760.0, // C6
  2093.0,
  2349.32,
  2637.02,
  3135.96,
  3520.0, // C7
];

export const BALL_COLORS = ["#ff6fae", "#5ee4ff", "#ffd166", "#a6f56a", "#c39bff", "#ff9a5e"];

export const MAX_BALLS = 250;

export const TOOLS: ToolInfo[] = [
  { id: "ball", label: "Ball", hint: "Click to drop a ball" },
  { id: "ramp", label: "Ramp", hint: "Click & drag a line" },
  { id: "bumper", label: "Bumper", hint: "Springy peg" },
  { id: "funnel", label: "Funnel", hint: "Click to place" },
  { id: "spinner", label: "Spinner", hint: "Rotating paddle" },
  { id: "duplicator", label: "Duplicator", hint: "Ring that clones balls" },
  { id: "select", label: "Move", hint: "Drag to move shapes" },
  { id: "rotate", label: "Rotate", hint: "Drag around a shape to rotate" },
  { id: "erase", label: "Erase", hint: "Click to remove" },
];
