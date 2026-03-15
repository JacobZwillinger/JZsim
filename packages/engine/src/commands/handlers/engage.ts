import { type Command, entityIndex } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type EngageCommand = Extract<Command, { type: 'ENGAGE' }>;

/** Set a fighter's engagement mode to auto-attack nearby enemies. */
export function handleEngage(cmd: EngageCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'ENGAGE', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const idx = entityIndex(id);
  if (!world.aircraft.has(idx)) {
    world.emit({ type: 'command:error', command: 'ENGAGE', error: `${cmd.callsign} is not an aircraft` });
    return;
  }

  // Use entityType field as engageMode flag: 2 = engaged
  world.aircraft.fields.get('entityType')![idx] = 2;

  world.emit({
    type: 'command:executed', command: 'ENGAGE', success: true,
    message: `${cmd.callsign} weapons free — auto-engaging hostile targets`,
  });
}
