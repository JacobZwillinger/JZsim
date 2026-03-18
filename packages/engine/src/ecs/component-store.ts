/**
 * Struct-of-Arrays component store with auto-growth.
 *
 * Each "field" gets its own Float64Array for cache-friendly iteration.
 * A Uint8Array mask tracks which entities have this component.
 * When an entity index exceeds capacity, all arrays are doubled.
 */
export class ComponentStore<T extends { [K in keyof T]: number }> {
  readonly fields: Map<keyof T, Float64Array>;
  mask: Uint8Array;
  private _capacity: number;

  constructor(private readonly fieldNames: (keyof T)[], capacity: number) {
    this._capacity = capacity;
    this.mask = new Uint8Array(capacity);
    this.fields = new Map();
    for (const name of fieldNames) {
      this.fields.set(name, new Float64Array(capacity));
    }
  }

  get capacity(): number {
    return this._capacity;
  }

  /** Grow all arrays to at least the given capacity */
  grow(minCapacity: number): void {
    let newCap = this._capacity;
    while (newCap < minCapacity) newCap *= 2;
    if (newCap === this._capacity) return;

    const newMask = new Uint8Array(newCap);
    newMask.set(this.mask);
    this.mask = newMask;

    for (const [name, arr] of this.fields) {
      const newArr = new Float64Array(newCap);
      newArr.set(arr);
      this.fields.set(name, newArr);
    }
    this._capacity = newCap;
  }

  set(entityIndex: number, values: Partial<T>): void {
    if (entityIndex >= this._capacity) this.grow(entityIndex + 1);
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
    return entityIndex < this._capacity && this.mask[entityIndex] === 1;
  }

  remove(entityIndex: number): void {
    if (entityIndex < this._capacity) this.mask[entityIndex] = 0;
  }

  /** Returns the raw Float64Array for a field — used for batch operations */
  raw(field: keyof T): Float64Array {
    return this.fields.get(field)!;
  }

  /** Remove all entities from this store */
  clear(): void {
    this.mask.fill(0);
  }

  /** Count of entities that have this component */
  count(): number {
    let n = 0;
    for (let i = 0; i < this._capacity; i++) {
      if (this.mask[i]) n++;
    }
    return n;
  }
}
