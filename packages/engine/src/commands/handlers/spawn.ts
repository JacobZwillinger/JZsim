import {
  type Command,
  entityIndex,
  getAircraftDefaults,
  knotsToMps, feetToMeters,
  Side, ModelType, RadarMode,
  RADAR_DEFAULTS, SAM_DEFAULTS, getWeaponDefaults,
  LOADOUT_DEFAULTS, AIRCRAFT_DEFAULTS, TANKER_DEFAULTS,
  lbsToKg,
} from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type SpawnCommand = Extract<Command, { type: 'SPAWN' }>;

export function handleSpawn(cmd: SpawnCommand, world: World): void {
  const id = world.entities.allocate(cmd.callsign);
  const idx = entityIndex(id);

  // Position (alt input is in feet, stored in meters)
  world.position.set(idx, {
    lat: cmd.lat,
    lon: cmd.lon,
    alt: cmd.alt ? feetToMeters(cmd.alt) : 0,
    heading: cmd.heading ?? 0,
    pitch: 0,
    roll: 0,
  });

  // Allegiance
  const side = cmd.side === 'red' ? Side.RED : cmd.side === 'neutral' ? Side.NEUTRAL : Side.BLUE;
  world.allegiance.set(idx, { side, iffCode: 0 });

  // Try to look up aircraft defaults
  const acDefaults = getAircraftDefaults(cmd.entityType);
  if (acDefaults) {
    // It's an aircraft type
    world.aircraft.set(idx, {
      fuel: acDefaults.fuelCapacity,
      fuelCapacity: acDefaults.fuelCapacity,
      fuelBurnRate: acDefaults.fuelBurnRate,
      maxSpeed: acDefaults.maxSpeed,
      cruiseSpeed: acDefaults.cruiseSpeed,
      ceiling: acDefaults.ceiling,
      rcs: acDefaults.rcs,
      throttle: 0.8,
      entityType: 1,
    });

    const speed = cmd.speed
      ? knotsToMps(cmd.speed)
      : acDefaults.cruiseSpeed;
    world.velocity.set(idx, { speed, climbRate: 0, turnRate: 0 });

    world.renderable.set(idx, {
      modelType: acDefaults.modelType,
      iconId: 0,
      colorR: side === Side.BLUE ? 0.27 : 1,
      colorG: side === Side.BLUE ? 0.53 : 0.27,
      colorB: side === Side.BLUE ? 1 : 0.27,
      visible: 1,
    });

    // Health (100 HP for all aircraft)
    world.health.set(idx, { maxHealth: 100, currentHealth: 100 });

    // Loadout — resolve alias to get defaults key
    const TYPE_ALIASES: Record<string, string> = {
      'FIGHTER': 'F-15C', 'BOMBER': 'B-2A', 'TANKER': 'KC-135', 'TRANSPORT': 'KC-135', 'AWACS': 'E-3',
    };
    const loadoutKey = TYPE_ALIASES[cmd.entityType.toUpperCase()] ?? cmd.entityType;
    const loadoutDef = LOADOUT_DEFAULTS[loadoutKey];
    if (loadoutDef) {
      // Check if this is a tanker with offloadable fuel
      const tankerDef = TANKER_DEFAULTS[loadoutKey];
      const offloadableFuel = tankerDef ? lbsToKg(tankerDef.offloadCapacityLbs) : -1;

      world.loadouts.set(idx, {
        primaryWeapon: loadoutDef.primaryWeapon,
        primaryAmmo: loadoutDef.primaryAmmo,
        primaryMax: loadoutDef.primaryAmmo,
        secondaryWeapon: loadoutDef.secondaryWeapon,
        secondaryAmmo: loadoutDef.secondaryAmmo,
        secondaryMax: loadoutDef.secondaryAmmo,
        externalFuelTanks: false,
        bayDoorsOpenUntil: 0,
        offloadableFuel,
        externalPods: [],
      });
    }
  } else if (cmd.entityType.toLowerCase() === 'base' || cmd.entityType.toLowerCase() === 'airbase') {
    // Base entity
    world.base.set(idx, {
      fuelTons: 50000,
      weaponsCount: 1000,
      runwayCount: 2,
      aircraftCapacity: 50,
      aircraftCount: 0,
    });
    world.renderable.set(idx, {
      modelType: ModelType.AIRBASE,
      iconId: 0,
      colorR: side === Side.BLUE ? 0.27 : 1,
      colorG: side === Side.BLUE ? 0.53 : 0.27,
      colorB: side === Side.BLUE ? 1 : 0.27,
      visible: 1,
    });
    // Initialize empty base inventory
    world.baseInventory.set(idx, {
      munitions: new Map(),
      assignedAircraft: new Set(),
    });
  } else if (cmd.entityType.toLowerCase() === 'radar' || cmd.entityType.toLowerCase() === 'radar_site') {
    // Radar site — optionally match specific radar type keyword after 'radar/'
    const radarKey = cmd.entityType.includes('/') ? cmd.entityType : 'AN/TPS-77';
    const radarParams = RADAR_DEFAULTS[radarKey] ?? RADAR_DEFAULTS['AN/TPS-77'];
    const maxRangeM = radarParams.maxRangeKm * 1000;

    world.radar.set(idx, {
      powerW: radarParams.powerW,
      gainDbi: radarParams.gainDbi,
      freqGhz: radarParams.freqGhz,
      mode: RadarMode.SEARCH,
      maxRangeM,
    });
    world.renderable.set(idx, {
      modelType: ModelType.RADAR_SITE,
      iconId: 0,
      colorR: side === Side.BLUE ? 0.27 : 1,
      colorG: side === Side.BLUE ? 0.53 : 0.27,
      colorB: side === Side.BLUE ? 1 : 0.27,
      visible: 1,
    });

    // Emit radar info for visualization
    world.emit({
      type: 'radar:entity_info',
      radarId: idx,
      lat: cmd.lat,
      lon: cmd.lon,
      maxRangeM,
      side,
    });
  } else if (cmd.entityType.toLowerCase() === 'sam' || cmd.entityType.toLowerCase() === 'sam_site' || SAM_DEFAULTS[cmd.entityType.toUpperCase()]) {
    // SAM site — has radar + SAM state
    const samKey = SAM_DEFAULTS[cmd.entityType.toUpperCase()] ? cmd.entityType.toUpperCase() : 'SA-10';
    const samDef = SAM_DEFAULTS[samKey];
    const radarParams = RADAR_DEFAULTS[samDef.radarKey] ?? RADAR_DEFAULTS['AN/TPS-77'];
    const maxRangeM = radarParams.maxRangeKm * 1000;

    world.radar.set(idx, {
      powerW: radarParams.powerW,
      gainDbi: radarParams.gainDbi,
      freqGhz: radarParams.freqGhz,
      mode: RadarMode.SEARCH,
      maxRangeM,
    });

    world.samStates.set(idx, {
      weaponKey: samDef.weaponKey,
      missilesRemaining: samDef.maxMissiles,
      maxMissiles: samDef.maxMissiles,
      reloadTimer: 0,
      reloadTimeSec: samDef.reloadTimeSec,
      minEngageAltM: samDef.minEngageAltM,
      engagedTargets: new Set(),
    });

    world.renderable.set(idx, {
      modelType: ModelType.SAM_SITE,
      iconId: 0,
      colorR: side === Side.BLUE ? 0.27 : 1,
      colorG: side === Side.BLUE ? 0.53 : 0.27,
      colorB: side === Side.BLUE ? 1 : 0.27,
      visible: 1,
    });

    world.emit({
      type: 'radar:entity_info',
      radarId: idx,
      lat: cmd.lat,
      lon: cmd.lon,
      maxRangeM,
      side,
    });
  } else {
    // Generic entity — just has position and renderable
    world.renderable.set(idx, {
      modelType: ModelType.FIGHTER,
      iconId: 0,
      colorR: 0.5, colorG: 0.5, colorB: 0.5,
      visible: 1,
    });

    if (cmd.speed) {
      world.velocity.set(idx, {
        speed: knotsToMps(cmd.speed),
        climbRate: 0,
        turnRate: 0,
      });
    }
  }

  // Use entity INDEX (not packed ID) as entityId in events so main thread can look up by buffer position
  world.emit({
    type: 'entity:spawned',
    entityId: idx,
    callsign: cmd.callsign,
    entityType: cmd.entityType,
  });

}
