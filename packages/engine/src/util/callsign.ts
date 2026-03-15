import { entityIndex } from '@jzsim/core';
import type { World } from '../ecs/world.js';

/**
 * Resolve an entity index to its callsign.
 *
 * Uses the reverse callsignMap lookup. O(n) in the worst case but
 * the map is typically small (<100 named entities).
 */
export function findCallsign(world: World, idx: number, fallback?: string): string {
  for (const [cs, id] of world.entities.callsignMap) {
    if (entityIndex(id) === idx) return cs;
  }
  return fallback ?? `entity-${idx}`;
}

/** Find a base entity index by callsign. Returns -1 if not found or not a base. */
export function findBaseByCallsign(world: World, baseCallsign: string): number {
  const id = world.entities.callsignMap.get(baseCallsign.toUpperCase());
  if (id === undefined) return -1;
  const idx = entityIndex(id);
  if (!world.base.has(idx)) return -1;
  return idx;
}
