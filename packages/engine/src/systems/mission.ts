import {
  approxDistance, bearing, entityIndex,
  Side, ModelType, RadarMode, getWeaponDefaults,
  TANKER_DEFAULTS, FUEL_RECEIVE_RATE, AIRCRAFT_DEFAULTS,
} from '@jzsim/core';
import type { System } from './types.js';
import type { World } from '../ecs/world.js';
import { MissionState } from '../components/mission.js';
import type { MissionStore } from '../components/mission.js';
import { findCallsign, findBaseByCallsign } from '../util/callsign.js';

const WAYPOINT_ARRIVAL_RADIUS_M = 1000; // 1km arrival threshold
const SEAD_AREA_ARRIVAL_M = 10_000;     // 10km — close enough to start searching
const SEAD_DETECT_RANGE_M = 150_000;    // 150km ESM detection range for radar emissions
const REFUEL_CONNECT_RANGE_M = 500;     // 500m — close enough to start fuel transfer
const REFUEL_DEFAULT_RECEIVE_KG_S = 0.30; // fallback receive rate if aircraft type unknown

/**
 * Mission system: processes waypoint queues and state machine transitions.
 *
 * Each tick:
 * 1. For ENROUTE entities: check arrival at current waypoint, advance queue
 * 2. For PATROL entities: bounce between two patrol points
 * 3. For RTB: fly home, land on arrival
 */
export class MissionSystem implements System {
  constructor(private readonly missionStore: MissionStore) {}

  update(world: World, dt: number): void {
    for (const [idx, mission] of this.missionStore.entries()) {
      if (!world.position.has(idx)) continue;

      switch (mission.state) {
        case MissionState.ENROUTE:
          this.tickEnroute(world, idx, dt);
          break;
        case MissionState.PATROL:
          this.tickPatrol(world, idx, dt);
          break;
        case MissionState.RTB:
          this.tickRtb(world, idx, dt);
          break;
        case MissionState.INTERCEPT:
          this.tickIntercept(world, idx, dt);
          break;
        case MissionState.SEAD:
          this.tickSead(world, idx, dt);
          break;
        case MissionState.STRIKE:
          this.tickStrike(world, idx, dt);
          break;
        case MissionState.REFUELING:
          this.tickRefueling(world, idx, dt);
          break;
        case MissionState.LOITER:
          if (world.simTime >= mission.loiterUntil) {
            this.transitionState(world, idx, MissionState.IDLE);
            world.velocity.fields.get('speed')![idx] = 0;
          }
          break;
      }
    }
  }

  private tickEnroute(world: World, idx: number, dt: number): void {
    const mission = this.missionStore.get(idx)!;
    if (mission.waypoints.length === 0) {
      this.transitionState(world, idx, MissionState.LOITER);
      mission.loiterUntil = world.simTime + 60;
      return;
    }

    const wpt = mission.waypoints[mission.currentWptIdx];
    if (!wpt) {
      this.transitionState(world, idx, MissionState.IDLE);
      return;
    }

    const lat = world.position.get(idx, 'lat');
    const lon = world.position.get(idx, 'lon');
    const dist = approxDistance(lat, lon, wpt.lat, wpt.lon);

    if (dist <= WAYPOINT_ARRIVAL_RADIUS_M) {
      // Arrived at waypoint
      mission.currentWptIdx++;
      if (mission.currentWptIdx >= mission.waypoints.length) {
        // All waypoints done → loiter briefly
        mission.waypoints.length = 0;
        mission.currentWptIdx = 0;
        this.transitionState(world, idx, MissionState.LOITER);
        mission.loiterUntil = world.simTime + 30;
      } else {
        // Steer to next waypoint
        this.steerToward(world, idx, mission.waypoints[mission.currentWptIdx]);
      }
    } else {
      // Keep steering toward current waypoint
      this.steerToward(world, idx, wpt);
    }
  }

