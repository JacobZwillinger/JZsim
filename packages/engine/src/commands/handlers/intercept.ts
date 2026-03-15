import { type Command, entityIndex } from '@jzsim/core';
import type { World } from '../../ecs/world.js';
import { MissionState } from '../../components/mission.js';

type InterceptCommand = Extract<Command, { type: 'INTERCEPT' }>;

/**
 * INTERCEPT command: steer toward a target and auto-engage when in range.
 * Sets mission to INTERCEPT and enables engagement mode.
 */
export function handleIntercept(cmd: InterceptCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'INTERCEPT', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const targetId = world.entities.resolve(cmd.target);
  if (targetId === null) {
    world.emit({ type: 'command:error', command: 'INTERCEPT', error: `Unknown target: ${cmd.target}` });
    return;
  }

  const idx = entityIndex(id);
  const targetIdx = entityIndex(targetId);

  if (!world.aircraft.has(idx)) {
    world.emit({ type: 'command:error', command: 'INTERCEPT', error: `${cmd.callsign} is not an aircraft` });
    return;
  }

  if (!world.position.has(targetIdx)) {
    world.emit({ type: 'command:error', command: 'INTERCEPT', error: `Target ${cmd.target} has no position` });
    return;
  }

  // Enable engagement mode
  world.aircraft.fields.get('entityType')![idx] = 2;

  const prevState = world.missions.getState(idx) ?? 'IDLE';

  // Set mission to INTERCEPT with target
  world.missions.set(idx, {
    state: MissionState.INTERCEPT,
    waypoints: [],
    currentWptIdx: 0,
    patrolPoint1: null,
    patrolPoint2: null,
    patrolLeg: 0,
    homeBaseLat: 0,
    homeBaseLon: 0,
    homeBaseCallsign: '',
    loiterUntil: 0,
    targetIdx,
    seadAreaLat: 0,
    seadAreaLon: 0,
    previousState: null,
  });

  world.emit({
    type: 'mission:state_change',
    entityId: idx,
    from: prevState,
    to: MissionState.INTERCEPT,
  });

  world.emit({
    type: 'command:executed', command: 'INTERCEPT', success: true,
    message: `${cmd.callsign} intercepting ${cmd.target}`,
  });
}
