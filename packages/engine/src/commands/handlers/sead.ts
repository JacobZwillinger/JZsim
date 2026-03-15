import { type Command, entityIndex } from '@jzsim/core';
import type { World } from '../../ecs/world.js';
import { MissionState } from '../../components/mission.js';

type SeadCommand = Extract<Command, { type: 'SEAD' }>;

/**
 * SEAD command: order an aircraft to suppress enemy air defenses.
 * Aircraft flies to the designated area, detects SAM radar emissions,
 * and attacks emitting SAM sites with available weapons.
 */
export function handleSead(cmd: SeadCommand, world: World): void {
  const id = world.entities.resolve(cmd.callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'SEAD', error: `Unknown callsign: ${cmd.callsign}` });
    return;
  }

  const idx = entityIndex(id);

  if (!world.aircraft.has(idx)) {
    world.emit({ type: 'command:error', command: 'SEAD', error: `${cmd.callsign} is not an aircraft` });
    return;
  }

  // Check ammo
  const loadout = world.loadouts.get(idx);
  if (loadout) {
    const totalAmmo = loadout.primaryAmmo + loadout.secondaryAmmo;
    if (totalAmmo === 0) {
      world.emit({ type: 'command:error', command: 'SEAD', error: `${cmd.callsign} has no weapons — cannot perform SEAD` });
      return;
    }
  }

  const prevState = world.missions.getState(idx) ?? 'IDLE';

  // Enable engagement mode
  world.aircraft.fields.get('entityType')![idx] = 2;

  // Set mission to SEAD
  let mission = world.missions.get(idx);
  if (!mission) {
    mission = {
      state: MissionState.SEAD,
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
      seadAreaLat: cmd.lat,
      seadAreaLon: cmd.lon,
      previousState: null,
    };
    world.missions.set(idx, mission);
  } else {
    mission.state = MissionState.SEAD;
    mission.seadAreaLat = cmd.lat;
    mission.seadAreaLon = cmd.lon;
    mission.targetIdx = -1;
  }

  world.emit({
    type: 'mission:state_change',
    entityId: idx,
    from: prevState,
    to: MissionState.SEAD,
  });

  world.emit({
    type: 'command:executed',
    command: 'SEAD',
    success: true,
    message: `${cmd.callsign} executing SEAD mission at (${cmd.lat.toFixed(2)}, ${cmd.lon.toFixed(2)})`,
  });
}