  private tickPatrol(world: World, idx: number, dt: number): void {
    const mission = this.missionStore.get(idx)!;
    const p1 = mission.patrolPoint1;
    const p2 = mission.patrolPoint2;
    if (!p1 || !p2) {
      this.transitionState(world, idx, MissionState.IDLE);
      return;
    }

    const target = mission.patrolLeg === 0 ? p1 : p2;
    const lat = world.position.get(idx, 'lat');
    const lon = world.position.get(idx, 'lon');
    const dist = approxDistance(lat, lon, target.lat, target.lon);

    if (dist <= WAYPOINT_ARRIVAL_RADIUS_M) {
      // Flip patrol leg
      mission.patrolLeg = mission.patrolLeg === 0 ? 1 : 0;
      this.steerToward(world, idx, mission.patrolLeg === 0 ? p1 : p2);
    } else {
      this.steerToward(world, idx, target);
    }
  }

  private tickIntercept(world: World, idx: number, dt: number): void {
    const mission = this.missionStore.get(idx)!;
    const targetIdx = mission.targetIdx;
    if (targetIdx < 0 || !world.position.has(targetIdx)) {
      // Target lost — revert to idle
      this.transitionState(world, idx, MissionState.IDLE);
      return;
    }

    const lat = world.position.get(idx, 'lat');
    const lon = world.position.get(idx, 'lon');
    const tgtLat = world.position.get(targetIdx, 'lat');
    const tgtLon = world.position.get(targetIdx, 'lon');

    // Continuously steer toward target
    const hdg = bearing(lat, lon, tgtLat, tgtLon);
    world.position.fields.get('heading')![idx] = hdg;

    // Use cruise speed if available
    if (world.aircraft.has(idx)) {
      const cruiseSpeed = world.aircraft.get(idx, 'cruiseSpeed');
      if (world.velocity.has(idx)) {
        const currentSpeed = world.velocity.get(idx, 'speed');
        if (currentSpeed < cruiseSpeed) {
          world.velocity.fields.get('speed')![idx] = cruiseSpeed;
        }
      }
    }
  }

  private tickRtb(world: World, idx: number, dt: number): void {
    const mission = this.missionStore.get(idx)!;
    const lat = world.position.get(idx, 'lat');
    const lon = world.position.get(idx, 'lon');
    const dist = approxDistance(lat, lon, mission.homeBaseLat, mission.homeBaseLon);

    if (dist <= 5000) {
      // Landed
      world.velocity.fields.get('speed')![idx] = 0;
      world.velocity.fields.get('climbRate')![idx] = 0;
      world.position.fields.get('alt')![idx] = 0;
      this.returnMunsToBase(world, idx, mission.homeBaseCallsign);
      this.transitionState(world, idx, MissionState.LANDED);
    } else {
      // Descend as we approach
      const targetAlt = Math.max(0, (dist / 50) * 100); // descend gradually
      const currentAlt = world.position.get(idx, 'alt');
      const climbRate = targetAlt < currentAlt ? -10 : 0;
      world.velocity.fields.get('climbRate')![idx] = climbRate;

      const hdg = bearing(lat, lon, mission.homeBaseLat, mission.homeBaseLon);
      world.position.fields.get('heading')![idx] = hdg;
    }
  }

