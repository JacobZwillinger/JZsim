import { type Command, entityIndex, mpsToKnots, metersToFeet } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type StatusCommand = Extract<Command, { type: 'STATUS' }>;

export function handleStatus(cmd: StatusCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'STATUS', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const idx = entityIndex(id);
  const parts: string[] = [`=== ${cmd.callsign} ===`];

  if (world.position.has(idx)) {
    const lat = world.position.get(idx, 'lat');
    const lon = world.position.get(idx, 'lon');
    const alt = world.position.get(idx, 'alt');
    const hdg = world.position.get(idx, 'heading');
    parts.push(`Pos: ${lat.toFixed(4)}°, ${lon.toFixed(4)}° | Alt: ${metersToFeet(alt).toFixed(0)} ft | Hdg: ${hdg.toFixed(0)}°`);
  }

  if (world.velocity.has(idx)) {
    const speed = world.velocity.get(idx, 'speed');
    parts.push(`Speed: ${mpsToKnots(speed).toFixed(0)} kts`);
  }

  if (world.aircraft.has(idx)) {
    const fuel = world.aircraft.get(idx, 'fuel');
    const rcs = world.aircraft.get(idx, 'rcs');
    parts.push(`Fuel: ${fuel.toFixed(0)} kg | RCS: ${rcs} m²`);
  }

  if (world.allegiance.has(idx)) {
    const side = world.allegiance.get(idx, 'side');
    parts.push(`Side: ${side === 1 ? 'BLUE' : side === 2 ? 'RED' : 'NEUTRAL'}`);
  }

  world.emit({
    type: 'command:executed',
    command: 'STATUS',
    success: true,
    message: parts.join('\n'),
  });
}
