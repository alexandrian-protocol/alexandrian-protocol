# M2 — Grant Scope (Skeletons)

M2 adds **clean economic wiring** for grant narrative (e.g. AI infrastructure, L2):

- **Slash mechanism** — KBStaking, onDeprecation (10% to protocol).
- **totalFeesEarned** — Query accumulator on KnowledgeRegistry (settleQuery, KBQueried).
- **Deprecation** — deprecateKB, KBDeprecated, supersededBy (lineage continuity).
- **Subgraph** — queryCount, totalFeesEarned, deprecated, supersededBy; handleKBQueried, handleKBDeprecated.
- **Smart account compatibility** — ERC-165, ERC-1271 (SignatureHelper), EIP-712 (AlexandrianEIP712); ERC-2612 Permit on token (optional).

**Narrative:** Epistemic settlement layer for autonomous on-chain agents. On-chain quality signals (totalFeesEarned) enable measurable knowledge demand; natively indexable for ecosystem tooling. ERC-4337 compatible; EIP-712 for secure agent interaction.

**Do not over-standard.** Value prop: deterministic KB identity, economic accountability, royalty DAG. Stay narrow; wire consequences; show composability; keep ERC stack lean.

See `specs/m2/GRANT-NARRATIVE.md` and `specs/m2/ERC-STACK.md`.
