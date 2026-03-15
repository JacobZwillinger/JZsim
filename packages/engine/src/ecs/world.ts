import {
  PositionFields, POSITION_FIELD_NAMES,
  VelocityFields, VELOCITY_FIELD_NAMES,
  AircraftFields, AIRCRAFT_FIELD_NAMES,
  RadarFields, RADAR_FIELD_NAMES,
  BaseFields, BASE_FIELD_NAMES,
  AllegianceFields, ALLEGIANCE_FIELD_NAMES,
  RenderableFields, RENDERABLE_FIELD_NAMES,
  WeaponFields, WEAPON_FIELD_NAMES,
  HealthFields, HEALTH_FIELD_NAMES,
  MAX_ENTITIES,
  type SimEvent,
} from '@jzsim/core';
import { ComponentStore } from './component-store.js';
import { EntityAllocator } from './entity.js';
import { MissionStore } from '../components/mission.js';
import { SamStateStore } from '../components/sam-state.js';
import { LoadoutStore } from '../components/loadout.js';
import { BaseInventoryStore } from '../components/base-inventory.js';
import { AARStore } from '../components/aar.js';

/**
 * The World holds all ECS state: entity allocator, component stores,
 * simulation clock, and event queue.
 */
export class World {
  readonly entities: EntityAllocator;

  // Component stores (SoA)
  readonly position: ComponentStore<PositionFields>;
  readonly velocity: ComponentStore<VelocityFields>;
  readonly aircraft: ComponentStore<AircraftFields>;
  readonly radar: ComponentStore<RadarFields>;
  readonly base: ComponentStore<BaseFields>;
  readonly allegiance: ComponentStore<AllegianceFields>;
  readonly renderable: ComponentStore<RenderableFields>;
  readonly weapon: ComponentStore<WeaponFields>;
  readonly health: ComponentStore<HealthFields>;

  // Variable-length stores
  readonly missions: MissionStore;
  readonly samStates: SamStateStore;
  readonly loadouts: LoadoutStore;
  readonly baseInventory: BaseInventoryStore;
  readonly aar: AARStore;

  // Simulation clock
  simTime: number = 0;    // seconds since scenario start
  tickCount: number = 0;
  timeMultiplier: number = 1.0;
  paused: boolean = false;

  // Event queue (flushed each tick)
  private eventQueue: SimEvent[] = [];

  constructor(capacity: number = MAX_ENTITIES) {
    this.entities = new EntityAllocator(capacity);
    this.position = new ComponentStore<PositionFields>(POSITION_FIELD_NAMES, capacity);
    this.velocity = new ComponentStore<VelocityFields>(VELOCITY_FIELD_NAMES, capacity);
    this.aircraft = new ComponentStore<AircraftFields>(AIRCRAFT_FIELD_NAMES, capacity);
    this.radar = new ComponentStore<RadarFields>(RADAR_FIELD_NAMES, capacity);
    this.base = new ComponentStore<BaseFields>(BASE_FIELD_NAMES, capacity);
    this.allegiance = new ComponentStore<AllegianceFields>(ALLEGIANCE_FIELD_NAMES, capacity);
    this.renderable = new ComponentStore<RenderableFields>(RENDERABLE_FIELD_NAMES, capacity);
    this.weapon = new ComponentStore<WeaponFields>(WEAPON_FIELD_NAMES, capacity);
    this.health = new ComponentStore<HealthFields>(HEALTH_FIELD_NAMES, capacity);
    this.missions = new MissionStore();
    this.samStates = new SamStateStore();
    this.loadouts = new LoadoutStore();
    this.baseInventory = new BaseInventoryStore();
    this.aar = new AARStore();
  }

  emit(event: SimEvent): void {
    this.eventQueue.push(event);
  }

  drainEvents(): SimEvent[] {
    const events = this.eventQueue;
    this.eventQueue = [];
    return events;
  }

  /** Remove all components for an entity */
  removeEntity(entityIndex: number): void {
    this.position.remove(entityIndex);
    this.velocity.remove(entityIndex);
    this.aircraft.remove(entityIndex);
    this.radar.remove(entityIndex);
    this.base.remove(entityIndex);
    this.allegiance.remove(entityIndex);
    this.renderable.remove(entityIndex);
    this.weapon.remove(entityIndex);
    this.health.remove(entityIndex);
    this.missions.delete(entityIndex);
    this.samStates.delete(entityIndex);
    this.loadouts.delete(entityIndex);
    this.baseInventory.delete(entityIndex);
    this.baseInventory.unassignAircraft(entityIndex);
  }
}
