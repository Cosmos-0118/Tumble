import { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";

type Tool =
  | "ball"
  | "bouncy"
  | "ramp"
  | "bumper"
  | "funnel"
  | "spinner"
  | "duplicator"
  | "select"
  | "rotate"
  | "erase";

const BALL_COLORS = [
  "#ff6fae",
  "#5ee4ff",
  "#ffd166",
  "#a6f56a",
  "#c39bff",
  "#ff9a5e",
];

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: "ball", label: "Ball", hint: "Click to drop a ball" },
  { id: "bouncy", label: "Bouncy", hint: "Super bouncy ball" },
  { id: "ramp", label: "Ramp", hint: "Click & drag a line" },
  { id: "bumper", label: "Bumper", hint: "Springy peg" },
  { id: "funnel", label: "Funnel", hint: "Click to place" },
  { id: "spinner", label: "Spinner", hint: "Rotating paddle" },
  { id: "duplicator", label: "Duplicator", hint: "Ring that clones balls" },
  { id: "select", label: "Move", hint: "Drag to move shapes" },
  { id: "rotate", label: "Rotate", hint: "Drag around a shape to rotate" },
  { id: "erase", label: "Erase", hint: "Click to remove" },
];


const MAX_BALLS = 250;

export default function Factory() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurRef = useRef<{ x: number; y: number } | null>(null);
  const toolRef = useRef<Tool>("ball");
  const ballCountRef = useRef(0);
  const lastNoteRef = useRef(0);
  const dupSizeRef = useRef(140);
  const selectedRef = useRef<Matter.Body[] | null>(null);
  const selectAnchorRef = useRef<{ x: number; y: number; bodies: { body: Matter.Body; ox: number; oy: number }[] } | null>(null);
  const rotateAnchorRef = useRef<{ cx: number; cy: number; startAngle: number; bodies: { body: Matter.Body; startBodyAngle: number; ox: number; oy: number }[] } | null>(null);
  const groupCounterRef = useRef(1);

  const [tool, setTool] = useState<Tool>("ball");
  const [ballCount, setBallCount] = useState(0);
  const [partsCount, setPartsCount] = useState(0);
  const [showHelp, setShowHelp] = useState(true);
  const [dupSize, setDupSize] = useState(140);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);
  useEffect(() => {
    dupSizeRef.current = dupSize;
  }, [dupSize]);

  const playTone = useCallback((freq: number, vol = 0.06, type: OscillatorType = "sine") => {
    let ctx = audioCtxRef.current;
    if (!ctx) {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
    }
    if (ctx.state === "suspended") ctx.resume();
    // gentle throttle to avoid audio overload
    const now = performance.now();
    if (now - lastNoteRef.current < 8) return;
    lastNoteRef.current = now;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  }, []);

  // pentatonic scale for satisfying tones
  const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

  useEffect(() => {
    if (!wrapperRef.current || !canvasRef.current) return;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;

    let width = wrapper.clientWidth;
    let height = wrapper.clientHeight;

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1, scale: 0.0012 },
      positionIterations: 10,
      velocityIterations: 10,
      constraintIterations: 4,
    });
    engineRef.current = engine;

    const render = Matter.Render.create({
      canvas,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: "transparent",
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    renderRef.current = render;
    Matter.Render.run(render);

    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    const buildWalls = (w: number, h: number) => {
      const wallOpts = {
        isStatic: true,
        render: { fillStyle: "rgba(255,255,255,0.04)" },
        label: "wall",
      };
      const t = 80;
      return [
        Matter.Bodies.rectangle(w / 2, h + t / 2 - 1, w, t, wallOpts),
        Matter.Bodies.rectangle(-t / 2, h / 2, t, h * 2, wallOpts),
        Matter.Bodies.rectangle(w + t / 2, h / 2, t, h * 2, wallOpts),
      ];
    };

    let walls = buildWalls(width, height);
    Matter.Composite.add(engine.world, walls);

    // seed scaffolding
    const seedRamp = (x: number, y: number, len: number, angle: number, color = "#3b4566") =>
      Matter.Bodies.rectangle(x, y, len, 12, {
        isStatic: true,
        angle,
        chamfer: { radius: 6 },
        friction: 0.001,
        render: { fillStyle: color },
        label: "ramp",
      });
    Matter.Composite.add(engine.world, [
      seedRamp(width * 0.25, height * 0.35, 220, 0.35),
      seedRamp(width * 0.7, height * 0.5, 260, -0.3),
      seedRamp(width * 0.4, height * 0.72, 220, 0.22),
    ]);

    const seedSpinner = Matter.Bodies.rectangle(width * 0.82, height * 0.28, 140, 12, {
      isStatic: true,
      render: { fillStyle: "#ffd166" },
      label: "spinner",
    });
    Matter.Composite.add(engine.world, seedSpinner);

    const updateCounts = () => {
      const bodies = Matter.Composite.allBodies(engine.world);
      setBallCount(bodies.filter((b) => b.label === "ball").length);
      setPartsCount(
        bodies.filter((b) =>
          ["ramp", "bumper", "funnel", "spinner", "duplicator-arc"].includes(b.label),
        ).length,
      );
    };

    const cloneBall = (source: Matter.Body) => {
      const bodies = Matter.Composite.allBodies(engine.world);
      if (bodies.filter((b) => b.label === "ball").length >= MAX_BALLS) return;
      const r = (source as any).circleRadius || 10;
      const color = (source.render as any).fillStyle || "#5ee4ff";
      const now = performance.now();
      // Spawn the clone OFFSET upward + sideways so it doesn't immediately re-trigger
      // the duplicate arc (it sits at the bottom of the ring). Then set lastDup so
      // newborn balls have a grace period before they can themselves duplicate.
      const ox = (Math.random() - 0.5) * 4;
      const oy = -r * 2.4;
      const ball = Matter.Bodies.circle(source.position.x + ox, source.position.y + oy, r, {
        restitution: (source as any).bouncy ? 1.05 : 0.78,
        friction: 0.003,
        frictionAir: (source as any).bouncy ? 0.001 : 0.005,
        density: (source as any).bouncy ? 0.001 : 0.0018,
        label: "ball",
        render: {
          fillStyle: color,
          strokeStyle: "rgba(255,255,255,0.45)",
          lineWidth: 2,
        },
      });
      (ball as any).pitch = (source as any).pitch ?? 440;
      (ball as any).bouncy = (source as any).bouncy ?? false;
      (ball as any).lastDup = now;
      Matter.Body.setVelocity(ball, {
        x: source.velocity.x * 0.5 + (Math.random() - 0.5) * 1.5,
        y: -Math.abs(source.velocity.y) * 0.5 - 2,
      });
      Matter.Composite.add(engine.world, ball);
    };


    // per-tick logic: spinners + cull
    Matter.Events.on(engine, "beforeUpdate", () => {
      const bodies = Matter.Composite.allBodies(engine.world);
      for (const b of bodies) {
        if (b.label === "spinner") {
          Matter.Body.setAngularVelocity(b, 0.09);
          Matter.Body.setAngle(b, b.angle + 0.09);
        }
        // duplicator arcs are static — no rotation
        if (b.label === "ball" && (b.position.y > height + 300 || b.position.x < -300 || b.position.x > width + 300)) {
          Matter.Composite.remove(engine.world, b);
        }
      }
    });

    Matter.Events.on(engine, "collisionStart", (e) => {
      for (const pair of e.pairs) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        const involvesBall = a.label === "ball" || b.label === "ball";
        if (!involvesBall) continue;
        const ball = a.label === "ball" ? a : b;
        const other = ball === a ? b : a;
        const speed = Math.hypot(ball.velocity.x, ball.velocity.y);

        // Duplicator — only one clone per ball-hit, with cooldown to prevent chain explosions
        if (other.label === "duplicator-arc") {
          const now = performance.now();
          const last = (ball as any).lastDup ?? 0;
          if (now - last > 220) {
            (ball as any).lastDup = now;
            cloneBall(ball);
            const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)] * 2;
            playTone(note, 0.06, "triangle");
          }
          continue;
        }

        if (speed < 1.2) continue;

        // pentatonic note based on ball + obstacle
        const baseIdx = Math.floor(((ball as any).pitch ?? 440) / 80) % PENTATONIC.length;
        let idx = baseIdx;
        let waveform: OscillatorType = "sine";
        if (other.label === "bumper") { idx = (baseIdx + 4) % PENTATONIC.length; waveform = "triangle"; }
        else if (other.label === "spinner") { idx = (baseIdx + 7) % PENTATONIC.length; waveform = "triangle"; }
        else if (other.label === "ramp") { idx = baseIdx; waveform = "sine"; }
        else if (other.label === "ball") { idx = (baseIdx + 2) % PENTATONIC.length; waveform = "sine"; }
        const freq = PENTATONIC[idx];
        const vol = Math.min(0.1, 0.015 + speed * 0.008);
        playTone(freq, vol, waveform);

        if (other.label === "bumper") {
          const dx = ball.position.x - other.position.x;
          const dy = ball.position.y - other.position.y;
          const m = Math.hypot(dx, dy) || 1;
          const force = (ball as any).bouncy ? 0.06 : 0.045;
          Matter.Body.applyForce(ball, ball.position, {
            x: (dx / m) * force,
            y: (dy / m) * force,
          });
        }
      }
    });

    const intervalCounts = window.setInterval(updateCounts, 250);

    const getPos = (ev: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    };

    const dropBall = (x: number, y: number, bouncy: boolean) => {
      const bodies = Matter.Composite.allBodies(engine.world);
      if (bodies.filter((b) => b.label === "ball").length >= MAX_BALLS) return;
      const color = bouncy ? "#ff6fae" : BALL_COLORS[ballCountRef.current % BALL_COLORS.length];
      ballCountRef.current += 1;
      const radius = bouncy ? 12 : 10 + Math.random() * 8;
      const pitch = 220 + Math.random() * 440;
      const ball = Matter.Bodies.circle(x, y, radius, {
        restitution: bouncy ? 1.05 : 0.78,
        friction: 0.003,
        frictionAir: bouncy ? 0.001 : 0.005,
        density: bouncy ? 0.001 : 0.0018,
        label: "ball",
        render: {
          fillStyle: color,
          strokeStyle: bouncy ? "#fff" : "rgba(255,255,255,0.4)",
          lineWidth: bouncy ? 3 : 2,
        },
      });
      (ball as any).pitch = pitch;
      (ball as any).bouncy = bouncy;
      Matter.Composite.add(engine.world, ball);
    };

    const placeBumper = (x: number, y: number) => {
      const body = Matter.Bodies.circle(x, y, 16, {
        isStatic: true,
        restitution: 1.2,
        label: "bumper",
        render: { fillStyle: "#ff6fae", strokeStyle: "#fff", lineWidth: 2 },
      });
      Matter.Composite.add(engine.world, body);
    };

    const placeFunnel = (x: number, y: number) => {
      const gid = groupCounterRef.current++;
      const left = Matter.Bodies.rectangle(x - 32, y, 70, 10, {
        isStatic: true,
        angle: 0.6,
        render: { fillStyle: "#5ee4ff" },
        label: "funnel",
      });
      const right = Matter.Bodies.rectangle(x + 32, y, 70, 10, {
        isStatic: true,
        angle: -0.6,
        render: { fillStyle: "#5ee4ff" },
        label: "funnel",
      });
      (left as any).groupId = gid;
      (right as any).groupId = gid;
      Matter.Composite.add(engine.world, [left, right]);
    };

    const placeSpinner = (x: number, y: number) => {
      const body = Matter.Bodies.rectangle(x, y, 120, 10, {
        isStatic: true,
        render: { fillStyle: "#ffd166" },
        label: "spinner",
      });
      Matter.Composite.add(engine.world, body);
    };

    // Duplicator: big ring of inert wall segments + ONE highlighted arc that duplicates balls on contact.
    // Opening at the top lets balls fall in. Duplicate arc sits at the bottom.
    const placeDuplicator = (cx: number, cy: number, radius: number) => {
      const r = Math.max(40, Math.min(radius, 360));
      const circumference = Math.PI * 2 * r;
      const segments = Math.max(28, Math.round(circumference / 18));
      const openingHalf = 0.45;
      const dupHalf = 0.5;
      const bodies: Matter.Body[] = [];
      const gid = groupCounterRef.current++;
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2 - Math.PI / 2;
        if (a > -Math.PI / 2 - openingHalf && a < -Math.PI / 2 + openingHalf) continue;
        const isDup = a > Math.PI / 2 - dupHalf && a < Math.PI / 2 + dupHalf;
        const segLen = (Math.PI * 2 * r) / segments + 4;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const body = Matter.Bodies.rectangle(x, y, segLen, isDup ? 10 : 6, {
          isStatic: true,
          angle: a + Math.PI / 2,
          restitution: isDup ? 0.2 : 0.6,
          render: {
            fillStyle: isDup ? "#a6f56a" : "rgba(195,155,255,0.85)",
            strokeStyle: isDup ? "#ffffff" : undefined,
            lineWidth: isDup ? 2 : 0,
          },
          label: isDup ? "duplicator-arc" : "funnel",
        });
        (body as any).groupId = gid;
        bodies.push(body);
      }
      Matter.Composite.add(engine.world, bodies);
    };



    const placeRamp = (x1: number, y1: number, x2: number, y2: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.max(40, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      const body = Matter.Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2, len, 12, {
        isStatic: true,
        angle,
        chamfer: { radius: 6 },
        friction: 0.001,
        render: { fillStyle: "#a6f56a" },
        label: "ramp",
      });
      Matter.Composite.add(engine.world, body);
    };

    const eraseAt = (x: number, y: number) => {
      const bodies = Matter.Composite.allBodies(engine.world);
      const hit = bodies.find(
        (b) =>
          ["ramp", "bumper", "funnel", "spinner", "ball", "duplicator-arc"].includes(b.label) &&
          Matter.Bounds.contains(b.bounds, { x, y }),
      );
      if (hit) Matter.Composite.remove(engine.world, hit);
    };

    const SELECTABLE = ["ramp", "bumper", "funnel", "spinner", "duplicator-arc"];

    const findBodyAt = (x: number, y: number): Matter.Body | null => {
      const bodies = Matter.Composite.allBodies(engine.world).filter((b) =>
        SELECTABLE.includes(b.label),
      );
      const hit = Matter.Query.point(bodies, { x, y })[0];
      if (hit) return hit;
      // fallback: bounding box hit (helps thin segments)
      return bodies.find((b) => Matter.Bounds.contains(b.bounds, { x, y })) || null;
    };

    const getGroup = (body: Matter.Body): Matter.Body[] => {
      const gid = (body as any).groupId;
      if (gid == null) return [body];
      return Matter.Composite.allBodies(engine.world).filter((b) => (b as any).groupId === gid);
    };

    const onDown = (ev: PointerEvent) => {
      setShowHelp(false);
      const { x, y } = getPos(ev);
      const t = toolRef.current;
      if (t === "ramp" || t === "duplicator") {
        dragStartRef.current = { x, y };
        dragCurRef.current = { x, y };
      } else if (t === "ball") dropBall(x, y, false);
      else if (t === "bouncy") dropBall(x, y, true);
      else if (t === "bumper") placeBumper(x, y);
      else if (t === "funnel") placeFunnel(x, y);
      else if (t === "spinner") placeSpinner(x, y);
      else if (t === "erase") eraseAt(x, y);
      else if (t === "select") {
        const hit = findBodyAt(x, y);
        if (hit) {
          const group = getGroup(hit);
          selectedRef.current = group;
          selectAnchorRef.current = {
            x,
            y,
            bodies: group.map((b) => ({ body: b, ox: b.position.x - x, oy: b.position.y - y })),
          };
        } else {
          selectedRef.current = null;
        }
      } else if (t === "rotate") {
        const hit = findBodyAt(x, y);
        if (hit) {
          const group = getGroup(hit);
          // centroid
          const cx = group.reduce((s, b) => s + b.position.x, 0) / group.length;
          const cy = group.reduce((s, b) => s + b.position.y, 0) / group.length;
          selectedRef.current = group;
          rotateAnchorRef.current = {
            cx,
            cy,
            startAngle: Math.atan2(y - cy, x - cx),
            bodies: group.map((b) => ({
              body: b,
              startBodyAngle: b.angle,
              ox: b.position.x - cx,
              oy: b.position.y - cy,
            })),
          };
        } else {
          selectedRef.current = null;
        }
      }
    };

    const onMove = (ev: PointerEvent) => {
      const t = toolRef.current;
      const p = getPos(ev);
      if ((t === "ramp" || t === "duplicator") && dragStartRef.current) {
        dragCurRef.current = p;
      } else if (t === "select" && selectAnchorRef.current) {
        for (const item of selectAnchorRef.current.bodies) {
          Matter.Body.setPosition(item.body, { x: p.x + item.ox, y: p.y + item.oy });
          Matter.Body.setVelocity(item.body, { x: 0, y: 0 });
        }
      } else if (t === "rotate" && rotateAnchorRef.current) {
        const a = rotateAnchorRef.current;
        const cur = Math.atan2(p.y - a.cy, p.x - a.cx);
        const delta = cur - a.startAngle;
        const cos = Math.cos(delta);
        const sin = Math.sin(delta);
        for (const item of a.bodies) {
          const nx = a.cx + item.ox * cos - item.oy * sin;
          const ny = a.cy + item.ox * sin + item.oy * cos;
          Matter.Body.setPosition(item.body, { x: nx, y: ny });
          Matter.Body.setAngle(item.body, item.startBodyAngle + delta);
        }
      }
    };

    const onUp = (ev: PointerEvent) => {
      const t = toolRef.current;
      const s = dragStartRef.current;
      const { x, y } = getPos(ev);
      if (s && t === "ramp") {
        if (Math.hypot(x - s.x, y - s.y) > 20) placeRamp(s.x, s.y, x, y);
      } else if (s && t === "duplicator") {
        const dragR = Math.hypot(x - s.x, y - s.y);
        const r = dragR > 25 ? dragR : dupSizeRef.current;
        placeDuplicator(s.x, s.y, r);
      }
      dragStartRef.current = null;
      dragCurRef.current = null;
      selectAnchorRef.current = null;
      rotateAnchorRef.current = null;
    };

    // overlay drawing for ramp + duplicator preview + selection highlight
    Matter.Events.on(render, "afterRender", () => {
      const ctx = render.context;
      const s = dragStartRef.current;
      const c = dragCurRef.current;
      const t = toolRef.current;
      if (s && c && t === "ramp") {
        ctx.save();
        ctx.strokeStyle = "rgba(166,245,106,0.8)";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
        ctx.restore();
      }
      if (t === "duplicator") {
        const cx = s ? s.x : (c ? c.x : -9999);
        const cy = s ? s.y : (c ? c.y : -9999);
        const dragR = s && c ? Math.hypot(c.x - s.x, c.y - s.y) : 0;
        const r = dragR > 25 ? dragR : dupSizeRef.current;
        if (cx > -9000) {
          ctx.save();
          ctx.strokeStyle = "rgba(195,155,255,0.6)";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = "rgba(166,245,106,0.9)";
          ctx.lineWidth = 5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(cx, cy, r, Math.PI / 2 - 0.5, Math.PI / 2 + 0.5);
          ctx.stroke();
          ctx.restore();
        }
      }
      // selection outline
      const sel = selectedRef.current;
      if (sel && (t === "select" || t === "rotate")) {
        ctx.save();
        ctx.strokeStyle = t === "rotate" ? "rgba(255,209,102,0.95)" : "rgba(94,228,255,0.95)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const b of sel) {
          minX = Math.min(minX, b.bounds.min.x);
          minY = Math.min(minY, b.bounds.min.y);
          maxX = Math.max(maxX, b.bounds.max.x);
          maxY = Math.max(maxY, b.bounds.max.y);
        }
        ctx.strokeRect(minX - 4, minY - 4, maxX - minX + 8, maxY - minY + 8);
        if (t === "rotate") {
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    });



    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    const onResize = () => {
      const w = wrapper.clientWidth;
      const h = wrapper.clientHeight;
      width = w;
      height = h;
      render.canvas.width = w * (window.devicePixelRatio || 1);
      render.canvas.height = h * (window.devicePixelRatio || 1);
      render.options.width = w;
      render.options.height = h;
      Matter.Render.setPixelRatio(render, window.devicePixelRatio || 1);
      // rebuild walls
      walls.forEach((wbody) => Matter.Composite.remove(engine.world, wbody));
      walls = buildWalls(w, h);
      Matter.Composite.add(engine.world, walls);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.clearInterval(intervalCounts);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", onResize);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      render.textures = {};
    };
  }, [playTone]);

  const rainBalls = (bouncy = false) => {
    const engine = engineRef.current;
    if (!engine || !wrapperRef.current) return;
    const w = wrapperRef.current.clientWidth;
    for (let i = 0; i < 25; i++) {
      setTimeout(() => {
        const bodies = Matter.Composite.allBodies(engine.world);
        if (bodies.filter((b) => b.label === "ball").length >= MAX_BALLS) return;
        const x = Math.random() * w;
        const color = bouncy ? "#ff6fae" : BALL_COLORS[ballCountRef.current % BALL_COLORS.length];
        ballCountRef.current += 1;
        const ball = Matter.Bodies.circle(x, -20, bouncy ? 12 : 10 + Math.random() * 8, {
          restitution: bouncy ? 1.05 : 0.78,
          friction: 0.003,
          frictionAir: bouncy ? 0.001 : 0.005,
          density: bouncy ? 0.001 : 0.0018,
          label: "ball",
          render: { fillStyle: color, strokeStyle: "rgba(255,255,255,0.4)", lineWidth: 2 },
        });
        (ball as any).pitch = 220 + Math.random() * 440;
        (ball as any).bouncy = bouncy;
        Matter.Composite.add(engine.world, ball);
      }, i * 50);
    }
  };

  const clearBalls = () => {
    const engine = engineRef.current;
    if (!engine) return;
    Matter.Composite.allBodies(engine.world)
      .filter((b) => b.label === "ball")
      .forEach((b) => Matter.Composite.remove(engine.world, b));
  };

  const clearAll = () => {
    const engine = engineRef.current;
    if (!engine) return;
    Matter.Composite.allBodies(engine.world)
      .filter((b) => b.label !== "wall")
      .forEach((b) => Matter.Composite.remove(engine.world, b));
  };

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden">
      {/* Ambient glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/3 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.5_0.2_320/0.35),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[35rem] w-[35rem] rounded-full bg-[radial-gradient(circle,oklch(0.55_0.2_200/0.3),transparent_70%)] blur-3xl" />
      </div>

      {/* HUD top */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-5">
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] max-w-[70vw]">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            Tumble · Sketch 008
          </p>
          <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
            Oddly Satisfying Factory
          </h1>
          <p className="mt-1 hidden sm:block max-w-sm text-xs sm:text-sm text-muted-foreground">
            Drop balls. Build ramps. Let the chaos compose itself.
          </p>
        </div>
        <div className="pointer-events-auto flex flex-col sm:flex-row gap-2 text-xs font-medium">
          <Stat label="Balls" value={ballCount} accent="var(--cyan)" />
          <Stat label="Parts" value={partsCount} accent="var(--lime)" />
        </div>
      </header>

      {/* Help hint */}
      {showHelp && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Tap anywhere</p>
          <p className="mt-1 text-sm sm:text-base text-foreground/80">Drop balls · drag ramps · place a duplicator</p>
        </div>
      )}

      {/* Canvas */}
      <div ref={wrapperRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full cursor-crosshair touch-none" />
      </div>

      {/* Toolbar */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 p-3 sm:p-5">
        {tool === "duplicator" && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Size</span>
            <input
              type="range"
              min={50}
              max={300}
              value={dupSize}
              onChange={(e) => setDupSize(Number(e.target.value))}
              className="w-40 accent-[color:var(--lime)]"
            />
            <span className="text-xs tabular-nums text-foreground/80 w-8 text-right">{dupSize}</span>
            <span className="hidden sm:inline text-[10px] text-muted-foreground">· tip: drag on canvas to size</span>
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
              onClick={() => rainBalls(false)}
              className="shrink-0 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-foreground hover:bg-white/10"
            >
              Rain
            </button>
            <button
              onClick={() => rainBalls(true)}
              className="shrink-0 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-medium text-pink hover:bg-white/10"
            >
              Bouncy rain
            </button>
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
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-2xl min-w-[68px]">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
        />
        <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      </div>
      <div className="mt-0.5 text-base sm:text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ToolGlyph({ id }: { id: Tool }) {
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
      return <svg {...common}><circle cx="12" cy="12" r="6" /></svg>;
    case "bouncy":
      return <svg {...common}><circle cx="12" cy="12" r="5" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></svg>;
    case "ramp":
      return <svg {...common}><path d="M4 18 L20 8" /></svg>;
    case "bumper":
      return <svg {...common}><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="9" /></svg>;
    case "funnel":
      return <svg {...common}><path d="M4 6 L12 14 L20 6" /></svg>;
    case "spinner":
      return <svg {...common}><path d="M4 12 L20 12" /><circle cx="12" cy="12" r="2" /></svg>;
    case "duplicator":
      return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M9 12h6M12 9v6" /></svg>;
    case "select":
      return <svg {...common}><path d="M5 3 L5 17 L9 13 L12 20 L14 19 L11 12 L17 12 Z" /></svg>;
    case "rotate":
      return <svg {...common}><path d="M4 12a8 8 0 1 0 3-6.2" /><path d="M3 3v5h5" /></svg>;
    case "erase":
      return <svg {...common}><path d="M6 18 L18 6" /><path d="M6 6 L18 18" /></svg>;
  }
}
