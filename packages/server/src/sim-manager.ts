import type { Command, SimEvent } from '@jzsim/core';
import {
  World,
  CommandBus,
  SpatialGrid,
  MovementSystem,
  FuelSystem,
  RadarDetectionSystem,
  SamEngagementSystem,
  FighterEngagementSystem,
  WeaponSystem,
  MissionSystem,
  HistoryStore,
} from '@jzsim/engine';
import type { System } from '@jzsim/engine';
import { parseCommand } from '@jzsim/command-parser';

/**
 * Headless simulation manager for the REST API server.
 *
 * Replicates the Simulation class's tick logic but without
 * postMessage or SharedArrayBuffer (which are Worker-only APIs).
 */
export class SimManager {
  readonly world: World;
  readonly commandBus: CommandBus;
  readonly history: HistoryStore;

  private readonly systems: System[];
  private readonly spatialGrid: SpatialGrid;
  private readonly BASE_DT = 1.0;
  private accumulator = 0;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastTickTime: number = 0;
  private eventListeners: Array<(events: SimEvent[]) => void> = [];

  /** Tracks entity type names from spawn events (index -> type name) */
  readonly entityTypeNames: Map<number, string> = new Map();

  constructor() {
    this.world = new World(32768);
    this.commandBus = new CommandBus();
    this.spatialGrid = new SpatialGrid(0.5, 128);
    this.history = new HistoryStore();

    this.systems = [
      new MissionSystem(this.world.missions),
      new MovementSystem(),
      new FuelSystem(),
      new RadarDetectionSystem(this.spatialGrid),
      new SamEngagementSystem(this.spatialGrid),
      new FighterEngagementSystem(this.spatialGrid),
      new WeaponSystem(),
    ];
  }

  /** Start the headless sim loop at 60Hz */
  start(): void {
    if (this.intervalId !== null) return;
    this.lastTickTime = Date.now();
    this.intervalId = setInterval(() => {
      const now = Date.now();
      const wallDtMs = now - this.lastTickTime;
      this.lastTickTime = now;
      this.tickHeadless(wallDtMs);
    }, 1000 / 60);
  }

  /** Stop the sim loop */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  get running(): boolean {
    return this.intervalId !== null;
  }

  private tickHeadless(wallDtMs: number): void {
    if (this.world.paused) return;

    const simDt = (wallDtMs / 1000) * this.world.timeMultiplier;
    this.accumulator += simDt;

    let steps = 0;
    const maxSteps = 10;

    while (this.accumulator >= this.BASE_DT && steps < maxSteps) {
      this.commandBus.processAll(this.world);
      this.spatialGrid.rebuild(this.world.position, this.world.entities.highWaterMark);

      for (const system of this.systems) {
        system.update(this.world, this.BASE_DT);
      }

      this.world.simTime += this.BASE_DT;
      this.world.tickCount++;
      this.accumulator -= this.BASE_DT;
      steps++;
    }

    // Drain events
    const events = this.world.drainEvents();
    if (events.length > 0) {
      // Track entity type names from spawn events
      for (const e of events) {
        if (e.type === 'entity:spawned') {
          const idx = e.entityId & 0xFFFFF; // entityIndex mask
          this.entityTypeNames.set(idx, e.entityType);
        }
      }

      // Store in history
      this.history.addEvents(events, this.world.simTime);

      // Notify listeners
      for (const listener of this.eventListeners) {
        listener(events);
      }
    }

    // Capture history snapshot
    this.history.onTick(this.world);
  }

  /** Parse and execute a text command */
  executeCommand(text: string): { success: boolean; error?: string } {
    try {
      const cmd = parseCommand(text);
      if (!cmd) {
        return { success: false, error: `Could not parse command: ${text}` };
      }
      this.commandBus.enqueue(cmd);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /** Execute a pre-built command object */
  executeCommandObj(cmd: Command): void {
    this.commandBus.enqueue(cmd);
  }

  /** Execute multiple commands in sequence */
  executeCommands(cmds: Command[]): void {
    for (const cmd of cmds) {
      this.commandBus.enqueue(cmd);
    }
  }

  pause(): void {
    this.world.paused = true;
  }

  resume(): void {
    this.world.paused = false;
  }

  setSpeed(multiplier: number): void {
    this.world.timeMultiplier = Math.max(0, Math.min(multiplier, 60));
  }

  /** Register an event listener, returns unsubscribe function */
  onEvents(listener: (events: SimEvent[]) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const idx = this.eventListeners.indexOf(listener);
      if (idx >= 0) this.eventListeners.splice(idx, 1);
    };
  }

  /** Force a single tick (useful for step-through debugging) */
  stepOnce(): void {
    this.commandBus.processAll(this.world);
    this.spatialGrid.rebuild(this.world.position, this.world.entities.highWaterMark);
    for (const system of this.systems) {
      system.update(this.world, this.BASE_DT);
    }
    this.world.simTime += this.BASE_DT;
    this.world.tickCount++;

    const events = this.world.drainEvents();
    if (events.length > 0) {
      for (const e of events) {
        if (e.type === 'entity:spawned') {
          const idx = e.entityId & 0xFFFFF;
          this.entityTypeNames.set(idx, e.entityType);
        }
      }
      this.history.addEvents(events, this.world.simTime);
      for (const listener of this.eventListeners) {
        listener(events);
      }
    }
    this.history.onTick(this.world);
  }
}
