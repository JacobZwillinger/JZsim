import { type Command, entityIndex, knotsToMps } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type SetSpeedCommand = Extract<Command, { type: 'SET_SPEED' }>;

export function handleSetSpeed(cmd: SetSpeedCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'SET_SPEED', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const idx = entityIndex(id);
  const speedMps = knotsToMps(cmd.speed);

  if (world.velocity.has(idx)) {
    world.velocity.fields.get('speed')![idx] = speedMps;
  } else {
    world.velocity.set(idx, { speed: speedMps, climbRate: 0, turnRate: 0 });
  }

  world.emit({
    type: 'command:executed',
    command: 'SET_SPEED',
    success: true,
    message: `${cmd.callsign} speed set to ${cmd.speed} kts`,
  });
}
