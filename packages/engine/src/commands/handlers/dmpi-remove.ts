import type { Command } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

export function handleDmpiRemove(cmd: Extract<Command, { type: 'DMPI_REMOVE' }>, world: World): void {
  const { name } = cmd;

  if (!world.dmpis.has(name)) {
    world.emit({ type: 'command:error', command: 'DMPI REMOVE', error: `DMPI "${name}" not found` });
    return;
  }

  world.dmpis.remove(name);
  world.emit({ type: 'dmpi:removed', name });
  world.emit({
    type: 'command:executed',
    command: 'DMPI REMOVE',
    success: true,
    message: `DMPI "${name}" removed`,
  });
}
