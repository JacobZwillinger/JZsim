import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../ecs/world.js';
import { MovementSystem } from '../systems/movement.js';
import { FuelSystem } from '../systems/fuel.js';
import { RadarDetectionSystem } from '../systems/radar-detection.js';
import { SamEngagementSystem } from '../systems/sam-engagement.js';
import { FighterEngagementSystem } from '../systems/fighter-engagement.js';
import { WeaponSystem } from '../systems/weapon.js';
import { MissionSystem } from '../systems/mission.js';
import { SpatialGrid } from '../spatial/grid-index.js';
import { MissionState } from '../components/mission.js';
import {
  entityIndex, knotsToMps, feetToMeters,
  Side, ModelType, RadarMode,
  computeEffectiveRCS,
} from '@jzsim/core';
import { batchRadarCheck } from '@jzsim/wasm-radar';
import { CommandBus } from '../commands/command-bus.js';

/** Helper: create a world + spatial grid for testing */
function createTestWorld() {
  const world = new World(256);
  const grid = new SpatialGrid(0.5, 128);
  return { world, grid };
}

/** Helper: spawn a blue fighter at given coords */
function spawnFighter(
  world: World,
  callsign: string,
  lat: number,
  lon: number,
  alt = 8000,
  side = Side.BLUE,
) {
  const id = world.entities.allocate(callsign);
  const idx = entityIndex(id);
  world.position.set(idx, { lat, lon, alt, heading: 0, pitch: 0, roll: 0 });
  world.velocity.set(idx, { speed: knotsToMps(500), climbRate: 0, turnRate: 0 });
  world.aircraft.set(idx, {
    fuel: 5000,
    fuelCapacity: 6000,
    fuelBurnRate: 1.5, // kg/s
    maxSpeed: knotsToMps(1600),
    cruiseSpeed: knotsToMps(550),
    ceiling: feetToMeters(65000),
    rcs: 5.0,
    throttle: 0.8,
    entityType: 1,
  });
  world.allegiance.set(idx, { side, iffCode: 0 });
  world.renderable.set(idx, {
    modelType: ModelType.FIGHTER,
    iconId: 0,
    colorR: side === Side.BLUE ? 0.27 : 1,
    colorG: 0.27,
    colorB: side === Side.BLUE ? 1 : 0.27,
    visible: 1,
  });
  world.health.set(idx, { maxHealth: 100, currentHealth: 100 });
  return idx;
}

// ============================================================
// Movement System Tests
// ============================================================
describe('MovementSystem', () => {
  let world: World;
  let system: MovementSystem;

  beforeEach(() => {
    world = new World(256);
    system = new MovementSystem();
  });

  it('should move an entity north over 1 second', () => {
    const idx = spawnFighter(world, 'TEST01', 26.0, 128.0);
    // Set heading to 0° (north) and speed
    world.position.fields.get('heading')![idx] = 0;
    const speed = knotsToMps(500);
    world.velocity.fields.get('speed')![idx] = speed;

    const startLat = world.position.get(idx, 'lat');
    system.update(world, 1.0);
    const endLat = world.position.get(idx, 'lat');

    // Should have moved north (lat increased)
    expect(endLat).toBeGreaterThan(startLat);
    // Approximate distance: 500kts ≈ 257 m/s ≈ 0.0023° lat/s
    const deltaLat = endLat - startLat;
    expect(deltaLat).toBeGreaterThan(0.001);
    expect(deltaLat).toBeLessThan(0.01);
  });

  it('should move east with heading 90°', () => {
    const idx = spawnFighter(world, 'TEST01', 26.0, 128.0);
    world.position.fields.get('heading')![idx] = 90;

    const startLon = world.position.get(idx, 'lon');
    system.update(world, 1.0);
    const endLon = world.position.get(idx, 'lon');

    expect(endLon).toBeGreaterThan(startLon);
  });

  it('should change altitude based on climbRate', () => {
    const idx = spawnFighter(world, 'TEST01', 26.0, 128.0);
    world.velocity.fields.get('climbRate')![idx] = 10; // 10 m/s climb

    const startAlt = world.position.get(idx, 'alt');
    system.update(world, 1.0);
    const endAlt = world.position.get(idx, 'alt');

    expect(endAlt).toBeCloseTo(startAlt + 10, 0);
  });

  it('should not move entities without velocity component', () => {
    const id = world.entities.allocate('STATIC01');
    const idx = entityIndex(id);
    world.position.set(idx, { lat: 26.0, lon: 128.0, alt: 0, heading: 0, pitch: 0, roll: 0 });
    // No velocity set

    const startLat = world.position.get(idx, 'lat');
    system.update(world, 1.0);
    const endLat = world.position.get(idx, 'lat');

    expect(endLat).toBe(startLat);
  });
});

// ============================================================
// Fuel System Tests
// ============================================================
describe('FuelSystem', () => {
  let world: World;
  let system: FuelSystem;

  beforeEach(() => {
    world = new World(256);
    system = new FuelSystem();
  });

  it('should decrement fuel when aircraft is moving', () => {
    const idx = spawnFighter(world, 'EAGLE01', 26.0, 128.0);
    const startFuel = world.aircraft.get(idx, 'fuel');

    system.update(world, 1.0);
    const endFuel = world.aircraft.get(idx, 'fuel');

    expect(endFuel).toBeLessThan(startFuel);
    // Burn rate = 1.5 kg/s, so 1s = 1.5 kg burned
    expect(startFuel - endFuel).toBeCloseTo(1.5, 1);
  });

  it('should not burn fuel when aircraft speed is 0', () => {
    const idx = spawnFighter(world, 'EAGLE01', 26.0, 128.0);
    world.velocity.fields.get('speed')![idx] = 0;

    const startFuel = world.aircraft.get(idx, 'fuel');
    system.update(world, 1.0);
    const endFuel = world.aircraft.get(idx, 'fuel');

    expect(endFuel).toBe(startFuel);
  });

  it('should not go below zero fuel', () => {
    const idx = spawnFighter(world, 'EAGLE01', 26.0, 128.0);
    world.aircraft.fields.get('fuel')![idx] = 0.5; // Almost empty

    system.update(world, 1.0);
    const endFuel = world.aircraft.get(idx, 'fuel');

    expect(endFuel).toBe(0);
  });

  it('should emit fuel:empty event when fuel runs out', () => {
    const idx = spawnFighter(world, 'EAGLE01', 26.0, 128.0);
    world.aircraft.fields.get('fuel')![idx] = 1.0; // Will run out in < 1s

    system.update(world, 1.0);

    const events = world.drainEvents();
    const emptyEvent = events.find((e) => e.type === 'fuel:empty');
    expect(emptyEvent).toBeDefined();
  });
});