  /**
   * SEAD tick: fly to area, detect emitting SAMs, attack them.
   * 1. If not yet at SEAD area → fly toward it
   * 2. At area → scan for enemy SAM sites with radar in SEARCH mode
   * 3. If SAM found and have ammo → fire missile
   * 4. If out of ammo → auto-RTB
   */
  private tickSead(world: World, idx: number, dt: number): void {
    const mission = this.missionStore.get(idx)!;
    const lat = world.position.get(idx, 'lat');
    const lon = world.position.get(idx, 'lon');

    // Check ammo
    const loadout = world.loadouts.get(idx);
    const totalAmmo = loadout ? loadout.primaryAmmo + loadout.secondaryAmmo : 0;
    if (totalAmmo <= 0) {
      // Winchester — RTB
      const callsign = findCallsign(world, idx);
      world.emit({
        type: 'command:executed',
        command: 'SEAD',
        success: true,
        message: `${callsign} SEAD mission — WINCHESTER, RTB`,
      });
      this.transitionState(world, idx, MissionState.RTB);
      return;
    }

    // Fly toward SEAD area
    const distToArea = approxDistance(lat, lon, mission.seadAreaLat, mission.seadAreaLon);
    if (distToArea > SEAD_AREA_ARRIVAL_M) {
      // Still enroute — steer toward area at cruise speed
      const hdg = bearing(lat, lon, mission.seadAreaLat, mission.seadAreaLon);
      world.position.fields.get('heading')![idx] = hdg;
      if (world.aircraft.has(idx)) {
        const cruiseSpeed = world.aircraft.get(idx, 'cruiseSpeed');
        if (world.velocity.has(idx)) {
          world.velocity.fields.get('speed')![idx] = cruiseSpeed;
        }
      }
      return;
    }

    // At SEAD area — scan for enemy SAM sites with radar emitting
    const acSide = world.allegiance.has(idx) ? world.allegiance.get(idx, 'side') : Side.BLUE;
    let nearestSamIdx = -1;
    let nearestDist = Infinity;

    for (const [samIdx] of world.samStates.entries()) {
      if (!world.position.has(samIdx)) continue;
      if (!world.radar.has(samIdx)) continue;

      // Only target enemy SAMs
      const samSide = world.allegiance.has(samIdx) ? world.allegiance.get(samIdx, 'side') : 0;
      if (samSide === acSide || samSide === Side.NEUTRAL) continue;

      // Only detect if radar is emitting (SEARCH mode)
      const radarMode = world.radar.get(samIdx, 'mode');
      if (radarMode !== RadarMode.SEARCH) continue;

      const samLat = world.position.get(samIdx, 'lat');
      const samLon = world.position.get(samIdx, 'lon');
      const dist = approxDistance(lat, lon, samLat, samLon);

      if (dist < nearestDist && dist <= SEAD_DETECT_RANGE_M) {
        nearestDist = dist;
        nearestSamIdx = samIdx;
      }
    }

    if (nearestSamIdx >= 0) {
      // Found emitting SAM — launch missile
      this.launchSeadMissile(world, idx, nearestSamIdx);
    } else {
      // No SAMs detected — orbit in area (loiter pattern)
      const hdg = (world.position.get(idx, 'heading') + 1.5 * dt) % 360;
      world.position.fields.get('heading')![idx] = hdg;
    }
  }

