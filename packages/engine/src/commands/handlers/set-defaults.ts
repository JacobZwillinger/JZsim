import { type Command, AIRCRAFT_DEFAULTS } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type SetDefaultsCommand = Extract<Command, { type: 'SET_DEFAULTS' }>;

/**
 * Mutates the live AIRCRAFT_DEFAULTS object so that future SPAWN
 * commands pick up the new values.  This is intentionally mutable —
 * in-memory overrides only, lost on page reload.
 */
export function handleSetDefaults(cmd: SetDefaultsCommand, world: World): void {
  const def = (AIRCRAFT_DEFAULTS as Record<string, Record<string, unknown>>)[cmd.aircraftKey];
  if (!def) {
    world.emit({
      type: 'command:error',
      command: 'SET_DEFAULTS',
      error: `Unknown aircraft type "${cmd.aircraftKey}"`,
    });
    return;
  }

  if (!(cmd.field in def)) {
    world.emit({
      type: 'command:error',
      command: 'SET_DEFAULTS',
      error: `Unknown field "${cmd.field}" on ${cmd.aircraftKey}`,
    });
    return;
  }

  (def as Record<string, unknown>)[cmd.field] = cmd.value;

  world.emit({
    type: 'command:executed',
    command: 'SET_DEFAULTS',
    success: true,
    message: `${cmd.aircraftKey}.${cmd.field} = ${cmd.value}`,
  });
}
