import { type Command, entityIndex } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type DisengageCommand = Extract<Command, { type: 'DISENGAGE' }>;

/** Disable a fighter's auto-engagement mode. */
export function handleDisengage(cmd: DisengageCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'DISENGAGE', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const idx = entityIndex(id);
  if (!world.aircraft.has(idx)) {
    world.emit({ type: 'command:error', command: 'DISENGAGE', error: `${cmd.callsign} is not an aircraft` });
    return;
  }

  // Reset entityType field to normal (1 = aircraft)
  world.aircraft.fields.get('entityType')![idx] = 1;

  world.emit({
    type: 'command:executed', command: 'DISENGAGE', success: true,
    message: `${cmd.callsign} weapons hold — disengaging`,
  });
}
