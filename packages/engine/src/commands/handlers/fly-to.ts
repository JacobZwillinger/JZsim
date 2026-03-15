import { type Command, entityIndex, bearing, knotsToMps, feetToMeters } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type FlyToCommand = Extract<Command, { type: 'FLY_TO' }>;

export function handleFlyTo(cmd: FlyToCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'FLY_TO', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const idx = entityIndex(id);

  // Compute bearing to target
  const lat = world.position.get(idx, 'lat');
  const lon = world.position.get(idx, 'lon');
  const hdg = bearing(lat, lon, cmd.lat, cmd.lon);
  world.position.fields.get('heading')![idx] = hdg;

  // Set speed if specified
  if (cmd.speed !== undefined) {
    const speedMps = knotsToMps(cmd.speed);
    world.velocity.set(idx, {
      speed: speedMps,
      climbRate: world.velocity.has(idx) ? world.velocity.get(idx, 'climbRate') : 0,
      turnRate: 0,
    });
  }

  // Set altitude if specified
  if (cmd.alt !== undefined) {
    const targetAlt = feetToMeters(cmd.alt);
    const currentAlt = world.position.get(idx, 'alt');
    const climbRate = targetAlt > currentAlt ? 15 : targetAlt < currentAlt ? -15 : 0; // ~3000 ft/min
    if (world.velocity.has(idx)) {
      world.velocity.fields.get('climbRate')![idx] = climbRate;
    }
  }

  world.emit({
    type: 'command:executed',
    command: 'FLY_TO',
    success: true,
    message: `${cmd.callsign} heading ${hdg.toFixed(0)}° to ${cmd.lat.toFixed(4)}, ${cmd.lon.toFixed(4)}`,
  });
}
