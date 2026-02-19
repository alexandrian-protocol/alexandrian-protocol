# Repo file tree (GitHub)

Source layout only — no `node_modules/` or `dist/`. What you get after `git clone` and before `pnpm install`.

```
alexandrian-protocol/
│
├── .env.example
├── .gitignore
├── .node-version
├── .nvmrc
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.md
├── REPO-TREE.md
├── TESTS.md
├── tsconfig.base.json
├── tsconfig.json
├── vitest.config.ts
│
├── .cursor/
│   └── rules/
│       └── specs-markdown.mdc
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── docker/
│   ├── blockchain.package.json
│   ├── docker-compose.dev.yml
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   ├── Dockerfile.blockchain
│   └── README.md
│
├── packages/
│   ├── api/
│   │   ├── package.json
│   │   ├── server.ts
│   │   ├── tsconfig.json
│   │   └── services/
│   │       ├── ledger.ts
│   │       └── merkle.ts
│   │
│   ├── pipeline/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── index.ts
│   │   ├── compiler/
│   │   │   ├── index.ts
│   │   │   ├── compiler.ts
│   │   │   ├── pipeline/
│   │   │   │   ├── orchestrator.ts
│   │   │   │   └── queue.ts
│   │   │   ├── processors/
│   │   │   │   ├── index.ts
│   │   │   │   ├── processor.ts
│   │   │   │   ├── chunker.ts
│   │   │   │   ├── embedder.ts
│   │   │   │   ├── entityExtractor.ts
│   │   │   │   └── summarizer.ts
│   │   │   └── extractors/
│   │   │       ├── index.ts
│   │   │       ├── factory.ts
│   │   │       ├── html.ts
│   │   │       ├── markdown.ts
│   │   │       └── pdf.ts
│   │   ├── storage/
│   │   │   ├── index.ts
│   │   │   ├── cache/
│   │   │   │   ├── index.ts
│   │   │   │   ├── client.ts
│   │   │   │   └── royaltyCache.ts
│   │   │   ├── filecoin/
│   │   │   │   ├── client.ts
│   │   │   │   ├── dealMaker.ts
│   │   │   │   ├── dealMonitor.ts
│   │   │   │   └── retrieval.ts
│   │   │   └── ipfs/
│   │   │       ├── dht.ts
│   │   │       ├── gateway.ts
│   │   │       └── pinner.ts
│   │   └── compliance/
│   │       ├── index.ts
│   │       ├── audit/
│   │       │   ├── logger.ts
│   │       │   └── verifier.ts
│   │       ├── copyright/
│   │       │   ├── checker.ts
│   │       │   └── registry.ts
│   │       └── publisher/
│   │           ├── reputation.ts
│   │           └── verifier.ts
│   │
│   ├── protocol/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── hardhat.config.cjs
│   │   ├── deployments/
│   │   │   ├── KnowledgeRegistry.json
│   │   │   ├── Registry.json
│   │   │   └── ...
│   │   ├── contracts/
│   │   │   ├── (Solidity files)
│   │   │   └── m2/
│   │   │       └── AlexandrianEIP712.sol
│   │   ├── scripts/
│   │   │   ├── deploy-testnet.cjs
│   │   │   └── ...
│   │   └── src/
│   │       ├── index.ts
│   │       ├── canonical.ts
│   │       ├── constants.ts
│   │       ├── types.ts
│   │       ├── core/
│   │       │   ├── index.ts
│   │       │   ├── virtualRegistry/
│   │       │   ├── fingerprint/
│   │       │   ├── license/
│   │       │   └── invariants/
│   │       ├── schema/
│   │       │   ├── index.ts
│   │       │   ├── api/
│   │       │   └── ...
│   │       ├── schemas/
│   │       ├── validation/
│   │       ├── compiler/
│   │       ├── semanticIndex/
│   │       └── sdk/
│   │
│   └── sdk/
│       ├── package.json
│       ├── tsconfig.json
│       ├── index.ts
│       ├── cli.ts
│       ├── bin/
│       │   └── run.ts
│       ├── client/
│       │   ├── AlexandrianClient.ts
│       │   ├── AlexandrianSDK.ts
│       │   ├── AccessClient.ts
│       │   ├── DatasetClient.ts
│       │   └── RoyaltyClient.ts
│       ├── commands/
│       │   ├── publish.ts
│       │   ├── query.ts
│       │   ├── inspect.ts
│       │   ├── lineage.ts
│       │   ├── derive.ts
│       │   ├── verify.ts
│       │   ├── royalty.ts
│       │   ├── license.ts
│       │   └── publish-registry.ts
│       ├── lib/
│       │   └── explorer.ts
│       ├── types/
│       │   └── index.ts
│       └── examples/
│           ├── contribute.ts
│           └── research-agent.ts
│
├── scripts/
│   ├── assert-no-skipped-integration.mjs
│   ├── run-m1-verification.mjs
│   ├── run-demo-walkthrough.mjs
│   ├── register-seeds-testnet.mjs
│   ├── subgraph-deploy.cjs
│   └── ...
│
├── seeds/
│   ├── meta.alexandria/
│   ├── software.patterns/
│   ├── software.security/
│   └── (seed KBs)
│
├── specs/
│   ├── PROTOCOL-SPEC.md
│   ├── INVARIANTS.md
│   ├── ARCHITECTURE.md
│   ├── M1-DEMO.md
│   ├── TESTNET-ADDRESSES.md
│   ├── TROUBLESHOOTING.md
│   ├── E2E-TESTNET-GRAPH.md
│   ├── (other specs)
│   ├── grants/
│   │   ├── README.md
│   │   ├── COMMANDS.md
│   │   ├── FILE-STRUCTURE.md
│   │   ├── DOCS-AND-FEATURES.md
│   │   ├── REVIEW.md
│   │   └── AUDIT-READINESS.md
│   └── m2/
│       ├── README.md
│       └── ...
│
├── subgraph/
│   ├── package.json
│   ├── subgraph.yaml
│   ├── schema.graphql
│   ├── src/
│   │   └── (mapping)
│   └── README.md
│
├── test-vectors/
│   └── canonical/
│
└── tests/
    ├── demo-walkthrough/
    │   ├── ingestion.test.ts
    │   └── m1-demo.test.ts
    ├── integration/
    │   ├── subgraph.test.ts
    │   ├── (other integration tests)
    │   └── ...
    ├── invariants/
    ├── unit/
    └── performance/
```

**To regenerate a full tree locally (Windows):**
```powershell
tree /F /A > tree.txt
```
Then open `tree.txt` and remove `node_modules` and `dist` sections, or run from a clean clone before `pnpm install`.

**To list only top-level:**
```powershell
Get-ChildItem -Name
```

**To list packages:**
```powershell
Get-ChildItem packages -Recurse -Name -File | Where-Object { $_ -notmatch '\\node_modules\\' -and $_ -notmatch '\\dist\\' }
```
