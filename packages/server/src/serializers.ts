import type { World } from '@jzsim/engine';
import { MissionState } from '@jzsim/engine';
import type { MissionData, LoadoutEntry, SamStateData, BaseInventory, AARSnapshot } from '@jzsim/engine';
import {
  entityIndex,
  metersToFeet,
  mpsToKnots,
  kgToLbs,
  M_TO_KM,
  M_TO_NM,
  Side,
  ModelType,
  RadarMode,
  WeaponType,
} from '@jzsim/core';
import type { SimManager } from './sim-manager.js';

// ---- DTO interfaces ----

export interface PositionDTO {
  lat: number;
  lon: number;
  altFt: number;
}

export interface VelocityDTO {
  speedKts: number;
  headingDeg: number;
  climbRateFpm: number;
}

export interface FuelDTO {
  currentLbs: number;
  capacityLbs: number;
  burnRateLbsHr: number;
  pctRemaining: number;
}

export interface HealthDTO {
  current: number;
  max: number;
  pctRemaining: number;
}

export interface MissionDTO {
  state: string;
  currentWaypointIdx: number;
  waypointCount: number;
  homeBase: string | null;
  targetIdx: number;
}

export interface LoadoutDTO {
  primary: { weapon: string; ammo: number; max: number };
  secondary: { weapon: string; ammo: number; max: number };
}

export interface AircraftDTO {
  callsign: string;
  type: string;
  side: string;
  position: PositionDTO;
  velocity: VelocityDTO;
  fuel: FuelDTO;
  health: HealthDTO | null;
  mission: MissionDTO | null;
  loadout: LoadoutDTO | null;
  entityIndex: number;
}

export interface RadarDTO {
  callsign: string;
  side: string;
  position: PositionDTO;
  powerW: number;
  gainDbi: number;
  freqGhz: number;
  mode: string;
  maxRangeKm: number;
  entityIndex: number;
}

export interface SAMDTO {
  callsign: string;
  side: string;
  position: PositionDTO;
  weaponKey: string;
  missilesRemaining: number;
  maxMissiles: number;
  reloadTimer: number;
  reloadTimeSec: number;
  minEngageAltFt: number;
  engagedTargetCount: number;
  health: HealthDTO | null;
  radar: Omit<RadarDTO, 'callsign' | 'side' | 'position' | 'entityIndex'> | null;
  entityIndex: number;
}

export interface BaseDTO {
  callsign: string;
  side: string;
  position: PositionDTO;
  fuelTons: number;
  runwayCount: number;
  aircraftCapacity: number;
  aircraftCount: number;
  inventory: Record<string, number>;
  assignedAircraft: string[];
  entityIndex: number;
}

export interface WeaponDTO {
  entityIndex: number;
  weaponType: string;
  targetCallsign: string | null;
  shooterCallsign: string | null;
  position: PositionDTO;
  speedKts: number;
  headingDeg: number;
  flightTimeLeft: number;
  damage: number;
  hitProbability: number;
}

export interface EntityDTO {
  callsign: string;
  entityIndex: number;
  category: string;
  side: string;
  modelType: string;
  position: PositionDTO;
  velocity: VelocityDTO | null;
  health: HealthDTO | null;
}

export interface SimStateDTO {
  simTime: number;
  tickCount: number;
  entityCount: number;
  paused: boolean;
  timeMultiplier: number;
  running: boolean;
}

// ---- Helper functions ----

function sideName(s: number): string {
  switch (s) {
    case Side.BLUE: return 'BLUE';
    case Side.RED: return 'RED';
    case Side.NEUTRAL: return 'NEUTRAL';
    default: return 'UNKNOWN';
  }
}

function modelTypeName(m: number): string {
  switch (m) {
    case ModelType.FIGHTER: return 'FIGHTER';
    case ModelType.BOMBER: return 'BOMBER';
    case ModelType.TANKER: return 'TANKER';
    case ModelType.TRANSPORT: return 'TRANSPORT';
    case ModelType.AWACS: return 'AWACS';
    case ModelType.AIRBASE: return 'AIRBASE';
    case ModelType.RADAR_SITE: return 'RADAR_SITE';
    case ModelType.SAM_SITE: return 'SAM_SITE';
    case ModelType.SHIP: return 'SHIP';
    case ModelType.MISSILE: return 'MISSILE';
    default: return 'UNKNOWN';
  }
}

function radarModeName(m: number): string {
  switch (m) {
    case RadarMode.OFF: return 'OFF';
    case RadarMode.STANDBY: return 'STANDBY';
    case RadarMode.SEARCH: return 'SEARCH';
    case RadarMode.TRACK: return 'TRACK';
    default: return 'UNKNOWN';
  }
}

