export type Tool =
  | "ball"
  | "ramp"
  | "bumper"
  | "funnel"
  | "spinner"
  | "duplicator"
  | "select"
  | "rotate"
  | "erase";

export type BallType = "normal" | "bouncy" | "perfect";

export interface ToolInfo {
  id: Tool;
  label: string;
  hint: string;
}
