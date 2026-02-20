/**
 * Deprecation / supersession — proves KBDeprecated event and successor link.
 * Resolves: "No accountability when knowledge degrades" failure mode.
 *
 * Contract does not yet emit KBDeprecated or store supersededBy. This test is skipped
 * until the Registry has deprecation support; then unskip and implement:
 * - Publish original KB, publish corrected KB, call deprecate(original, supersededBy: corrected)
 * - Assert GET /api/blocks/:original returns status DEPRECATED and supersededBy.
 */
import { describe, it, expect } from "vitest";

describe("Flow: Deprecation", () => {
  // Skipped in Milestone 1: depends on Registry KBDeprecated support.
  // Deferred: requires KBDeprecated event and supersededBy.
  it.skip(
    "deprecates original KB and links supersededBy (requires Registry KBDeprecated support)",
    async () => {
      // When Registry emits KBDeprecated and stores supersededBy: publish original,
      // publish corrected, call deprecate(original, supersededBy: corrected),
      // GET /api/blocks/:original and assert status DEPRECATED and supersededBy.
    }
  );
});
