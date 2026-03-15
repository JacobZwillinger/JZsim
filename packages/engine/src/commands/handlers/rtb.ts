import { type Command, entityIndex } from '@jzsim/core';
import type { World } from '../../ecs/world.js';
import { MissionState } from '../../components/mission.js';

type RTBCommand = Extract<Command, { type: 'RTB' }>;

export function handleRTB(cmd: RTBCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'RTB', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const idx = entityIndex(id);
  const mission = world.missions.get(idx);

  if (!mission) {
    world.emit({ type: 'command:error', command: 'RTB', error: `${cmd.callsign} has no mission data. Use SCRAMBLE first.` });
    return;
  }

  const prevState = mission.state;
  mission.state = MissionState.RTB;
  mission.waypoints = [];

  world.emit({
    type: 'mission:state_change',
    entityId: idx,
    from: prevState,
    to: MissionState.RTB,
  });
  world.emit({
    type: 'command:executed',
    command: 'RTB',
    success: true,
    message: `${cmd.callsign} returning to base (${mission.homeBaseCallsign || `${mission.homeBaseLat.toFixed(2)},${mission.homeBaseLon.toFixed(2)}`})`,
  });
}
