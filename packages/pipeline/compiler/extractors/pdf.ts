export function extractPdf(buffer: Uint8Array): string {
  return new TextDecoder().decode(buffer);
}
