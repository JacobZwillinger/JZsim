import { entityIndex, bearing } from '@jzsim/core';
import type { Command } from '@jzsim/core';
import type { World } from '../../ecs/world.js';
import { MissionState } from '../../components/mission.js';

export function handleStrike(cmd: Extract<Command, { type: 'STRIKE' }>, world: World): void {
  const { callsign, dmpiNames, weaponPerDmpi } = cmd;

  // Resolve callsign
  const id = world.entities.resolve(callsign);
  if (id === null) {
    world.emit({ type: 'command:error', command: 'STRIKE', error: `Entity "${callsign}" not found` });
    return;
  }
  const idx = entityIndex(id);

  // Validate entity is an aircraft
  if (!world.aircraft.has(idx)) {
    world.emit({ type: 'command:error', command: 'STRIKE', error: `${callsign} is not an aircraft` });
    return;
  }

  // Validate DMPI names
  if (!dmpiNames || dmpiNames.length === 0) {
    world.emit({ type: 'command:error', command: 'STRIKE', error: 'No DMPI targets specified' });
    return;
  }

  const missing = dmpiNames.filter(n => !world.dmpis.has(n));
  if (missing.length > 0) {
    world.emit({ type: 'command:error', command: 'STRIKE', error: `DMPI not found: ${missing.join(', ')}` });
    return;
  }

  // Create strike route
  world.strikes.set(idx, {
    dmpiNames: [...dmpiNames],
    currentDmpiIdx: 0,
    completedDmpis: [],
    weaponPerDmpi: weaponPerDmpi ?? 1,
  });

  // Set mission state to STRIKE
  const mission = world.missions.get(idx);
  if (mission) {
    const prevState = mission.state;
    mission.state = MissionState.STRIKE;
    world.emit({ type: 'mission:state_change', entityId: idx, from: prevState, to: MissionState.STRIKE });
  } else {
    // Create mission entry
    world.missions.set(idx, {
      state: MissionState.STRIKE,
      waypoints: [],
      currentWptIdx: 0,
      patrolPoint1: null,
      patrolPoint2: null,
      patrolLeg: 0,
      homeBaseLat: 0,
      homeBaseLon: 0,
      homeBaseCallsign: '',
      loiterUntil: 0,
      targetIdx: -1,
      seadAreaLat: 0,
      seadAreaLon: 0,
      previousState: null,
    });
    world.emit({ type: 'mission:state_change', entityId: idx, from: 'IDLE', to: MissionState.STRIKE });
  }

  // Steer toward first DMPI
  const firstDmpi = world.dmpis.get(dmpiNames[0])!;
  const lat = world.position.get(idx, 'lat');
  const lon = world.position.get(idx, 'lon');
  const hdg = bearing(lat, lon, firstDmpi.lat, firstDmpi.lon);
  world.position.fields.get('heading')![idx] = hdg;

  // Ensure moving at cruise speed
  if (world.velocity.has(idx) && world.aircraft.has(idx)) {
    world.velocity.fields.get('speed')![idx] = world.aircraft.get(idx, 'cruiseSpeed');
  }

  world.emit({
    type: 'strike:assigned',
    entityId: idx,
    callsign,
    dmpiNames: [...dmpiNames],
    weaponPerDmpi: weaponPerDmpi ?? 1,
  });
  world.emit({
    type: 'command:executed',
    command: 'STRIKE',
    success: true,
    message: `${callsign} STRIKE mission: ${dmpiNames.length} DMPIs — ${dmpiNames.join(' → ')}`,
  });
}
