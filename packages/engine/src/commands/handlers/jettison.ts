import { type Command, entityIndex, POD_DEFAULTS } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type JettisonCommand = Extract<Command, { type: 'JETTISON' }>;

export function handleJettison(cmd: JettisonCommand, world: World): void {
  const podKey = cmd.podType.toUpperCase();

  const acId = world.entities.callsignMap.get(cmd.callsign.toUpperCase());
  if (acId === undefined) {
    world.emit({ type: 'command:error', command: 'JETTISON', error: `Aircraft "${cmd.callsign}" not found` });
    return;
  }
  const acIdx = entityIndex(acId);

  if (!world.aircraft.has(acIdx)) {
    world.emit({ type: 'command:error', command: 'JETTISON', error: `"${cmd.callsign}" is not an aircraft` });
    return;
  }

  const loadout = world.loadouts.get(acIdx);
  if (!loadout) {
    world.emit({ type: 'command:error', command: 'JETTISON', error: `"${cmd.callsign}" has no loadout` });
    return;
  }

  const idx = loadout.externalPods.indexOf(podKey);
  if (idx < 0) {
    world.emit({ type: 'command:error', command: 'JETTISON', error: `"${cmd.callsign}" does not have a ${podKey} pod equipped` });
    return;
  }

  loadout.externalPods.splice(idx, 1);

  const podDef = POD_DEFAULTS[podKey];
  world.emit({
    type: 'command:executed',
    command: 'JETTISON',
    success: true,
    message: `${cmd.callsign} jettisoned ${podKey}${podDef ? ` (-${podDef.rcsM2} m² RCS)` : ''}`,
  });
}
