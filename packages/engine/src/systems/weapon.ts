import { approxDistance, bearing, normalizeHeading, headingDelta, destinationPoint, DEG_TO_RAD, Side } from '@jzsim/core';
import type { System } from './types.js';
import type { World } from '../ecs/world.js';
import { findCallsign } from '../util/callsign.js';

const IMPACT_RADIUS_M = 50;     // proximity fuze detonation range (realistic)
const WEAPON_BASE_DAMAGE = 60;  // base HP per hit (scaled by per-weapon damage multiplier)
const PN_CONSTANT = 3;          // proportional navigation constant (typical 3-5)
const M_PER_DEG_LAT = 111_320;  // meters per degree of latitude

/**
 * Closest distance from a point to a line segment, in meters.
 * All inputs in lat/lon degrees; uses flat-earth approximation (fine at <100km scales).
 */
function segmentPointDistanceM(
  p0Lat: number, p0Lon: number,  // segment start
  p1Lat: number, p1Lon: number,  // segment end
  tLat: number, tLon: number,    // target point
): number {
  const cosLat = Math.cos(tLat * DEG_TO_RAD);
  // Convert to local meters relative to target
  const dx = (p1Lon - p0Lon) * M_PER_DEG_LAT * cosLat;
  const dy = (p1Lat - p0Lat) * M_PER_DEG_LAT;
  const tx = (tLon - p0Lon) * M_PER_DEG_LAT * cosLat;
  const ty = (tLat - p0Lat) * M_PER_DEG_LAT;

  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    // Zero-length segment — just return point distance
    return Math.sqrt(tx * tx + ty * ty);
  }

  // Project target onto segment, clamped to [0,1]
  const t = Math.max(0, Math.min(1, (tx * dx + ty * dy) / lenSq));
  const closestX = t * dx;
  const closestY = t * dy;
  const ex = tx - closestX;
  const ey = ty - closestY;
  return Math.sqrt(ex * ex + ey * ey);
}

/**
 * Weapon system: guides missiles toward targets and checks for impact.
 *
 * Each tick for entities with the weapon component:
 * 1. Decrement flight time — self-destruct if expired
 * 2. Check target still alive — self-destruct if not
 * 3. Update heading using proportional navigation (leads target)
 * 4. Check proximity for impact using swept-segment closest-approach
 *    (prevents high-speed missiles from overshooting the 50m proximity fuze)
 */
export class WeaponSystem implements System {
  update(world: World, dt: number): void {
    const wepMask = world.weapon.mask;
    const hwm = world.entities.highWaterMark;

    for (let i = 0; i < hwm; i++) {
      if (!wepMask[i]) continue;

      // Decrement flight time
      const ttl = world.weapon.get(i, 'flightTimeLeft') - dt;
      world.weapon.fields.get('flightTimeLeft')![i] = ttl;

      if (ttl <= 0) {
        this.destroyMissile(world, i);
        continue;
      }

      const targetIdx = world.weapon.get(i, 'targetIdx');

      // Target already gone?
      if (!world.position.has(targetIdx)) {
        this.destroyMissile(world, i);
        continue;
      }

      // Current positions (post-movement — MovementSystem already ran)
      const mLat = world.position.get(i, 'lat');
      const mLon = world.position.get(i, 'lon');
      const tLat = world.position.get(targetIdx, 'lat');
      const tLon = world.position.get(targetIdx, 'lon');

      // Guidance: Proportional Navigation
      const losAngle = bearing(mLat, mLon, tLat, tLon);
      const prevLos = world.weapon.get(i, 'prevLosAngle');

      if (prevLos !== 0) {
        // PN guidance: steer proportional to line-of-sight rate
        const losRate = headingDelta(prevLos, losAngle) / dt; // deg/s
        const correction = PN_CONSTANT * losRate * dt;
        const currentHeading = world.position.get(i, 'heading');
        const newHeading = normalizeHeading(currentHeading + correction);
        world.position.fields.get('heading')![i] = newHeading;
      } else {
        // First tick: pure pursuit to initialize
        world.position.fields.get('heading')![i] = losAngle;
      }

      // Store current LOS for next tick
      world.weapon.fields.get('prevLosAngle')![i] = losAngle;

      // Impact check: swept-segment closest-approach
      // Compute where the missile was BEFORE this tick's movement
      const speed = world.velocity.has(i) ? world.velocity.get(i, 'speed') : 0;
      const heading = world.position.get(i, 'heading');
      const travelM = speed * dt;

      let closestDist: number;
      if (travelM > IMPACT_RADIUS_M) {
        // High-speed: check the entire travel segment for closest approach
        // Reverse the movement to get previous position
        const [prevLat, prevLon] = destinationPoint(mLat, mLon, travelM, normalizeHeading(heading + 180));
        closestDist = segmentPointDistanceM(prevLat, prevLon, mLat, mLon, tLat, tLon);
      } else {
        // Low-speed: simple point check is sufficient
        closestDist = approxDistance(mLat, mLon, tLat, tLon);
      }

      if (closestDist <= IMPACT_RADIUS_M) {
        const hitProb = world.weapon.get(i, 'hitProbability');
        const hit = Math.random() < hitProb;

        world.emit({
          type: 'weapon:impact',
          weaponId: i,
          targetId: targetIdx,
          hit,
        });

        if (hit) {
          // AAR: record kill for shooter
          const shooterIdx = world.weapon.get(i, 'shooterIdx');
          if (shooterIdx >= 0) {
            world.aar.recordKill(shooterIdx);
          }
          const damageMult = world.weapon.get(i, 'damage');
          this.applyDamage(world, targetIdx, WEAPON_BASE_DAMAGE * damageMult);
        }

        this.destroyMissile(world, i);
      }
    }
  }

  /** Apply partial damage to a target. Destroy if health drops to 0. */
  private applyDamage(world: World, idx: number, damage: number): void {
    if (!world.health.has(idx)) {
      // No health component — instant kill (legacy behavior)
      this.destroyTarget(world, idx);
      return;
    }

    const hp = world.health.get(idx, 'currentHealth') - damage;
    world.health.fields.get('currentHealth')![idx] = Math.max(0, hp);

    const callsign = findCallsign(world, idx);
    const maxHp = world.health.get(idx, 'maxHealth');
    const pct = Math.max(0, hp / maxHp * 100);

    if (hp <= 0) {
      this.destroyTarget(world, idx);
    } else {
      world.emit({
        type: 'entity:damaged',
        entityId: idx,
        callsign,
        healthPercent: pct,
      });
    }
  }

  private destroyTarget(world: World, idx: number): void {
    const callsign = findCallsign(world, idx);
    const side = world.allegiance.has(idx) ? world.allegiance.get(idx, 'side') : Side.BLUE;
    world.aar.recordLoss(idx, side === Side.BLUE);

    world.emit({
      type: 'entity:destroyed',
      entityId: idx,
      callsign,
      reason: 'missile impact',
    });

    world.removeEntity(idx);
    world.entities.freeByIndex(idx);
  }

  private destroyMissile(world: World, idx: number): void {
    world.removeEntity(idx);
    world.entities.freeByIndex(idx);
  }
}
