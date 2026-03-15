import { type Command, MUNS_PRESETS } from '@jzsim/core';
import type { World } from '../../ecs/world.js';
import { findCallsign, findBaseByCallsign } from '../../util/callsign.js';

type LoadMunsCommand = Extract<Command, { type: 'LOAD_MUNS' }>;

export function handleLoadMuns(cmd: LoadMunsCommand, world: World): void {
  if (cmd.target === 'ALL_BASES') {
    loadAllBases(world, cmd.level, cmd.weaponKey, cmd.count);
  } else {
    loadSingleBase(world, cmd.target, cmd.level, cmd.weaponKey, cmd.count);
  }
}

function loadAllBases(world: World, level: string, weaponKey?: string, count?: number): void {
  let loaded = 0;
  for (const [baseIdx] of world.baseInventory.entries()) {
    applyLoad(world, baseIdx, level, weaponKey, count);
    loaded++;
  }

  if (loaded === 0) {
    world.emit({ type: 'command:error', command: 'LOAD_MUNS', error: 'No bases found to load munitions' });
    return;
  }

  world.emit({
    type: 'command:executed',
    command: 'LOAD_MUNS',
    success: true,
    message: `Loaded MUNS (${level}) on ${loaded} base(s)`,
  });

  world.emit({ type: 'muns:loaded', baseCallsign: 'ALL', level });
}

function loadSingleBase(world: World, baseCallsign: string, level: string, weaponKey?: string, count?: number): void {
  const baseIdx = findBaseByCallsign(world, baseCallsign);
  if (baseIdx < 0) {
    world.emit({ type: 'command:error', command: 'LOAD_MUNS', error: `Base "${baseCallsign}" not found` });
    return;
  }

  applyLoad(world, baseIdx, level, weaponKey, count);

  const cs = findCallsign(world, baseIdx);
  world.emit({
    type: 'command:executed',
    command: 'LOAD_MUNS',
    success: true,
    message: weaponKey
      ? `Loaded ${count ?? 0} ${weaponKey} on ${cs}`
      : `Loaded MUNS (${level}) on ${cs}`,
  });

  world.emit({ type: 'muns:loaded', baseCallsign: cs, level });
}

function applyLoad(world: World, baseIdx: number, level: string, weaponKey?: string, count?: number): void {
  const inv = world.baseInventory.get(baseIdx);
  if (!inv) return;

  if (weaponKey && count !== undefined) {
    // Specific weapon + count
    inv.munitions.set(weaponKey, (inv.munitions.get(weaponKey) ?? 0) + count);
  } else {
    // Apply preset
    const preset = MUNS_PRESETS[level as keyof typeof MUNS_PRESETS] ?? MUNS_PRESETS.STANDARD;
    for (const [wk, qty] of Object.entries(preset)) {
      inv.munitions.set(wk, qty);
    }
  }
}
