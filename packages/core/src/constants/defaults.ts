import { knotsToMps, feetToMeters, lbsToKg } from './units.js';

/** Default aircraft performance parameters */
export const AIRCRAFT_DEFAULTS: Record<string, {
  type: string;
  maxSpeedKts: number;
  cruiseSpeedKts: number;
  ceilingFt: number;
  fuelCapacityLbs: number;
  fuelBurnCruiseLbsHr: number;
  rcsM2: number;
  isStealth: boolean;
  modelType: number;
}> = {
  'F-15C': {
    type: 'fighter',
    maxSpeedKts: 1650,
    cruiseSpeedKts: 570,
    ceilingFt: 65000,
    fuelCapacityLbs: 13455,
    fuelBurnCruiseLbsHr: 5800,
    rcsM2: 5.0,
    isStealth: false,
    modelType: 1,
  },
  'F-22A': {
    type: 'fighter',
    maxSpeedKts: 1500,
    cruiseSpeedKts: 1050,
    ceilingFt: 65000,
    fuelCapacityLbs: 18000,
    fuelBurnCruiseLbsHr: 6200,
    rcsM2: 0.0001,
    isStealth: true,
    modelType: 1,
  },
  'F-16C': {
    type: 'fighter',
    maxSpeedKts: 1320,
    cruiseSpeedKts: 530,
    ceilingFt: 50000,
    fuelCapacityLbs: 7000,
    fuelBurnCruiseLbsHr: 4800,
    rcsM2: 1.2,
    isStealth: false,
    modelType: 1,
  },
  'Su-30': {
    type: 'fighter',
    maxSpeedKts: 1320,
    cruiseSpeedKts: 570,
    ceilingFt: 56800,
    fuelCapacityLbs: 20700,
    fuelBurnCruiseLbsHr: 7000,
    rcsM2: 4.0,
    isStealth: false,
    modelType: 1,
  },
  'B-2A': {
    type: 'bomber',
    maxSpeedKts: 500,  // Mach 0.85 — subsonic stealth bomber
    cruiseSpeedKts: 475,
    ceilingFt: 50000,
    fuelCapacityLbs: 167000,
    fuelBurnCruiseLbsHr: 12000,
    rcsM2: 0.001,
    isStealth: true,
    modelType: 2,
  },
  'KC-135': {
    type: 'tanker',
    maxSpeedKts: 530,
    cruiseSpeedKts: 460,
    ceilingFt: 50000,
    fuelCapacityLbs: 200000,
    fuelBurnCruiseLbsHr: 10000,
    rcsM2: 100,
    isStealth: false,
    modelType: 3,
  },
  'E-3': {
    type: 'awacs',
    maxSpeedKts: 460,
    cruiseSpeedKts: 360,
    ceilingFt: 40000,
    fuelCapacityLbs: 155000,
    fuelBurnCruiseLbsHr: 10000,
    rcsM2: 100,
    isStealth: false,
    modelType: 5,
  },
};

/** Convert aircraft defaults to internal SI units */
export function getAircraftDefaults(typeName: string) {
  const TYPE_ALIASES: Record<string, string> = {
    'FIGHTER': 'F-15C',
    'BOMBER': 'B-2A',
    'TANKER': 'KC-135',
    'TRANSPORT': 'KC-135',
    'AWACS': 'E-3',
  };
  const key = TYPE_ALIASES[typeName.toUpperCase()] ?? typeName;
  const def = AIRCRAFT_DEFAULTS[key];
  if (!def) return null;
  return {
    maxSpeed: knotsToMps(def.maxSpeedKts),
    cruiseSpeed: knotsToMps(def.cruiseSpeedKts),
    ceiling: feetToMeters(def.ceilingFt),
    fuelCapacity: lbsToKg(def.fuelCapacityLbs),
    fuelBurnRate: lbsToKg(def.fuelBurnCruiseLbsHr) / 3600, // kg/s
    rcs: def.rcsM2,
    isStealth: def.isStealth,
    modelType: def.modelType,
  };
}

/** Default weapon parameters */
export const WEAPON_DEFAULTS: Record<string, {
  speedMach: number;
  maxRangeKm: number;
  flightTimeSec: number;
  damage: number;         // warhead lethality multiplier (1.0 = 60 HP baseline)
  hitProbability: number; // per-weapon Pk (probability of kill on proximity)
  weaponType: number;
}> = {
  'AIM-120': { speedMach: 4, maxRangeKm: 180, flightTimeSec: 60, damage: 1.0, hitProbability: 0.70, weaponType: 1 },
  'AIM-9':   { speedMach: 2.5, maxRangeKm: 35, flightTimeSec: 30, damage: 0.6, hitProbability: 0.65, weaponType: 2 },
  'SA-10':   { speedMach: 6, maxRangeKm: 200, flightTimeSec: 50, damage: 1.5, hitProbability: 0.80, weaponType: 10 },
  'SA-2':    { speedMach: 3.5, maxRangeKm: 50, flightTimeSec: 30, damage: 1.2, hitProbability: 0.50, weaponType: 11 },
  'GBU-31':  { speedMach: 0.9, maxRangeKm: 28, flightTimeSec: 90, damage: 3.0, hitProbability: 0.90, weaponType: 20 },
  'GBU-38':  { speedMach: 0.9, maxRangeKm: 28, flightTimeSec: 90, damage: 2.0, hitProbability: 0.85, weaponType: 21 },
};

