# Demo Video Script
## Alexandrian Protocol — End-to-End Walkthrough

**Format:** Screen recording, no slides  
**Runtime:** 3–4 minutes  
**Audience:** Grant reviewers, developers, agent framework builders

---

## Before You Record

Verify the full checklist passes:

- [ ] All mandatory E2E tests passing (`pnpm test && pnpm test:spec && pnpm test:integration`)
- [ ] `docker compose -f docker/docker-compose.yml up --build` starts cleanly from cold state (from repo root)
- [ ] CLI output is clean — no stack traces, no raw JSON blobs
- [ ] Each command prints content hash and transaction hash
- [ ] Block explorer URL prints automatically after every on-chain event
- [ ] Three funded test accounts ready (Curator A, Curator B, Agent)
- [ ] Terminal font size large enough to read in recording
- [ ] Block explorer open in browser tab, ready to show

---

## Scene 1 — Stack Startup (20 seconds)

**What to show:** Single command brings the full stack online.

From repo root:

```bash
docker compose -f docker/docker-compose.yml up --build
```

Let the services come up. When healthy, show:
- API service running
- Local blockchain node running
- IPFS node running
- Redis running

**Why this matters:** Proves the system runs as a coherent stack from one command. No manual setup, no hidden dependencies.

---

## Scene 2 — Publish a Practice Block (45 seconds)

**What to show:** First KB published with content addressing and on-chain registration.

```bash
alex publish seeds/software.security/practice-constant-time-comparison/envelope.json \
  --stake 100 \
  --query-fee 0.01
```

**Expected CLI output:**
```
Publishing Knowledge Block...
  Domain:       software.security
  Type:         practice
  Stake:        100 XANDER

Content hash:   0x20fdb963...
CIDv1:          bafybeig...
IPFS:           confirmed ✓
On-chain:       tx 0xABC... (block 1042)
Explorer:       https://sepolia.basescan.org/tx/0xABC...
```

Switch to block explorer. Show the `KBRegistered` event with:
- Content hash
- Curator address
- Block number

**Why this matters:** Resolves *unverified AI knowledge* — the content hash is a cryptographic commitment to the knowledge. Resolves *no attribution* — the curator address is permanently on-chain.

---

## Scene 3 — Publish a Second Practice Block (20 seconds)

**What to show:** Second KB registered, different curator.

```bash
alex publish seeds/software.security/practice-rate-limiting/envelope.json \
  --stake 100 \
  --query-fee 0.01
```

**Expected CLI output:**
```
Content hash:   0xDEF456...
CIDv1:          bafybei...
IPFS:           confirmed ✓
On-chain:       tx 0xDEF... (block 1043)
Explorer:       https://sepolia.basescan.org/tx/0xDEF...
```

Keep this scene short. It sets up the derivation in Scene 4.

---

## Scene 4 — Publish a Synthesis with Derivation (60 seconds)

**What to show:** Synthesis KB citing two practice blocks with royalty splits encoded in the DAG.

```bash
alex publish seeds/software.security/synthesis-secure-api-design/envelope.json \
  --stake 150 \
  --query-fee 0.02 \
  --parent 0x20fdb963...=3000 \
  --parent 0xDEF456...=3000
```

**Expected CLI output:**
```
Publishing Knowledge Block...
  Domain:       software.security
  Type:         synthesis
  Stake:        150 XANDER
  Parents:      2

  Parent 1:     0x20fdb963... (30% royalty)
  Parent 2:     0xDEF456...  (30% royalty)

Content hash:   0xSYNTH789...
CIDv1:          bafybeih...
IPFS:           confirmed ✓
On-chain:       tx 0xGHI... (block 1044)
Explorer:       https://sepolia.basescan.org/tx/0xGHI...
```

Switch to block explorer. Show:
- `KBRegistered` event for the synthesis
- Derivation links pointing to both parent hashes
- Royalty BPS recorded on-chain

**Why this matters:** This is the citation DAG made visible. The archive is now a graph, not a flat list. Resolves *no royalty routing across derivations* — the royalty splits are encoded at publication time and enforced by the contract.

---

## Scene 5 — Query and Settle (45 seconds)

