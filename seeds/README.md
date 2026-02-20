# Seed Knowledge Blocks

Real knowledge content that populates the Alexandrian archive for demos, grant reviewers, and early agents.

**Not test vectors.** Test vectors (`test-vectors/canonical/`) are synthetic and determinism-focused. Seeds are real KBs that tell a coherent story.

See [docs/PROTOCOL-SPEC.md](../docs/PROTOCOL-SPEC.md) for canonical serialization and [test-vectors/canonical/](../test-vectors/canonical/) for reference vectors.

## Seed count (20 total)

| Type | Count | Examples |
|------|-------|----------|
| **practice** | 9 | practice-input-validation, practice-rate-limiting, practice-circuit-breaker, practice-kb-authoring, … |
| **stateMachine** | 2 | state-machine-auth-flow, state-machine-token-lifecycle |
| **complianceChecklist** | 2 | compliance-owasp-top10, compliance-jwt-rfc7519 |
| **pattern** | 2 | pattern-idempotency-key, pattern-webhook-delivery |
| **synthesis** (derived) | 3 | synthesis-secure-api-design, synthesis-auth-patterns, synthesis-knowledge-economy-intro |
| **adaptation** (derived) | 1 | adaptation-retry-to-queue |
| **enhancement** (derived) | 1 | enhancement-circuit-breaker-observability |

## Structure

```
seeds/
  software.security/     # auth, crypto, OWASP, synthesis (11)
  software.patterns/     # retry, circuit breaker, adaptation, enhancement (7)
  meta.alexandria/       # KB authoring, taxonomy, intro (3)
```

## Recommended for graph (a few of each + derived)

Register these on testnet so the subgraph shows variety and lineage:

1. **One practice per domain:** `practice-input-validation`, `practice-circuit-breaker`, `practice-kb-authoring`
2. **One stateMachine:** `state-machine-auth-flow`
3. **One complianceChecklist:** `compliance-owasp-top10`
4. **One pattern:** `pattern-idempotency-key`
5. **Derived (lineage):** register parents first, then:
   - `synthesis-secure-api-design` (parents: constant-time-comparison, rate-limiting, input-validation)
   - `synthesis-auth-patterns` (parents: auth-flow, token-lifecycle, token-rotation)
   - `adaptation-retry-to-queue` (parent: practice-retry-exponential-backoff)
   - `enhancement-circuit-breaker-observability` (parent: practice-circuit-breaker)

That gives roots of each kind plus derived KBs so the subgraph `parents` array and lineage queries return real data.

## Registration Order

Base seeds (no sources) can be registered in any order. Derived seeds (synthesis, adaptation, enhancement) require their sources to be registered first.

**Suggested order:**
1. software.security practices, state machines, compliance
2. software.patterns practices, patterns
3. meta.alexandria practices
4. synthesis-secure-api-design, synthesis-auth-patterns
5. adaptation-retry-to-queue, enhancement-circuit-breaker-observability
6. synthesis-knowledge-economy-intro

## Hashes

`seeds/hashes.json` maps seed path → contentHash. Regenerate with:

```bash
node scripts/seed-compute-hashes.mjs
```

## Usage

Use `@alexandrian/protocol` `contentHashFromEnvelope(envelope)` to verify hashes. For on-chain registration, run the seed script (see [CONTRIBUTING](../CONTRIBUTING.md) for runbook location).
