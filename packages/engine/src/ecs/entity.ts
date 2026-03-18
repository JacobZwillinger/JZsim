import { EntityId, makeEntityId, entityIndex, entityGeneration } from '@jzsim/core';

/**
 * Entity allocator with generational indices and auto-growth.
 *
 * Maintains a free list of available indices. When an entity is destroyed,
 * its index is recycled but the generation is incremented, so stale
 * EntityId references are detected.
 *
 * When capacity is exceeded, the allocator doubles its internal arrays.
 */
export class EntityAllocator {
  private generations: Uint16Array;
  private freeList: number[];
  private nextFreshIndex: number;
  private _activeCount: number = 0;
  private _capacity: number;

  /** Callback invoked when capacity grows — World uses this to grow component stores */
  onGrow?: (newCapacity: number) => void;

  /** Maps callsign -> EntityId for named lookup */
  readonly callsignMap: Map<string, EntityId> = new Map();
  /** Maps EntityId -> callsign */
  readonly idToCallsign: Map<EntityId, string> = new Map();

  constructor(initialCapacity: number = 4096) {
    this._capacity = initialCapacity;
    this.generations = new Uint16Array(initialCapacity);
    this.freeList = [];
    this.nextFreshIndex = 0;
  }

  get capacity(): number {
    return this._capacity;
  }

  /** Grow to at least the given capacity */
  private grow(minCapacity: number): void {
    let newCap = this._capacity;
    while (newCap < minCapacity) newCap *= 2;
    if (newCap === this._capacity) return;

    const newGens = new Uint16Array(newCap);
    newGens.set(this.generations);
    this.generations = newGens;
    this._capacity = newCap;

    this.onGrow?.(newCap);
  }

  /** Allocate a new entity, optionally with a callsign */
  allocate(callsign?: string): EntityId {
    let index: number;
    if (this.freeList.length > 0) {
      index = this.freeList.pop()!;
    } else {
      index = this.nextFreshIndex++;
      if (index >= this._capacity) {
        this.grow(index + 1);
      }
    }

    const id = makeEntityId(index, this.generations[index]);
    this._activeCount++;

    if (callsign) {
      this.callsignMap.set(callsign, id);
      this.idToCallsign.set(id, callsign);
    }

    return id;
  }

  /** Free an entity, incrementing its generation */
  free(id: EntityId): void {
    const index = entityIndex(id);
    const gen = entityGeneration(id);

    if (this.generations[index] !== gen) {
      return; // Already freed or stale reference
    }

    // Remove callsign mapping
    const callsign = this.idToCallsign.get(id);
    if (callsign) {
      this.callsignMap.delete(callsign);
      this.idToCallsign.delete(id);
    }

    this.generations[index]++;
    this.freeList.push(index);
    this._activeCount--;
  }

  /** Check if an EntityId is still valid (not freed or stale) */
  isAlive(id: EntityId): boolean {
    const index = entityIndex(id);
    const gen = entityGeneration(id);
    return index < this._capacity && this.generations[index] === gen && index < this.nextFreshIndex;
  }

  /** Resolve a callsign to an EntityId, or null if not found */
  resolve(callsign: string): EntityId | null {
    return this.callsignMap.get(callsign) ?? null;
  }

  /** Free an entity by its index (looks up current generation) */
  freeByIndex(index: number): void {
    const gen = this.generations[index];
    const id = makeEntityId(index, gen);
    this.free(id);
  }

  get activeCount(): number {
    return this._activeCount;
  }

  /** Reset allocator to initial empty state */
  reset(): void {
    this.generations.fill(0);
    this.freeList.length = 0;
    this.nextFreshIndex = 0;
    this._activeCount = 0;
    this.callsignMap.clear();
    this.idToCallsign.clear();
  }

  get highWaterMark(): number {
    return this.nextFreshIndex;
  }
}
