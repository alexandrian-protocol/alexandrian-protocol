# Protocol quality assessment

How Alexandrian holds up against a nine-pillar protocol doctrine.

---

## 1. Invariant preservation (foundation)

**Doctrine:** Everything flows from explicit, enforced invariants.

**Alexandrian:** Strong. Invariants are named and tested:

- **Economic:** Cycle-free royalty DAG; path shares ≤ 100%; base royalty + parent shares ≤ 100%; distribution and obligation math in `EconomicInvariants` and `tests/invariants/economic-invariants.test.ts`.
- **Structural:** VirtualRegistry rejects duplicate sources, cycles, unregistered parents; canonical hash independent of timestamp and source order.
- **Ledger:** RS bounds, freshness, tier, payout, leaf hash in ledger stub and tests.

**Gap:** Invariants are in code and tests; they are not yet listed in one place as "the set of protocol invariants" with a single source of truth (e.g. PROTOCOL-SPEC or a dedicated invariants doc).

---

## 2. Deterministic core (identity integrity)

**Doctrine:** Identity and state transitions mathematically stable; hash independent of order; settlement independent of caller.

**Alexandrian:** Aligned.

- Content hash from JCS-normalized envelope; `sortSources()` before hashing; no timestamp in preimage → same content + lineage → same `contentHash` / `kbId`.
- VirtualRegistry and contract layer enforce same structural rules regardless of who calls.
- Settlement distribution is computed from the royalty DAG and payment amount; no caller-dependent branching in core math.

---

## 3. Clear contract surface (interoperability)

**Doctrine:** Stable envelope, event, ABI, and subpath exports; external builders rely on structure, not quirks.

**Alexandrian:** Strong.

- Canonical envelope shape and KB types specified; Zod schemas for all 10 types; test vectors lock envelope/expected format.
- Package exports: explicit `types` + `default` for each subpath; no composite misuse.
- Solidity ABIs and deployment artifacts define on-chain contract surface.

---

## 4. Independent verifiability (trust minimization)

**Doctrine:** The question is "Can an adversary independently recompute and validate?" not "Can the server compute it?"

**Alexandrian:** Strong primitives.

- **Canonical envelope + CID:** Anyone can recompute contentHash and CIDv1 from public envelope and verify.
- **VirtualRegistry:** Reference implementation of conformance (cycles, duplicates, lineage); anyone can run the same checks off-chain.
- **Economic invariants:** DAG validation, cycle detection, path and share bounds are pure functions; anyone can recompute distribution and obligation.
- **Settlement:** On-chain settlement and royalty routing are verifiable from contract state and events.

---

## 5. Explicit failure semantics (predictable collapse)

**Doctrine:** Fail early, clearly, deterministically; no silent failure; no state corruption.

**Alexandrian:** Hardened.

- No `process.env` mutation at import; explicit config (`createServer(options)`).
- JSON.parse wrapped with clear errors (file path + message).
- Embedder: fail at startup if `EMBEDDER=openai|cohere` and key missing.
- SDK: throw on missing `privateKey` / `registryAddress` with clear messages.
- CI fails when integration tests are skipped; script logs which tests were skipped.
- VirtualRegistry and EconomicInvariants throw with specific messages (cycle, path > 100%, invalid share, etc.).

---

## 6. Layer separation (upstream purity)

**Doctrine:** Protocol = minimal core; runtime = layered consumers; protocol does not absorb runtime.

**Alexandrian:** Clear.

- `@alexandrian/protocol`: types, schemas, canonical serialization, VirtualRegistry, economic invariants, contracts. No Redis, no HTTP, no pipeline-specific logic.
- Pipeline, SDK, API consume protocol as a dependency; no reverse coupling. Subpath imports (`/core`, `/schema`, etc.) keep boundaries explicit.

---

## 7. Backward compatibility discipline

**Doctrine:** Versioned spec; clear deprecation path; one-time warnings.

**Alexandrian:** In place.

