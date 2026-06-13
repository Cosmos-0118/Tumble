/* eslint-disable @typescript-eslint/no-explicit-any */
import Matter from "matter-js";
import { PENTATONIC, BALL_COLORS, MAX_BALLS } from "../constants";
import { Tool, BallType } from "../types";

export interface PhysicsEngineOptions {
  onCountsChange: (ballCount: number, partsCount: number) => void;
  playTone: (freq: number, vol?: number, type?: OscillatorType) => void;
  onPointerDown?: () => void;
}

export class PhysicsEngine {
  private canvas: HTMLCanvasElement;
  private wrapper: HTMLDivElement;
  private options: PhysicsEngineOptions;

  private engine!: Matter.Engine;
  private render!: Matter.Render;
  private runner!: Matter.Runner;

  // Configuration from React
  private currentTool: Tool = "ball";
  private currentBallType: BallType = "normal";
  private currentDupSize = 140;

  // Interaction State
  private dragStart: { x: number; y: number } | null = null;
  private dragCur: { x: number; y: number } | null = null;
  private ballCountSeq = 0;
  private groupCounter = 1;

  private selectedBodies: Matter.Body[] | null = null;
  private selectAnchor: {
    x: number;
    y: number;
    bodies: { body: Matter.Body; ox: number; oy: number }[];
  } | null = null;
  private rotateAnchor: {
    cx: number;
    cy: number;
    startAngle: number;
    bodies: { body: Matter.Body; startBodyAngle: number; ox: number; oy: number }[];
  } | null = null;

  private walls: Matter.Body[] = [];
  private intervalId: number | null = null;

  constructor(canvas: HTMLCanvasElement, wrapper: HTMLDivElement, options: PhysicsEngineOptions) {
    this.canvas = canvas;
    this.wrapper = wrapper;
    this.options = options;

    this.init();
  }

  public setTool(tool: Tool) {
    this.currentTool = tool;
  }

  public setBallType(type: BallType) {
    this.currentBallType = type;
  }

  public setDupSize(size: number) {
    this.currentDupSize = size;
  }

