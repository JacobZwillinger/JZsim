import { type Command, entityIndex, feetToMeters } from '@jzsim/core';
import type { World } from '../../ecs/world.js';
import { MissionState } from '../../components/mission.js';

type PatrolCommand = Extract<Command, { type: 'PATROL' }>;

export function handlePatrol(cmd: PatrolCommand, world: World): void {
  const missions = world.missions;
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'PATROL', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const idx = entityIndex(id);
  const altM = cmd.alt ? feetToMeters(cmd.alt) : world.position.get(idx, 'alt');
  const speed = world.velocity.has(idx) ? world.velocity.get(idx, 'speed') : 250;

  const p1 = { lat: cmd.point1.lat, lon: cmd.point1.lon, alt: altM, speed };
  const p2 = { lat: cmd.point2.lat, lon: cmd.point2.lon, alt: altM, speed };

  let mission = missions.get(idx);
  if (!mission) {
    mission = {
      state: MissionState.IDLE,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: world.position.get(idx, 'lat'),
      homeBaseLon: world.position.get(idx, 'lon'),
      homeBaseCallsign: '',
      loiterUntil: 0,
      targetIdx: -1,
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: null,
    };
    missions.set(idx, mission);
  }

  const prevState = mission.state;
  mission.patrolPoint1 = p1;
  mission.patrolPoint2 = p2;
  mission.patrolLeg = 0;
  mission.state = MissionState.PATROL;

  world.emit({
    type: 'mission:state_change',
    entityId: idx,
    from: prevState,
    to: MissionState.PATROL,
  });
  world.emit({
    type: 'command:executed',
    command: 'PATROL',
    success: true,
    message: `${cmd.callsign} patrolling between (${cmd.point1.lat.toFixed(2)},${cmd.point1.lon.toFixed(2)}) and (${cmd.point2.lat.toFixed(2)},${cmd.point2.lon.toFixed(2)})`,
  });
}
