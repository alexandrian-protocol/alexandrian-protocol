# Repo file structure

Clean, reviewable layout. Everything a reviewer needs: README files and this structure.

```
alexandrian-protocol/
│
├── README.md                        ← root, public face
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── glossary.md
├── .nvmrc
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
│
├── specs/
│   ├── PROTOCOL-SPEC.md
│   ├── INVARIANTS.md
│   ├── ARCHITECTURE.md
│   ├── THREAT-MODEL.md
│   ├── ECONOMIC-ASSUMPTIONS.md
│   ├── SHARP-EDGES.md
│   ├── TESTNET-ADDRESSES.md         ← fill after Sepolia deploy
│   ├── PACKAGING.md
│   ├── TROUBLESHOOTING.md
│   ├── serialization-test-vectors.md
│   ├── E2E-TESTNET-GRAPH.md
│   ├── M1-DEMO.md
│   │
│   ├── grants/
│   │   ├── README.md                ← reviewer entry point
│   │   ├── COMMANDS.md
│   │   ├── REVIEW.md
│   │   ├── AUDIT-READINESS.md
│   │   └── FILE-STRUCTURE.md
│   │
│   └── m2/
│       ├── README.md                ← planned work only
│       ├── ROADMAP.md
│       ├── GRANT-NARRATIVE.md
│       ├── ERC-STACK.md
│       └── demo-video-script.md
│
├── packages/
│   ├── protocol/
│   ├── pipeline/
│   ├── sdk/
│   └── api/
│
├── seeds/
│   ├── meta.alexandria/
│   ├── software.patterns/
│   └── software.security/
│
├── test-vectors/
│   └── canonical/
│
├── tests/
│   ├── demo-walkthrough/
│   ├── integration/
│   ├── invariants/
│   ├── performance/
│   └── unit/
│
├── subgraph/
├── scripts/
└── docker/
```

Deploy to Sepolia, fill in [TESTNET-ADDRESSES.md](../TESTNET-ADDRESSES.md), and M1 is done.
