# Serialization and canonical test vectors

Content-addressed Knowledge Blocks: **no timestamp in the hash preimage**. Same content and same lineage yield the same `contentHash` / `kbId` regardless of curator or registration time.

## Format

- **Envelope** — CamelCase payload (JCS input). `sources` are sorted before hashing (deterministic lineage).
- **Expected** — `contentHash` (SHA-256 hex, 0x-prefixed) and `cidV1` (CIDv1 base32 when available).

## Canonical test vectors (Milestone 1)

Layout and usage are documented in [test-vectors/canonical/README.md](../test-vectors/canonical/README.md).

Summary:

- **types/** — Practice (minimal, with parents), StateMachine, Prompt, Compliance, Synthesis, Pattern, Adaptation, Enhancement.
- **derivation/** — Single-parent, multi-parent, parent-sort normalization, cycle-rejection, duplicate-source-rejection.
- **edge-cases/** — Empty payload fields, max-sources, unicode, large payload, zero/full royalty share.

Regression: load `envelope.json`, compute hash with `contentHashFromEnvelope(envelope)` from `@alexandrian/protocol`, assert `=== expected.contentHash`. Run `pnpm test:spec` for full conformance.

## Metadata separation

- **Canonical envelope** (hashed) → contentHash / CIDv1; stored on IPFS as the content-addressed object.
- **Signed metadata** (timestamp, signature, envelopeCid) → stored as a linked, distinct object; not in the hash preimage.