**What to show:** Agent queries for knowledge, settlement fires, royalties route to three wallets.

```bash
# Agent queries
alex query "secure API design" \
  --domain software.security \
  --agent 0xAGENT_ADDRESS

# Settle against the synthesis
alex settle 0xSYNTH789... \
  --agent 0xAGENT_ADDRESS
```

**Expected CLI output:**
```
Query match:    synthesis-secure-api-design
Content hash:   0xSYNTH789...
Curator:        0xCURATOR_C

Settling...
Settlement:     tx 0xJKL... (block 1050)
Total fee:      0.02 XANDER

Royalty routing:
  0xCURATOR_C   → 0.008 XANDER (40%)
  0xCURATOR_A   → 0.006 XANDER (30%)
  0xCURATOR_B   → 0.006 XANDER (30%)

Explorer:       https://sepolia.basescan.org/tx/0xJKL...
```

Switch to block explorer. Show three separate transfer events in the same transaction. All three wallet balances updated.

**Why this matters:** Resolves *no economic incentive for high-quality curation* — curators earn when their knowledge is consumed. Royalties route automatically to parent curators without any intermediary.

---

## Scene 6 — Deprecation (30 seconds)

**What to show:** A KB deprecated on-chain with a successor recorded.

```bash
alex deprecate 0x20fdb963... \
  --superseded-by 0xNEWHASH...

alex inspect 0x20fdb963...
```

**Expected CLI output:**
```
Deprecated:     0x20fdb963...
Superseded by:  0xNEWHASH...
On-chain:       tx 0xMNO... (block 1055)

Knowledge Block: 0x20fdb963...
Status:         DEPRECATED ⚠
Superseded by:  0xNEWHASH...
Deprecated at:  block 1055
```

**Why this matters:** Resolves *no accountability when knowledge degrades* — deprecation is permanent, public, and on-chain. Agents querying deprecated KBs are directed to successors.

---

## Scene 7 — Lineage Traversal (30 seconds)

**What to show:** Full provenance tree reconstructed from on-chain state.

```bash
alex lineage 0xSYNTH789...
```

**Expected CLI output:**
```
synthesis-secure-api-design
  0xSYNTH789...  curator: 0xCURATOR_C  block: 1044
  ├── practice-constant-time-comparison
  │     0x20fdb963...  curator: 0xCURATOR_A  block: 1042
  │     royalty: 30%
  └── practice-rate-limiting
        0xDEF456...  curator: 0xCURATOR_B  block: 1043
        royalty: 30%
```

**Why this matters:** Resolves *no persistent, trustless knowledge lineage* — the full provenance chain is reconstructed from on-chain events alone. No Alexandria servers required. Any implementation can verify this independently.

---

## Scene 8 — Block Explorer Close (20 seconds)

**What to show:** Base Sepolia explorer with all transactions from the session.

Open `https://sepolia.basescan.org/address/YOUR_REGISTRY_ADDRESS`

Show:
- All `KBRegistered` events
- `CitationSettled` event
- `KBDeprecated` event
- Three royalty transfer events

End on a clean shot of the registry contract with all KBs registered and all events visible.

**Why this matters:** Everything shown in the demo is verifiable by anyone, independently, from on-chain state alone. This is the last frame reviewers see.

---

## Narration Notes

You do not need to speak over every command. Let the CLI output do the work. Speak at these moments:

- **Scene 2:** "The content hash is a cryptographic commitment to this knowledge. It will be identical in any implementation — TypeScript, Python, Rust."
- **Scene 4:** "The royalty splits are encoded in the derivation DAG at publication time. The contract enforces them — no platform, no intermediary."
- **Scene 5:** "Three wallets, one settlement transaction. The economic incentive is built into the protocol."
- **Scene 7:** "This lineage is reconstructed entirely from on-chain events. It does not depend on Alexandria's servers."

---

## Upload Checklist

- [ ] Video exported at 1080p minimum
- [ ] Captions added (improves accessibility and watch rate)
- [ ] Upload to YouTube as unlisted or Loom
- [ ] Title: "Alexandrian Protocol — End-to-End Demo (Base Sepolia)"
- [ ] Description includes: registry contract address, GitHub repo link, contact
- [ ] Link included in grant application and README
