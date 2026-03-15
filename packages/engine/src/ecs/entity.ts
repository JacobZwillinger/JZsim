import { EntityId, makeEntityId, entityIndex, entityGeneration, MAX_ENTITIES } from '@jzsim/core';

/**
 * Entity allocator with generational indices.
 *
 * Maintains a free list of available indices. When an entity is destroyed,
 * its index is recycled but the generation is incremented, so stale
 * EntityId references are detected.
 */
export class EntityAllocator {
  private generations: Uint16Array;
  private freeList: number[];
  private nextFreshIndex: number;
  private _activeCount: number = 0;

  /** Maps callsign -> EntityId for named lookup */
  readonly callsignMap: Map<string, EntityId> = new Map();
  /** Maps EntityId -> callsign */
  readonly idToCallsign: Map<EntityId, string> = new Map();

  constructor(private readonly capacity: number = MAX_ENTITIES) {
    this.generations = new Uint16Array(capacity);
    this.freeList = [];
    this.nextFreshIndex = 0;
  }

  /** Allocate a new entity, optionally with a callsign */
  allocate(callsign?: string): EntityId {
    let index: number;
    if (this.freeList.length > 0) {
      index = this.freeList.pop()!;
    } else if (this.nextFreshIndex < this.capacity) {
      index = this.nextFreshIndex++;
    } else {
      throw new Error('Entity capacity exceeded');
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
    return this.generations[index] === gen && index < this.nextFreshIndex;
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

  get highWaterMark(): number {
    return this.nextFreshIndex;
  }
}
