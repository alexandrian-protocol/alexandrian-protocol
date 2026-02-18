/**
 * Pattern KB payload schema (minimal)
 */
import { z } from "zod";

export const patternOccurrenceSchema = z.object({
  context: z.string(),
  offset: z.number().optional(),
}).passthrough();

export const patternPayloadSchema = z.object({
  type: z.literal("pattern"),
  pattern: z.string(),
  occurrences: z.array(patternOccurrenceSchema),
  applicability: z.string(),
});

export type PatternPayload = z.infer<typeof patternPayloadSchema>;
