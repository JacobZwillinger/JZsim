import type { Command } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

export function handleDmpiAdd(cmd: Extract<Command, { type: 'DMPI_ADD' }>, world: World): void {
  const { name, lat, lon, description } = cmd;

  if (!name || name.trim().length === 0) {
    world.emit({ type: 'command:error', command: 'DMPI ADD', error: 'DMPI name is required' });
    return;
  }

  if (world.dmpis.has(name)) {
    world.emit({ type: 'command:error', command: 'DMPI ADD', error: `DMPI "${name}" already exists` });
    return;
  }

  if (isNaN(lat) || isNaN(lon)) {
    world.emit({ type: 'command:error', command: 'DMPI ADD', error: 'Invalid coordinates' });
    return;
  }

  world.dmpis.add({ name, lat, lon, description });
  world.emit({ type: 'dmpi:added', name, lat, lon, description });
  world.emit({
    type: 'command:executed',
    command: 'DMPI ADD',
    success: true,
    message: `DMPI "${name}" added at ${lat.toFixed(2)}, ${lon.toFixed(2)}${description ? ` — ${description}` : ''}`,
  });
}
