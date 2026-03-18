/**
 * Base inventory store — tracks munitions stockpiles and aircraft assignments per base.
 */

export interface BaseInventory {
  munitions: Map<string, number>;    // weaponKey → count (e.g., 'AIM-120' → 200)
  assignedAircraft: Set<number>;     // entity indices of aircraft assigned to this base
}

export class BaseInventoryStore {
  private data = new Map<number, BaseInventory>();

  set(baseIdx: number, inventory: BaseInventory): void {
    this.data.set(baseIdx, inventory);
  }

  get(baseIdx: number): BaseInventory | undefined {
    return this.data.get(baseIdx);
  }

  has(baseIdx: number): boolean {
    return this.data.has(baseIdx);
  }

  delete(baseIdx: number): void {
    this.data.delete(baseIdx);
  }

  entries(): IterableIterator<[number, BaseInventory]> {
    return this.data.entries();
  }

  /** Remove an aircraft from whichever base it's assigned to */
  unassignAircraft(aircraftIdx: number): void {
    for (const [, inv] of this.data) {
      inv.assignedAircraft.delete(aircraftIdx);
    }
  }

  clear(): void {
    this.data.clear();
  }

  /** Find the base index that an aircraft is assigned to, or -1 */
  findBaseForAircraft(aircraftIdx: number): number {
    for (const [baseIdx, inv] of this.data) {
      if (inv.assignedAircraft.has(aircraftIdx)) return baseIdx;
    }
    return -1;
  }
}
