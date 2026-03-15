import { approxDistance, bearing, normalizeHeading, headingDelta } from '@jzsim/core';
import type { System } from './types.js';
import type { World } from '../ecs/world.js';
import { findCallsign } from '../util/callsign.js';

const IMPACT_RADIUS_M = 50;     // proximity fuze detonation range (realistic)
const WEAPON_BASE_DAMAGE = 60;  // base HP per hit (scaled by per-weapon damage multiplier)
const PN_CONSTANT = 3;          // proportional navigation constant (typical 3-5)

/**
 * Weapon system: guides missiles toward targets and checks for impact.
 *
 * Each tick for entities with the weapon component:
 * 1. Decrement flight time — self-destruct if expired
 * 2. Check target still alive — self-destruct if not
 * 3. Update heading using proportional navigation (leads target)
 * 4. Check proximity for impact — roll per-weapon Pk, apply variable damage
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

      // Guidance: Proportional Navigation
      const mLat = world.position.get(i, 'lat');
      const mLon = world.position.get(i, 'lon');
      const tLat = world.position.get(targetIdx, 'lat');
      const tLon = world.position.get(targetIdx, 'lon');

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

      // Impact check
      const dist = approxDistance(mLat, mLon, tLat, tLon);
      if (dist <= IMPACT_RADIUS_M) {
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
    const side = world.allegiance.has(idx) ? world.allegiance.get(idx, 'side') : 0;
    // Side 0 = BLUE = friendly
    world.aar.recordLoss(idx, side === 0);

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
