// --- Entity ID system (generational packed integers) ---

/** Packed entity ID: lower 20 bits = index, upper 12 bits = generation */
export type EntityId = number;

export const ENTITY_INDEX_BITS = 20;
export const ENTITY_INDEX_MASK = (1 << ENTITY_INDEX_BITS) - 1;
export const MAX_ENTITIES = 1 << ENTITY_INDEX_BITS; // ~1,048,576

export function entityIndex(id: EntityId): number {
  return id & ENTITY_INDEX_MASK;
}

export function entityGeneration(id: EntityId): number {
  return id >>> ENTITY_INDEX_BITS;
}

export function makeEntityId(index: number, generation: number): EntityId {
  return (generation << ENTITY_INDEX_BITS) | index;
}

// --- Entity types ---

export enum EntityType {
  AIRCRAFT = 1,
  BASE = 2,
  RADAR_SITE = 3,
  SAM_SITE = 4,
  SHIP = 5,
  GROUND_UNIT = 6,
  WEAPON = 7,
  TANKER = 8,
}

export enum Side {
  BLUE = 1,
  RED = 2,
  NEUTRAL = 3,
}

// --- Model type for rendering ---

export enum ModelType {
  FIGHTER = 1,
  BOMBER = 2,
  TANKER = 3,
  TRANSPORT = 4,
  AWACS = 5,
  AIRBASE = 10,
  RADAR_SITE = 11,
  SAM_SITE = 12,
  SHIP = 13,
  MISSILE = 20,
}
