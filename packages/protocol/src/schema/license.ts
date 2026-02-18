import { z } from 'zod';

export const LicenseTermsSchema = z.object({
  commercialUse: z.boolean(),
  attribution: z.boolean(),
  shareAlike: z.boolean(),
  derivatives: z.boolean()
});

export const LicenseSchema = z.object({
  type: z.string(),
  terms: LicenseTermsSchema
});

export type LicenseTerms = z.infer<typeof LicenseTermsSchema>;
export type License = z.infer<typeof LicenseSchema>;
