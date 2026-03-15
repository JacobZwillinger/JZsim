/** Field layouts for SoA component stores */

export interface PositionFields {
  lat: number;
  lon: number;
  alt: number;     // meters
  heading: number;  // degrees, 0=north, clockwise
  pitch: number;    // degrees
  roll: number;     // degrees
}

export const POSITION_FIELD_NAMES: (keyof PositionFields)[] = [
  'lat', 'lon', 'alt', 'heading', 'pitch', 'roll',
];

export interface VelocityFields {
  speed: number;      // m/s
  climbRate: number;  // m/s (positive = climbing)
  turnRate: number;   // deg/s (positive = clockwise)
}

export const VELOCITY_FIELD_NAMES: (keyof VelocityFields)[] = [
  'speed', 'climbRate', 'turnRate',
];

export interface AircraftFields {
  fuel: number;           // kg remaining
  fuelCapacity: number;   // kg max fuel
  fuelBurnRate: number;   // kg/s at current throttle
  maxSpeed: number;       // m/s
  cruiseSpeed: number;    // m/s
  ceiling: number;        // meters
  rcs: number;            // m² radar cross section
  throttle: number;       // 0.0 - 1.0
  entityType: number;     // EntityType enum value
}

export const AIRCRAFT_FIELD_NAMES: (keyof AircraftFields)[] = [
  'fuel', 'fuelCapacity', 'fuelBurnRate', 'maxSpeed', 'cruiseSpeed', 'ceiling', 'rcs', 'throttle', 'entityType',
];

export interface RadarFields {
  powerW: number;       // transmit power in watts
  gainDbi: number;      // antenna gain in dBi
  freqGhz: number;     // frequency in GHz
  mode: number;         // RadarMode enum
  maxRangeM: number;    // max detection range in meters
}

export const RADAR_FIELD_NAMES: (keyof RadarFields)[] = [
  'powerW', 'gainDbi', 'freqGhz', 'mode', 'maxRangeM',
];

export enum RadarMode {
  OFF = 0,
  STANDBY = 1,
  SEARCH = 2,
  TRACK = 3,
}

export interface BaseFields {
  fuelTons: number;
  weaponsCount: number;
  runwayCount: number;
  aircraftCapacity: number;
  aircraftCount: number;
}

export const BASE_FIELD_NAMES: (keyof BaseFields)[] = [
  'fuelTons', 'weaponsCount', 'runwayCount', 'aircraftCapacity', 'aircraftCount',
];

export interface AllegianceFields {
  side: number;    // Side enum
  iffCode: number; // IFF transponder code
}

export const ALLEGIANCE_FIELD_NAMES: (keyof AllegianceFields)[] = [
  'side', 'iffCode',
];

export interface RenderableFields {
  modelType: number;   // ModelType enum
  iconId: number;
  colorR: number;
  colorG: number;
  colorB: number;
  visible: number;     // 0 or 1
}

export const RENDERABLE_FIELD_NAMES: (keyof RenderableFields)[] = [
  'modelType', 'iconId', 'colorR', 'colorG', 'colorB', 'visible',
];

export enum WeaponType {
  AIM120_AMRAAM = 1,
  AIM9_SIDEWINDER = 2,
  SA10_GRUMBLE = 10,
  SA2_GUIDELINE = 11,
}

export interface WeaponFields {
  targetIdx: number;       // entity INDEX of target
  shooterIdx: number;      // entity INDEX of shooter
  weaponType: number;      // WeaponType enum
  damage: number;          // damage multiplier (0.6-1.5, scaled by WEAPON_BASE_DAMAGE)
  hitProbability: number;  // per-weapon Pk (0.0-1.0)
  maxRange: number;        // meters
  flightTimeLeft: number;  // seconds remaining before self-destruct
  missileSpeed: number;    // m/s
  prevLosAngle: number;    // previous line-of-sight angle for PN guidance (degrees)
}

export const WEAPON_FIELD_NAMES: (keyof WeaponFields)[] = [
  'targetIdx', 'shooterIdx', 'weaponType', 'damage', 'hitProbability', 'maxRange', 'flightTimeLeft', 'missileSpeed', 'prevLosAngle',
];

export interface HealthFields {
  maxHealth: number;      // max HP (typically 100)
  currentHealth: number;  // current HP
}

export const HEALTH_FIELD_NAMES: (keyof HealthFields)[] = [
  'maxHealth', 'currentHealth',
];