// ============================================================
// Radar Detection System Tests
// ============================================================
describe('RadarDetectionSystem', () => {
  let world: World;
  let grid: SpatialGrid;
  let system: RadarDetectionSystem;

  beforeEach(() => {
    ({ world, grid } = createTestWorld());
    system = new RadarDetectionSystem(grid);
  });

  it('should detect a nearby aircraft', () => {
    // Create a radar site
    const radarId = world.entities.allocate('RADAR01');
    const radarIdx = entityIndex(radarId);
    world.position.set(radarIdx, { lat: 26.0, lon: 128.0, alt: 100, heading: 0, pitch: 0, roll: 0 });
    world.radar.set(radarIdx, {
      powerW: 25000,
      gainDbi: 34,
      freqGhz: 1.3,
      mode: RadarMode.SEARCH,
      maxRangeM: 300_000,
    });
    world.allegiance.set(radarIdx, { side: Side.BLUE, iffCode: 0 });

    // Create a target aircraft ~50km away
    const tgtIdx = spawnFighter(world, 'TARGET01', 26.5, 128.0, 8000, Side.RED);

    // Rebuild spatial grid
    grid.rebuild(world.position, world.entities.highWaterMark);

    // Run detection for enough ticks to ensure radarIdx's stagger slot fires
    for (let tick = 0; tick < 5; tick++) {
      world.tickCount = tick;
      system.update(world, 1.0);
    }

    const events = world.drainEvents();
    const detections = events.filter((e) => e.type === 'radar:detection');
    expect(detections.length).toBeGreaterThan(0);
  });

  it('should not detect when radar is off', () => {
    const radarId = world.entities.allocate('RADAR01');
    const radarIdx = entityIndex(radarId);
    world.position.set(radarIdx, { lat: 26.0, lon: 128.0, alt: 100, heading: 0, pitch: 0, roll: 0 });
    world.radar.set(radarIdx, {
      powerW: 25000,
      gainDbi: 34,
      freqGhz: 1.3,
      mode: RadarMode.OFF,
      maxRangeM: 300_000,
    });

    const tgtIdx = spawnFighter(world, 'TARGET01', 26.5, 128.0, 8000, Side.RED);
    grid.rebuild(world.position, world.entities.highWaterMark);

    for (let tick = 0; tick < 5; tick++) {
      world.tickCount = tick;
      system.update(world, 1.0);
    }

    const events = world.drainEvents();
    const detections = events.filter((e) => e.type === 'radar:detection');
    expect(detections.length).toBe(0);
  });

  it('should not detect targets beyond max range', () => {
    const radarId = world.entities.allocate('RADAR01');
    const radarIdx = entityIndex(radarId);
    world.position.set(radarIdx, { lat: 26.0, lon: 128.0, alt: 100, heading: 0, pitch: 0, roll: 0 });
    world.radar.set(radarIdx, {
      powerW: 25000,
      gainDbi: 34,
      freqGhz: 1.3,
      mode: RadarMode.SEARCH,
      maxRangeM: 50_000, // 50km range
    });
    world.allegiance.set(radarIdx, { side: Side.BLUE, iffCode: 0 });

    // Target ~200km away — well beyond 50km max range
    spawnFighter(world, 'FAR01', 28.0, 128.0, 8000, Side.RED);

    grid.rebuild(world.position, world.entities.highWaterMark);

    for (let tick = 0; tick < 5; tick++) {
      world.tickCount = tick;
      system.update(world, 1.0);
    }

    const events = world.drainEvents();
    const detections = events.filter((e) => e.type === 'radar:detection');
    expect(detections.length).toBe(0);
  });
});

// ============================================================
// Weapon System Tests
// ============================================================
describe('WeaponSystem', () => {
  let world: World;
  let system: WeaponSystem;

  beforeEach(() => {
    world = new World(256);
    system = new WeaponSystem();
  });

  it('should guide missile toward target', () => {
    const shooterIdx = spawnFighter(world, 'EAGLE01', 26.0, 128.0);
    const targetIdx = spawnFighter(world, 'FLANKER01', 26.5, 128.0, 8000, Side.RED);

    // Spawn a missile
    const mslId = world.entities.allocate('MSL01');
    const mslIdx = entityIndex(mslId);
    world.position.set(mslIdx, { lat: 26.0, lon: 128.0, alt: 8000, heading: 0, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: 1372, climbRate: 0, turnRate: 0 }); // Mach 4
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx,
      weaponType: 1,
      damage: 1.0,
      hitProbability: 0.70,
      maxRange: 180_000,
      flightTimeLeft: 60,
      missileSpeed: 1372,
      prevLosAngle: 0, // PN: will initialize on first tick
    });

    system.update(world, 1.0);

    // Missile should be steering toward target (heading toward ~0° or ~360°)
    const heading = world.position.get(mslIdx, 'heading');
    // Target is north of shooter, so heading should be close to 0
    expect(heading).toBeGreaterThanOrEqual(0);
    expect(heading).toBeLessThan(10);
  });

  it('should self-destruct missile when flight time expires', () => {
    const targetIdx = spawnFighter(world, 'FLANKER01', 26.5, 128.0, 8000, Side.RED);

    const mslId = world.entities.allocate('MSL01');
    const mslIdx = entityIndex(mslId);
    world.position.set(mslIdx, { lat: 26.0, lon: 128.0, alt: 8000, heading: 0, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: 1372, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx: 0,
      weaponType: 1,
      damage: 1.0,
      hitProbability: 0.70,
      maxRange: 180_000,
      flightTimeLeft: 0.5, // Almost expired
      missileSpeed: 1372,
      prevLosAngle: 0,
    });

    system.update(world, 1.0);

    // Missile should be destroyed
    expect(world.position.has(mslIdx)).toBe(false);
  });

  it('should apply partial damage on hit', () => {
    const targetIdx = spawnFighter(world, 'FLANKER01', 26.0, 128.0, 8000, Side.RED);
    world.health.set(targetIdx, { maxHealth: 100, currentHealth: 100 });

    // Place missile right on top of target for guaranteed impact check
    const mslId = world.entities.allocate('MSL01');
    const mslIdx = entityIndex(mslId);
    world.position.set(mslIdx, {
      lat: 26.0, lon: 128.0, alt: 8000, heading: 0, pitch: 0, roll: 0,
    });
    world.velocity.set(mslIdx, { speed: 1372, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx: 0,
      weaponType: 1,
      damage: 1.0,
      hitProbability: 1.0, // guaranteed hit for test
      maxRange: 180_000,
      flightTimeLeft: 60,
      missileSpeed: 1372,
      prevLosAngle: 0,
    });

    system.update(world, 1.0);

    const events = world.drainEvents();
    const impactEvent = events.find((e) => e.type === 'weapon:impact');
    expect(impactEvent).toBeDefined();

    // With hitProbability=1.0, target health should always be reduced
    if (impactEvent && (impactEvent as any).hit) {
      const hp = world.health.get(targetIdx, 'currentHealth');
      expect(hp).toBeLessThanOrEqual(40); // 100 - (60 * 1.0) = 40
    }
  });
});