  /** Launch a missile at a SAM target during SEAD mission */
  private launchSeadMissile(world: World, shooterIdx: number, targetIdx: number): void {
    const loadout = world.loadouts.get(shooterIdx);
    if (!loadout) return;

    let weaponKey = '';
    if (loadout.primaryAmmo > 0) {
      weaponKey = loadout.primaryWeapon;
      loadout.primaryAmmo--;
    } else if (loadout.secondaryAmmo > 0) {
      weaponKey = loadout.secondaryWeapon;
      loadout.secondaryAmmo--;
    } else {
      return;
    }

    const wep = getWeaponDefaults(weaponKey);
    if (!wep) return;

    const shooterCallsign = findCallsign(world, shooterIdx);
    const missileCallsign = `MSL-${shooterCallsign}-${world.tickCount}`;
    const missileId = world.entities.allocate(missileCallsign);
    const mslIdx = entityIndex(missileId);

    const sLat = world.position.get(shooterIdx, 'lat');
    const sLon = world.position.get(shooterIdx, 'lon');
    const sAlt = world.position.get(shooterIdx, 'alt');
    const tLat = world.position.get(targetIdx, 'lat');
    const tLon = world.position.get(targetIdx, 'lon');
    const hdg = bearing(sLat, sLon, tLat, tLon);

    world.position.set(mslIdx, { lat: sLat, lon: sLon, alt: sAlt, heading: hdg, pitch: 0, roll: 0 });
    world.velocity.set(mslIdx, { speed: wep.speed, climbRate: 0, turnRate: 0 });
    world.weapon.set(mslIdx, {
      targetIdx,
      shooterIdx,
      weaponType: wep.weaponType,
      damage: wep.damage,
      hitProbability: wep.hitProbability,
      maxRange: wep.maxRange,
      flightTimeLeft: wep.flightTime,
      missileSpeed: wep.speed,
      prevLosAngle: hdg,
    });

    const shooterSide = world.allegiance.has(shooterIdx) ? world.allegiance.get(shooterIdx, 'side') : Side.BLUE;
    world.allegiance.set(mslIdx, { side: shooterSide, iffCode: 0 });
    world.renderable.set(mslIdx, {
      modelType: ModelType.MISSILE,
      iconId: 0,
      colorR: shooterSide === Side.BLUE ? 0.27 : 1,
      colorG: 0.27,
      colorB: shooterSide === Side.BLUE ? 1 : 0.27,
      visible: 1,
    });

    // Bay door timer for stealth aircraft
    const loadoutEntry = world.loadouts.get(shooterIdx);
    if (loadoutEntry) {
      loadoutEntry.bayDoorsOpenUntil = world.simTime + 5;
    }

    // AAR tracking
    const shooterSideAAR = world.allegiance.has(shooterIdx) ? world.allegiance.get(shooterIdx, 'side') : 0;
    world.aar.getOrCreateEntity(shooterIdx, shooterCallsign, 'fighter', shooterSideAAR, '');
    world.aar.recordMunsExpended(shooterIdx, weaponKey, 1);

    world.emit({ type: 'weapon:launched', shooterId: shooterIdx, targetId: targetIdx, weaponType: weaponKey });
    world.emit({ type: 'entity:spawned', entityId: mslIdx, callsign: missileCallsign, entityType: 'missile' });

    const targetCallsign = findCallsign(world, targetIdx);
    world.emit({
      type: 'command:executed',
      command: 'SEAD',
      success: true,
      message: `${shooterCallsign} SEAD: launched ${weaponKey} at ${targetCallsign}`,
    });
  }

  /**
   * STRIKE tick: fly ordered DMPI route, drop ordnance at each target, RTB when done.
   */
  private tickStrike(world: World, idx: number, dt: number): void {
    const route = world.strikes.get(idx);
    if (!route) {
      this.transitionState(world, idx, MissionState.IDLE);
      return;
    }

    // Route complete?
    if (route.currentDmpiIdx >= route.dmpiNames.length) {
      const callsign = findCallsign(world, idx);
      world.emit({ type: 'strike:route_complete', entityId: idx, callsign });
      world.emit({
        type: 'command:executed', command: 'STRIKE', success: true,
        message: `${callsign} STRIKE complete — all ${route.dmpiNames.length} DMPIs hit, RTB`,
      });
      this.transitionState(world, idx, MissionState.RTB);
      return;
    }

    // Check ammo
    const loadout = world.loadouts.get(idx);
    const totalAmmo = loadout ? loadout.primaryAmmo + loadout.secondaryAmmo : 0;
    if (totalAmmo <= 0) {
      const callsign = findCallsign(world, idx);
      world.emit({
        type: 'command:executed', command: 'STRIKE', success: true,
        message: `${callsign} STRIKE — WINCHESTER after ${route.completedDmpis.length}/${route.dmpiNames.length} DMPIs, RTB`,
      });
      this.transitionState(world, idx, MissionState.RTB);
      return;
    }

    // Resolve current DMPI
    const dmpiName = route.dmpiNames[route.currentDmpiIdx];
    const dmpi = world.dmpis.get(dmpiName);
    if (!dmpi) {
      // DMPI was removed — skip to next
      route.currentDmpiIdx++;
      return;
    }

    const lat = world.position.get(idx, 'lat');
    const lon = world.position.get(idx, 'lon');
    const dist = approxDistance(lat, lon, dmpi.lat, dmpi.lon);

    if (dist > WAYPOINT_ARRIVAL_RADIUS_M) {
      // Steer toward current DMPI at cruise speed
      const hdg = bearing(lat, lon, dmpi.lat, dmpi.lon);
      world.position.fields.get('heading')![idx] = hdg;
      if (world.aircraft.has(idx) && world.velocity.has(idx)) {
        world.velocity.fields.get('speed')![idx] = world.aircraft.get(idx, 'cruiseSpeed');
      }
      return;
    }

    // Arrived at DMPI — drop ordnance
    const callsign = findCallsign(world, idx);
    for (let b = 0; b < route.weaponPerDmpi; b++) {
      if (!this.dropBomb(world, idx, dmpi, callsign)) break; // out of ammo
    }

    route.completedDmpis.push(dmpiName);
    route.currentDmpiIdx++;

    world.emit({
      type: 'command:executed', command: 'STRIKE', success: true,
      message: `${callsign} STRIKE: bombs on ${dmpiName} (${route.completedDmpis.length}/${route.dmpiNames.length})`,
    });
  }

