# @alexandrian/protocol — API Reference

**Implements:** [PROTOCOL-SPEC v2.0.0](../../../docs/PROTOCOL-SPEC.md)

## Exports

| Path | Description |
|------|-------------|
| `@alexandrian/protocol` | Main entry: core, schema, types, canonical, validation, schemas |
| `@alexandrian/protocol/core` | Canonical serialization, VirtualRegistry, fingerprint, license, invariants |
| `@alexandrian/protocol/schema` | CanonicalEnvelope, KnowledgeBlock, dataset, royalty, access, api |
| `@alexandrian/protocol/schemas` | Zod schemas per KB type (practice, base, …) |
| `@alexandrian/protocol/validation` | EconomicInvariants, VirtualRegistry (conformance) |
| `@alexandrian/protocol/compiler` | KBCanonicalizer — use pipeline for full impl |
| `@alexandrian/protocol/sdk` | AlexandrianSDK — use SDK package for full impl |
| `@alexandrian/protocol/semanticIndex` | SemanticIndex — use API for full impl |

## Canonical

```ts
import {
  canonicalize,
  sortSources,
  contentHashFromEnvelope,
  cidV1FromEnvelope,
  buildDerivedEnvelope,
} from "@alexandrian/protocol/core";
```

## VirtualRegistry (Conformance)

```ts
import { VirtualRegistry, VirtualRegistryError } from "@alexandrian/protocol/core";
```

## Schemas

```ts
import type { CanonicalEnvelope, CanonicalPayload } from "@alexandrian/protocol/schema";
import { practicePayloadSchema } from "@alexandrian/protocol/schemas";
```

## Entry Points

```ts
// Main
import { KBType, TrustTier } from "@alexandrian/protocol";

// Runtime (execution layer)
import { CanonRuntime } from "@alexandrian/runtime";

// Compiler (canonicalization)
import { KBCanonicalizer } from "@alexandrian/protocol/compiler";

// SDK — use @alexandrian/sdk for full implementation
import { AlexandrianSDK } from "@alexandrian/protocol/sdk";

// Semantic index — use API package for full implementation
import { SemanticIndex } from "@alexandrian/protocol/semanticIndex";
```
