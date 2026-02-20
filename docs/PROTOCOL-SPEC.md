# Alexandrian Protocol — PROTOCOL-SPEC v2.0.0

This document is the protocol specification reference. The implementation lives in `packages/protocol` and implements this spec.

## Scope

- **Canonical Knowledge Block types** — Practice, Feature, StateMachine, Prompt, Compliance, Synthesis, Pattern, Adaptation, Enhancement, etc., with Zod schemas.
- **Canonical serialization** — JCS-normalized envelope, `sortSources()` for deterministic lineage, contentHash (SHA-256), CIDv1.
- **VirtualRegistry** — In-memory conformance: cycle rejection, duplicate source rejection, lineage validation.
- **Solidity** — Registry, Royalty (DAG), License, Token, EpochCommit.
- **Invariants** — Economic (RS bounds, freshness, tier, payout), ledger leaf hash; see `packages/protocol` and `tests/invariants/`.

## API reference

See [packages/protocol/docs/API.md](../packages/protocol/docs/API.md) for exports and usage.

## Adversarial and economic scope

- **Threat model:** To be added in docs (who we assume can attack, what we protect against, what we don’t).
- **Economic assumptions:** To be added in docs (invariants we enforce, intended properties, what we do not claim).

## Test conformance

- **Unit / spec:** `pnpm test:spec` — canonical vectors + invariants (no API/blockchain).
- **Canonical vectors:** [test-vectors/canonical/README.md](../test-vectors/canonical/README.md).
