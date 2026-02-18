# Seed Knowledge Blocks

Real knowledge content that populates the Alexandrian archive for demos, grant reviewers, and early agents.

**Not test vectors.** Test vectors (`test-vectors/canonical/`) are synthetic and determinism-focused. Seeds are real KBs that tell a coherent story.

See [docs/TEST-VECTORS-AND-SEEDS.md](../docs/TEST-VECTORS-AND-SEEDS.md) for the full spec.

## Structure

```
seeds/
  software.security/     # 12 seeds — auth, crypto, OWASP, synthesis
  software.patterns/     # 6 seeds — retry, circuit breaker, adaptation, enhancement
  meta.alexandria/       # 3 seeds — KB authoring, taxonomy, intro
```

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

Use `@alexandrian/protocol` `contentHashFromEnvelope(envelope)` to verify hashes. For on-chain registration, run the seed script (see `scripts/` or `docs/DEMO_STEPS.md`).
