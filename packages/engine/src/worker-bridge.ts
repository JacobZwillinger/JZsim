import { entityIndex, type EntityId } from '@jzsim/core';
import type { World } from './ecs/world.js';

/**
 * SharedArrayBuffer layout for zero-copy entity sync.
 *
 * Header (64 bytes = 8 x f64):
 *   [0] simTime
 *   [1] tickCount
 *   [2] entityCount
 *   [3] paused (0/1)
 *   [4] timeMultiplier
 *   [5-7] reserved
 *
 * Entity data (128 bytes = 16 x f64 per entity):
 *   [0] entityId
 *   [1] lat
 *   [2] lon
 *   [3] alt
 *   [4] heading
 *   [5] speed (m/s)
 *   [6] modelType
 *   [7] side
 *   [8] fuel (kg, -1 if not aircraft)
 *   [9] maxSpeed (m/s)
 *   [10] fuelCapacity (kg)
 *   [11] isWeapon (0/1)
 *   [12] currentHealth (-1 if no health)
 *   [13] maxHealth
 *   [14] primaryAmmo (-1 if no loadout)
 *   [15] secondaryAmmo
 */
export const HEADER_F64_COUNT = 8;
export const ENTITY_F64_STRIDE = 16;
export const MAX_SYNCED_ENTITIES = 32768;
export const BUFFER_SIZE = (HEADER_F64_COUNT + ENTITY_F64_STRIDE * MAX_SYNCED_ENTITIES) * 8;

/** Sync world state into a SharedArrayBuffer for the renderer to read */
export function syncWorldToBuffer(world: World, buffer: Float64Array): number {
  // Header
  buffer[0] = world.simTime;
  buffer[1] = world.tickCount;
  // entityCount filled below
  buffer[3] = world.paused ? 1 : 0;
  buffer[4] = world.timeMultiplier;

  const hwm = world.entities.highWaterMark;
  let count = 0;

  for (let i = 0; i < hwm && count < MAX_SYNCED_ENTITIES; i++) {
    if (!world.position.has(i) || !world.renderable.has(i)) continue;
    if (world.renderable.get(i, 'visible') === 0) continue;

    const offset = HEADER_F64_COUNT + count * ENTITY_F64_STRIDE;
    buffer[offset + 0] = i; // entity index as ID for now
    buffer[offset + 1] = world.position.get(i, 'lat');
    buffer[offset + 2] = world.position.get(i, 'lon');
    buffer[offset + 3] = world.position.get(i, 'alt');
    buffer[offset + 4] = world.position.get(i, 'heading');
    buffer[offset + 5] = world.velocity.has(i) ? world.velocity.get(i, 'speed') : 0;
    buffer[offset + 6] = world.renderable.get(i, 'modelType');
    buffer[offset + 7] = world.allegiance.has(i) ? world.allegiance.get(i, 'side') : 0;
    buffer[offset + 8] = world.aircraft.has(i) ? world.aircraft.get(i, 'fuel') : -1;
    buffer[offset + 9] = world.aircraft.has(i) ? world.aircraft.get(i, 'maxSpeed') : 0;
    buffer[offset + 10] = world.aircraft.has(i) ? world.aircraft.get(i, 'fuelCapacity') : 0;
    buffer[offset + 11] = world.weapon.has(i) ? 1 : 0;
    buffer[offset + 12] = world.health.has(i) ? world.health.get(i, 'currentHealth') : -1;
    buffer[offset + 13] = world.health.has(i) ? world.health.get(i, 'maxHealth') : 0;
    const loadout = world.loadouts.get(i);
    buffer[offset + 14] = loadout ? loadout.primaryAmmo : -1;
    buffer[offset + 15] = loadout ? loadout.secondaryAmmo : -1;
    count++;
  }

  buffer[2] = count;
  return count;
}

/** Worker message types */
export type WorkerMessage =
  | { type: 'init'; buffer: SharedArrayBuffer }
  | { type: 'command'; command: import('@jzsim/core').Command }
  | { type: 'set_time_multiplier'; multiplier: number }
  | { type: 'set_paused'; paused: boolean }
  | { type: 'reset' }
  | { type: 'events'; events: import('@jzsim/core').SimEvent[] }
  | { type: 'ready' }
  | { type: 'tick_stats'; simTime: number; tickCount: number; entityCount: number; tickMs: number;
      systemTimings?: { name: string; ms: number }[];
      gridRebuildMs?: number;
      bufferSyncMs?: number;
      radarContacts?: number;
      missileCount?: number;
      worldCapacity?: number;
    }
  | { type: 'aar_update'; data: import('./components/aar.js').AARSnapshot };
