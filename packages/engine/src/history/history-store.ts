import type { SimEvent } from '@jzsim/core';
import { entityIndex } from '@jzsim/core';
import type { World } from '../ecs/world.js';
import { MissionState } from '../components/mission.js';

export interface EntitySnapshot {
  callsign: string;
  entityIndex: number;
  simTime: number;
  lat: number;
  lon: number;
  altM: number;
  headingDeg: number;
  speedMps: number;
  side: number;
  modelType: number;
  fuel?: number;
  currentHealth?: number;
  missionState?: string;
}

export interface HistoryEntry {
  simTime: number;
  entities: EntitySnapshot[];
}

/**
 * Stores periodic snapshots of entity state and sim events for
 * time-series replay and historical queries.
 */
export class HistoryStore {
  private snapshots: HistoryEntry[] = [];
  private events: Array<SimEvent & { simTime?: number }> = [];
  private maxSnapshots: number;
  private snapshotInterval: number;
  private lastSnapshotTick: number = -Infinity;
  private maxEvents: number;

  constructor(opts?: { maxSnapshots?: number; snapshotInterval?: number; maxEvents?: number }) {
    this.maxSnapshots = opts?.maxSnapshots ?? 3600;
    this.snapshotInterval = opts?.snapshotInterval ?? 10;
    this.maxEvents = opts?.maxEvents ?? 10000;
  }

  /** Call after each tick to potentially capture a snapshot */
  onTick(world: World): void {
    if (world.tickCount - this.lastSnapshotTick < this.snapshotInterval) return;
    this.lastSnapshotTick = world.tickCount;

    // Build index -> callsign map from idToCallsign
    const indexToCallsign = new Map<number, string>();
    for (const [id, callsign] of world.entities.idToCallsign) {
      indexToCallsign.set(entityIndex(id), callsign);
    }

    const entities: EntitySnapshot[] = [];
    const hwm = world.entities.highWaterMark;

    for (let i = 0; i < hwm; i++) {
      if (!world.position.has(i)) continue;

      const callsign = indexToCallsign.get(i) ?? `entity_${i}`;

      const snap: EntitySnapshot = {
        callsign,
        entityIndex: i,
        simTime: world.simTime,
        lat: world.position.get(i, 'lat'),
        lon: world.position.get(i, 'lon'),
        altM: world.position.get(i, 'alt'),
        headingDeg: world.position.get(i, 'heading'),
        speedMps: world.velocity.has(i) ? world.velocity.get(i, 'speed') : 0,
        side: world.allegiance.has(i) ? world.allegiance.get(i, 'side') : 0,
        modelType: world.renderable.has(i) ? world.renderable.get(i, 'modelType') : 0,
      };

      if (world.aircraft.has(i)) {
        snap.fuel = world.aircraft.get(i, 'fuel');
      }

      if (world.health.has(i)) {
        snap.currentHealth = world.health.get(i, 'currentHealth');
      }

      const mission = world.missions.get(i);
      if (mission) {
        snap.missionState = mission.state;
      }

      entities.push(snap);
    }

    this.snapshots.push({ simTime: world.simTime, entities });
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /** Store events from the sim, stamped with current sim time */
  addEvents(events: SimEvent[], simTime: number): void {
    for (const e of events) {
      this.events.push({ ...e, simTime });
    }
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /** Get history for a specific entity by callsign */
  getEntityHistory(callsign: string): EntitySnapshot[] {
    const result: EntitySnapshot[] = [];
    for (const entry of this.snapshots) {
      for (const snap of entry.entities) {
        if (snap.callsign === callsign) {
          result.push(snap);
        }
      }
    }
    return result;
  }

  /** Get all snapshots in a time range */
  getSnapshots(since?: number, until?: number): HistoryEntry[] {
    return this.snapshots.filter((s) => {
      if (since !== undefined && s.simTime < since) return false;
      if (until !== undefined && s.simTime > until) return false;
      return true;
    });
  }

  /** Get events, optionally filtered by time and type */
  getEvents(opts?: { since?: number; type?: string }): Array<SimEvent & { simTime?: number }> {
    return this.events.filter((e) => {
      if (opts?.since !== undefined && (e.simTime ?? 0) < opts.since) return false;
      if (opts?.type !== undefined && e.type !== opts.type) return false;
      return true;
    });
  }

  /** Get total snapshot count */
  get snapshotCount(): number {
    return this.snapshots.length;
  }

  /** Get total event count */
  get eventCount(): number {
    return this.events.length;
  }
}
