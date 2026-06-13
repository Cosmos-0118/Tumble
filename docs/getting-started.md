# Getting Started Guide

Welcome to the Tumble developer documentation. This guide explains how to configure, develop, test, and package the physics sandbox.

---

## Workspace Setup

### Installing Dependencies

Make sure you have Node.js (v18+) and [Bun](https://bun.sh) (recommended) or npm installed on your local machine.

```bash
# Using Bun (Recommended)
bun install

# Using npm
npm install
```

---

## Development

Start the Vite development compiler:

```bash
bun run dev
# or
npm run dev
```

The app will launch on [http://localhost:5173](http://localhost:5173).

---

## Project Scripts

The following commands are configured in `package.json` to manage developer quality:

| Command           | Tool     | Description                                                   |
| :---------------- | :------- | :------------------------------------------------------------ |
| `npm run dev`     | Vite     | Starts the development hot-reloading dev server.              |
| `npm run build`   | Vite     | Builds both client and SSR server bundles for production.     |
| `npm run preview` | Vite     | Hosts the compiled production build locally for verification. |
| `npm run lint`    | ESLint   | Evaluates typescript files against coding conventions.        |
| `npm run format`  | Prettier | Automatically formats code files across the workspace.        |

---

## Formatting and Code Quality

Always verify formatting and check for warnings before committing modifications:

```bash
# Format the codebase
bun run format

# Run TypeScript compilation and ESLint code checks
bun run lint
```

Ensure that your linters output clean runs. No warnings or errors should be present.
