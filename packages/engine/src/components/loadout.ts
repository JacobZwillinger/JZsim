/**
 * Loadout store — Map-based storage for weapon loadouts.
 * Tracks primary and secondary weapon types + ammo counts.
 */

export interface LoadoutEntry {
  primaryWeapon: string;
  primaryAmmo: number;
  primaryMax: number;
  secondaryWeapon: string;
  secondaryAmmo: number;
  secondaryMax: number;
  externalFuelTanks: boolean;   // whether aircraft has external drop tanks
  bayDoorsOpenUntil: number;    // simTime when bay doors close (stealth A/C weapon launch)
  offloadableFuel: number;      // kg of fuel available for tanker offload (-1 if not tanker)
  externalPods: string[];       // equipped pod type keys (e.g., ['ECM', 'TGP'])
}

export class LoadoutStore {
  private data = new Map<number, LoadoutEntry>();

  set(entityIdx: number, entry: LoadoutEntry): void {
    this.data.set(entityIdx, entry);
  }

  get(entityIdx: number): LoadoutEntry | undefined {
    return this.data.get(entityIdx);
  }

  has(entityIdx: number): boolean {
    return this.data.has(entityIdx);
  }

  delete(entityIdx: number): void {
    this.data.delete(entityIdx);
  }

  entries(): IterableIterator<[number, LoadoutEntry]> {
    return this.data.entries();
  }

  clear(): void {
    this.data.clear();
  }
}
