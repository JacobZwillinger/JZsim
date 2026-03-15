import { type Command, entityIndex, feetToMeters } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type SetAltCommand = Extract<Command, { type: 'SET_ALT' }>;

export function handleSetAlt(cmd: SetAltCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'SET_ALT', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const idx = entityIndex(id);
  const targetAlt = feetToMeters(cmd.alt);
  const currentAlt = world.position.get(idx, 'alt');
  const climbRate = targetAlt > currentAlt ? 15 : targetAlt < currentAlt ? -15 : 0;

  if (world.velocity.has(idx)) {
    world.velocity.fields.get('climbRate')![idx] = climbRate;
  }

  // Directly set altitude for now (simplified)
  world.position.fields.get('alt')![idx] = targetAlt;

  world.emit({
    type: 'command:executed',
    command: 'SET_ALT',
    success: true,
    message: `${cmd.callsign} altitude set to ${cmd.alt} ft`,
  });
}
