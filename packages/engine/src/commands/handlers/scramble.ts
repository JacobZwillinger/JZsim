import { type Command, entityIndex, feetToMeters } from '@jzsim/core';
import type { World } from '../../ecs/world.js';
import { MissionState } from '../../components/mission.js';

type ScrambleCommand = Extract<Command, { type: 'SCRAMBLE' }>;

export function handleScramble(cmd: ScrambleCommand, world: World): void {
  const missions = world.missions;
  // Resolve the base
  const baseId = world.entities.resolve(cmd.base);
  if (baseId === null) {
    world.emit({ type: 'command:error', command: 'SCRAMBLE', error: `Unknown base: ${cmd.base}` });
    return;
  }

  // Resolve the aircraft callsign
  const acId = world.entities.resolve(cmd.callsign);
  if (acId === null) {
    world.emit({ type: 'command:error', command: 'SCRAMBLE', error: `Unknown aircraft: ${cmd.callsign}` });
    return;
  }

  const acIdx = entityIndex(acId);
  const baseIdx = entityIndex(baseId);

  if (!world.aircraft.has(acIdx)) {
    world.emit({ type: 'command:error', command: 'SCRAMBLE', error: `${cmd.callsign} is not an aircraft` });
    return;
  }

  // Teleport aircraft to base position (simplified — no taxiing animation yet)
  const baseLat = world.position.get(baseIdx, 'lat');
  const baseLon = world.position.get(baseIdx, 'lon');
  world.position.fields.get('lat')![acIdx] = baseLat;
  world.position.fields.get('lon')![acIdx] = baseLon;
  world.position.fields.get('alt')![acIdx] = feetToMeters(1000); // initial climb-out

  // Set cruise speed
  const cruiseSpeed = world.aircraft.get(acIdx, 'cruiseSpeed');
  world.velocity.set(acIdx, { speed: cruiseSpeed, climbRate: 10, turnRate: 0 });

  // Set up mission with home base
  let mission = missions.get(acIdx);
  if (!mission) {
    mission = {
      state: MissionState.IDLE,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: baseLat,
      homeBaseLon: baseLon,
      homeBaseCallsign: cmd.base,
      loiterUntil: 0,
      targetIdx: -1,
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: null,
    };
    missions.set(acIdx, mission);
  } else {
    mission.homeBaseLat = baseLat;
    mission.homeBaseLon = baseLon;
    mission.homeBaseCallsign = cmd.base;
  }

  mission.state = MissionState.ENROUTE;
  mission.waypoints = [];

  world.emit({
    type: 'mission:state_change',
    entityId: acIdx,
    from: MissionState.IDLE,
    to: MissionState.ENROUTE,
  });
  world.emit({
    type: 'command:executed',
    command: 'SCRAMBLE',
    success: true,
    message: `${cmd.callsign} scrambled from ${cmd.base}${cmd.loadout ? ` with ${cmd.loadout}` : ''}`,
  });
}