- PROTOCOL-SPEC versioned (v2.0.0); schema roadmap (Milestone 2) documented in code.
- Deprecated APIs (`parentWeights`, `settle`) have JSDoc + one-time runtime `console.warn` and clear migration target (`sourceWeights`, `settleCitation`).

---

## 8. Adversarial model — gap

**Doctrine:** Define who can attack, what they can do, what the protocol protects against and what it does not.

**Alexandrian:** Implicit in design, not explicit.

- **What exists:** VirtualRegistry and contracts reject cycles and duplicate sources; economic invariants cap shares and paths; neutrality commitment (no privileged curator). No `FOUNDER`/`ARCHITECT` in settlement or ranking.
- **What's missing:** A short, written threat model that states:
  - Assumed adversaries (e.g. rational curators, spam accounts, colluding parties).
  - Explicit threats considered (e.g. parent spam, royalty-path inflation, 10k tiny KBs to game settlement, exponential DAG traversal).
  - What the protocol does **not** guarantee (e.g. cost of spam, reputation gaming, or Sybil beyond structural/economic invariants).

**Recommendation:** Add `specs/THREAT-MODEL.md` (or a section in PROTOCOL-SPEC) listing assumed adversaries, in-scope threats, and out-of-scope assumptions. Even one page significantly raises protocol-grade credibility.

---

## 9. Economic game-theory soundness — gap

**Doctrine:** With staking and settlement, ask: Is spam profitable? Reputation gaming? Parent inflation? Collusion to increase payout?

**Alexandrian:** Partially addressed by structure; not yet stated as economic assumptions.

- **What exists:** Royalty DAG is cycle-free and share-bounded; distribution is deterministic; stake and query fees exist. Invariants prevent "impossible" economic states (e.g. >100% shares).
- **What's missing:** Explicit economic assumptions and design choices, e.g.:
  - Is spam (many low-value KBs) profitable or unprofitable under current fee/stake design?
  - Is parent inflation (deep DAGs, many parents) bounded or discouraged by rules or costs?
  - Can collusion increase payout beyond what the DAG allows, or is it limited to what the DAG allows?
  - What is the intended story for reputation gaming (e.g. self-endorsement, Sybil)?

**Recommendation:** Add `specs/ECONOMIC-ASSUMPTIONS.md` (or a section in PROTOCOL-SPEC) that states: what the protocol assumes about rational actors, what it tries to discourage (e.g. spam, parent inflation), and what remains out of scope (e.g. full Sybil resistance). This completes "economically sound under rational incentives" in a reviewer-visible way.

---

## Summary

| Pillar                         | Status   | Notes                                                                 |
|--------------------------------|----------|-----------------------------------------------------------------------|
| 1. Invariant preservation      | Strong   | Enforced in code and tests; could add a single "invariants" manifest.|
| 2. Deterministic core          | Aligned  | Identity and hashing are order- and timestamp-independent.           |
| 3. Clear contract surface      | Strong   | Envelope, types, exports, ABI are stable and documented.              |
| 4. Independent verifiability  | Strong   | Canonical hash, VirtualRegistry, economic math, on-chain settlement.  |
| 5. Explicit failure semantics | Strong   | Fail-fast, clear errors, no silent skips.                            |
| 6. Layer separation            | Strong   | Protocol is minimal core; consumers are layered.                     |
| 7. Backward compatibility     | Strong   | Versioned spec, deprecation warnings, roadmap.                        |
| 8. Adversarial model           | **Gap**  | Implicit in design; needs a short, explicit threat-model doc.         |
| 9. Economic soundness          | **Gap**  | Structure supports soundness; needs explicit economic assumptions.   |

**Verdict:** Alexandrian is strong on reliability, determinism, layering, failure clarity, and contract stability. To meet "protocol-grade" doctrine fully, the two missing pieces are: **(8) an explicit adversarial model** and **(9) explicit economic assumptions.** Adding concise, honest threat-model and economic-assumptions docs (or sections) closes that gap and makes the protocol's maturity and scope clear to reviewers.
