# @alexandrian/protocol — API Reference

**Implements:** [PROTOCOL-SPEC v2.0.0](../../specs/PROTOCOL-SPEC.md)

## Exports

| Path | Description |
|------|-------------|
| `@alexandrian/protocol` | Main entry: core, schema, types, canonical, validation, schemas |
| `@alexandrian/protocol/core` | Canonical serialization, VirtualRegistry, fingerprint, license, invariants |
| `@alexandrian/protocol/schema` | CanonicalEnvelope, KnowledgeBlock, dataset, royalty, access, api |
| `@alexandrian/protocol/schemas` | Zod schemas per KB type (practice, base, …) |
| `@alexandrian/protocol/validation` | EconomicInvariants, VirtualRegistry (conformance) |
| `@alexandrian/protocol/compiler` | KBCanonicalizer (placeholder) |
| `@alexandrian/protocol/sdk` | AlexandrianSDK (placeholder) |
| `@alexandrian/protocol/semanticIndex` | SemanticIndex (placeholder) |

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

// SDK (placeholder)
import { AlexandrianSDK } from "@alexandrian/protocol/sdk";

// Semantic index (placeholder)
import { SemanticIndex } from "@alexandrian/protocol/semanticIndex";
```
