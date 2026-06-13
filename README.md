# Tumble 🎲

Tumble is a modern, interactive physics simulation and audio engine built with React, Matter.js, and the Web Audio API.
It provides an engaging sandbox environment where users can create dynamic physics contraptions that generate satisfying audio feedback.

## Features

- **Physics Sandbox:** Interact with a 2D physics world powered by Matter.js. Place dynamic objects, ramps, and bouncy elements.
- **Audio Synthesis:** A custom Web Audio synthesizer manager that generates pentatonic tones on collision events.
- **Modern UI:** Built using Shadcn UI and Tailwind CSS for a clean, accessible interface.
- **Production-Grade Architecture:** Features a modular design separating the core simulation from the UI rendering layer.

## Project Structure

The project is structured by feature/domain to ensure scalability:

- `src/features/sandbox/` - The core simulation domain, including the physics engine, audio engine, and HUD components.
- `src/core/` - Foundational app setup such as configuration, error capture, and logging.
- `src/components/ui/` - Reusable UI components (buttons, sliders, etc.) using Radix/Shadcn.
- `src/routes/` - TanStack Router definitions for the app's pages.

See the `docs/` folder for more detailed architectural information.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Scripts

- `npm run dev`: Start the Vite dev server
- `npm run build`: Build the production bundle
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
