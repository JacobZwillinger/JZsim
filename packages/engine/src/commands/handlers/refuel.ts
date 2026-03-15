import { type Command, entityIndex } from '@jzsim/core';
import type { World } from '../../ecs/world.js';
import { MissionState } from '../../components/mission.js';

type RefuelCommand = Extract<Command, { type: 'REFUEL' }>;

/**
 * REFUEL command: order an aircraft to fly to a tanker and refuel mid-flight.
 * Aircraft transitions to REFUELING state, flies to tanker, matches speed,
 * and receives fuel at real-world transfer rates.
 */
export function handleRefuel(cmd: RefuelCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'REFUEL', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const tankerId = world.entities.resolve(cmd.at);
  if (tankerId === null) {
    world.emit({ type: 'command:error', command: 'REFUEL', error: `Unknown tanker: ${cmd.at}` });
    return;
  }

  const idx = entityIndex(id);
  const tankerIdx = entityIndex(tankerId);

  if (!world.aircraft.has(idx)) {
    world.emit({ type: 'command:error', command: 'REFUEL', error: `${cmd.callsign} is not an aircraft` });
    return;
  }

  if (!world.position.has(tankerIdx)) {
    world.emit({ type: 'command:error', command: 'REFUEL', error: `Tanker ${cmd.at} has no position` });
    return;
  }

  // Verify tanker has offloadable fuel
  const tankerLoadout = world.loadouts.get(tankerIdx);
  if (!tankerLoadout || tankerLoadout.offloadableFuel <= 0) {
    world.emit({ type: 'command:error', command: 'REFUEL', error: `${cmd.at} cannot offload fuel (not a tanker or empty)` });
    return;
  }

  // Save current mission state so we can restore after refueling
  const prevState = world.missions.getState(idx) ?? MissionState.IDLE;

  let mission = world.missions.get(idx);
  if (!mission) {
    mission = {
      state: MissionState.REFUELING,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: world.position.get(idx, 'lat'),
      homeBaseLon: world.position.get(idx, 'lon'),
      homeBaseCallsign: '',
      loiterUntil: 0,
      targetIdx: tankerIdx,
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: prevState !== MissionState.REFUELING ? prevState : null,
    };
    world.missions.set(idx, mission);
  } else {
    mission.previousState = prevState !== MissionState.REFUELING ? prevState : mission.previousState;
    mission.state = MissionState.REFUELING;
    mission.targetIdx = tankerIdx;
  }

  world.emit({
    type: 'mission:state_change',
    entityId: idx,
    from: prevState,
    to: MissionState.REFUELING,
  });

  world.emit({
    type: 'command:executed',
    command: 'REFUEL',
    success: true,
    message: `${cmd.callsign} proceeding to tanker ${cmd.at} for refueling`,
  });
}
