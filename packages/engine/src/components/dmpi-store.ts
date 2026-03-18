import type { DMPI } from '@jzsim/core';

/**
 * Global registry of DMPI (Designated Mean Point of Impact) targets.
 * Named ground targets that can be assigned to strike routes.
 */
export class DMPIStore {
  private targets: Map<string, DMPI> = new Map();

  add(dmpi: DMPI): void {
    this.targets.set(dmpi.name, dmpi);
  }

  remove(name: string): boolean {
    return this.targets.delete(name);
  }

  get(name: string): DMPI | undefined {
    return this.targets.get(name);
  }

  has(name: string): boolean {
    return this.targets.has(name);
  }

  getAll(): DMPI[] {
    return Array.from(this.targets.values());
  }

  get size(): number {
    return this.targets.size;
  }

  clear(): void {
    this.targets.clear();
  }
}