// ============================================================
// Combat Damage & Swept-Segment Hit Detection Tests
// ============================================================
describe('Aircraft damage and missile hit detection', () => {
  let world: World;
  let system: WeaponSystem;
  let movementSystem: MovementSystem;

  beforeEach(() => {
    world = new World(256);
    system = new WeaponSystem();
    movementSystem = new MovementSystem();
  });

  it('should detect hit when high-speed missile overshoots target between ticks', () => {
    // Target sitting at 26.01°N — missile starts just south at 26.0°N heading north
    // At Mach 4 (1372 m/s), missile travels 1372m in 1 tick — ~0.0123° lat
    // Target is ~1111m (0.01°) away — missile will overshoot past it in one tick
    const targetIdx = spawnFighter(world, 'TGT01', 26.01, 128.0, 8000, Side.RED);

    const mslId = world.entities.allocate('MSL01');
    const mslIdx = entityIndex(mslId);
    world.position.set(mslIdx, { lat: 26.0, lon: 128.0, alt: 8000, heading: 0, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: 1372, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx: 0,
      weaponType: 1,
      damage: 1.0,
      hitProbability: 1.0, // guaranteed hit
      maxRange: 180_000,
      flightTimeLeft: 60,
      missileSpeed: 1372,
      prevLosAngle: 0,
    });

    // First move the missile (simulating MovementSystem running before WeaponSystem)
    movementSystem.update(world, 1.0);
    // Now the missile has moved ~1372m north past the target

    // WeaponSystem should detect hit via swept-segment closest approach
    system.update(world, 1.0);

    const events = world.drainEvents();
    const impacts = events.filter((e) => e.type === 'weapon:impact');
    expect(impacts.length).toBe(1);
    expect((impacts[0] as any).hit).toBe(true);
  });

  it('should destroy aircraft when HP reaches zero', () => {
    const targetIdx = spawnFighter(world, 'FLANKER01', 26.0, 128.0, 8000, Side.RED);
    expect(world.health.get(targetIdx, 'currentHealth')).toBe(100);

    // Place missile directly on target (zero distance)
    const mslId = world.entities.allocate('MSL01');
    const mslIdx = entityIndex(mslId);
    world.position.set(mslIdx, { lat: 26.0, lon: 128.0, alt: 8000, heading: 0, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: 1372, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx: 0,
      weaponType: 1,
      damage: 2.0, // 60 * 2.0 = 120 damage — enough to kill from 100 HP
      hitProbability: 1.0,
      maxRange: 180_000,
      flightTimeLeft: 60,
      missileSpeed: 1372,
      prevLosAngle: 0,
    });

    system.update(world, 1.0);

    const events = world.drainEvents();
    const destroyEvents = events.filter((e) => e.type === 'entity:destroyed');
    expect(destroyEvents.length).toBe(1);
    expect((destroyEvents[0] as any).callsign).toBe('FLANKER01');

    // Target should be removed from the world
    expect(world.position.has(targetIdx)).toBe(false);
  });

  it('should reduce aircraft HP without destroying when damage is partial', () => {
    const targetIdx = spawnFighter(world, 'FLANKER01', 26.0, 128.0, 8000, Side.RED);

    const mslId = world.entities.allocate('MSL01');
    const mslIdx = entityIndex(mslId);
    world.position.set(mslIdx, { lat: 26.0, lon: 128.0, alt: 8000, heading: 0, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: 1372, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx: 0,
      weaponType: 1,
      damage: 0.5, // 60 * 0.5 = 30 damage — leaves 70 HP
      hitProbability: 1.0,
      maxRange: 180_000,
      flightTimeLeft: 60,
      missileSpeed: 1372,
      prevLosAngle: 0,
    });

    system.update(world, 1.0);

    // Target should still exist with reduced HP
    expect(world.position.has(targetIdx)).toBe(true);
    const hp = world.health.get(targetIdx, 'currentHealth');
    expect(hp).toBe(70); // 100 - 30

    const events = world.drainEvents();
    const damageEvents = events.filter((e) => e.type === 'entity:damaged');
    expect(damageEvents.length).toBe(1);
    expect((damageEvents[0] as any).healthPercent).toBe(70);
  });

  it('should track kills in AAR when aircraft is destroyed', () => {
    const shooterIdx = spawnFighter(world, 'EAGLE01', 25.5, 128.0, 8000, Side.BLUE);
    const targetIdx = spawnFighter(world, 'FLANKER01', 26.0, 128.0, 8000, Side.RED);

    // Register shooter in AAR
    world.aar.getOrCreateEntity(shooterIdx, 'EAGLE01', 'F-15C', Side.BLUE, 'KADENA');

    const mslId = world.entities.allocate('MSL01');
    const mslIdx = entityIndex(mslId);
    world.position.set(mslIdx, { lat: 26.0, lon: 128.0, alt: 8000, heading: 0, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: 1372, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx,
      weaponType: 1,
      damage: 2.0, // lethal
      hitProbability: 1.0,
      maxRange: 180_000,
      flightTimeLeft: 60,
      missileSpeed: 1372,
      prevLosAngle: 0,
    });

    system.update(world, 1.0);

    // AAR should record the kill
    expect(world.aar.targetsHit).toBe(1);
    expect(world.aar.enemyLosses).toBe(1);
    const shooterAAR = world.aar.getEntity(shooterIdx);
    expect(shooterAAR?.kills).toBe(1);
  });

  it('should record enemy loss for red side and friendly loss for blue side', () => {
    // Red target destroyed
    const redIdx = spawnFighter(world, 'RED01', 26.0, 128.0, 8000, Side.RED);
    const mslId1 = world.entities.allocate('MSL01');
    const mslIdx1 = entityIndex(mslId1);
    world.position.set(mslIdx1, { lat: 26.0, lon: 128.0, alt: 8000, heading: 0, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx1, { speed: 1372, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx1, {
      targetIdx: redIdx, shooterIdx: 0, weaponType: 1,
      damage: 2.0, hitProbability: 1.0, maxRange: 180_000,
      flightTimeLeft: 60, missileSpeed: 1372, prevLosAngle: 0,
    });

    system.update(world, 1.0);
    expect(world.aar.enemyLosses).toBe(1);
    expect(world.aar.friendlyLosses).toBe(0);

    // Blue target destroyed
    const blueIdx = spawnFighter(world, 'BLUE01', 27.0, 128.0, 8000, Side.BLUE);
    const mslId2 = world.entities.allocate('MSL02');
    const mslIdx2 = entityIndex(mslId2);
    world.position.set(mslIdx2, { lat: 27.0, lon: 128.0, alt: 8000, heading: 0, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx2, { speed: 1372, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx2, {
      targetIdx: blueIdx, shooterIdx: 0, weaponType: 1,
      damage: 2.0, hitProbability: 1.0, maxRange: 180_000,
      flightTimeLeft: 60, missileSpeed: 1372, prevLosAngle: 0,
    });

    system.update(world, 1.0);
    // Cumulative: 1 enemy + 1 friendly
    expect(world.aar.enemyLosses).toBe(1);
    expect(world.aar.friendlyLosses).toBe(1);
  });
});

// ============================================================
// Mission System Tests
// ============================================================
describe('MissionSystem', () => {
  let world: World;
  let system: MissionSystem;

  beforeEach(() => {
    world = new World(256);
    system = new MissionSystem(world.missions);
  });

  it('should patrol between two points', () => {
    const idx = spawnFighter(world, 'PATROL01', 26.0, 128.0);

    world.missions.set(idx, {
      state: MissionState.PATROL,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: { lat: 26.5, lon: 128.0, alt: 8000, speed: 250 },
      patrolPoint2: { lat: 26.0, lon: 128.5, alt: 8000, speed: 250 },
      patrolLeg: 0,
      homeBaseLat: 26.0,
      homeBaseLon: 128.0,
      homeBaseCallsign: 'BASE01',
      loiterUntil: 0,
      targetIdx: -1,
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: null,
    });

    system.update(world, 1.0);

    // Aircraft should be steering toward patrolPoint1 (north)
    const heading = world.position.get(idx, 'heading');
    // Point1 is due north, so heading should be close to 0
    expect(heading).toBeGreaterThanOrEqual(0);
    expect(heading).toBeLessThan(15);
  });

  it('should transition RTB to LANDED when close to base', () => {
    // Place aircraft near base
    const idx = spawnFighter(world, 'RTB01', 26.001, 128.001);

    world.missions.set(idx, {
      state: MissionState.RTB,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: 26.0,
      homeBaseLon: 128.0,
      homeBaseCallsign: 'KADENA',
      loiterUntil: 0,
      targetIdx: -1,
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: null,
    });

    system.update(world, 1.0);

    const mission = world.missions.get(idx)!;
    expect(mission.state).toBe(MissionState.LANDED);
    expect(world.velocity.get(idx, 'speed')).toBe(0);
  });

  it('should steer toward intercept target', () => {
    const attackerIdx = spawnFighter(world, 'EAGLE01', 26.0, 128.0);
    const targetIdx = spawnFighter(world, 'FLANKER01', 27.0, 129.0, 8000, Side.RED);

    world.missions.set(attackerIdx, {
      state: MissionState.INTERCEPT,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: 26.0,
      homeBaseLon: 128.0,
      homeBaseCallsign: 'BASE01',
      loiterUntil: 0,
      targetIdx,
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: null,
    });

    system.update(world, 1.0);

    // Should be steering toward target (NE direction)
    const heading = world.position.get(attackerIdx, 'heading');
    expect(heading).toBeGreaterThan(30);
    expect(heading).toBeLessThan(60);
  });

  it('should revert to IDLE if intercept target is lost', () => {
    const attackerIdx = spawnFighter(world, 'EAGLE01', 26.0, 128.0);

    world.missions.set(attackerIdx, {
      state: MissionState.INTERCEPT,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: 26.0,
      homeBaseLon: 128.0,
      homeBaseCallsign: 'BASE01',
      loiterUntil: 0,
      targetIdx: 999, // Non-existent target
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: null,
    });

    system.update(world, 1.0);

    const mission = world.missions.get(attackerIdx)!;
    expect(mission.state).toBe(MissionState.IDLE);
  });
});

// ============================================================
// Command Parser Integration Tests
// ============================================================
describe('CommandParser', () => {
  it('should parse SPAWN command', async () => {
    const { parseCommand } = await import('@jzsim/command-parser');
    const cmd = parseCommand('SPAWN F-15C EAGLE01 AT 26.35 127.77 ALT 25000 SIDE blue');
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe('SPAWN');
    expect((cmd as any).callsign).toBe('EAGLE01');
    expect((cmd as any).lat).toBeCloseTo(26.35);
    expect((cmd as any).lon).toBeCloseTo(127.77);
    expect((cmd as any).alt).toBe(25000);
    expect((cmd as any).side).toBe('blue');
  });

  it('should parse ENGAGE command', async () => {
    const { parseCommand } = await import('@jzsim/command-parser');
    const cmd = parseCommand('ENGAGE EAGLE01');
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe('ENGAGE');
    expect((cmd as any).callsign).toBe('EAGLE01');
  });

  it('should parse DISENGAGE command', async () => {
    const { parseCommand } = await import('@jzsim/command-parser');
    const cmd = parseCommand('DISENGAGE EAGLE01');
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe('DISENGAGE');
  });

  it('should parse INTERCEPT command', async () => {
    const { parseCommand } = await import('@jzsim/command-parser');
    const cmd = parseCommand('INTERCEPT EAGLE01 TARGET FLANKER01');
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe('INTERCEPT');
    expect((cmd as any).callsign).toBe('EAGLE01');
    expect((cmd as any).target).toBe('FLANKER01');
  });

  it('should parse PATROL command', async () => {
    const { parseCommand } = await import('@jzsim/command-parser');
    const cmd = parseCommand('PATROL EAGLE01 BETWEEN 26.0 128.0 AND 27.0 129.0 AT 30000');
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe('PATROL');
    expect((cmd as any).point1.lat).toBeCloseTo(26.0);
    expect((cmd as any).alt).toBe(30000);
  });

  it('should return null for invalid input', async () => {
    const { parseCommand } = await import('@jzsim/command-parser');
    expect(parseCommand('')).toBeNull();
    expect(parseCommand('INVALID_CMD')).toBeNull();
    expect(parseCommand('SPAWN')).toBeNull(); // too few tokens
  });

  it('should list all command keywords', async () => {
    const { getCommandKeywords } = await import('@jzsim/command-parser');
    const keywords = getCommandKeywords();
    expect(keywords).toContain('SPAWN');
    expect(keywords).toContain('ENGAGE');
    expect(keywords).toContain('DISENGAGE');
    expect(keywords).toContain('INTERCEPT');
    expect(keywords.length).toBeGreaterThanOrEqual(13);
  });
});

// ============================================================
// Entity Allocator Tests
// ============================================================
describe('EntityAllocator', () => {
  let world: World;

  beforeEach(() => {
    world = new World(256);
  });

  it('should allocate entities with unique indices', () => {
    const id1 = world.entities.allocate('ENTITY1');
    const id2 = world.entities.allocate('ENTITY2');
    expect(entityIndex(id1)).not.toBe(entityIndex(id2));
  });

  it('should resolve callsign to entity ID', () => {
    const id = world.entities.allocate('EAGLE01');
    const resolved = world.entities.resolve('EAGLE01');
    expect(resolved).toBe(id);
  });

  it('should return null for unknown callsign', () => {
    expect(world.entities.resolve('NONEXISTENT')).toBeNull();
  });

  it('should increment generation on free + reuse', () => {
    const id1 = world.entities.allocate('TEMP');
    const idx1 = entityIndex(id1);
    world.entities.free(id1);

    const id2 = world.entities.allocate('REUSE');
    const idx2 = entityIndex(id2);

    // Should reuse the same index but with different generation
    expect(idx2).toBe(idx1);
    expect(id2).not.toBe(id1);
  });

  it('should track active count', () => {
    expect(world.entities.activeCount).toBe(0);
    const id1 = world.entities.allocate('A');
    const id2 = world.entities.allocate('B');
    expect(world.entities.activeCount).toBe(2);
    world.entities.free(id1);
    expect(world.entities.activeCount).toBe(1);
  });
});

// ============================================================
// SpatialGrid Tests
// ============================================================
describe('SpatialGrid', () => {
  it('should find entities within radius', () => {
    const world = new World(256);
    const grid = new SpatialGrid(0.5, 128);

    const idx1 = spawnFighter(world, 'A', 26.0, 128.0);
    const idx2 = spawnFighter(world, 'B', 26.1, 128.0); // ~11km away
    const idx3 = spawnFighter(world, 'C', 30.0, 135.0); // Far away

    grid.rebuild(world.position, world.entities.highWaterMark);

    const results: number[] = [];
    grid.queryRadius(26.0, 128.0, 0.5, results); // ~55km radius

    expect(results).toContain(idx1);
    expect(results).toContain(idx2);
    expect(results).not.toContain(idx3);
  });
});

// ============================================================
// Health & Damage Tests
// ============================================================
describe('Health & Damage', () => {
  it('should set health on spawn via handler', () => {
    const world = new World(256);
    const idx = spawnFighter(world, 'TEST01', 26.0, 128.0);
    world.health.set(idx, { maxHealth: 100, currentHealth: 100 });

    expect(world.health.has(idx)).toBe(true);
    expect(world.health.get(idx, 'maxHealth')).toBe(100);
    expect(world.health.get(idx, 'currentHealth')).toBe(100);
  });

  it('should apply partial damage', () => {
    const world = new World(256);
    const idx = spawnFighter(world, 'TEST01', 26.0, 128.0);
    world.health.set(idx, { maxHealth: 100, currentHealth: 100 });

    // Simulate damage
    const hp = world.health.get(idx, 'currentHealth') - 60;
    world.health.fields.get('currentHealth')![idx] = Math.max(0, hp);

    expect(world.health.get(idx, 'currentHealth')).toBe(40);
  });

  it('should destroy entity when health reaches 0', () => {
    const world = new World(256);
    const idx = spawnFighter(world, 'TEST01', 26.0, 128.0);
    world.health.set(idx, { maxHealth: 100, currentHealth: 100 });

    // Apply lethal damage
    world.health.fields.get('currentHealth')![idx] = 0;
    world.removeEntity(idx);
    world.entities.freeByIndex(idx);

    expect(world.position.has(idx)).toBe(false);
    expect(world.entities.activeCount).toBe(0);
  });
});

// ============================================================
// Loadout Tests
// ============================================================
describe('LoadoutStore', () => {
  it('should store and retrieve loadout data', () => {
    const world = new World(256);
    const idx = spawnFighter(world, 'TEST01', 26.0, 128.0);

    world.loadouts.set(idx, {
      primaryWeapon: 'AIM-120',
      primaryAmmo: 4,
      primaryMax: 4,
      secondaryWeapon: 'AIM-9',
      secondaryAmmo: 4,
      secondaryMax: 4,
      externalFuelTanks: false,
      bayDoorsOpenUntil: 0,
      offloadableFuel: -1,
      externalPods: [],
    });

    const loadout = world.loadouts.get(idx);
    expect(loadout).toBeDefined();
    expect(loadout!.primaryWeapon).toBe('AIM-120');
    expect(loadout!.primaryAmmo).toBe(4);
    expect(loadout!.secondaryAmmo).toBe(4);
  });

  it('should decrement ammo', () => {
    const world = new World(256);
    const idx = spawnFighter(world, 'TEST01', 26.0, 128.0);

    world.loadouts.set(idx, {
      primaryWeapon: 'AIM-120',
      primaryAmmo: 4,
      primaryMax: 4,
      secondaryWeapon: 'AIM-9',
      secondaryAmmo: 4,
      secondaryMax: 4,
      externalFuelTanks: false,
      bayDoorsOpenUntil: 0,
      offloadableFuel: -1,
      externalPods: [],
    });

    const loadout = world.loadouts.get(idx)!;
    loadout.primaryAmmo--;

    expect(world.loadouts.get(idx)!.primaryAmmo).toBe(3);
  });
});

// ============================================================
// Dynamic RCS Tests (computeEffectiveRCS)
// ============================================================
describe('Dynamic RCS (computeEffectiveRCS)', () => {
  it('should return base RCS for clean non-stealth aircraft', () => {
    const rcs = computeEffectiveRCS(5.0, 0, false, false, false);
    expect(rcs).toBe(5.0);
  });

  it('should increase RCS with external stores for non-stealth', () => {
    const rcs = computeEffectiveRCS(5.0, 4, false, false, false);
    // 5.0 + 4 × 0.3 = 6.2
    expect(rcs).toBeCloseTo(6.2, 1);
  });

  it('should double RCS with external fuel tanks for non-stealth', () => {
    const rcs = computeEffectiveRCS(5.0, 0, true, false, false);
    expect(rcs).toBeCloseTo(10.0, 1);
  });

  it('should keep stealth RCS when clean', () => {
    const rcs = computeEffectiveRCS(0.0001, 0, false, false, true);
    expect(rcs).toBe(0.0001);
  });

  it('should dramatically increase stealth RCS with external stores', () => {
    // Stealth: max(0.0001, 0.1) + 2 × 0.5 = 0.1 + 1.0 = 1.1
    const rcs = computeEffectiveRCS(0.0001, 2, false, false, true);
    expect(rcs).toBeGreaterThan(1.0);
  });

  it('should negate stealth with external tanks', () => {
    const rcs = computeEffectiveRCS(0.0001, 0, true, false, true);
    expect(rcs).toBeGreaterThanOrEqual(1.0);
  });

  it('should spike stealth RCS when bay doors are open', () => {
    const rcs = computeEffectiveRCS(0.0001, 0, false, true, true);
    expect(rcs).toBeGreaterThanOrEqual(0.1);
  });
});

// ============================================================
// Proportional Navigation Missile Guidance Tests
// ============================================================
describe('PN Missile Guidance', () => {
  let world: World;
  let system: WeaponSystem;

  beforeEach(() => {
    world = new World(256);
    system = new WeaponSystem();
  });

  it('should initialize heading to LOS angle on first tick (pure pursuit)', () => {
    const targetIdx = spawnFighter(world, 'TGT01', 27.0, 128.0, 8000, Side.RED);

    const mslId = world.entities.allocate('MSL01');
    const mslIdx = entityIndex(mslId);
    world.position.set(mslIdx, { lat: 26.0, lon: 128.0, alt: 8000, heading: 90, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: 1372, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx: 0,
      weaponType: 1,
      damage: 1.0,
      hitProbability: 0.70,
      maxRange: 180_000,
      flightTimeLeft: 60,
      missileSpeed: 1372,
      prevLosAngle: 0, // zero = first tick initialization
    });

    system.update(world, 1.0);

    // prevLosAngle should now be set to the bearing (target is north ≈ 0°)
    const prevLos = world.weapon.get(mslIdx, 'prevLosAngle');
    expect(prevLos).toBeGreaterThanOrEqual(0);
    expect(prevLos).toBeLessThan(5); // nearly due north
  });

  it('should apply PN correction when target moves laterally', () => {
    // Target is NE and moving east — missile should lead it
    const targetIdx = spawnFighter(world, 'TGT01', 26.5, 128.5, 8000, Side.RED);
    world.position.fields.get('heading')![targetIdx] = 90; // moving east

    const mslId = world.entities.allocate('MSL01');
    const mslIdx = entityIndex(mslId);
    world.position.set(mslIdx, { lat: 26.0, lon: 128.0, alt: 8000, heading: 45, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: 1372, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx: 0,
      weaponType: 1,
      damage: 1.0,
      hitProbability: 0.70,
      maxRange: 180_000,
      flightTimeLeft: 60,
      missileSpeed: 1372,
      prevLosAngle: 44.5, // slightly different from current LOS → nonzero rate
    });

    system.update(world, 1.0);

    // PN should adjust heading based on LOS rate
    const heading = world.weapon.has(mslIdx) ? world.position.get(mslIdx, 'heading') : -1;
    // Should still be roughly NE direction with PN correction applied
    expect(heading).toBeGreaterThan(30);
    expect(heading).toBeLessThan(60);
  });

  it('should self-destruct when target is destroyed mid-flight', () => {
    const targetIdx = spawnFighter(world, 'TGT01', 27.0, 128.0, 8000, Side.RED);

    const mslId = world.entities.allocate('MSL01');
    const mslIdx = entityIndex(mslId);
    world.position.set(mslIdx, { lat: 26.0, lon: 128.0, alt: 8000, heading: 0, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: 1372, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx: 0,
      weaponType: 1,
      damage: 1.0,
      hitProbability: 0.70,
      maxRange: 180_000,
      flightTimeLeft: 60,
      missileSpeed: 1372,
      prevLosAngle: 0,
    });

    // Remove target before missile tick
    world.removeEntity(targetIdx);
    world.entities.freeByIndex(targetIdx);

    system.update(world, 1.0);

    // Missile should be cleaned up
    expect(world.position.has(mslIdx)).toBe(false);
  });
});

// ============================================================
// SAM Altitude Floor Tests
// ============================================================
describe('SAM Altitude Floor', () => {
  it('should not engage targets below minimum altitude', () => {
    const { world, grid } = createTestWorld();
    const radarSys = new RadarDetectionSystem(grid);
    const samSystem = new SamEngagementSystem();

    // Create SAM site
    const samId = world.entities.allocate('SAM01');
    const samIdx = entityIndex(samId);
    world.position.set(samIdx, { lat: 26.0, lon: 128.0, alt: 0, heading: 0, pitch: 0, roll: 0 });
    world.radar.set(samIdx, { powerW: 50000, gainDbi: 38, freqGhz: 3.0, mode: RadarMode.SEARCH, maxRangeM: 200_000 });
    world.allegiance.set(samIdx, { side: Side.RED, iffCode: 0 });
    world.samStates.set(samIdx, {
      weaponKey: 'SA-10',
      missilesRemaining: 8,
      maxMissiles: 8,
      reloadTimer: 0,
      reloadTimeSec: 10,
      minEngageAltM: 300, // 300m floor
      engagedTargets: new Set(),
    });

    // Target flying at 200m — below the 300m floor
    const tgtIdx = spawnFighter(world, 'LOW01', 26.1, 128.0, 200, Side.BLUE);

    grid.rebuild(world.position, world.entities.highWaterMark);

    // Run enough ticks for stagger (radar + SAM)
    for (let tick = 0; tick < 5; tick++) {
      world.tickCount = tick;
      radarSys.update(world, 1.0);
      samSystem.update(world, 1.0);
    }

    const events = world.drainEvents();
    const launches = events.filter((e) => e.type === 'weapon:launched');
    expect(launches.length).toBe(0);
  });

  it('should engage targets above minimum altitude', () => {
    const { world, grid } = createTestWorld();
    const radarSys = new RadarDetectionSystem(grid);
    const samSystem = new SamEngagementSystem();

    const samId = world.entities.allocate('SAM01');
    const samIdx = entityIndex(samId);
    world.position.set(samIdx, { lat: 26.0, lon: 128.0, alt: 0, heading: 0, pitch: 0, roll: 0 });
    world.radar.set(samIdx, { powerW: 50000, gainDbi: 38, freqGhz: 3.0, mode: RadarMode.SEARCH, maxRangeM: 200_000 });
    world.allegiance.set(samIdx, { side: Side.RED, iffCode: 0 });
    world.samStates.set(samIdx, {
      weaponKey: 'SA-10',
      missilesRemaining: 8,
      maxMissiles: 8,
      reloadTimer: 0,
      reloadTimeSec: 10,
      minEngageAltM: 300,
      engagedTargets: new Set(),
    });

    // Target at 8000m — well above the 300m floor
    const tgtIdx = spawnFighter(world, 'HIGH01', 26.1, 128.0, 8000, Side.BLUE);

    grid.rebuild(world.position, world.entities.highWaterMark);

    for (let tick = 0; tick < 5; tick++) {
      world.tickCount = tick;
      radarSys.update(world, 1.0);
      samSystem.update(world, 1.0);
    }

    const events = world.drainEvents();
    const launches = events.filter((e) => e.type === 'weapon:launched');
    expect(launches.length).toBeGreaterThan(0);
  });
});

// ============================================================
// SEAD Mission Tests
// ============================================================
describe('SEAD Mission', () => {
  it('should fly toward SEAD area when far away', () => {
    const world = new World(256);
    const system = new MissionSystem(world.missions);

    const idx = spawnFighter(world, 'WILD01', 26.0, 128.0, 8000);
    world.loadouts.set(idx, {
      primaryWeapon: 'AIM-120', primaryAmmo: 4, primaryMax: 4,
      secondaryWeapon: 'AIM-9', secondaryAmmo: 2, secondaryMax: 2,
      externalFuelTanks: false, bayDoorsOpenUntil: 0, offloadableFuel: -1, externalPods: [],
    });

    world.missions.set(idx, {
      state: MissionState.SEAD,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: 26.0,
      homeBaseLon: 128.0,
      homeBaseCallsign: 'BASE01',
      loiterUntil: 0,
      targetIdx: -1,
      seadAreaLat: 27.0,    // area is north (~111km away)
      seadAreaLon: 128.0,
      previousState: null,
    });

    system.update(world, 1.0);

    // Aircraft should be steering toward SEAD area (north)
    const heading = world.position.get(idx, 'heading');
    expect(heading).toBeGreaterThanOrEqual(0);
    expect(heading).toBeLessThan(10);
  });

  it('should auto-RTB when Winchester (out of ammo)', () => {
    const world = new World(256);
    const system = new MissionSystem(world.missions);

    // Place aircraft at the SEAD area with zero ammo
    const idx = spawnFighter(world, 'WILD01', 27.0, 128.0, 8000);
    world.loadouts.set(idx, {
      primaryWeapon: 'AIM-120', primaryAmmo: 0, primaryMax: 4,
      secondaryWeapon: 'AIM-9', secondaryAmmo: 0, secondaryMax: 2,
      externalFuelTanks: false, bayDoorsOpenUntil: 0, offloadableFuel: -1, externalPods: [],
    });

    world.missions.set(idx, {
      state: MissionState.SEAD,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: 26.0,
      homeBaseLon: 128.0,
      homeBaseCallsign: 'BASE01',
      loiterUntil: 0,
      targetIdx: -1,
      seadAreaLat: 27.0,
      seadAreaLon: 128.0,
      previousState: null,
    });

    system.update(world, 1.0);

    const mission = world.missions.get(idx)!;
    expect(mission.state).toBe(MissionState.RTB);
  });
});

// ============================================================
// Refueling Mission Tests
// ============================================================
describe('Refueling Mission', () => {
  /** Helper: spawn a tanker with offloadable fuel */
  function spawnTanker(world: World, callsign: string, lat: number, lon: number) {
    const id = world.entities.allocate(callsign);
    const idx = entityIndex(id);
    world.position.set(idx, { lat, lon, alt: 8000, heading: 90, pitch: 0, roll: 0 });
    world.velocity.set(idx, { speed: knotsToMps(400), climbRate: 0, turnRate: 0 });
    world.aircraft.set(idx, {
      fuel: 50000,
      fuelCapacity: 90000,
      fuelBurnRate: 3.0,
      maxSpeed: knotsToMps(530),
      cruiseSpeed: knotsToMps(450),
      ceiling: feetToMeters(45000),
      rcs: 25.0,
      throttle: 0.8,
      entityType: 3, // TANKER
    });
    world.allegiance.set(idx, { side: Side.BLUE, iffCode: 0 });
    world.renderable.set(idx, {
      modelType: ModelType.TANKER,
      iconId: 0,
      colorR: 0.27, colorG: 0.27, colorB: 1, visible: 1,
    });
    world.loadouts.set(idx, {
      primaryWeapon: '', primaryAmmo: 0, primaryMax: 0,
      secondaryWeapon: '', secondaryAmmo: 0, secondaryMax: 0,
      externalFuelTanks: false, bayDoorsOpenUntil: 0,
      offloadableFuel: 30000, externalPods: [], // 30,000 kg offload pool
    });
    return idx;
  }

  it('should fly toward tanker when far away', () => {
    const world = new World(256);
    const system = new MissionSystem(world.missions);

    const tankerIdx = spawnTanker(world, 'TEXACO01', 27.0, 128.0);
    const receiverIdx = spawnFighter(world, 'EAGLE01', 26.0, 128.0);

    world.missions.set(receiverIdx, {
      state: MissionState.REFUELING,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: 26.0,
      homeBaseLon: 128.0,
      homeBaseCallsign: 'BASE01',
      loiterUntil: 0,
      targetIdx: tankerIdx,
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: MissionState.PATROL,
    });

    system.update(world, 1.0);

    // Should be heading north toward tanker
    const heading = world.position.get(receiverIdx, 'heading');
    expect(heading).toBeGreaterThanOrEqual(0);
    expect(heading).toBeLessThan(10);
  });

  it('should transfer fuel when within connect range', () => {
    const world = new World(256);
    const system = new MissionSystem(world.missions);

    const tankerIdx = spawnTanker(world, 'TEXACO01', 26.0, 128.0);
    // Place receiver right next to tanker (within 500m)
    const receiverIdx = spawnFighter(world, 'EAGLE01', 26.0001, 128.0);
    // Set fuel to half capacity
    world.aircraft.fields.get('fuel')![receiverIdx] = 3000;

    world.missions.set(receiverIdx, {
      state: MissionState.REFUELING,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: 26.0,
      homeBaseLon: 128.0,
      homeBaseCallsign: 'BASE01',
      loiterUntil: 0,
      targetIdx: tankerIdx,
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: MissionState.PATROL,
    });

    const fuelBefore = world.aircraft.get(receiverIdx, 'fuel');
    system.update(world, 1.0);
    const fuelAfter = world.aircraft.get(receiverIdx, 'fuel');

    // Fuel should have increased (transfer rate is ~0.3 kg/s for 1 second)
    expect(fuelAfter).toBeGreaterThan(fuelBefore);
    // Should be a small realistic transfer (not unrealistically fast)
    expect(fuelAfter - fuelBefore).toBeLessThan(1.0); // well under 1 kg for 1s at ~0.3 kg/s
    expect(fuelAfter - fuelBefore).toBeGreaterThan(0.1);
  });

  it('should restore previous state when fuel is full', () => {
    const world = new World(256);
    const system = new MissionSystem(world.missions);

    const tankerIdx = spawnTanker(world, 'TEXACO01', 26.0, 128.0);
    const receiverIdx = spawnFighter(world, 'EAGLE01', 26.0001, 128.0);
    // Set fuel to max capacity so it's already full
    world.aircraft.fields.get('fuel')![receiverIdx] = 6000; // == fuelCapacity

    world.missions.set(receiverIdx, {
      state: MissionState.REFUELING,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: 26.0,
      homeBaseLon: 128.0,
      homeBaseCallsign: 'BASE01',
      loiterUntil: 0,
      targetIdx: tankerIdx,
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: MissionState.PATROL,
    });

    system.update(world, 1.0);

    // Should restore to PATROL since tanks are full
    const mission = world.missions.get(receiverIdx)!;
    expect(mission.state).toBe(MissionState.PATROL);
  });

  it('should revert to idle if tanker is lost', () => {
    const world = new World(256);
    const system = new MissionSystem(world.missions);

    const receiverIdx = spawnFighter(world, 'EAGLE01', 26.0, 128.0);

    world.missions.set(receiverIdx, {
      state: MissionState.REFUELING,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: 26.0,
      homeBaseLon: 128.0,
      homeBaseCallsign: 'BASE01',
      loiterUntil: 0,
      targetIdx: 999, // non-existent tanker
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: MissionState.PATROL,
    });

    system.update(world, 1.0);

    const mission = world.missions.get(receiverIdx)!;
    // Should revert to previousState (PATROL)
    expect(mission.state).toBe(MissionState.PATROL);
  });
});

// ============================================================
// SEAD & REFUEL Parser Tests
// ============================================================
describe('Parser: SEAD & REFUEL Commands', () => {
  it('should parse SEAD command', async () => {
    const { parseCommand } = await import('@jzsim/command-parser');
    const cmd = parseCommand('SEAD WILD01 AT 27.5 128.3');
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe('SEAD');
    expect((cmd as any).callsign).toBe('WILD01');
    expect((cmd as any).lat).toBeCloseTo(27.5);
    expect((cmd as any).lon).toBeCloseTo(128.3);
  });

  it('should parse REFUEL command', async () => {
    const { parseCommand } = await import('@jzsim/command-parser');
    const cmd = parseCommand('REFUEL EAGLE01 AT TEXACO01');
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe('REFUEL');
    expect((cmd as any).callsign).toBe('EAGLE01');
    expect((cmd as any).at).toBe('TEXACO01');
  });

  it('should include SEAD and REFUEL in command keywords', async () => {
    const { getCommandKeywords } = await import('@jzsim/command-parser');
    const keywords = getCommandKeywords();
    expect(keywords).toContain('SEAD');
    expect(keywords).toContain('REFUEL');
  });

  it('should include SEAD and REFUEL in command help', async () => {
    const { getCommandHelp } = await import('@jzsim/command-parser');
    const seadHelp = getCommandHelp('SEAD');
    expect(seadHelp).not.toBeNull();
    expect(seadHelp).toContain('SEAD');
    const refuelHelp = getCommandHelp('REFUEL');
    expect(refuelHelp).not.toBeNull();
    expect(refuelHelp).toContain('REFUEL');
  });
});

// ============================================================
// Batch Radar Check (JS Fallback) Tests
// ============================================================
describe('Batch Radar Check (JS fallback)', () => {
  it('should detect a radar/target pair in range', () => {
    // One radar, one target, close together
    const radarData = new Float64Array([
      25000, 34, 1.3, 26.0, 128.0, 100, 300_000,  // radar at 26, 128
    ]);
    const targetData = new Float64Array([
      26.5, 128.0, 8000, 5.0,  // target ~55km north
    ]);
    const output = new Float64Array(4 * 100);

    const n = batchRadarCheck(radarData, targetData, 1, 1, output);

    expect(n).toBeGreaterThan(0);
    expect(output[0]).toBe(0);  // radar index
    expect(output[1]).toBe(0);  // target index
    expect(output[2]).toBeGreaterThan(0); // distance
    expect(output[3]).toBeGreaterThan(0); // probability
  });

  it('should not detect targets beyond max range', () => {
    const radarData = new Float64Array([
      25000, 34, 1.3, 26.0, 128.0, 100, 10_000,  // 10km max range
    ]);
    const targetData = new Float64Array([
      28.0, 128.0, 8000, 5.0,  // target ~222km away — way out of range
    ]);
    const output = new Float64Array(4 * 100);

    const n = batchRadarCheck(radarData, targetData, 1, 1, output);
    expect(n).toBe(0);
  });

  it('should handle multiple radars and targets', () => {
    const radarData = new Float64Array([
      // Radar 0 at 26, 128
      25000, 34, 1.3, 26.0, 128.0, 100, 300_000,
      // Radar 1 at 30, 130 (far away from targets)
      25000, 34, 1.3, 30.0, 130.0, 100, 50_000,
    ]);
    const targetData = new Float64Array([
      // Target near radar 0
      26.2, 128.0, 8000, 5.0,
      // Target far from both radars
      35.0, 140.0, 8000, 5.0,
    ]);
    const output = new Float64Array(4 * 100);

    const n = batchRadarCheck(radarData, targetData, 2, 2, output);

    // Radar 0 should detect target 0, but not target 1
    // Radar 1 should detect neither target
    expect(n).toBeGreaterThanOrEqual(1);
    // First detection should be radar 0 → target 0
    expect(output[0]).toBe(0);
    expect(output[1]).toBe(0);
  });

  it('should return 0 detections for empty inputs', () => {
    const radarData = new Float64Array(0);
    const targetData = new Float64Array(0);
    const output = new Float64Array(4 * 100);

    const n = batchRadarCheck(radarData, targetData, 0, 0, output);
    expect(n).toBe(0);
  });
});

// ============================================================
// SAM Radar-Gated Engagement Tests
// ============================================================
describe('SAM Radar-Gated Engagement', () => {
  /** Helper: spawn a SAM site at given coords */
  function spawnSAM(
    world: World,
    callsign: string,
    lat: number,
    lon: number,
    side = Side.RED,
  ) {
    const id = world.entities.allocate(callsign);
    const idx = entityIndex(id);
    world.position.set(idx, { lat, lon, alt: 0, heading: 0, pitch: 0, roll: 0 });
    world.allegiance.set(idx, { side, iffCode: 0 });
    world.radar.set(idx, {
      powerW: 10000,
      gainDbi: 38,
      freqGhz: 4.0,
      mode: RadarMode.SEARCH,
      maxRangeM: 300_000,
    });
    world.samStates.set(idx, {
      weaponKey: 'SA-10',
      missilesRemaining: 12,
      maxMissiles: 12,
      reloadTimer: 0,
      reloadTimeSec: 5,
      minEngageAltM: 30,
      engagedTargets: new Set(),
    });
    world.renderable.set(idx, {
      modelType: ModelType.SAM_SITE,
      iconId: 0,
      colorR: 1, colorG: 0.27, colorB: 0.27,
      visible: 1,
    });
    return idx;
  }

  it('should fire at non-stealth target detected by radar', () => {
    const { world, grid } = createTestWorld();
    const radarSys = new RadarDetectionSystem(grid);
    const samSys = new SamEngagementSystem();

    const samIdx = spawnSAM(world, 'SA10-01', 26.0, 128.0);
    // Place a non-stealth fighter at 50km north (well within 300km radar range)
    const tgtIdx = spawnFighter(world, 'EAGLE01', 26.45, 128.0, 8000, Side.BLUE);

    // Set tick so SAM's stagger fires (samIdx % 4 === tickCount % 4)
    world.tickCount = samIdx;

    grid.rebuild(world.position, world.entities.highWaterMark);
    radarSys.update(world, 1.0);
    samSys.update(world, 1.0);

    const events = world.drainEvents();
    const launchEvents = events.filter((e) => e.type === 'weapon:launched');
    expect(launchEvents.length).toBe(1);
    expect((launchEvents[0] as any).targetId).toBe(tgtIdx);
  });

  it('should NOT fire at stealth target beyond effective radar detection range', () => {
    const { world, grid } = createTestWorld();
    const radarSys = new RadarDetectionSystem(grid);
    const samSys = new SamEngagementSystem();

    const samIdx = spawnSAM(world, 'SA10-01', 26.0, 128.0);
    // Place an F-22 (RCS 0.0001) at 200km — radar eq will yield very low detection probability
    const tgtIdx = spawnFighter(world, 'RAPTOR01', 27.8, 128.0, 8000, Side.BLUE);
    // Set RCS to stealth levels
    world.aircraft.fields.get('rcs')![tgtIdx] = 0.0001;

    world.tickCount = samIdx;

    grid.rebuild(world.position, world.entities.highWaterMark);
    radarSys.update(world, 1.0);

    // Verify radar did NOT detect
    expect(world.radarContacts.get(samIdx)?.length ?? 0).toBe(0);

    samSys.update(world, 1.0);
    const events = world.drainEvents();
    const launchEvents = events.filter((e) => e.type === 'weapon:launched');
    expect(launchEvents.length).toBe(0);
  });

  it('should respect altitude floor even if target is radar-detected', () => {
    const { world, grid } = createTestWorld();
    const radarSys = new RadarDetectionSystem(grid);
    const samSys = new SamEngagementSystem();

    const samIdx = spawnSAM(world, 'SA10-01', 26.0, 128.0);
    // Place target very close but at very low altitude (below 30m minEngageAlt)
    const tgtIdx = spawnFighter(world, 'EAGLE01', 26.1, 128.0, 20, Side.BLUE); // 20m alt

    world.tickCount = samIdx;

    grid.rebuild(world.position, world.entities.highWaterMark);
    radarSys.update(world, 1.0);

    // Radar should detect (close range, high RCS)
    expect((world.radarContacts.get(samIdx)?.length ?? 0)).toBeGreaterThan(0);

    samSys.update(world, 1.0);
    const events = world.drainEvents();
    const launchEvents = events.filter((e) => e.type === 'weapon:launched');
    // Should NOT fire — target below altitude floor
    expect(launchEvents.length).toBe(0);
  });

  it('should detect high-RCS and low-RCS aircraft in formation at different ranges', () => {
    // Two aircraft flying in formation: F-15C (RCS 5.0) and F-22 (RCS 0.0001)
    // At medium range, the SAM radar should detect the F-15 but NOT the F-22
    const { world, grid } = createTestWorld();
    const radarSys = new RadarDetectionSystem(grid);

    const samIdx = spawnSAM(world, 'SA10-01', 26.0, 128.0);

    // Place both aircraft at ~55km from SAM (Rmax for RCS 5.0 is ~87km, so well within range)
    const f15Idx = spawnFighter(world, 'EAGLE01', 26.5, 128.0, 8000, Side.BLUE);
    world.aircraft.fields.get('rcs')![f15Idx] = 5.0; // non-stealth

    const f22Idx = spawnFighter(world, 'RAPTOR01', 26.5, 128.01, 8000, Side.BLUE);
    world.aircraft.fields.get('rcs')![f22Idx] = 0.0001; // stealth (Rmax ~6km)

    // Align tick with SAM entity index for stagger
    world.tickCount = samIdx;

    grid.rebuild(world.position, world.entities.highWaterMark);
    radarSys.update(world, 1.0);

    const contacts = world.radarContacts.get(samIdx) ?? [];

    // F-15 should be detected (RCS 5.0 at ~55km, Rmax ~87km → high probability)
    expect(contacts).toContain(f15Idx);

    // F-22 should NOT be detected (RCS 0.0001 at ~55km, Rmax ~6km → zero probability)
    expect(contacts).not.toContain(f22Idx);
  });
});

// ============================================================
// External Pods & RCS Tests
// ============================================================
describe('External Pods and RCS', () => {
  it('should increase non-stealth RCS with pod contributions', () => {
    // Non-stealth: base 5.0 + ECM pod 0.2 = 5.2
    const rcs = computeEffectiveRCS(5.0, 0, false, false, false, 0.2);
    expect(rcs).toBeCloseTo(5.2, 2);
  });

  it('should break stealth with pod RCS', () => {
    // Stealth clean: 0.0001. With ECM pod (0.2): max(0.0001, 0.1) + 0.2 = 0.3
    const clean = computeEffectiveRCS(0.0001, 0, false, false, true, 0);
    const withPod = computeEffectiveRCS(0.0001, 0, false, false, true, 0.2);
    expect(clean).toBe(0.0001);
    expect(withPod).toBeCloseTo(0.3, 2);
    expect(withPod).toBeGreaterThan(clean * 1000);
  });

  it('should stack multiple pod RCS contributions', () => {
    // Two pods: ECM (0.2) + TGP (0.15) = 0.35 total pod RCS
    const rcs = computeEffectiveRCS(5.0, 0, false, false, false, 0.35);
    expect(rcs).toBeCloseTo(5.35, 2);
  });

  it('EQUIP command should add pod to loadout', () => {
    const { world } = createTestWorld();
    const idx = spawnFighter(world, 'EAGLE01', 26.0, 128.0);
    world.loadouts.set(idx, {
      primaryWeapon: 'AIM-120', primaryAmmo: 4, primaryMax: 4,
      secondaryWeapon: 'AIM-9', secondaryAmmo: 4, secondaryMax: 4,
      externalFuelTanks: false, bayDoorsOpenUntil: 0, offloadableFuel: -1,
      externalPods: [],
    });

    const bus = new CommandBus();
    bus.enqueue({ type: 'EQUIP', callsign: 'EAGLE01', podType: 'ECM' });
    bus.processAll(world);

    const loadout = world.loadouts.get(idx)!;
    expect(loadout.externalPods).toContain('ECM');
    expect(loadout.externalPods.length).toBe(1);
  });

  it('JETTISON command should remove pod from loadout', () => {
    const { world } = createTestWorld();
    const idx = spawnFighter(world, 'EAGLE01', 26.0, 128.0);
    world.loadouts.set(idx, {
      primaryWeapon: 'AIM-120', primaryAmmo: 4, primaryMax: 4,
      secondaryWeapon: 'AIM-9', secondaryAmmo: 4, secondaryMax: 4,
      externalFuelTanks: false, bayDoorsOpenUntil: 0, offloadableFuel: -1,
      externalPods: ['ECM', 'TGP'],
    });

    const bus = new CommandBus();
    bus.enqueue({ type: 'JETTISON', callsign: 'EAGLE01', podType: 'ECM' });
    bus.processAll(world);

    const loadout = world.loadouts.get(idx)!;
    expect(loadout.externalPods).not.toContain('ECM');
    expect(loadout.externalPods).toContain('TGP');
    expect(loadout.externalPods.length).toBe(1);
  });

  it('EQUIP with invalid pod type should emit error', () => {
    const { world } = createTestWorld();
    spawnFighter(world, 'EAGLE01', 26.0, 128.0);
    world.loadouts.set(entityIndex(world.entities.callsignMap.get('EAGLE01')!), {
      primaryWeapon: 'AIM-120', primaryAmmo: 4, primaryMax: 4,
      secondaryWeapon: 'AIM-9', secondaryAmmo: 4, secondaryMax: 4,
      externalFuelTanks: false, bayDoorsOpenUntil: 0, offloadableFuel: -1,
      externalPods: [],
    });

    const bus = new CommandBus();
    bus.enqueue({ type: 'EQUIP', callsign: 'EAGLE01', podType: 'INVALID' });
    bus.processAll(world);

    const events = world.drainEvents();
    const errors = events.filter((e) => e.type === 'command:error');
    expect(errors.length).toBe(1);
    expect((errors[0] as any).error).toContain('Unknown pod type');
  });
});

// ============================================================
// Parser: EQUIP & JETTISON Tests
// ============================================================
describe('Parser: EQUIP & JETTISON Commands', () => {
  it('should parse EQUIP command', async () => {
    const { parseCommand } = await import('@jzsim/command-parser');
    const cmd = parseCommand('EQUIP EAGLE01 ECM');
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe('EQUIP');
    expect((cmd as any).callsign).toBe('EAGLE01');
    expect((cmd as any).podType).toBe('ECM');
  });

  it('should parse JETTISON command', async () => {
    const { parseCommand } = await import('@jzsim/command-parser');
    const cmd = parseCommand('JETTISON RAPTOR01 TGP');
    expect(cmd).not.toBeNull();
    expect(cmd!.type).toBe('JETTISON');
    expect((cmd as any).callsign).toBe('RAPTOR01');
    expect((cmd as any).podType).toBe('TGP');
  });

  it('should include EQUIP and JETTISON in command keywords', async () => {
    const { getCommandKeywords } = await import('@jzsim/command-parser');
    const keywords = getCommandKeywords();
    expect(keywords).toContain('EQUIP');
    expect(keywords).toContain('JETTISON');
  });
});
