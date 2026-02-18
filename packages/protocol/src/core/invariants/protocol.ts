export type ProtocolInvariantInput = {
  artifactId: string;
  contentHash: string;
};

export function enforceProtocolInvariant(input: ProtocolInvariantInput): void {
  if (!input.artifactId || !input.contentHash) {
    throw new Error("Protocol invariant failed");
  }
}
