/**
 * Struct-of-Arrays component store.
 *
 * Each "field" gets its own Float64Array for cache-friendly iteration.
 * A Uint8Array mask tracks which entities have this component.
 */
export class ComponentStore<T extends { [K in keyof T]: number }> {
  readonly fields: Map<keyof T, Float64Array>;
  readonly mask: Uint8Array;
  private readonly capacity: number;

  constructor(fieldNames: (keyof T)[], capacity: number) {
    this.capacity = capacity;
    this.mask = new Uint8Array(capacity);
    this.fields = new Map();
    for (const name of fieldNames) {
      this.fields.set(name, new Float64Array(capacity));
    }
  }

  set(entityIndex: number, values: Partial<T>): void {
    this.mask[entityIndex] = 1;
    for (const key in values) {
      const arr = this.fields.get(key as keyof T);
      if (arr) arr[entityIndex] = values[key as keyof T] as number;
    }
  }

  get(entityIndex: number, field: keyof T): number {
    return this.fields.get(field)![entityIndex];
  }

  has(entityIndex: number): boolean {
    return this.mask[entityIndex] === 1;
  }

  remove(entityIndex: number): void {
    this.mask[entityIndex] = 0;
  }

  /** Returns the raw Float64Array for a field — used for batch operations */
  raw(field: keyof T): Float64Array {
    return this.fields.get(field)!;
  }

  /** Count of entities that have this component */
  count(): number {
    let n = 0;
    for (let i = 0; i < this.capacity; i++) {
      if (this.mask[i]) n++;
    }
    return n;
  }
}