function weaponTypeName(w: number): string {
  switch (w) {
    case WeaponType.AIM120_AMRAAM: return 'AIM-120';
    case WeaponType.AIM9_SIDEWINDER: return 'AIM-9';
    case WeaponType.SA10_GRUMBLE: return 'SA-10';
    case WeaponType.SA2_GUIDELINE: return 'SA-2';
    default: return 'UNKNOWN';
  }
}

/** Build index -> callsign reverse map */
function buildIndexToCallsign(world: World): Map<number, string> {
  const map = new Map<number, string>();
  for (const [id, callsign] of world.entities.idToCallsign) {
    map.set(entityIndex(id), callsign);
  }
  return map;
}

function getPosition(world: World, idx: number): PositionDTO {
  return {
    lat: world.position.get(idx, 'lat'),
    lon: world.position.get(idx, 'lon'),
    altFt: Math.round(metersToFeet(world.position.get(idx, 'alt'))),
  };
}

function getVelocity(world: World, idx: number): VelocityDTO | null {
  if (!world.velocity.has(idx)) return null;
  return {
    speedKts: Math.round(mpsToKnots(world.velocity.get(idx, 'speed')) * 10) / 10,
    headingDeg: Math.round(world.position.get(idx, 'heading') * 10) / 10,
    climbRateFpm: Math.round(world.velocity.get(idx, 'climbRate') * 196.85), // m/s -> ft/min
  };
}

function getHealth(world: World, idx: number): HealthDTO | null {
  if (!world.health.has(idx)) return null;
  const current = world.health.get(idx, 'currentHealth');
  const max = world.health.get(idx, 'maxHealth');
  return {
    current: Math.round(current),
    max: Math.round(max),
    pctRemaining: max > 0 ? Math.round((current / max) * 100) : 0,
  };
}

function getFuel(world: World, idx: number): FuelDTO {
  const fuel = world.aircraft.get(idx, 'fuel');
  const cap = world.aircraft.get(idx, 'fuelCapacity');
  const burnRate = world.aircraft.get(idx, 'fuelBurnRate');
  return {
    currentLbs: Math.round(kgToLbs(fuel)),
    capacityLbs: Math.round(kgToLbs(cap)),
    burnRateLbsHr: Math.round(kgToLbs(burnRate * 3600)),
    pctRemaining: cap > 0 ? Math.round((fuel / cap) * 100) : 0,
  };
}

function getMission(world: World, idx: number): MissionDTO | null {
  const m = world.missions.get(idx);
  if (!m) return null;
  return {
    state: m.state,
    currentWaypointIdx: m.currentWptIdx,
    waypointCount: m.waypoints.length,
    homeBase: m.homeBaseCallsign || null,
    targetIdx: m.targetIdx,
  };
}

function getLoadout(world: World, idx: number): LoadoutDTO | null {
  const l = world.loadouts.get(idx);
  if (!l) return null;
  return {
    primary: { weapon: l.primaryWeapon, ammo: l.primaryAmmo, max: l.primaryMax },
    secondary: { weapon: l.secondaryWeapon, ammo: l.secondaryAmmo, max: l.secondaryMax },
  };
}

function getSide(world: World, idx: number): string {
  if (!world.allegiance.has(idx)) return 'UNKNOWN';
  return sideName(world.allegiance.get(idx, 'side'));
}

function getModelType(world: World, idx: number): number {
  if (!world.renderable.has(idx)) return 0;
  return world.renderable.get(idx, 'modelType');
}

/** Determine entity category from its components */
function entityCategory(world: World, idx: number): string {
  const mt = getModelType(world, idx);
  if (mt === ModelType.MISSILE) return 'weapon';
  if (mt === ModelType.SAM_SITE) return 'sam';
  if (mt === ModelType.RADAR_SITE) return 'radar';
  if (mt === ModelType.AIRBASE) return 'base';
  if (world.base.has(idx)) return 'base';
  if (world.aircraft.has(idx)) return 'aircraft';
  if (world.weapon.has(idx)) return 'weapon';
  if (world.radar.has(idx)) return 'radar';
  return 'unknown';
}

// ---- Public serialization functions ----

