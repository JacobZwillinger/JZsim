import { type Command, entityIndex } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type RemoveCommand = Extract<Command, { type: 'REMOVE' }>;

export function handleRemove(cmd: RemoveCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'REMOVE', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const idx = entityIndex(id);
  world.removeEntity(idx);
  world.entities.free(id);

  world.emit({
    type: 'entity:removed',
    entityId: idx,
    callsign: cmd.callsign,
  });
  world.emit({
    type: 'command:executed',
    command: 'REMOVE',
    success: true,
    message: `Removed "${cmd.callsign}"`,
  });
}
