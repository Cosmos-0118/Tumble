import { useEffect, useRef, useState } from "react";
import { Tool, BallType } from "../types";
import { AudioEngine } from "../audio/audio-engine";
import { PhysicsEngine } from "../physics/physics-engine";

export function useSandbox() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const physicsEngineRef = useRef<PhysicsEngine | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  const [tool, setTool] = useState<Tool>("ball");
  const [ballType, setBallType] = useState<BallType>("normal");
  const [dupSize, setDupSize] = useState(140);

  const [ballCount, setBallCount] = useState(0);
  const [partsCount, setPartsCount] = useState(0);
  const [showHelp, setShowHelp] = useState(true);

  // Initialize simulation and engines
  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current) return;

    const audio = new AudioEngine();
    audioEngineRef.current = audio;

    const physics = new PhysicsEngine(canvasRef.current, wrapperRef.current, {
      onCountsChange: (balls, parts) => {
        setBallCount(balls);
        setPartsCount(parts);
      },
      playTone: (freq, vol, type) => {
        audio.playTone(freq, vol, type);
      },
      onPointerDown: () => {
        setShowHelp(false);
      },
    });
    physicsEngineRef.current = physics;

    // Set initial values
    physics.setTool(tool);
    physics.setBallType(ballType);
    physics.setDupSize(dupSize);

    return () => {
      physics.destroy();
      audio.destroy();
      physicsEngineRef.current = null;
      audioEngineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state values to PhysicsEngine
  useEffect(() => {
    physicsEngineRef.current?.setTool(tool);
  }, [tool]);

  useEffect(() => {
    physicsEngineRef.current?.setBallType(ballType);
  }, [ballType]);

  useEffect(() => {
    physicsEngineRef.current?.setDupSize(dupSize);
  }, [dupSize]);

  // Expose simulation controls
  const rainBalls = () => physicsEngineRef.current?.rainBalls();
  const clearBalls = () => physicsEngineRef.current?.clearBalls();
  const clearAll = () => physicsEngineRef.current?.clearAll();

  return {
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
  };
}
export type UseSandboxReturn = ReturnType<typeof useSandbox>;
