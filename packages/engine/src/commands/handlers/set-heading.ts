import { type Command, entityIndex, normalizeHeading } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type SetHeadingCommand = Extract<Command, { type: 'SET_HEADING' }>;

export function handleSetHeading(cmd: SetHeadingCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'SET_HEADING', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const idx = entityIndex(id);
  world.position.fields.get('heading')![idx] = normalizeHeading(cmd.heading);

  world.emit({
    type: 'command:executed',
    command: 'SET_HEADING',
    success: true,
    message: `${cmd.callsign} heading set to ${cmd.heading}°`,
  });
}