export function serializeAircraft(world: World, idx: number, mgr: SimManager): AircraftDTO | null {
  if (!world.aircraft.has(idx) || !world.position.has(idx)) return null;

  const indexToCallsign = buildIndexToCallsign(world);
  const callsign = indexToCallsign.get(idx) ?? `entity_${idx}`;
  const typeName = mgr.entityTypeNames.get(idx) ?? modelTypeName(getModelType(world, idx));

  return {
    callsign,
    type: typeName,
    side: getSide(world, idx),
    position: getPosition(world, idx),
    velocity: getVelocity(world, idx)!,
    fuel: getFuel(world, idx),
    health: getHealth(world, idx),
    mission: getMission(world, idx),
    loadout: getLoadout(world, idx),
    entityIndex: idx,
  };
}

export function serializeAllAircraft(world: World, mgr: SimManager): AircraftDTO[] {
  const result: AircraftDTO[] = [];
  const hwm = world.entities.highWaterMark;
  for (let i = 0; i < hwm; i++) {
    if (!world.aircraft.has(i) || !world.position.has(i)) continue;
    // Skip weapons (missiles have aircraft component? No, they have weapon component)
    const mt = getModelType(world, i);
    if (mt === ModelType.MISSILE) continue;
    if (mt === ModelType.SAM_SITE || mt === ModelType.RADAR_SITE || mt === ModelType.AIRBASE) continue;
    const dto = serializeAircraft(world, i, mgr);
    if (dto) result.push(dto);
  }
  return result;
}

export function serializeRadar(world: World, idx: number): RadarDTO | null {
  if (!world.radar.has(idx) || !world.position.has(idx)) return null;
  // Only standalone radars (not radars on aircraft or SAMs)
  const mt = getModelType(world, idx);
  if (mt !== ModelType.RADAR_SITE && mt !== ModelType.SAM_SITE) return null;

  const indexToCallsign = buildIndexToCallsign(world);
  const callsign = indexToCallsign.get(idx) ?? `radar_${idx}`;

  return {
    callsign,
    side: getSide(world, idx),
    position: getPosition(world, idx),
    powerW: world.radar.get(idx, 'powerW'),
    gainDbi: world.radar.get(idx, 'gainDbi'),
    freqGhz: world.radar.get(idx, 'freqGhz'),
    mode: radarModeName(world.radar.get(idx, 'mode')),
    maxRangeKm: Math.round(world.radar.get(idx, 'maxRangeM') * M_TO_KM * 10) / 10,
    entityIndex: idx,
  };
}

export function serializeAllRadars(world: World): RadarDTO[] {
  const result: RadarDTO[] = [];
  const hwm = world.entities.highWaterMark;
  for (let i = 0; i < hwm; i++) {
    const mt = getModelType(world, i);
    if (mt !== ModelType.RADAR_SITE) continue;
    const dto = serializeRadar(world, i);
    if (dto) result.push(dto);
  }
  return result;
}

export function serializeSAM(world: World, idx: number): SAMDTO | null {
  const mt = getModelType(world, idx);
  if (mt !== ModelType.SAM_SITE || !world.position.has(idx)) return null;

  const indexToCallsign = buildIndexToCallsign(world);
  const callsign = indexToCallsign.get(idx) ?? `sam_${idx}`;

  const samState = world.samStates.get(idx);
  const health = getHealth(world, idx);

  let radarInfo = null;
  if (world.radar.has(idx)) {
    radarInfo = {
      powerW: world.radar.get(idx, 'powerW'),
      gainDbi: world.radar.get(idx, 'gainDbi'),
      freqGhz: world.radar.get(idx, 'freqGhz'),
      mode: radarModeName(world.radar.get(idx, 'mode')),
      maxRangeKm: Math.round(world.radar.get(idx, 'maxRangeM') * M_TO_KM * 10) / 10,
    };
  }

  return {
    callsign,
    side: getSide(world, idx),
    position: getPosition(world, idx),
    weaponKey: samState?.weaponKey ?? 'unknown',
    missilesRemaining: samState?.missilesRemaining ?? 0,
    maxMissiles: samState?.maxMissiles ?? 0,
    reloadTimer: samState?.reloadTimer ?? 0,
    reloadTimeSec: samState?.reloadTimeSec ?? 0,
    minEngageAltFt: Math.round(metersToFeet(samState?.minEngageAltM ?? 0)),
    engagedTargetCount: samState?.engagedTargets.size ?? 0,
    health,
    radar: radarInfo,
    entityIndex: idx,
  };
}

export function serializeAllSAMs(world: World): SAMDTO[] {
  const result: SAMDTO[] = [];
  const hwm = world.entities.highWaterMark;
  for (let i = 0; i < hwm; i++) {
    const dto = serializeSAM(world, i);
    if (dto) result.push(dto);
  }
  return result;
}

