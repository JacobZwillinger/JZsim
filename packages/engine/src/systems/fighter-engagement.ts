import {
  approxDistance, bearing, entityIndex,
  Side, ModelType, getWeaponDefaults,
  METERS_PER_DEGREE_LAT,
} from '@jzsim/core';
import type { System } from './types.js';
import type { World } from '../ecs/world.js';
import type { SpatialGrid } from '../spatial/grid-index.js';
import { findCallsign } from '../util/callsign.js';

const ENGAGE_RANGE_M = 150_000; // 150km auto-engage range
const WEAPON_RANGE_M = 100_000; // 100km — fire when within this range

/**
 * Fighter engagement system: auto-fires at nearby enemies when engaged.
 *
 * Aircraft with engageMode=1 (set via ENGAGE command) will:
 * 1. Scan for enemy aircraft within ENGAGE_RANGE_M
 * 2. Steer toward closest enemy
 * 3. Fire when within WEAPON_RANGE_M if ammo available
 *
 * Staggered: each fighter checks every 4 ticks.
 */
export class FighterEngagementSystem implements System {
  private readonly candidateBuffer: number[] = [];

  constructor(private readonly spatialGrid: SpatialGrid) {}

  update(world: World, dt: number): void {
    const hwm = world.entities.highWaterMark;

    for (let i = 0; i < hwm; i++) {
      if (!world.aircraft.has(i)) continue;
      if (!world.position.has(i)) continue;

      // Check engageMode flag
      const engageMode = world.aircraft.get(i, 'entityType'); // reuse entityType field: 2 = engaged
      if (engageMode !== 2) continue;

      // Stagger: each fighter checks every 4 ticks
      if (i % 4 !== world.tickCount % 4) continue;

      // Skip missiles
      if (world.weapon.has(i)) continue;

      const myLat = world.position.get(i, 'lat');
      const myLon = world.position.get(i, 'lon');
      const mySide = world.allegiance.has(i) ? world.allegiance.get(i, 'side') : 0;

      // Check ammo
      const loadout = world.loadouts.get(i);
      if (loadout && loadout.primaryAmmo <= 0 && loadout.secondaryAmmo <= 0) continue;

      // Find nearby enemies
      const rangeDeg = ENGAGE_RANGE_M / METERS_PER_DEGREE_LAT;
      this.spatialGrid.queryRadius(myLat, myLon, rangeDeg, this.candidateBuffer);

      let closestIdx = -1;
      let closestDist = Infinity;

      for (const tgtIdx of this.candidateBuffer) {
        if (tgtIdx === i) continue;
        if (!world.aircraft.has(tgtIdx)) continue;
        if (world.weapon.has(tgtIdx)) continue; // skip missiles

        const tgtSide = world.allegiance.has(tgtIdx) ? world.allegiance.get(tgtIdx, 'side') : 0;
        if (tgtSide === mySide || tgtSide === Side.NEUTRAL) continue;

        const tgtLat = world.position.get(tgtIdx, 'lat');
        const tgtLon = world.position.get(tgtIdx, 'lon');
        const dist = approxDistance(myLat, myLon, tgtLat, tgtLon);

        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = tgtIdx;
        }
      }

      if (closestIdx < 0) continue;

      // Steer toward closest enemy
      const tgtLat = world.position.get(closestIdx, 'lat');
      const tgtLon = world.position.get(closestIdx, 'lon');
      const hdg = bearing(myLat, myLon, tgtLat, tgtLon);
      world.position.fields.get('heading')![i] = hdg;

      // Fire if within weapon range
      if (closestDist <= WEAPON_RANGE_M && loadout && loadout.primaryAmmo > 0) {
        this.launchMissile(world, i, closestIdx, loadout);
      }
    }
  }

  private launchMissile(
    world: World,
    shooterIdx: number,
    targetIdx: number,
    loadout: import('../components/loadout.js').LoadoutEntry,
  ): void {
    const weaponKey = loadout.primaryAmmo > 0 ? loadout.primaryWeapon : loadout.secondaryWeapon;
    const wep = getWeaponDefaults(weaponKey);
    if (!wep) return;

    if (loadout.primaryAmmo > 0) {
      loadout.primaryAmmo--;
    } else {
      loadout.secondaryAmmo--;
    }

    // Bay doors open for stealth aircraft (5 second RCS spike)
    loadout.bayDoorsOpenUntil = world.simTime + 5;

    const shooterCallsign = findCallsign(world, shooterIdx, `FTR-${shooterIdx}`);

    // AAR: ensure entry exists and track muns expended
    const shooterSideAAR = world.allegiance.has(shooterIdx) ? world.allegiance.get(shooterIdx, 'side') : 0;
    world.aar.getOrCreateEntity(shooterIdx, shooterCallsign, '', shooterSideAAR, '');
    world.aar.recordMunsExpended(shooterIdx, weaponKey, 1);
    world.aar.enemiesEngaged++;

    const missileCallsign = `MSL-${shooterCallsign}-${world.tickCount}`;
    const missileId = world.entities.allocate(missileCallsign);
    const mslIdx = entityIndex(missileId);

    const sLat = world.position.get(shooterIdx, 'lat');
    const sLon = world.position.get(shooterIdx, 'lon');
    const sAlt = world.position.get(shooterIdx, 'alt');
    const tLat = world.position.get(targetIdx, 'lat');
    const tLon = world.position.get(targetIdx, 'lon');
    const hdg = bearing(sLat, sLon, tLat, tLon);

    world.position.set(mslIdx, { lat: sLat, lon: sLon, alt: sAlt, heading: hdg, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: wep.speed, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx,
      weaponType: wep.weaponType,
      damage: wep.damage,
      hitProbability: wep.hitProbability,
      maxRange: wep.maxRange,
      flightTimeLeft: wep.flightTime,
      missileSpeed: wep.speed,
      prevLosAngle: hdg, // initialize PN with initial LOS angle
    });

    const shooterSide = world.allegiance.has(shooterIdx) ? world.allegiance.get(shooterIdx, 'side') : Side.BLUE;
    world.allegiance.set(mslIdx, { side: shooterSide, iffCode: 0 });
    world.renderable.set(mslIdx, {
      modelType: ModelType.MISSILE,
      iconId: 0,
      colorR: shooterSide === Side.BLUE ? 0.27 : 1,
      colorG: 0.27,
      colorB: shooterSide === Side.BLUE ? 1 : 0.27,
      visible: 1,
    });

    world.emit({ type: 'weapon:launched', shooterId: shooterIdx, targetId: targetIdx, weaponType: weaponKey });
    world.emit({ type: 'entity:spawned', entityId: mslIdx, callsign: missileCallsign, entityType: 'missile' });
  }
}
