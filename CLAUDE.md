# CLAUDE.md

This file provides AI assistants with the context needed to work effectively in this repository.

## Project Overview

**willycode** is a full-stack monorepo starter kit combining a NestJS backend with a React + Vite frontend. Both live in a single repository with a shared `package.json`. The backend serves the compiled React build as static files in production, with API routes namespaced under `/api`.

- **Node version:** v20.11.1 (see `.nvmrc`)
- **Language:** TypeScript throughout (frontend and backend)
- **Deployment target:** Vercel (serverless backend + static frontend)

---

## Repository Structure

```
started-kit/
├── src/
│   ├── api/                        # NestJS backend
│   │   ├── app/
│   │   │   ├── app.module.ts       # Root module (registers controllers, providers, static serving)
│   │   │   ├── app.controller.ts   # Route handlers (prefix: /api)
│   │   │   ├── app.service.ts      # Business logic
│   │   │   └── app.controller.spec.ts  # Unit tests
│   │   ├── test/
│   │   │   └── app.e2e-spec.ts     # End-to-end tests
│   │   └── main.ts                 # Entry point, listens on port 8000
│   └── client/                     # React + Vite frontend
│       ├── App.tsx                 # Root component
│       ├── App.test.tsx            # Frontend unit tests (Vitest)
│       ├── store.ts                # Zustand global store
│       ├── main.tsx                # React entry point (ignored by ESLint)
│       ├── App.css / index.css     # Styles
│       └── vite-env.d.ts           # Vite type declarations
├── index.html                      # SPA shell (entry for Vite)
├── vite.config.ts                  # Vite + Vitest config
├── nest-cli.json                   # NestJS CLI config (source root: src/api)
├── tsconfig.json                   # Base TS config for NestJS (CommonJS, ES2021)
├── tsconfig.build.json             # Build-time TS config (excludes client & specs)
├── tsconfig.node.json              # Node-specific TS config (extends tsconfig.json)
├── .eslintrc.js                    # ESLint config (TypeScript + React + Prettier)
├── .prettierrc                     # Prettier config
├── vercel.json                     # Vercel deployment routing
└── package.json                    # Root package.json with all scripts
```

---

## Development Workflow

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

This runs `dev:client` (Vite HMR on port 5173) and `dev:server` (NestJS on port 8000) concurrently via `npm-run-all`.

To run each separately:

```bash
npm run dev:client   # Vite frontend
npm run dev:server   # NestJS backend
```

### Build for production

```bash
npm run build
```

This runs sequentially:
1. `build:nest` — compiles the NestJS backend via `nest build` → `dist/`
2. `build:vite` — builds the React frontend via Vite → `dist/src/client/`

In production, NestJS uses `ServeStaticModule` to serve the React build from `dist/src/client`.

### Preview production build locally

```bash
npm run preview
```

---

## Testing

### Run all tests

```bash
npm test
```

Note: There is a known typo in `package.json` — the `test` script calls `test:clent` (missing `i`) instead of `test:client`. This still works because the script name is defined as `test:clent`.

### Frontend tests (Vitest)

```bash
npm run test:clent              # Run Vitest in watch mode
npm run test:client:coverage    # Run with coverage report
```

- Test files: `src/client/**/*.test.tsx`
- Vitest excludes `src/api/**` and `**/main.tsx/**`
- Currently only a placeholder test exists in `App.test.tsx`

### Backend tests (Jest + ts-jest)

```bash
npm run test:server             # Run Jest once
npm run test:server:watch       # Run Jest in watch mode
npm run test:server:cov         # Run with coverage report
```

- Test files: `src/api/**/*.spec.ts` (unit tests)
- E2E tests: `src/api/test/**/*.e2e-spec.ts`
- Jest root: `src/api`
- Uses `ts-jest` with `tsconfig.node.json`
- Coverage output: `coverage/`

---

## Linting & Formatting

### Run linting

```bash
npm run lint           # Lint both client and server
npm run lint:client    # ESLint on src/**/*.tsx (auto-fix)
npm run lint:server    # ESLint on src/**/*.ts (auto-fix)
```

### Pre-commit hook (lint-staged)

Staged `*.ts` and `*.tsx` files are automatically linted and formatted on commit:

```json
"lint-staged": {
  "*.ts?(x)": ["eslint --fix", "prettier --write", "git add"]
}
```

### Code style rules

- **Prettier:** single quotes, semicolons required, no trailing commas
- **ESLint:** TypeScript + Prettier + React recommended rules
- Disabled rules: `@typescript-eslint/explicit-function-return-type`, `@typescript-eslint/no-explicit-any`, `react/react-in-jsx-scope`
- JSX allowed in `.tsx` and `.js` files
- `main.tsx` is excluded from ESLint

---

## Architecture

### Backend (NestJS)

- **Entry point:** `src/api/main.ts` — bootstraps the app on **port 8000**
- **Root module:** `src/api/app/app.module.ts`
  - Registers `AppController` and `AppService`
  - Uses `ServeStaticModule` to serve the compiled React app from `dist/src/client`
  - Excludes `/api/(.*)` routes from static file serving
- **API routes** are prefixed with `/api` (defined in `@Controller('api')`)
- **Current endpoint:** `GET /api/h` → returns `"Hello World!"`

#### Adding a new feature module

Follow NestJS module conventions:
1. Create `src/api/<feature>/<feature>.module.ts`
2. Create `<feature>.controller.ts` and `<feature>.service.ts`
3. Import the feature module in `AppModule`
4. Prefix controllers with `/api` to avoid conflicts with static file serving

### Frontend (React + Vite)

- **Entry point:** `index.html` → `src/client/main.tsx`
- **Root component:** `src/client/App.tsx`
- **State management:** Zustand (`src/client/store.ts`)
  - Store: `useStoreFoods` — manages a `foods` counter with `increasePopulation`, `removeAllFoods`, `updateFoods`
  - Use `useShallow` from `zustand/react/shallow` when selecting multiple state slices to avoid unnecessary re-renders
- **Build output:** `dist/src/client/` (configured in `vite.config.ts`)

### Routing (production)

In production, all traffic is routed by NestJS:
- `/api/*` → handled by NestJS controllers
- `/*` → served as static files from `dist/src/client/`

In development, Vite and NestJS run on separate ports with no proxying configured by default.

---

## Deployment (Vercel)

`vercel.json` defines two build targets and routing:

| Route pattern | Destination |
|---|---|
| `/api(.*)` | `src/api/main.ts` (serverless Node) |
| `/(.*)` | `dist/src/client/$1` (static) |

Deploy steps:
1. `npm run build` to produce `dist/`
2. Push to GitHub; Vercel picks up the build automatically
3. Or use `vercel deploy` directly

---

## TypeScript Configuration

| File | Purpose |
|---|---|
| `tsconfig.json` | Base config for NestJS: `target: ES2021`, `module: CommonJS`, `outDir: ./dist`, decorators enabled |
| `tsconfig.build.json` | Build-only config: excludes `src/client`, tests, and node_modules |
| `tsconfig.node.json` | Node-specific overrides used by Jest (`ts-jest`) |

**Relaxed settings (intentional):**
- `strictNullChecks: false`
- `noImplicitAny: false`

When extending the codebase, maintain these settings unless explicitly migrating to strict mode.

---

## Known Issues

- **Typo in `package.json`:** `test:clent` should be `test:client` — do not rename it without updating the `test` script too.
- **Dead code in `App.tsx`:** An unused `shallow()` function at the bottom of the file throws `"Function not implemented."` — it should be removed when touching that file.
- **Placeholder test:** `App.test.tsx` contains an empty test suite with no assertions.
- **Empty file:** `test.json` at the repository root is empty and has no known purpose.

---

## Key Conventions

- **File naming:** `<name>.controller.ts`, `<name>.service.ts`, `<name>.module.ts`, `<name>.spec.ts` for backend; `.tsx` for React components
- **API prefix:** All backend routes must be under `/api` to coexist with static file serving
- **State management:** Use Zustand for all React global state; prefer `useShallow` for multi-slice selectors
- **No database configured** — add a database module (e.g., TypeORM, Prisma) to `AppModule` when persistence is needed
- **Single `package.json`** — do not split into workspaces; both apps share the root `node_modules`
- **Port 8000** is the backend default; Vite defaults to port 5173 in development