  private init() {
    const w = this.wrapper.clientWidth;
    const h = this.wrapper.clientHeight;

    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1, scale: 0.0012 },
      positionIterations: 20,
      velocityIterations: 20,
      constraintIterations: 8,
    });

    this.render = Matter.Render.create({
      canvas: this.canvas,
      engine: this.engine,
      options: {
        width: w,
        height: h,
        wireframes: false,
        background: "transparent",
        pixelRatio: window.devicePixelRatio || 1,
      },
    });

    Matter.Render.run(this.render);

    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);

    // Build walls
    this.walls = this.buildWalls(w, h);
    Matter.Composite.add(this.engine.world, this.walls);

    // Seed scaffolding
    Matter.Composite.add(this.engine.world, [
      this.seedRamp(w * 0.25, h * 0.35, 220, 0.35),
      this.seedRamp(w * 0.7, h * 0.5, 260, -0.3),
      this.seedRamp(w * 0.4, h * 0.72, 220, 0.22),
    ]);

    const seedSpinner = Matter.Bodies.rectangle(w * 0.82, h * 0.28, 140, 12, {
      isStatic: true,
      render: { fillStyle: "#ffd166" },
      label: "spinner",
    });
    Matter.Composite.add(this.engine.world, seedSpinner);

    // Event listener setup
    this.setupEvents();

    // Stats updates
    this.updateCounts();
    this.intervalId = window.setInterval(() => this.updateCounts(), 250);

    // Binding Canvas Events
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("resize", this.handleResize);
  }

  private buildWalls(w: number, h: number): Matter.Body[] {
    const wallOpts = {
      isStatic: true,
      render: { fillStyle: "rgba(255,255,255,0.04)" },
      label: "wall",
    };
    const t = 400; // Thick walls prevent tunneling at extreme speeds
    return [
      Matter.Bodies.rectangle(w / 2, -t / 2, w + t * 2, t, wallOpts),
      Matter.Bodies.rectangle(w / 2, h + t / 2 - 1, w + t * 2, t, wallOpts),
      Matter.Bodies.rectangle(-t / 2, h / 2, t, h * 2 + t * 2, wallOpts),
      Matter.Bodies.rectangle(w + t / 2, h / 2, t, h * 2 + t * 2, wallOpts),
    ];
  }

  private seedRamp(
    x: number,
    y: number,
    len: number,
    angle: number,
    color = "#3b4566",
  ): Matter.Body {
    return Matter.Bodies.rectangle(x, y, len, 12, {
      isStatic: true,
      angle,
      chamfer: { radius: 6 },
      friction: 0.001,
      render: { fillStyle: color },
      label: "ramp",
    });
  }

  private setupEvents() {
    // BeforeUpdate ticker logic
    Matter.Events.on(this.engine, "beforeUpdate", () => {
      const bodies = Matter.Composite.allBodies(this.engine.world);
      const w = this.wrapper.clientWidth;
      const h = this.wrapper.clientHeight;

      for (const b of bodies) {
        if (b.label === "spinner") {
          Matter.Body.setAngularVelocity(b, 0.09);
          Matter.Body.setAngle(b, b.angle + 0.09);
        }
        if (b.label === "ball") {
          // Prevent tunneling at extreme speed
          const maxSpeed = 35;
          if (b.speed > maxSpeed) {
            Matter.Body.setVelocity(b, {
              x: (b.velocity.x / b.speed) * maxSpeed,
              y: (b.velocity.y / b.speed) * maxSpeed,
            });
          }
          // Cull balls that somehow escaped
          if (
            b.position.y > h + 500 ||
            b.position.y < -500 ||
            b.position.x < -500 ||
            b.position.x > w + 500
          ) {
            Matter.Composite.remove(this.engine.world, b);
          }
        }
      }
    });

    // Collision Logic
    Matter.Events.on(this.engine, "collisionStart", (e) => {
      for (const pair of e.pairs) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        const involvesBall = a.label === "ball" || b.label === "ball";
        if (!involvesBall) continue;
        const ball = a.label === "ball" ? a : b;
        const other = ball === a ? b : a;
        const speed = Math.hypot(ball.velocity.x, ball.velocity.y);

        // Duplicator
        if (other.label === "duplicator-arc") {
          const now = performance.now();
          const last = (ball as any).lastDup ?? 0;
          if (now - last > 220) {
            (ball as any).lastDup = now;
            this.cloneBall(ball);
            const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)] * 2;
            this.options.playTone(note, 0.06, "triangle");
          }
          continue;
        }

        if (speed < 1.2) continue;

        // pentatonic note based on ball + obstacle
        const baseIdx = (ball as any).pitchIdx ?? Math.floor(Math.random() * PENTATONIC.length);
        let idx = baseIdx;
        let waveform: OscillatorType = "sine";
        if (other.label === "bumper") {
          idx = (baseIdx + 4) % PENTATONIC.length;
          waveform = "triangle";
        } else if (other.label === "spinner") {
          idx = (baseIdx + 7) % PENTATONIC.length;
          waveform = "triangle";
        } else if (other.label === "ramp") {
          idx = baseIdx;
          waveform = "sine";
        } else if (other.label === "ball") {
          idx = (baseIdx + 2) % PENTATONIC.length;
          waveform = "sine";
        }
        const freq = PENTATONIC[idx];
        const vol = Math.min(0.1, 0.015 + speed * 0.008);
        const now = performance.now();
        const lastSound = (ball as any).lastSound ?? 0;
        if (now - lastSound > 60) {
          (ball as any).lastSound = now;
          this.options.playTone(freq, vol, waveform);
        }

        if (other.label === "bumper") {
          const dx = ball.position.x - other.position.x;
          const dy = ball.position.y - other.position.y;
          const m = Math.hypot(dx, dy) || 1;
          const force =
            (ball as any).ballType === "bouncy" || (ball as any).ballType === "perfect"
              ? 0.06
              : 0.045;
          Matter.Body.applyForce(ball, ball.position, {
            x: (dx / m) * force,
            y: (dy / m) * force,
          });
        }
      }
    });

    // Custom drawings overlay
    Matter.Events.on(this.render, "afterRender", () => {
      const ctx = this.render.context;
      const s = this.dragStart;
      const c = this.dragCur;
      const t = this.currentTool;

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
        const cx = s ? s.x : c ? c.x : -9999;
        const cy = s ? s.y : c ? c.y : -9999;
        const dragR = s && c ? Math.hypot(c.x - s.x, c.y - s.y) : 0;
        const r = dragR > 25 ? dragR : this.currentDupSize;
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
      const sel = this.selectedBodies;
      if (sel && (t === "select" || t === "rotate")) {
        ctx.save();
        ctx.strokeStyle = t === "rotate" ? "rgba(255,209,102,0.95)" : "rgba(94,228,255,0.95)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
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
  }

  private cloneBall(source: Matter.Body) {
    const bodies = Matter.Composite.allBodies(this.engine.world);
    if (bodies.filter((b) => b.label === "ball").length >= MAX_BALLS) return;

    const r = (source as any).circleRadius || 10;
    const color = (source.render as any).fillStyle || "#5ee4ff";
    const sType = (source as any).ballType || "normal";
    const now = performance.now();

    const ox = (Math.random() - 0.5) * 4;
    const oy = -r * 2.4;

    const ball = Matter.Bodies.circle(source.position.x + ox, source.position.y + oy, r, {
      restitution: sType === "bouncy" ? 1.05 : sType === "perfect" ? 1.02 : 0.78,
      friction: sType === "perfect" ? 0 : 0.003,
      frictionStatic: sType === "perfect" ? 0 : 0.5,
      frictionAir: sType === "perfect" ? 0 : sType === "bouncy" ? 0.001 : 0.005,
      density: sType === "bouncy" || sType === "perfect" ? 0.001 : 0.0018,
      inertia: sType === "perfect" ? Infinity : undefined,
      label: "ball",
      render: {
        fillStyle: color,
        strokeStyle:
          sType === "perfect" ? "#a6f56a" : sType === "bouncy" ? "#fff" : "rgba(255,255,255,0.4)",
        lineWidth: sType === "normal" ? 2 : 3,
      },
    });

    (ball as any).pitchIdx =
      (source as any).pitchIdx ?? Math.floor(Math.random() * PENTATONIC.length);
    (ball as any).ballType = sType;
    (ball as any).lastDup = now;

    const boostY = sType === "perfect" ? 16 : sType === "bouncy" ? 12 : 7;
    const boostX = sType === "perfect" ? 6 : 2;

    Matter.Body.setVelocity(ball, {
      x: source.velocity.x * 0.5 + (Math.random() - 0.5) * boostX,
      y: -Math.abs(source.velocity.y) * 0.5 - boostY,
    });

    Matter.Body.setVelocity(source, {
      x: source.velocity.x + (Math.random() - 0.5) * boostX,
      y: Math.min(source.velocity.y - boostY * 0.8, -boostY * 0.5),
    });

    Matter.Composite.add(this.engine.world, ball);
  }

  private updateCounts() {
    const bodies = Matter.Composite.allBodies(this.engine.world);
    const balls = bodies.filter((b) => b.label === "ball").length;
    const parts = bodies.filter((b) =>
      ["ramp", "bumper", "funnel", "spinner", "duplicator-arc"].includes(b.label),
    ).length;
    this.options.onCountsChange(balls, parts);
  }

  private getPos(ev: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  // Pointer Event Handlers (Bound in constructor/init)
  private handlePointerDown = (ev: PointerEvent) => {
    if (this.options.onPointerDown) {
      this.options.onPointerDown();
    }
    const { x, y } = this.getPos(ev);
    const t = this.currentTool;

    if (t === "ramp" || t === "duplicator") {
      this.dragStart = { x, y };
      this.dragCur = { x, y };
    } else if (t === "ball") {
      this.dropBall(x, y, this.currentBallType);
    } else if (t === "bumper") {
      this.placeBumper(x, y);
    } else if (t === "funnel") {
      this.placeFunnel(x, y);
    } else if (t === "spinner") {
      this.placeSpinner(x, y);
    } else if (t === "erase") {
      this.eraseAt(x, y);
    } else if (t === "select") {
      const hit = this.findBodyAt(x, y);
      if (hit) {
        const group = this.getGroup(hit);
        this.selectedBodies = group;
        this.selectAnchor = {
          x,
          y,
          bodies: group.map((b) => ({
            body: b,
            ox: b.position.x - x,
            oy: b.position.y - y,
          })),
        };
      } else {
        this.selectedBodies = null;
      }
    } else if (t === "rotate") {
      const hit = this.findBodyAt(x, y);
      if (hit) {
        const group = this.getGroup(hit);
        const cx = group.reduce((s, b) => s + b.position.x, 0) / group.length;
        const cy = group.reduce((s, b) => s + b.position.y, 0) / group.length;
        this.selectedBodies = group;
        this.rotateAnchor = {
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
        this.selectedBodies = null;
      }
    }
  };

  private handlePointerMove = (ev: PointerEvent) => {
    const t = this.currentTool;
    const p = this.getPos(ev);

    if ((t === "ramp" || t === "duplicator") && this.dragStart) {
      this.dragCur = p;
    } else if (t === "select" && this.selectAnchor) {
      for (const item of this.selectAnchor.bodies) {
        Matter.Body.setPosition(item.body, { x: p.x + item.ox, y: p.y + item.oy });
        Matter.Body.setVelocity(item.body, { x: 0, y: 0 });
      }
    } else if (t === "rotate" && this.rotateAnchor) {
      const a = this.rotateAnchor;
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

  private handlePointerUp = (ev: PointerEvent) => {
    const t = this.currentTool;
    const s = this.dragStart;
    const { x, y } = this.getPos(ev);

    if (s && t === "ramp") {
      if (Math.hypot(x - s.x, y - s.y) > 20) {
        this.placeRamp(s.x, s.y, x, y);
      }
    } else if (s && t === "duplicator") {
      const dragR = Math.hypot(x - s.x, y - s.y);
      const r = dragR > 25 ? dragR : this.currentDupSize;
      this.placeDuplicator(s.x, s.y, r);
    }

    this.dragStart = null;
    this.dragCur = null;
    this.selectAnchor = null;
    this.rotateAnchor = null;
  };

  private handleResize = () => {
    const w = this.wrapper.clientWidth;
    const h = this.wrapper.clientHeight;

    this.render.canvas.width = w * (window.devicePixelRatio || 1);
    this.render.canvas.height = h * (window.devicePixelRatio || 1);
    this.render.options.width = w;
    this.render.options.height = h;

    Matter.Render.setPixelRatio(this.render, window.devicePixelRatio || 1);

    // Rebuild walls
    this.walls.forEach((wbody) => Matter.Composite.remove(this.engine.world, wbody));
    this.walls = this.buildWalls(w, h);
    Matter.Composite.add(this.engine.world, this.walls);
  };

  // Simulation Controls & Placements
  public dropBall(x: number, y: number, type: BallType) {
    const bodies = Matter.Composite.allBodies(this.engine.world);
    if (bodies.filter((b) => b.label === "ball").length >= MAX_BALLS) return;

    this.ballCountSeq += 1;
    const color =
      type === "bouncy"
        ? "#ff6fae"
        : type === "perfect"
          ? "#ffffff"
          : BALL_COLORS[this.ballCountSeq % BALL_COLORS.length];
    const radius = type === "normal" ? 10 + Math.random() * 8 : 12;
    const pitchIdx = Math.floor(Math.random() * PENTATONIC.length);

    const ball = Matter.Bodies.circle(x, y, radius, {
      restitution: type === "bouncy" ? 1.05 : type === "perfect" ? 1.02 : 0.78,
      friction: type === "perfect" ? 0 : 0.003,
      frictionStatic: type === "perfect" ? 0 : 0.5,
      frictionAir: type === "perfect" ? 0 : type === "bouncy" ? 0.001 : 0.005,
      density: type === "bouncy" || type === "perfect" ? 0.001 : 0.0018,
      inertia: type === "perfect" ? Infinity : undefined,
      label: "ball",
      render: {
        fillStyle: color,
        strokeStyle:
          type === "perfect" ? "#a6f56a" : type === "bouncy" ? "#fff" : "rgba(255,255,255,0.4)",
        lineWidth: type === "normal" ? 2 : 3,
      },
    });

    (ball as any).pitchIdx = pitchIdx;
    (ball as any).ballType = type;

    Matter.Composite.add(this.engine.world, ball);
  }

  public placeBumper(x: number, y: number) {
    const body = Matter.Bodies.circle(x, y, 16, {
      isStatic: true,
      restitution: 1.2,
      label: "bumper",
      render: { fillStyle: "#ff6fae", strokeStyle: "#fff", lineWidth: 2 },
    });
    Matter.Composite.add(this.engine.world, body);
  }

  public placeFunnel(x: number, y: number) {
    const gid = this.groupCounter++;
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
    Matter.Composite.add(this.engine.world, [left, right]);
  }

  public placeSpinner(x: number, y: number) {
    const body = Matter.Bodies.rectangle(x, y, 120, 10, {
      isStatic: true,
      render: { fillStyle: "#ffd166" },
      label: "spinner",
    });
    Matter.Composite.add(this.engine.world, body);
  }

  public placeDuplicator(cx: number, cy: number, radius: number) {
    const r = Math.max(40, Math.min(radius, 360));
    const circumference = Math.PI * 2 * r;
    const segments = Math.max(28, Math.round(circumference / 18));
    const openingHalf = 0.45;
    const dupHalf = 0.5;
    const bodies: Matter.Body[] = [];
    const gid = this.groupCounter++;

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
    Matter.Composite.add(this.engine.world, bodies);
  }

  public placeRamp(x1: number, y1: number, x2: number, y2: number) {
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
    Matter.Composite.add(this.engine.world, body);
  }

  public eraseAt(x: number, y: number) {
    const bodies = Matter.Composite.allBodies(this.engine.world);
    const hit = bodies.find(
      (b) =>
        ["ramp", "bumper", "funnel", "spinner", "ball", "duplicator-arc"].includes(b.label) &&
        Matter.Bounds.contains(b.bounds, { x, y }),
    );
    if (hit) {
      Matter.Composite.remove(this.engine.world, hit);
    }
  }

  private findBodyAt(x: number, y: number): Matter.Body | null {
    const selectable = ["ramp", "bumper", "funnel", "spinner", "duplicator-arc"];
    const bodies = Matter.Composite.allBodies(this.engine.world).filter((b) =>
      selectable.includes(b.label),
    );
    const hit = Matter.Query.point(bodies, { x, y })[0];
    if (hit) return hit;

    // fallback bounding box containing check for thin segments
    return bodies.find((b) => Matter.Bounds.contains(b.bounds, { x, y })) || null;
  }

  private getGroup(body: Matter.Body): Matter.Body[] {
    const gid = (body as any).groupId;
    if (gid == null) return [body];
    return Matter.Composite.allBodies(this.engine.world).filter((b) => (b as any).groupId === gid);
  }

  public rainBalls() {
    const w = this.wrapper.clientWidth;
    const type = this.currentBallType;

    for (let i = 0; i < 25; i++) {
      setTimeout(() => {
        const bodies = Matter.Composite.allBodies(this.engine.world);
        if (bodies.filter((b) => b.label === "ball").length >= MAX_BALLS) return;

        const x = Math.random() * w;
        this.ballCountSeq += 1;
        const color =
          type === "bouncy"
            ? "#ff6fae"
            : type === "perfect"
              ? "#ffffff"
              : BALL_COLORS[this.ballCountSeq % BALL_COLORS.length];
        const radius = type === "normal" ? 10 + Math.random() * 8 : 12;

        const ball = Matter.Bodies.circle(x, 20, radius, {
          restitution: type === "bouncy" ? 1.05 : type === "perfect" ? 1.02 : 0.78,
          friction: type === "perfect" ? 0 : 0.003,
          frictionStatic: type === "perfect" ? 0 : 0.5,
          frictionAir: type === "perfect" ? 0 : type === "bouncy" ? 0.001 : 0.005,
          density: type === "bouncy" || type === "perfect" ? 0.001 : 0.0018,
          inertia: type === "perfect" ? Infinity : undefined,
          label: "ball",
          render: {
            fillStyle: color,
            strokeStyle:
              type === "perfect" ? "#a6f56a" : type === "bouncy" ? "#fff" : "rgba(255,255,255,0.4)",
            lineWidth: type === "normal" ? 2 : 3,
          },
        });

        (ball as any).pitchIdx = Math.floor(Math.random() * PENTATONIC.length);
        (ball as any).ballType = type;

        Matter.Composite.add(this.engine.world, ball);
      }, i * 50);
    }
  }

  public clearBalls() {
    Matter.Composite.allBodies(this.engine.world)
      .filter((b) => b.label === "ball")
      .forEach((b) => Matter.Composite.remove(this.engine.world, b));
  }

  public clearAll() {
    Matter.Composite.allBodies(this.engine.world)
      .filter((b) => b.label !== "wall")
      .forEach((b) => Matter.Composite.remove(this.engine.world, b));
  }

  // Cleanup simulation
  public destroy() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }

    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("resize", this.handleResize);

    Matter.Render.stop(this.render);
    Matter.Runner.stop(this.runner);
    Matter.Engine.clear(this.engine);
    this.render.textures = {};
  }
}
