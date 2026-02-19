# Sharp edges

Known footguns, brittle behavior, and places that could bite maintainers or users.

---

## 1. **API stub mutates `process.env` at import** — ✅ Fixed  
**File:** `packages/api/server.ts`

**Was:** `process.env.ALEXANDRIAN_API_STUB = "1"` at module load → test order/leak/surprising side effects.

**Fix:** No env mutation. Stub exposes `createServer({ stub: true })` and `isStub`; config is explicit. `app` is still exported for backward compatibility.

---

## 2. **`JSON.parse` without try/catch** — ✅ Fixed  
**Files:** `packages/sdk/commands/verify.ts`, `packages/sdk/commands/publish-registry.ts`

**Fix:** Both wrap `JSON.parse` in try/catch. Verify: logs "Invalid JSON in expected file: &lt;path&gt;" + error message and sets `process.exitCode = 1`. Publish-registry: throws `Error("Invalid JSON in envelope file: &lt;path&gt;")`.

---

## 3. **Non-null assertions on tx receipts**  
**File:** `packages/sdk/client/AlexandrianSDK.ts` (e.g. `receipt!.hash` after `tx.wait()`)

Code does `if (!receipt) throw new Error(...)` then uses `receipt!.hash`. The `!` is redundant; if someone removes the throw, this becomes a runtime error.

**Mitigation:** Use `receipt` without `!` after the guard, or assign to a variable so TypeScript narrows.

---

## 4. **Division by parent count**  
**File:** `packages/sdk/bin/run.ts` (e.g. `Math.floor(10000 / opts.parent!.length)`)

Only used when `opts.parent?.length` is truthy, so length ≥ 1. If the condition is ever relaxed, `opts.parent!.length` could be 0 → `Infinity` or NaN.

**Mitigation:** Explicit guard, e.g. `if (!opts.parent?.length) return;` before the block, or `Math.floor(10000 / Math.max(1, opts.parent.length))`.

---

## 5. **`createSDK()` uses `privateKey!` and `registryAddress!`**  
**File:** `packages/sdk/bin/run.ts`

The preAction hook only requires registry/privateKey for commands that aren’t `verify` or `accounts`. `verify` and `accounts` don’t call `createSDK()`, so in practice those are always set when `createSDK()` runs. If a new command calls `createSDK()` without going through the hook, undefined can slip through.

**Mitigation:** Have `createSDK()` validate and throw with a clear message, or split into `createSDKForRegistry()` (requires registry/signer) vs a lighter helper for read-only use.

---

## 6. **Duplicate catch branches**  
**File:** `packages/sdk/bin/run.ts` (publish-registry command)

Both branches of a conditional do the same thing (`console.error("Error:", msg)`). Copy-paste leftover; no behavioral bug but misleading.

**Mitigation:** Single `console.error("Error:", msg);`.

---

## 7. **Deprecated APIs still in use**  
**Files:** `packages/sdk/client/AlexandrianSDK.ts`, `packages/protocol/src/canonical.ts`

- `parentWeights` → prefer `sourceWeights`.
- `settleCitation` (and related naming).
- `sortSources` vs older canonical helper.

Callers that don’t see JSDoc (e.g. non-IDE, bundled) won’t get a deprecation warning.

**Mitigation:** Log a one-time deprecation warning at runtime, or bump major and remove the old API.

---

## 8. **Placeholder schemas**  
**File:** `packages/protocol/src/schemas/index.ts`

Only `base` and `practice` have real Zod schemas. Comment: "TODO: Add Zod schemas for remaining 8 types." Envelopes for other KB types are not validated by Zod here, so invalid payloads can slip through to canonical/VirtualRegistry.

**Mitigation:** Add schemas for the remaining types, or document that only practice (and base) are validated and others are “pass-through” for now.

---

## 9. **Integration tests: `describe.skip` and env-dependent `it.skipIf`**  
**Files:** `tests/integration/*.test.ts`

Several suites are permanently skipped (`describe.skip`) with messages like "requires API package (Milestone 2)". Others use `it.skipIf(!hasStack || process.env.RUN_* !== "1")`. If env is unset or wrong, tests silently skip and CI can still be green.

**Mitigation:** Document required env (e.g. in README or `specs/`). Consider a single integration job that runs with env set and fails if required tests are skipped. (Economic invariants were previously hidden by a hardcoded `describe.skip`; that’s fixed.)

---

## 10. **Deploy scripts: `process.exit` and `.catch`**  
**Files:** `packages/protocol/scripts/deploy.cjs`, `deploy-testnet.cjs`

Deploy uses `.then(…)` / `.catch(err => { console.error(err); process.exit(1); })`. Unhandled rejections elsewhere could still exit the process in a non-uniform way. Brief delay comment: "avoids Node/libuv crash on Windows" — platform-specific and easy to break if someone removes the delay.

**Mitigation:** Use a single top-level `async` entry that awaits the deploy and then calls `process.exit(0)` or `process.exit(1)`, and document the Windows delay if it’s required.

---

## 11. **Sync `readFileSync` in tests**  
**Files:** `tests/unit/canonical-vectors.test.ts`, `tests/unit/derived-vectors.test.ts`

Tests read fixture JSON with `readFileSync`. Fine for current fixture size; very large fixtures could block the event loop.

**Mitigation:** Optional: switch to `readFile` from `fs/promises` in async tests for consistency with the rest of the codebase; not urgent.

---

## 12. **Embedder / pipeline: env and API keys**  
**File:** `packages/pipeline/compiler/processors/embedder.ts`

Uses `process.env.OPENAI_API_KEY`, `COHERE_API_KEY`, `EMBEDDER`, `OLLAMA_URL`. Missing key → throw. Override logic (`EMBEDDER=local` etc.) is easy to forget when debugging.

**Mitigation:** Document in README or specs; consider a small `embedder-config` check that validates env and prints a clear error before running the pipeline.

---

## Summary

| # | Severity | Area |
|---|----------|------|
| 1 | Medium | Test/env isolation |
| 2 | Medium | CLI UX / crash on bad input |
| 3 | Low | TypeScript/receipt handling |
| 4 | Low | Division edge case |
| 5 | Low | SDK creation preconditions |
| 6 | Low | Dead code |
| 7 | Low | Deprecation visibility |
| 8 | Medium | Validation coverage |
| 9 | Medium | CI/skip visibility |
| 10 | Low | Deploy script robustness |
| 11 | Low | Test I/O style |
| 12 | Low | Config discoverability |

Fixing 1, 2, 8, and 9 gives the biggest gain for grant/review and Milestone 1 clarity.

---

## 13. **Pipeline build: missing type declarations for protocol subpaths**  
**Files:** `packages/protocol/package.json`, `packages/pipeline` (consumer)

When the pipeline (or SDK) imports `@alexandrian/protocol/core` or `@alexandrian/protocol/schema`, TypeScript looks for corresponding `.d.ts` files. The protocol package only listed plain `"./dist/core/index.js"` (etc.) in `exports`, so TypeScript had no explicit `types` entry for those subpaths and could not find declarations → **TS2307** or **TS7016** and pipeline build fails.

**Mitigation:** Use conditional exports with a `types` entry for each subpath (e.g. `"./core": { "types": "./dist/core/index.d.ts", "default": "./dist/core/index.js" }`). Ensure the protocol build emits declarations for all entry points: `declaration: true` and `emitDeclarationOnly: false` in protocol’s tsconfig; no `composite`; run a clean protocol build if `dist/core/index.d.ts` or `dist/schema/index.d.ts` are missing. See [PACKAGING.md](PACKAGING.md) for build hygiene.
