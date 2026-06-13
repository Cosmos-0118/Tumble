# Architecture Overview

Tumble is designed with a feature-driven architecture to keep responsibilities clean, testable, and scalable.

## Core Principles

1. **Separation of Concerns:** The simulation (physics and audio) operates independently of the React rendering cycle. React only synchronizes with the engine state for UI updates (e.g., tool selection, score).
2. **Feature Grouping:** Code is organized by domain rather than file type. A feature folder contains its own types, constants, hooks, and components.
3. **Decoupled Engines:**
   - `physics-engine.ts` encapsulates all Matter.js logic (world creation, bodies, collision events).
   - `audio-engine.ts` encapsulates Web Audio API logic (oscillators, envelopes).
   - They communicate via callbacks or an event bus, rather than direct tight coupling.

## Directory Layout

### `src/features/sandbox/`

Contains everything related to the main sandbox experience.

- `physics/`: The Matter.js wrapper and setup.
- `audio/`: Web Audio synthesis.
- `components/`: UI specific to the sandbox (Toolbar, HUD).
- `hooks/`: React hooks (e.g., `useSandbox`) to bridge the imperative engines with declarative UI.

### `src/core/`

Application-wide infrastructure.

- `config/`: Environment and server configurations.
- `errors/`: Global error handling and crash pages.

### `src/components/ui/`

Generic, reusable presentation components (buttons, dialogs, form inputs), mostly generated via Shadcn UI.
