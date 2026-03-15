import type { Command } from '@jzsim/core';
import { World } from './ecs/world.js';
import { CommandBus } from './commands/command-bus.js';
import { MovementSystem } from './systems/movement.js';
import { FuelSystem } from './systems/fuel.js';
import { RadarDetectionSystem } from './systems/radar-detection.js';
import { SamEngagementSystem } from './systems/sam-engagement.js';
import { WeaponSystem } from './systems/weapon.js';
import { FighterEngagementSystem } from './systems/fighter-engagement.js';
import { MissionSystem } from './systems/mission.js';
import { SpatialGrid } from './spatial/grid-index.js';
import type { System } from './systems/types.js';
import { syncWorldToBuffer, BUFFER_SIZE, type WorkerMessage } from './worker-bridge.js';

/**
 * Main simulation controller.
 *
 * Fixed timestep of 1 second with accumulator pattern.
 * Supports pause/resume and time multiplier for fast-forward.
 */
export class Simulation {
  readonly world: World;
  readonly commandBus: CommandBus;
  private readonly systems: System[];
  private readonly spatialGrid: SpatialGrid;

  private readonly BASE_DT = 1.0; // 1 second fixed timestep
  private accumulator = 0;
  private sharedBuffer: Float64Array | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastTickTime: number = 0;

  constructor() {
    this.world = new World(32768); // Support up to 32k entities
    this.commandBus = new CommandBus();
    this.spatialGrid = new SpatialGrid(0.5, 128);

    this.systems = [
      new MissionSystem(this.world.missions),   // 1. Mission state machine (steers, transitions)
      new MovementSystem(),                      // 2. Integrate position from velocity
      new FuelSystem(),                          // 3. Burn fuel
      new RadarDetectionSystem(this.spatialGrid), // 4. Radar detection (after spatial grid rebuild)
      new SamEngagementSystem(this.spatialGrid),  // 5. SAM auto-engagement
      new FighterEngagementSystem(this.spatialGrid), // 6. Fighter auto-engagement
      new WeaponSystem(),                         // 7. Weapon guidance + impact
    ];
  }

  setSharedBuffer(sab: SharedArrayBuffer): void {
    this.sharedBuffer = new Float64Array(sab);
  }

  enqueueCommand(command: Command): void {
    this.commandBus.enqueue(command);
  }

  /** Start the simulation loop */
  start(): void {
    this.lastTickTime = performance.now();

    // Run at 60Hz wall clock, but sim steps at fixed 1s intervals
    this.intervalId = setInterval(() => {
      const now = performance.now();
      const wallDtMs = now - this.lastTickTime;
      this.lastTickTime = now;
      this.tick(wallDtMs);
    }, 1000 / 60);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(wallDtMs: number): void {
    if (this.world.paused) {
      // Still sync buffer so UI shows current state
      if (this.sharedBuffer) syncWorldToBuffer(this.world, this.sharedBuffer);
      return;
    }

    const simDt = (wallDtMs / 1000) * this.world.timeMultiplier;
    this.accumulator += simDt;

    let steps = 0;
    const maxSteps = 10; // Prevent spiral of death
    const tickStart = performance.now();

    while (this.accumulator >= this.BASE_DT && steps < maxSteps) {
      // Process queued commands
      this.commandBus.processAll(this.world);

      // Rebuild spatial grid
      this.spatialGrid.rebuild(this.world.position, this.world.entities.highWaterMark);

      // Run all systems
      for (const system of this.systems) {
        system.update(this.world, this.BASE_DT);
      }

      this.world.simTime += this.BASE_DT;
      this.world.tickCount++;
      this.accumulator -= this.BASE_DT;
      steps++;
    }

    // Sync to shared buffer for renderer
    if (this.sharedBuffer) {
      syncWorldToBuffer(this.world, this.sharedBuffer);
    }

    // Flush events to main thread
    const events = this.world.drainEvents();
    if (events.length > 0) {
      postMessage({ type: 'events', events } satisfies WorkerMessage);
    }

    // Send AAR snapshot every 30 ticks
    if (this.world.tickCount % 30 === 0) {
      postMessage({ type: 'aar_update', data: this.world.aar.snapshot() } satisfies WorkerMessage);
    }

    // Send tick stats periodically
    if (this.world.tickCount % 10 === 0) {
      const tickMs = performance.now() - tickStart;
      postMessage({
        type: 'tick_stats',
        simTime: this.world.simTime,
        tickCount: this.world.tickCount,
        entityCount: this.world.entities.activeCount,
        tickMs,
      } satisfies WorkerMessage);
    }
  }
}