  /** Drop a single bomb at a DMPI target. Returns false if out of ammo. */
  private dropBomb(world: World, shooterIdx: number, dmpi: { lat: number; lon: number; name: string }, shooterCallsign: string): boolean {
    const loadout = world.loadouts.get(shooterIdx);
    if (!loadout) return false;

    let weaponKey = '';
    if (loadout.primaryAmmo > 0) {
      weaponKey = loadout.primaryWeapon;
      loadout.primaryAmmo--;
    } else if (loadout.secondaryAmmo > 0) {
      weaponKey = loadout.secondaryWeapon;
      loadout.secondaryAmmo--;
    } else {
      return false;
    }

    const wep = getWeaponDefaults(weaponKey);
    if (!wep) return false;

    const bombCallsign = `BOM-${shooterCallsign}-${world.tickCount}-${dmpi.name}`;
    const bombId = world.entities.allocate(bombCallsign);
    const bIdx = entityIndex(bombId);

    const sLat = world.position.get(shooterIdx, 'lat');
    const sLon = world.position.get(shooterIdx, 'lon');
    const sAlt = world.position.get(shooterIdx, 'alt');
    const hdg = bearing(sLat, sLon, dmpi.lat, dmpi.lon);

    world.position.set(bIdx, { lat: sLat, lon: sLon, alt: sAlt, heading: hdg, pitch: 0, roll: 0 });
    world.velocity.set(bIdx, { speed: wep.speed, climbRate: -50, turnRate: 0 });

    // Bomb targets ground position — use a dummy target index of -1 and let flight timer handle impact
    world.weapon.set(bIdx, {
      targetIdx: -1,
      shooterIdx,
      weaponType: wep.weaponType,
      damage: wep.damage,
      hitProbability: wep.hitProbability,
      maxRange: wep.maxRange,
      flightTimeLeft: wep.flightTime,
      missileSpeed: wep.speed,
      prevLosAngle: hdg,
    });

    const shooterSide = world.allegiance.has(shooterIdx) ? world.allegiance.get(shooterIdx, 'side') : Side.BLUE;
    world.allegiance.set(bIdx, { side: shooterSide, iffCode: 0 });
    world.renderable.set(bIdx, {
      modelType: ModelType.MISSILE,
      iconId: 0,
      colorR: shooterSide === Side.BLUE ? 0.27 : 1,
      colorG: 0.27,
      colorB: shooterSide === Side.BLUE ? 1 : 0.27,
      visible: 1,
    });

    // Bay door timer for stealth aircraft
    if (loadout) {
      loadout.bayDoorsOpenUntil = world.simTime + 5;
    }

    // AAR tracking
    world.aar.getOrCreateEntity(shooterIdx, shooterCallsign, 'bomber', shooterSide, '');
    world.aar.recordMunsExpended(shooterIdx, weaponKey, 1);

    world.emit({ type: 'entity:spawned', entityId: bIdx, callsign: bombCallsign, entityType: 'bomb' });
    world.emit({ type: 'strike:bomb_drop', entityId: shooterIdx, callsign: shooterCallsign, dmpiName: dmpi.name, weaponKey });

    return true;
  }

