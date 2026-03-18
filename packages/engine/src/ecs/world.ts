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
  type SimEvent,
} from '@jzsim/core';
import { ComponentStore } from './component-store.js';
import { EntityAllocator } from './entity.js';
import { MissionStore } from '../components/mission.js';
import { SamStateStore } from '../components/sam-state.js';
import { LoadoutStore } from '../components/loadout.js';
import { BaseInventoryStore } from '../components/base-inventory.js';
import { AARStore } from '../components/aar.js';
import { DMPIStore } from '../components/dmpi-store.js';
import { StrikeStore } from '../components/strike-store.js';

/** Default initial capacity — grows automatically as needed */
const DEFAULT_INITIAL_CAPACITY = 4096;

/**
 * The World holds all ECS state: entity allocator, component stores,
 * simulation clock, and event queue.
 *
 * All stores auto-grow when entity count exceeds capacity.
 */
export class World {
  readonly entities: EntityAllocator;

  // Component stores (SoA) — auto-grow via onGrow callback
  readonly position: ComponentStore<PositionFields>;
  readonly velocity: ComponentStore<VelocityFields>;
  readonly aircraft: ComponentStore<AircraftFields>;
  readonly radar: ComponentStore<RadarFields>;
  readonly base: ComponentStore<BaseFields>;
  readonly allegiance: ComponentStore<AllegianceFields>;
  readonly renderable: ComponentStore<RenderableFields>;
  readonly weapon: ComponentStore<WeaponFields>;
  readonly health: ComponentStore<HealthFields>;

  // Variable-length stores (Map-based, no capacity limit)
  readonly missions: MissionStore;
  readonly samStates: SamStateStore;
  readonly loadouts: LoadoutStore;
  readonly baseInventory: BaseInventoryStore;
  readonly aar: AARStore;
  readonly dmpis: DMPIStore;
  readonly strikes: StrikeStore;

  // Simulation clock
  simTime: number = 0;    // seconds since scenario start
  tickCount: number = 0;
  timeMultiplier: number = 1.0;
  paused: boolean = false;

  // Radar contacts: radarEntityIndex → detected target indices
  // Populated by RadarDetectionSystem, consumed by engagement systems, cleared each tick
  radarContacts: Map<number, number[]> = new Map();

  // Event queue (flushed each tick)
  private eventQueue: SimEvent[] = [];

  constructor(initialCapacity: number = DEFAULT_INITIAL_CAPACITY) {
    this.entities = new EntityAllocator(initialCapacity);
    this.position = new ComponentStore<PositionFields>(POSITION_FIELD_NAMES, initialCapacity);
    this.velocity = new ComponentStore<VelocityFields>(VELOCITY_FIELD_NAMES, initialCapacity);
    this.aircraft = new ComponentStore<AircraftFields>(AIRCRAFT_FIELD_NAMES, initialCapacity);
    this.radar = new ComponentStore<RadarFields>(RADAR_FIELD_NAMES, initialCapacity);
    this.base = new ComponentStore<BaseFields>(BASE_FIELD_NAMES, initialCapacity);
    this.allegiance = new ComponentStore<AllegianceFields>(ALLEGIANCE_FIELD_NAMES, initialCapacity);
    this.renderable = new ComponentStore<RenderableFields>(RENDERABLE_FIELD_NAMES, initialCapacity);
    this.weapon = new ComponentStore<WeaponFields>(WEAPON_FIELD_NAMES, initialCapacity);
    this.health = new ComponentStore<HealthFields>(HEALTH_FIELD_NAMES, initialCapacity);
    this.missions = new MissionStore();
    this.samStates = new SamStateStore();
    this.loadouts = new LoadoutStore();
    this.baseInventory = new BaseInventoryStore();
    this.aar = new AARStore();
    this.dmpis = new DMPIStore();
    this.strikes = new StrikeStore();

    // Wire up auto-growth: when entity allocator grows, grow all component stores
    this.entities.onGrow = (newCapacity: number) => {
      this.position.grow(newCapacity);
      this.velocity.grow(newCapacity);
      this.aircraft.grow(newCapacity);
      this.radar.grow(newCapacity);
      this.base.grow(newCapacity);
      this.allegiance.grow(newCapacity);
      this.renderable.grow(newCapacity);
      this.weapon.grow(newCapacity);
      this.health.grow(newCapacity);
    };
  }

  emit(event: SimEvent): void {
    this.eventQueue.push(event);
  }

  drainEvents(): SimEvent[] {
    const events = this.eventQueue;
    this.eventQueue = [];
    return events;
  }

  /** Reset the entire world to initial empty state */
  reset(): void {
    // Clear all component stores
    this.position.clear();
    this.velocity.clear();
    this.aircraft.clear();
    this.radar.clear();
    this.base.clear();
    this.allegiance.clear();
    this.renderable.clear();
    this.weapon.clear();
    this.health.clear();
    this.missions.clear();
    this.samStates.clear();
    this.loadouts.clear();
    this.baseInventory.clear();
    this.aar.reset();
    this.dmpis.clear();
    this.strikes.clear();
    this.entities.reset();

    // Reset clock
    this.simTime = 0;
    this.tickCount = 0;
    this.timeMultiplier = 1.0;
    this.paused = false;

    // Clear radar contacts
    this.radarContacts.clear();

    // Drain any pending events
    this.eventQueue = [];
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
    this.strikes.delete(entityIndex);
  }
}
