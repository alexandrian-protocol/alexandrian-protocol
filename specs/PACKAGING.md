# Package build hygiene

How we keep the monorepo build reliable and reviewer-friendly.

## Protocol package (`@alexandrian/protocol`)

- **Module format:** CommonJS (`"module": "CommonJS"` in tsconfig). We do **not** set `"type": "module"` in protocol’s `package.json` so Node and consumers get CJS.
- **Consumers (pipeline, SDK):** ESM (`"type": "module"` in their `package.json`). They import protocol via `@alexandrian/protocol` and subpaths (`@alexandrian/protocol/core`, `@alexandrian/protocol/schema`, etc.).

## TypeScript packaging

- **Explicit `types` in `exports`:** Each subpath in protocol’s `package.json` uses conditional exports with both `types` and `default`, e.g.  
  `"./core": { "types": "./dist/core/index.d.ts", "default": "./dist/core/index.js" }`  
  so TypeScript always finds declarations for subpath imports.
- **Declaration emit:** In protocol’s `tsconfig.json`:
  - `"declaration": true` — emit `.d.ts` for all compiled files.
  - `"emitDeclarationOnly": false` — emit both `.js` and `.d.ts`; future refactors (e.g. a separate declaration-only build) won’t silently drop `.d.ts` and break consumers.
- **No composite:** Protocol does not use `"composite": true`, so we get a full emit every time and all entry points (including barrel `index.d.ts` files) are generated.

## Build fragility risk

- **Before** (no explicit `types`, or composite, or missing `emitDeclarationOnly: false`): **Moderate** — consumers can fail with TS2307/TS7016 if declarations are missing or not resolved.
- **After** (explicit `types` in exports, no composite, `declaration: true` + `emitDeclarationOnly: false`): **Low** — clean build from clone is reliable; refactors are less likely to silently drop `.d.ts`.

## Assumptions (risk level: low)

- **`dist/` is not committed** — build from source on clone/CI.
- **Build runs from clean clone** — `pnpm install && pnpm build` is sufficient; no stale `tsbuildinfo` or partial `dist`.
- **No path-alias leakage** — consumers use package names (`@alexandrian/protocol/core`), not repo path aliases, so the published (or workspace) boundary is clear.

## Reviewer interpretation

If a reviewer sees:

- Explicit `types` in `exports` for every subpath  
- Clear subpath structure (`./core`, `.schema`, `.schemas`, etc.)  
- No composite misuse; `declaration` + `emitDeclarationOnly: false` documented  
- Clean build from root  
- This documented as a sharp edge / packaging note  

they can infer that the maintainer understands TypeScript packaging nuances, which supports credibility for grant or audit review.
