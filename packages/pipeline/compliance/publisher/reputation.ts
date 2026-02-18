const scores = new Map<string, number>();

export function setReputation(id: string, score: number): void {
  scores.set(id, score);
}

export function getReputation(id: string): number {
  return scores.get(id) ?? 0;
}