  /**
   * Refueling tick: fly to tanker, match speed, transfer fuel at real-world rates.
   * Transfer rate = min(tanker offload rate, receiver accept rate).
   * KC-135 boom: ~0.42 kg/s, receiver rates: 0.25-0.38 kg/s per aircraft type.
   */
  private tickRefueling(world: World, idx: number, dt: number): void {
    const mission = this.missionStore.get(idx)!;
    const tankerIdx = mission.targetIdx;

    if (tankerIdx < 0 || !world.position.has(tankerIdx)) {
      // Tanker gone — revert to previous state or idle
      const restoreState = mission.previousState ?? MissionState.IDLE;
      const callsign = findCallsign(world, idx);
      world.emit({
        type: 'command:executed', command: 'REFUEL', success: true,
        message: `${callsign} lost tanker contact — reverting to ${restoreState}`,
      });
      this.transitionState(world, idx, restoreState);
      return;
    }

    const lat = world.position.get(idx, 'lat');
    const lon = world.position.get(idx, 'lon');
    const tLat = world.position.get(tankerIdx, 'lat');
    const tLon = world.position.get(tankerIdx, 'lon');
    const dist = approxDistance(lat, lon, tLat, tLon);

    if (dist > REFUEL_CONNECT_RANGE_M) {
      // Still enroute to tanker — steer toward it and match tanker speed
      const hdg = bearing(lat, lon, tLat, tLon);
      world.position.fields.get('heading')![idx] = hdg;

      if (world.aircraft.has(idx) && world.velocity.has(idx)) {
        // Use max speed to close distance, then match tanker speed when close
        const cruiseSpeed = world.aircraft.get(idx, 'cruiseSpeed');
        world.velocity.fields.get('speed')![idx] = cruiseSpeed;
      }
      return;
    }

    // Within connection range — match tanker heading and speed
    const tankerHdg = world.position.get(tankerIdx, 'heading');
    world.position.fields.get('heading')![idx] = tankerHdg;
    if (world.velocity.has(tankerIdx) && world.velocity.has(idx)) {
      const tankerSpeed = world.velocity.get(tankerIdx, 'speed');
      world.velocity.fields.get('speed')![idx] = tankerSpeed;
    }

    // Fuel transfer
    if (!world.aircraft.has(idx)) return;

    const currentFuel = world.aircraft.get(idx, 'fuel');
    const fuelCapacity = world.aircraft.get(idx, 'fuelCapacity');

    // Already full?
    if (currentFuel >= fuelCapacity) {
      const callsign = findCallsign(world, idx);
      world.emit({
        type: 'command:executed', command: 'REFUEL', success: true,
        message: `${callsign} refueling complete — tanks full`,
      });
      const restoreState = mission.previousState ?? MissionState.IDLE;
      this.transitionState(world, idx, restoreState);
      return;
    }

    // Check tanker offload pool
    const tankerLoadout = world.loadouts.get(tankerIdx);
    if (!tankerLoadout || tankerLoadout.offloadableFuel <= 0) {
      const callsign = findCallsign(world, idx);
      world.emit({
        type: 'command:executed', command: 'REFUEL', success: true,
        message: `${callsign} tanker offload pool empty — disconnecting`,
      });
      const restoreState = mission.previousState ?? MissionState.IDLE;
      this.transitionState(world, idx, restoreState);
      return;
    }

    // Determine transfer rate: min(tanker offload, receiver accept)
    // Look up receiver's aircraft type to get receive rate
    const receiverCallsign = findCallsign(world, idx);
    const receiverType = this.resolveAircraftType(world, idx);
    const receiveRate = FUEL_RECEIVE_RATE[receiverType] ?? REFUEL_DEFAULT_RECEIVE_KG_S;

    // Tanker offload rate — find tanker type
    const tankerType = this.resolveAircraftType(world, tankerIdx);
    const tankerDef = TANKER_DEFAULTS[tankerType];
    const offloadRate = tankerDef ? tankerDef.maxOffloadRateKgPerSec : 0.42;

    const effectiveRate = Math.min(offloadRate, receiveRate);
    const fuelNeeded = fuelCapacity - currentFuel;
    const fuelAvailable = tankerLoadout.offloadableFuel;
    const maxTransfer = effectiveRate * dt;
    const actualTransfer = Math.min(maxTransfer, fuelNeeded, fuelAvailable);

    // Apply transfer
    world.aircraft.fields.get('fuel')![idx] = currentFuel + actualTransfer;
    tankerLoadout.offloadableFuel -= actualTransfer;
  }

