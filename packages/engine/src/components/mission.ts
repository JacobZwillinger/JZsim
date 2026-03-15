import type { EntityId } from '@jzsim/core';

export enum MissionState {
  IDLE = 'IDLE',
  ENROUTE = 'ENROUTE',
  PATROL = 'PATROL',
  LOITER = 'LOITER',
  RTB = 'RTB',
  LANDED = 'LANDED',
  INTERCEPT = 'INTERCEPT',
  SEAD = 'SEAD',
  REFUELING = 'REFUELING',
}

export interface Waypoint {
  lat: number;
  lon: number;
  alt: number;       // meters
  speed: number;     // m/s
  action?: 'PATROL_TURN' | 'LAND' | 'LOITER';
}

export interface MissionData {
  state: MissionState;
  waypoints: Waypoint[];
  currentWptIdx: number;
  patrolPoint1: Waypoint | null;
  patrolPoint2: Waypoint | null;
  patrolLeg: 0 | 1;          // which leg of patrol we're on
  homeBaseLat: number;
  homeBaseLon: number;
  homeBaseCallsign: string;
  loiterUntil: number;       // sim time to stop loitering
  targetIdx: number;         // entity index of intercept/refueling target (-1 if none)
  seadAreaLat: number;       // SEAD area center latitude
  seadAreaLon: number;       // SEAD area center longitude
  previousState: MissionState | null; // state to restore after REFUELING
}

/**
 * Mission store: variable-length per-entity mission data.
 * Uses a Map since waypoint lists vary in length (unlike SoA fixed-size stores).
 */
export class MissionStore {
  private data: Map<number, MissionData> = new Map();

  set(entityIdx: number, mission: MissionData): void {
    this.data.set(entityIdx, mission);
  }

  get(entityIdx: number): MissionData | undefined {
    return this.data.get(entityIdx);
  }

  has(entityIdx: number): boolean {
    return this.data.has(entityIdx);
  }

  delete(entityIdx: number): void {
    this.data.delete(entityIdx);
  }

  setState(entityIdx: number, state: MissionState): MissionState | undefined {
    const m = this.data.get(entityIdx);
    if (!m) return undefined;
    const prev = m.state;
    m.state = state;
    return prev;
  }

  getState(entityIdx: number): MissionState | undefined {
    return this.data.get(entityIdx)?.state;
  }

  entries(): IterableIterator<[number, MissionData]> {
    return this.data.entries();
  }
}
