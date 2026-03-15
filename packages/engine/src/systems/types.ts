import type { World } from '../ecs/world.js';

export interface System {
  update(world: World, dt: number): void;
}