export function serializeBase(world: World, idx: number): BaseDTO | null {
  if (!world.base.has(idx) || !world.position.has(idx)) return null;

  const indexToCallsign = buildIndexToCallsign(world);
  const callsign = indexToCallsign.get(idx) ?? `base_${idx}`;

  const inv = world.baseInventory.get(idx);
  const munitions: Record<string, number> = {};
  if (inv) {
    for (const [key, count] of inv.munitions) {
      munitions[key] = count;
    }
  }

  const assignedAircraft: string[] = [];
  if (inv) {
    for (const aircraftIdx of inv.assignedAircraft) {
      const cs = indexToCallsign.get(aircraftIdx);
      if (cs) assignedAircraft.push(cs);
    }
  }

  return {
    callsign,
    side: getSide(world, idx),
    position: getPosition(world, idx),
    fuelTons: world.base.get(idx, 'fuelTons'),
    runwayCount: world.base.get(idx, 'runwayCount'),
    aircraftCapacity: world.base.get(idx, 'aircraftCapacity'),
    aircraftCount: world.base.get(idx, 'aircraftCount'),
    inventory: munitions,
    assignedAircraft,
    entityIndex: idx,
  };
}

export function serializeAllBases(world: World): BaseDTO[] {
  const result: BaseDTO[] = [];
  const hwm = world.entities.highWaterMark;
  for (let i = 0; i < hwm; i++) {
    const dto = serializeBase(world, i);
    if (dto) result.push(dto);
  }
  return result;
}

export function serializeWeapon(world: World, idx: number): WeaponDTO | null {
  if (!world.weapon.has(idx) || !world.position.has(idx)) return null;

  const indexToCallsign = buildIndexToCallsign(world);

  const targetIdx = world.weapon.get(idx, 'targetIdx');
  const shooterIdx = world.weapon.get(idx, 'shooterIdx');

  return {
    entityIndex: idx,
    weaponType: weaponTypeName(world.weapon.get(idx, 'weaponType')),
    targetCallsign: indexToCallsign.get(targetIdx) ?? null,
    shooterCallsign: indexToCallsign.get(shooterIdx) ?? null,
    position: getPosition(world, idx),
    speedKts: Math.round(mpsToKnots(world.weapon.get(idx, 'missileSpeed'))),
    headingDeg: Math.round(world.position.get(idx, 'heading') * 10) / 10,
    flightTimeLeft: Math.round(world.weapon.get(idx, 'flightTimeLeft') * 10) / 10,
    damage: world.weapon.get(idx, 'damage'),
    hitProbability: world.weapon.get(idx, 'hitProbability'),
  };
}

export function serializeAllWeapons(world: World): WeaponDTO[] {
  const result: WeaponDTO[] = [];
  const hwm = world.entities.highWaterMark;
  for (let i = 0; i < hwm; i++) {
    const dto = serializeWeapon(world, i);
    if (dto) result.push(dto);
  }
  return result;
}

export function serializeEntity(world: World, idx: number, mgr: SimManager): EntityDTO | null {
  if (!world.position.has(idx)) return null;

  const indexToCallsign = buildIndexToCallsign(world);
  const callsign = indexToCallsign.get(idx) ?? `entity_${idx}`;
  const mt = getModelType(world, idx);

  return {
    callsign,
    entityIndex: idx,
    category: entityCategory(world, idx),
    side: getSide(world, idx),
    modelType: mgr.entityTypeNames.get(idx) ?? modelTypeName(mt),
    position: getPosition(world, idx),
    velocity: getVelocity(world, idx),
    health: getHealth(world, idx),
  };
}

export function serializeAllEntities(world: World, mgr: SimManager): EntityDTO[] {
  const result: EntityDTO[] = [];
  const hwm = world.entities.highWaterMark;
  for (let i = 0; i < hwm; i++) {
    const dto = serializeEntity(world, i, mgr);
    if (dto) result.push(dto);
  }
  return result;
}

export function serializeSimState(mgr: SimManager): SimStateDTO {
  const world = mgr.world;
  return {
    simTime: Math.round(world.simTime * 100) / 100,
    tickCount: world.tickCount,
    entityCount: world.entities.activeCount,
    paused: world.paused,
    timeMultiplier: world.timeMultiplier,
    running: mgr.running,
  };
}

export function serializeAAR(world: World): AARSnapshot {
  return world.aar.snapshot();
}

/**
 * Find entity index by callsign.
 * Returns -1 if not found.
 */
export function findEntityByCallsign(world: World, callsign: string): number {
  const id = world.entities.resolve(callsign);
  if (id === null) return -1;
  return entityIndex(id);
}
