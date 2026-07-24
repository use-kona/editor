# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **frontend-only pnpm monorepo** (Kona Editor). There is **no backend, database, or external service** — "running" the product means running Node-based dev/build/test tooling. Toolchain per CI (`.github/workflows/gh-pages.yml`): **Node 20+, pnpm 10** (the VM currently has Node 22 / pnpm 10, which works fine).

Workspaces (`pnpm-workspace.yaml`):
- `packages/editor` → `@use-kona/editor`, the publishable Slate-based React rich-text editor library.
- `apps/site` → `@kona/site`, an Rspress docs/demo site that consumes the editor via `workspace:*`.

Standard commands (see `package.json` scripts; run from repo root unless noted):
- Lint: `pnpm run lint` (Biome).
- Test: `pnpm --filter @use-kona/editor test` (Vitest, jsdom).
- Build library: `pnpm run build:editor`; Build site: `pnpm run build:site`.
- Site dev server: `pnpm --filter @kona/site dev`.
- Storybook (component playground): `pnpm --filter @use-kona/editor storybook`.

Non-obvious caveats:
- The site dev server serves under the base path `/editor/`, i.e. open **http://localhost:3000/editor/** (not `/`). The homepage embeds the live editor (`apps/site/docs/index.tsx` → `examples/Editor.tsx`), so it's the quickest way to manually exercise editor functionality.
- `pnpm install` prints "Ignored build scripts" (esbuild, core-js, @parcel/watcher). This is expected and harmless here — builds, tests, and the dev server all work without approving them (rslib/rspress use Rspack, not esbuild's native binary). Do **not** run the interactive `pnpm approve-builds`.
- Pre-existing issues unrelated to your changes (present on `dev`): `pnpm run lint` reports Biome errors/warnings, and Vitest has one failing test in `packages/editor/src/plugins/ListsPlugin/ListsPlugin.spec.tsx` ("should change current block to numbered list"). Don't assume you broke these; verify against the base branch.
- There is a nested `packages/editor/pnpm-lock.yaml`, but installs are driven by the root lockfile via workspaces — always install from the repo root.
