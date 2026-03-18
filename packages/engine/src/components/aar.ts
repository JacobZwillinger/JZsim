/**
 * After Action Report (AAR) store — singleton accumulator tracking
 * combat statistics over the simulation lifetime.
 */

export interface EntityAARData {
  callsign: string;
  aircraftType: string;
  side: number;
  baseCallsign: string;
  fuelUsedKg: number;
  munsExpended: Map<string, number>;
  kills: number;
  lost: boolean;
}

export interface AARSnapshot {
  totalFuelUsedKg: number;
  munsExpended: Record<string, number>;
  targetsHit: number;
  enemiesEngaged: number;
  friendlyLosses: number;
  enemyLosses: number;
  perEntity: Record<number, {
    callsign: string;
    aircraftType: string;
    side: number;
    baseCallsign: string;
    fuelUsedKg: number;
    munsExpended: Record<string, number>;
    kills: number;
    lost: boolean;
  }>;
}

export class AARStore {
  totalFuelUsedKg = 0;
  munsExpended = new Map<string, number>();
  targetsHit = 0;
  enemiesEngaged = 0;
  friendlyLosses = 0;
  enemyLosses = 0;
  private perEntity = new Map<number, EntityAARData>();

  getOrCreateEntity(idx: number, callsign: string, aircraftType: string, side: number, baseCallsign: string): EntityAARData {
    let entry = this.perEntity.get(idx);
    if (!entry) {
      entry = {
        callsign,
        aircraftType,
        side,
        baseCallsign,
        fuelUsedKg: 0,
        munsExpended: new Map(),
        kills: 0,
        lost: false,
      };
      this.perEntity.set(idx, entry);
    }
    return entry;
  }

  getEntity(idx: number): EntityAARData | undefined {
    return this.perEntity.get(idx);
  }

  recordFuelUsed(idx: number, kgUsed: number): void {
    this.totalFuelUsedKg += kgUsed;
    const entry = this.perEntity.get(idx);
    if (entry) entry.fuelUsedKg += kgUsed;
  }

  recordMunsExpended(idx: number, weaponKey: string, count: number): void {
    this.munsExpended.set(weaponKey, (this.munsExpended.get(weaponKey) ?? 0) + count);
    const entry = this.perEntity.get(idx);
    if (entry) {
      entry.munsExpended.set(weaponKey, (entry.munsExpended.get(weaponKey) ?? 0) + count);
    }
  }

  recordKill(shooterIdx: number): void {
    this.targetsHit++;
    const entry = this.perEntity.get(shooterIdx);
    if (entry) entry.kills++;
  }

  recordLoss(idx: number, isFriendly: boolean): void {
    if (isFriendly) this.friendlyLosses++;
    else this.enemyLosses++;
    const entry = this.perEntity.get(idx);
    if (entry) entry.lost = true;
  }

  reset(): void {
    this.totalFuelUsedKg = 0;
    this.munsExpended.clear();
    this.targetsHit = 0;
    this.enemiesEngaged = 0;
    this.friendlyLosses = 0;
    this.enemyLosses = 0;
    this.perEntity.clear();
  }

  /** Serialize for worker message transfer */
  snapshot(): AARSnapshot {
    const perEntity: AARSnapshot['perEntity'] = {};
    for (const [idx, e] of this.perEntity) {
      perEntity[idx] = {
        callsign: e.callsign,
        aircraftType: e.aircraftType,
        side: e.side,
        baseCallsign: e.baseCallsign,
        fuelUsedKg: e.fuelUsedKg,
        munsExpended: Object.fromEntries(e.munsExpended),
        kills: e.kills,
        lost: e.lost,
      };
    }
    return {
      totalFuelUsedKg: this.totalFuelUsedKg,
      munsExpended: Object.fromEntries(this.munsExpended),
      targetsHit: this.targetsHit,
      enemiesEngaged: this.enemiesEngaged,
      friendlyLosses: this.friendlyLosses,
      enemyLosses: this.enemyLosses,
      perEntity,
    };
  }
}
