import {
  approxDistance, bearing, entityIndex,
  Side, ModelType, getWeaponDefaults,
  METERS_PER_DEGREE_LAT,
} from '@jzsim/core';
import type { System } from './types.js';
import type { World } from '../ecs/world.js';
import type { SpatialGrid } from '../spatial/grid-index.js';
import { findCallsign } from '../util/callsign.js';

/**
 * SAM engagement system: auto-fires at enemy aircraft in range.
 *
 * Runs after RadarDetection. For each SAM site (has radar + samState):
 * 1. Tick reload timer
 * 2. Query spatial grid for aircraft in range
 * 3. Filter: enemy side only, not already engaged
 * 4. Fire missile at first valid target
 */
export class SamEngagementSystem implements System {
  private static readonly STAGGER_DIVISOR = 4;
  private readonly candidateBuffer: number[] = [];

  constructor(private readonly spatialGrid: SpatialGrid) {}

  update(world: World, dt: number): void {
    for (const [samIdx, samState] of world.samStates.entries()) {
      if (!world.position.has(samIdx)) continue;
      if (!world.radar.has(samIdx)) continue;

      // Stagger: each SAM checks every N ticks
      if (samIdx % SamEngagementSystem.STAGGER_DIVISOR !== world.tickCount % SamEngagementSystem.STAGGER_DIVISOR) continue;

      // Tick reload timer (compensate for stagger: only called 1/N ticks)
      if (samState.reloadTimer > 0) {
        samState.reloadTimer = Math.max(0, samState.reloadTimer - dt * SamEngagementSystem.STAGGER_DIVISOR);
        continue;
      }
      if (samState.missilesRemaining <= 0) continue;

      // Clean up engaged targets that no longer exist
      for (const tgt of samState.engagedTargets) {
        if (!world.position.has(tgt)) samState.engagedTargets.delete(tgt);
      }

      const samLat = world.position.get(samIdx, 'lat');
      const samLon = world.position.get(samIdx, 'lon');
      const maxRange = world.radar.get(samIdx, 'maxRangeM');
      const samSide = world.allegiance.has(samIdx) ? world.allegiance.get(samIdx, 'side') : 0;

      const maxRangeDeg = maxRange / METERS_PER_DEGREE_LAT;
      this.spatialGrid.queryRadius(samLat, samLon, maxRangeDeg, this.candidateBuffer);

      for (const tgtIdx of this.candidateBuffer) {
        if (!world.aircraft.has(tgtIdx)) continue;
        if (tgtIdx === samIdx) continue;
        if (samState.engagedTargets.has(tgtIdx)) continue;

        // Only fire at enemies
        const tgtSide = world.allegiance.has(tgtIdx) ? world.allegiance.get(tgtIdx, 'side') : 0;
        if (tgtSide === samSide || tgtSide === Side.NEUTRAL) continue;

        // Altitude floor check — SAMs can't track below minimum altitude (ground clutter)
        const tgtAlt = world.position.get(tgtIdx, 'alt');
        if (tgtAlt < samState.minEngageAltM) continue;

        // Range check
        const tgtLat = world.position.get(tgtIdx, 'lat');
        const tgtLon = world.position.get(tgtIdx, 'lon');
        const dist = approxDistance(samLat, samLon, tgtLat, tgtLon);
        if (dist > maxRange) continue;

        // FIRE
        this.launchMissile(world, samIdx, tgtIdx, samState);
        break; // one target per tick per SAM
      }
    }
  }

  private launchMissile(
    world: World,
    samIdx: number,
    tgtIdx: number,
    samState: { weaponKey: string; missilesRemaining: number; reloadTimer: number; reloadTimeSec: number; engagedTargets: Set<number> },
  ): void {
    const wep = getWeaponDefaults(samState.weaponKey);
    if (!wep) return;

    const samCallsign = findCallsign(world, samIdx, `SAM-${samIdx}`);

    const missileCallsign = `MSL-${samCallsign}-${world.tickCount}`;
    const missileId = world.entities.allocate(missileCallsign);
    const mslIdx = entityIndex(missileId);

    const samLat = world.position.get(samIdx, 'lat');
    const samLon = world.position.get(samIdx, 'lon');
    const tgtLat = world.position.get(tgtIdx, 'lat');
    const tgtLon = world.position.get(tgtIdx, 'lon');
    const hdg = bearing(samLat, samLon, tgtLat, tgtLon);

    world.position.set(mslIdx, { lat: samLat, lon: samLon, alt: 100, heading: hdg, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: wep.speed, climbRate: 20, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx: tgtIdx,
      shooterIdx: samIdx,
      weaponType: wep.weaponType,
      damage: wep.damage,
      hitProbability: wep.hitProbability,
      maxRange: wep.maxRange,
      flightTimeLeft: wep.flightTime,
      missileSpeed: wep.speed,
      prevLosAngle: hdg, // initialize PN with initial LOS angle
    });

    const samSide = world.allegiance.has(samIdx) ? world.allegiance.get(samIdx, 'side') : Side.BLUE;
    world.allegiance.set(mslIdx, { side: samSide, iffCode: 0 });
    world.renderable.set(mslIdx, {
      modelType: ModelType.MISSILE,
      iconId: 0,
      colorR: samSide === Side.BLUE ? 0.27 : 1,
      colorG: 0.27,
      colorB: samSide === Side.BLUE ? 1 : 0.27,
      visible: 1,
    });

    samState.missilesRemaining--;
    samState.reloadTimer = samState.reloadTimeSec;
    samState.engagedTargets.add(tgtIdx);

    // AAR: track muns expended (ensure SAM has an AAR entry)
    const samSideAAR = world.allegiance.has(samIdx) ? world.allegiance.get(samIdx, 'side') : 0;
    world.aar.getOrCreateEntity(samIdx, samCallsign, 'SAM', samSideAAR, '');
    world.aar.recordMunsExpended(samIdx, samState.weaponKey, 1);
    world.aar.enemiesEngaged++;

    world.emit({ type: 'weapon:launched', shooterId: samIdx, targetId: tgtIdx, weaponType: samState.weaponKey });
    world.emit({ type: 'entity:spawned', entityId: mslIdx, callsign: missileCallsign, entityType: 'missile' });
  }
}