  /** Resolve an entity's aircraft type key (e.g. 'F-15C', 'KC-135') */
  private resolveAircraftType(world: World, idx: number): string {
    // Check callsign-to-type mapping by iterating known defaults
    const callsign = findCallsign(world, idx);
    // Try to match from aircraft component RCS values (rough heuristic)
    if (!world.aircraft.has(idx)) return '';
    const rcs = world.aircraft.get(idx, 'rcs');
    for (const [key, def] of Object.entries(AIRCRAFT_DEFAULTS)) {
      if (Math.abs(def.rcsM2 - rcs) < 0.001) return key;
    }
    return '';
  }

  private steerToward(world: World, idx: number, wpt: { lat: number; lon: number; speed: number }): void {
    const lat = world.position.get(idx, 'lat');
    const lon = world.position.get(idx, 'lon');
    const hdg = bearing(lat, lon, wpt.lat, wpt.lon);
    world.position.fields.get('heading')![idx] = hdg;
    if (world.velocity.has(idx)) {
      world.velocity.fields.get('speed')![idx] = wpt.speed;
    }
  }

  private returnMunsToBase(world: World, acIdx: number, baseCallsign: string): void {
    const loadout = world.loadouts.get(acIdx);
    if (!loadout) return;

    const baseIdx = findBaseByCallsign(world, baseCallsign);
    if (baseIdx < 0) return;

    const baseInv = world.baseInventory.get(baseIdx);
    if (!baseInv) return;

    const items: Record<string, number> = {};

    if (loadout.primaryAmmo > 0) {
      baseInv.munitions.set(loadout.primaryWeapon,
        (baseInv.munitions.get(loadout.primaryWeapon) ?? 0) + loadout.primaryAmmo);
      items[loadout.primaryWeapon] = loadout.primaryAmmo;
      loadout.primaryAmmo = 0;
    }

    if (loadout.secondaryAmmo > 0) {
      baseInv.munitions.set(loadout.secondaryWeapon,
        (baseInv.munitions.get(loadout.secondaryWeapon) ?? 0) + loadout.secondaryAmmo);
      items[loadout.secondaryWeapon] = loadout.secondaryAmmo;
      loadout.secondaryAmmo = 0;
    }

    if (Object.keys(items).length > 0) {
      world.emit({
        type: 'muns:returned',
        callsign: findCallsign(world, acIdx),
        baseCallsign,
        items,
      });
    }
  }

  private transitionState(world: World, idx: number, newState: MissionState): void {
    const prev = this.missionStore.setState(idx, newState);
    if (prev !== newState) {
      world.emit({
        type: 'mission:state_change',
        entityId: idx,
        from: prev ?? 'UNKNOWN',
        to: newState,
      });
    }
  }
}
