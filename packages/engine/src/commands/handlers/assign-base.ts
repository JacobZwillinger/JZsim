import { type Command, entityIndex } from '@jzsim/core';
import type { World } from '../../ecs/world.js';
import { findCallsign, findBaseByCallsign } from '../../util/callsign.js';

type AssignBaseCommand = Extract<Command, { type: 'ASSIGN_BASE' }>;

export function handleAssignBase(cmd: AssignBaseCommand, world: World): void {
  // Find the aircraft
  const acId = world.entities.callsignMap.get(cmd.callsign.toUpperCase());
  if (acId === undefined) {
    world.emit({ type: 'command:error', command: 'ASSIGN_BASE', error: `Aircraft "${cmd.callsign}" not found` });
    return;
  }
  const acIdx = entityIndex(acId);

  if (!world.aircraft.has(acIdx)) {
    world.emit({ type: 'command:error', command: 'ASSIGN_BASE', error: `"${cmd.callsign}" is not an aircraft` });
    return;
  }

  // Find the base
  const baseIdx = findBaseByCallsign(world, cmd.base);
  if (baseIdx < 0) {
    world.emit({ type: 'command:error', command: 'ASSIGN_BASE', error: `Base "${cmd.base}" not found` });
    return;
  }

  const baseInv = world.baseInventory.get(baseIdx);
  if (!baseInv) {
    world.emit({ type: 'command:error', command: 'ASSIGN_BASE', error: `Base "${cmd.base}" has no inventory` });
    return;
  }

  // Unassign from previous base if any
  world.baseInventory.unassignAircraft(acIdx);

  // Assign to new base
  baseInv.assignedAircraft.add(acIdx);

  // Update mission homeBase fields if mission exists
  const mission = world.missions.get(acIdx);
  if (mission) {
    mission.homeBaseLat = world.position.get(baseIdx, 'lat');
    mission.homeBaseLon = world.position.get(baseIdx, 'lon');
    mission.homeBaseCallsign = cmd.base.toUpperCase();
  }

  const baseCallsign = findCallsign(world, baseIdx);
  world.emit({
    type: 'command:executed',
    command: 'ASSIGN_BASE',
    success: true,
    message: `${cmd.callsign} assigned to ${baseCallsign}`,
  });
}
