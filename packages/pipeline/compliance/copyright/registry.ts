const registry = new Set<string>();

export function registerCopyright(id: string): void {
  registry.add(id);
}

export function hasCopyright(id: string): boolean {
  return registry.has(id);
}
