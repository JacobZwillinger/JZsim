import { type Command, entityIndex, POD_DEFAULTS } from '@jzsim/core';
import type { World } from '../../ecs/world.js';

type EquipCommand = Extract<Command, { type: 'EQUIP' }>;

export function handleEquip(cmd: EquipCommand, world: World): void {
  const podKey = cmd.podType.toUpperCase();
  const podDef = POD_DEFAULTS[podKey];
  if (!podDef) {
    const validPods = Object.keys(POD_DEFAULTS).join(', ');
    world.emit({ type: 'command:error', command: 'EQUIP', error: `Unknown pod type "${cmd.podType}". Valid: ${validPods}` });
    return;
  }

  const acId = world.entities.callsignMap.get(cmd.callsign.toUpperCase());
  if (acId === undefined) {
    world.emit({ type: 'command:error', command: 'EQUIP', error: `Aircraft "${cmd.callsign}" not found` });
    return;
  }
  const acIdx = entityIndex(acId);

  if (!world.aircraft.has(acIdx)) {
    world.emit({ type: 'command:error', command: 'EQUIP', error: `"${cmd.callsign}" is not an aircraft` });
    return;
  }

  const loadout = world.loadouts.get(acIdx);
  if (!loadout) {
    world.emit({ type: 'command:error', command: 'EQUIP', error: `"${cmd.callsign}" has no loadout` });
    return;
  }

  loadout.externalPods.push(podKey);

  world.emit({
    type: 'command:executed',
    command: 'EQUIP',
    success: true,
    message: `${cmd.callsign} equipped ${podKey} (${podDef.description}, +${podDef.rcsM2} m² RCS)`,
  });
}