export function getWeaponDefaults(weaponName: string) {
  const def = WEAPON_DEFAULTS[weaponName];
  if (!def) return null;
  return {
    speed: def.speedMach * 343, // m/s (Mach * speed of sound)
    maxRange: def.maxRangeKm * 1000,
    flightTime: def.flightTimeSec,
    damage: def.damage,
    hitProbability: def.hitProbability,
    weaponType: def.weaponType,
  };
}

/** Default SAM site parameters */
export const SAM_DEFAULTS: Record<string, {
  radarKey: string;
  weaponKey: string;
  maxMissiles: number;
  reloadTimeSec: number;
  minEngageAltM: number;  // minimum target altitude for engagement (ground clutter floor)
}> = {
  'SA-10':   { radarKey: 'S-300', weaponKey: 'SA-10', maxMissiles: 4, reloadTimeSec: 10, minEngageAltM: 300 },
  'SA-2':    { radarKey: 'AN/FPS-117', weaponKey: 'SA-2', maxMissiles: 2, reloadTimeSec: 15, minEngageAltM: 500 },
  'PATRIOT': { radarKey: 'AN/TPS-77', weaponKey: 'AIM-120', maxMissiles: 4, reloadTimeSec: 8, minEngageAltM: 200 },
};

/** Default loadout per aircraft type: primary + secondary weapon with ammo counts */
export const LOADOUT_DEFAULTS: Record<string, {
  primaryWeapon: string;
  primaryAmmo: number;
  secondaryWeapon: string;
  secondaryAmmo: number;
}> = {
  'F-15C':  { primaryWeapon: 'AIM-120', primaryAmmo: 4, secondaryWeapon: 'AIM-9', secondaryAmmo: 4 },
  'F-22A':  { primaryWeapon: 'AIM-120', primaryAmmo: 6, secondaryWeapon: 'AIM-9', secondaryAmmo: 2 },
  'F-16C':  { primaryWeapon: 'AIM-120', primaryAmmo: 2, secondaryWeapon: 'AIM-9', secondaryAmmo: 4 },
  'Su-30':  { primaryWeapon: 'AIM-120', primaryAmmo: 4, secondaryWeapon: 'AIM-9', secondaryAmmo: 4 },
  'B-2A':   { primaryWeapon: 'GBU-31', primaryAmmo: 16, secondaryWeapon: 'GBU-38', secondaryAmmo: 0 },
  'KC-135': { primaryWeapon: 'AIM-120', primaryAmmo: 0, secondaryWeapon: 'AIM-9', secondaryAmmo: 0 },
  'E-3':    { primaryWeapon: 'AIM-120', primaryAmmo: 0, secondaryWeapon: 'AIM-9', secondaryAmmo: 0 },
};

/** Tanker offload parameters — real-world fuel transfer rates */
export const TANKER_DEFAULTS: Record<string, {
  maxOffloadRateKgPerSec: number;  // max fuel offload rate (boom/drogue)
  fuelReserveLbs: number;          // minimum fuel tanker keeps for itself
  offloadCapacityLbs: number;      // total offloadable fuel (capacity - reserve)
}> = {
  'KC-135': {
    maxOffloadRateKgPerSec: 0.42, // ~3300 lbs/hr boom transfer rate
    fuelReserveLbs: 50000,        // ~22,700 kg reserve for self
    offloadCapacityLbs: 150000,   // ~68,000 kg offloadable
  },
};

/** Per-aircraft maximum fuel receive rates (kg/s) — limited by fuel system */
export const FUEL_RECEIVE_RATE: Record<string, number> = {
  'F-15C': 0.35,  // ~2800 lbs/hr — boom receptacle
  'F-22A': 0.38,  // ~3000 lbs/hr — modern boom receptacle
  'F-16C': 0.30,  // ~2400 lbs/hr — boom receptacle, smaller fuel system
  'Su-30': 0.25,  // ~2000 lbs/hr — probe & drogue, slower transfer
  'B-2A':  0.40,  // ~3200 lbs/hr — boom receptacle, large fuel system
  'E-3':   0.40,  // ~3200 lbs/hr — boom receptacle
};

/** Default radar parameters */
export const RADAR_DEFAULTS: Record<string, {
  powerW: number;
  gainDbi: number;
  freqGhz: number;
  maxRangeKm: number;
}> = {
  'AN/TPS-77': {
    powerW: 25000,
    gainDbi: 34,
    freqGhz: 1.3,
    maxRangeKm: 470,
  },
  'AN/FPS-117': {
    powerW: 25000,
    gainDbi: 35,
    freqGhz: 1.3,
    maxRangeKm: 450,
  },
  'S-300': {
    powerW: 10000,
    gainDbi: 38,
    freqGhz: 4.0,
    maxRangeKm: 300,
  },
};

/** External pod/store definitions with RCS contributions */
export const POD_DEFAULTS: Record<string, { rcsM2: number; description: string }> = {
  'ECM':       { rcsM2: 0.2,  description: 'Electronic countermeasures pod' },
  'TGP':       { rcsM2: 0.15, description: 'Targeting pod (Sniper/LANTIRN)' },
  'RECON':     { rcsM2: 0.25, description: 'Reconnaissance pod' },
  'FUEL_TANK': { rcsM2: 0.4,  description: 'External drop tank' },
};
