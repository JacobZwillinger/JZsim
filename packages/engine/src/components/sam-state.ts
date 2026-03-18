export interface SamStateData {
  weaponKey: string;
  missilesRemaining: number;
  maxMissiles: number;
  reloadTimer: number;
  reloadTimeSec: number;
  minEngageAltM: number;     // minimum target altitude (ground clutter floor)
  engagedTargets: Set<number>;
}

export class SamStateStore {
  private data: Map<number, SamStateData> = new Map();

  set(entityIdx: number, state: SamStateData): void {
    this.data.set(entityIdx, state);
  }

  get(entityIdx: number): SamStateData | undefined {
    return this.data.get(entityIdx);
  }

  has(entityIdx: number): boolean {
    return this.data.has(entityIdx);
  }

  delete(entityIdx: number): void {
    this.data.delete(entityIdx);
  }

  entries(): IterableIterator<[number, SamStateData]> {
    return this.data.entries();
  }

  clear(): void {
    this.data.clear();
  }
}
