import type { System } from './types.js';
import type { World } from '../ecs/world.js';
import { findCallsign } from '../util/callsign.js';

const FUEL_LOW_THRESHOLD = 0.20; // 20% fuel remaining

/**
 * Fuel system: burns fuel based on burn rate each tick.
 * Emits fuel:low at 20% and fuel:empty at 0%.
 */
export class FuelSystem implements System {
  update(world: World, dt: number): void {
    const acMask = world.aircraft.mask;
    const acStore = world.aircraft;
    const hwm = world.entities.highWaterMark;

    for (let i = 0; i < hwm; i++) {
      if (!acMask[i]) continue;

      const fuel = acStore.get(i, 'fuel');
      if (fuel <= 0) continue;

      const burnRate = acStore.get(i, 'fuelBurnRate');
      const speed = world.velocity.has(i) ? world.velocity.get(i, 'speed') : 0;

      // Only burn fuel if moving
      if (speed <= 0) continue;

      const fuelBurned = burnRate * dt;
      const newFuel = Math.max(0, fuel - fuelBurned);
      acStore.fields.get('fuel')![i] = newFuel;

      // AAR tracking
      const actualBurned = fuel - newFuel;
      if (actualBurned > 0) {
        if (!world.aar.getEntity(i)) {
          const cs = findCallsign(world, i);
          const side = world.allegiance.has(i) ? world.allegiance.get(i, 'side') : 0;
          const baseIdx = world.baseInventory.findBaseForAircraft(i);
          const baseCs = baseIdx >= 0 ? findCallsign(world, baseIdx) : '';
          world.aar.getOrCreateEntity(i, cs, '', side, baseCs);
        }
        world.aar.recordFuelUsed(i, actualBurned);
      }

      const capacity = acStore.get(i, 'fuelCapacity');
      const fuelPercent = capacity > 0 ? (newFuel / capacity) * 100 : 0;

      if (newFuel <= 0 && fuel > 0) {
        world.emit({ type: 'fuel:empty', entityId: i });
      } else if (fuelPercent <= FUEL_LOW_THRESHOLD * 100 && (fuel / capacity) > FUEL_LOW_THRESHOLD) {
        // Just crossed the low-fuel threshold
        world.emit({ type: 'fuel:low', entityId: i, fuelPercent });
      }
    }
  }
}
