import { type Command, entityIndex, LOADOUT_DEFAULTS } from '@jzsim/core';
import type { World } from '../../ecs/world.js';
import { findCallsign } from '../../util/callsign.js';

type ArmCommand = Extract<Command, { type: 'ARM' }>;

export function handleArm(cmd: ArmCommand, world: World): void {
  // Find the aircraft
  const acId = world.entities.callsignMap.get(cmd.callsign.toUpperCase());
  if (acId === undefined) {
    world.emit({ type: 'command:error', command: 'ARM', error: `Aircraft "${cmd.callsign}" not found` });
    return;
  }
  const acIdx = entityIndex(acId);

  if (!world.aircraft.has(acIdx)) {
    world.emit({ type: 'command:error', command: 'ARM', error: `"${cmd.callsign}" is not an aircraft` });
    return;
  }

  // Find which base this aircraft is assigned to
  const baseIdx = world.baseInventory.findBaseForAircraft(acIdx);
  const baseInv = baseIdx >= 0 ? world.baseInventory.get(baseIdx) : undefined;

  if (cmd.weaponKey && cmd.count !== undefined) {
    // Specific weapon request
    armSpecific(world, acIdx, cmd.callsign, cmd.weaponKey, cmd.count, baseInv, baseIdx);
  } else {
    // Default loadout from aircraft type
    armDefault(world, acIdx, cmd.callsign, baseInv, baseIdx);
  }
}

function armSpecific(
  world: World, acIdx: number, callsign: string,
  weaponKey: string, count: number,
  baseInv: { munitions: Map<string, number> } | undefined,
  baseIdx: number,
): void {
  let actualCount = count;

  if (baseInv) {
    // Draw from base inventory
    const available = baseInv.munitions.get(weaponKey) ?? 0;
    if (available < count) {
      world.emit({ type: 'command:error', command: 'ARM', error: `${findCallsign(world, baseIdx)} has only ${available} ${weaponKey} (requested ${count})` });
      return;
    }
    baseInv.munitions.set(weaponKey, available - count);
    actualCount = count;
  }

  // Update aircraft loadout
  const loadout = world.loadouts.get(acIdx);
  if (loadout) {
    if (loadout.primaryWeapon === weaponKey) {
      loadout.primaryAmmo = Math.min(loadout.primaryMax, actualCount);
    } else if (loadout.secondaryWeapon === weaponKey) {
      loadout.secondaryAmmo = Math.min(loadout.secondaryMax, actualCount);
    } else {
      // Set as primary
      loadout.primaryWeapon = weaponKey;
      loadout.primaryAmmo = actualCount;
      loadout.primaryMax = actualCount;
    }
  } else {
    world.loadouts.set(acIdx, {
      primaryWeapon: weaponKey,
      primaryAmmo: actualCount,
      primaryMax: actualCount,
      secondaryWeapon: '',
      secondaryAmmo: 0,
      secondaryMax: 0,
      externalFuelTanks: false,
      bayDoorsOpenUntil: 0,
      offloadableFuel: -1,
      externalPods: [],
    });
  }

  world.emit({ type: 'muns:armed', callsign, weaponKey, count: actualCount });
  world.emit({
    type: 'command:executed',
    command: 'ARM',
    success: true,
    message: `${callsign} armed with ${actualCount}x ${weaponKey}`,
  });
}

function armDefault(
  world: World, acIdx: number, callsign: string,
  baseInv: { munitions: Map<string, number> } | undefined,
  baseIdx: number,
): void {
  // Resolve aircraft type to get default loadout
  const TYPE_ALIASES: Record<string, string> = {
    'FIGHTER': 'F-15C', 'BOMBER': 'B-2A', 'TANKER': 'KC-135', 'TRANSPORT': 'KC-135', 'AWACS': 'E-3',
  };

  // Try to find the aircraft type from the callsign map entity type
  let loadoutKey = '';
  for (const key of Object.keys(LOADOUT_DEFAULTS)) {
    if (loadoutKey) break;
    loadoutKey = key; // fallback to first
  }

  // Try to match from existing loadout
  const existingLoadout = world.loadouts.get(acIdx);
  if (existingLoadout) {
    // Re-arm to max using existing weapon types
    let primaryNeeded = existingLoadout.primaryMax - existingLoadout.primaryAmmo;
    let secondaryNeeded = existingLoadout.secondaryMax - existingLoadout.secondaryAmmo;

    if (baseInv) {
      // Draw from base
      const primaryAvail = baseInv.munitions.get(existingLoadout.primaryWeapon) ?? 0;
      const primaryTake = Math.min(primaryNeeded, primaryAvail);
      baseInv.munitions.set(existingLoadout.primaryWeapon, primaryAvail - primaryTake);
      existingLoadout.primaryAmmo += primaryTake;

      const secondaryAvail = baseInv.munitions.get(existingLoadout.secondaryWeapon) ?? 0;
      const secondaryTake = Math.min(secondaryNeeded, secondaryAvail);
      baseInv.munitions.set(existingLoadout.secondaryWeapon, secondaryAvail - secondaryTake);
      existingLoadout.secondaryAmmo += secondaryTake;

      primaryNeeded = primaryTake;
      secondaryNeeded = secondaryTake;
    } else {
      // Direct load to max
      existingLoadout.primaryAmmo = existingLoadout.primaryMax;
      existingLoadout.secondaryAmmo = existingLoadout.secondaryMax;
    }

    world.emit({ type: 'muns:armed', callsign, weaponKey: existingLoadout.primaryWeapon, count: existingLoadout.primaryAmmo });
    world.emit({
      type: 'command:executed',
      command: 'ARM',
      success: true,
      message: `${callsign} re-armed: ${existingLoadout.primaryAmmo}x ${existingLoadout.primaryWeapon}, ${existingLoadout.secondaryAmmo}x ${existingLoadout.secondaryWeapon}`,
    });
  } else {
    world.emit({ type: 'command:error', command: 'ARM', error: `${callsign} has no loadout to re-arm` });
  }
}
