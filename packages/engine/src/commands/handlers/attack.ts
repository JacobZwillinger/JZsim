import {
  type Command, entityIndex, bearing,
  Side, ModelType, getWeaponDefaults,
} from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type AttackCommand = Extract<Command, { type: 'ATTACK' }>;

export function handleAttack(cmd: AttackCommand, world: World): void {
  const shooterId = world.entities.resolve(cmd.callsign);
  if (shooterId === null) {
    world.emit({ type: 'command:error', command: 'ATTACK', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const targetCallsign = typeof cmd.target === 'string' ? cmd.target : null;
  if (!targetCallsign) {
    world.emit({ type: 'command:error', command: 'ATTACK', error: 'ATTACK requires a target callsign' });
    return;
  }

  const targetId = world.entities.resolve(targetCallsign);
  if (targetId === null) {
    world.emit({ type: 'command:error', command: 'ATTACK', error: `Unknown target: ${targetCallsign}` });
    return;
  }

  const shooterIdx = entityIndex(shooterId);
  const targetIdx = entityIndex(targetId);

  if (!world.position.has(targetIdx)) {
    world.emit({ type: 'command:error', command: 'ATTACK', error: `Target ${targetCallsign} has no position` });
    return;
  }

  // Check loadout — decrement ammo
  const loadout = world.loadouts.get(shooterIdx);
  let weaponKey = 'AIM-120';

  if (loadout) {
    if (loadout.primaryAmmo > 0) {
      weaponKey = loadout.primaryWeapon;
      loadout.primaryAmmo--;
    } else if (loadout.secondaryAmmo > 0) {
      weaponKey = loadout.secondaryWeapon;
      loadout.secondaryAmmo--;
    } else {
      world.emit({ type: 'command:error', command: 'ATTACK', error: `${cmd.callsign} out of ammo` });
      return;
    }
  }

  const wep = getWeaponDefaults(weaponKey);
  if (!wep) {
    world.emit({ type: 'command:error', command: 'ATTACK', error: `Unknown weapon: ${weaponKey}` });
    return;
  }

  // Spawn missile entity
  const missileCallsign = `MSL-${cmd.callsign}-${world.tickCount}`;
  const missileId = world.entities.allocate(missileCallsign);
  const mslIdx = entityIndex(missileId);

  // Copy shooter position
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

  // Notify ammo status
  if (loadout) {
    const totalAmmo = loadout.primaryAmmo + loadout.secondaryAmmo;
    if (totalAmmo === 0) {
      world.emit({ type: 'command:executed', command: 'ATTACK', success: true,
        message: `${cmd.callsign} launched ${weaponKey} at ${targetCallsign} — WINCHESTER (no ammo remaining)` });
      return;
    }
  }

  world.emit({
    type: 'command:executed', command: 'ATTACK', success: true,
    message: `${cmd.callsign} launched ${weaponKey} at ${targetCallsign}`,
  });
}
