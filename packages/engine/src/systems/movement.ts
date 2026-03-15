import { destinationPoint, normalizeHeading, headingDelta, DEG_TO_RAD } from '@jzsim/core';
import type { System } from './types.js';
import type { World } from '../ecs/world.js';

/**
 * Movement system: integrates position from velocity each tick.
 *
 * For each entity with both Position and Velocity:
 * 1. Apply turn rate to heading
 * 2. Apply climb rate to altitude
 * 3. Move forward by speed * dt along current heading
 */
export class MovementSystem implements System {
  update(world: World, dt: number): void {
    const posMask = world.position.mask;
    const velMask = world.velocity.mask;
    const posStore = world.position;
    const velStore = world.velocity;
    const hwm = world.entities.highWaterMark;

    for (let i = 0; i < hwm; i++) {
      if (!posMask[i] || !velMask[i]) continue;

      const speed = velStore.get(i, 'speed');
      const climbRate = velStore.get(i, 'climbRate');
      const turnRate = velStore.get(i, 'turnRate');

      // Apply turn rate
      if (turnRate !== 0) {
        const heading = normalizeHeading(posStore.get(i, 'heading') + turnRate * dt);
        posStore.fields.get('heading')![i] = heading;
      }

      // Apply climb rate
      if (climbRate !== 0) {
        const alt = posStore.get(i, 'alt') + climbRate * dt;
        posStore.fields.get('alt')![i] = Math.max(0, alt);
      }

      // Move forward along heading
      if (speed > 0) {
        const lat = posStore.get(i, 'lat');
        const lon = posStore.get(i, 'lon');
        const heading = posStore.get(i, 'heading');
        const distanceM = speed * dt;

        const [newLat, newLon] = destinationPoint(lat, lon, distanceM, heading);
        posStore.fields.get('lat')![i] = newLat;
        posStore.fields.get('lon')![i] = newLon;
      }
    }
  }
}
