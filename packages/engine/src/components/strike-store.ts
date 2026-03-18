import type { StrikeRoute } from '@jzsim/core';

/**
 * Per-entity strike route storage.
 * Maps entity index → ordered DMPI route with progress tracking.
 */
export class StrikeStore {
  private routes: Map<number, StrikeRoute> = new Map();

  set(entityIdx: number, route: StrikeRoute): void {
    this.routes.set(entityIdx, route);
  }

  get(entityIdx: number): StrikeRoute | undefined {
    return this.routes.get(entityIdx);
  }

  has(entityIdx: number): boolean {
    return this.routes.has(entityIdx);
  }

  delete(entityIdx: number): void {
    this.routes.delete(entityIdx);
  }

  entries(): IterableIterator<[number, StrikeRoute]> {
    return this.routes.entries();
  }

  get size(): number {
    return this.routes.size;
  }

  clear(): void {
    this.routes.clear();
  }
}
