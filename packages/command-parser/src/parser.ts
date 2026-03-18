import type { Command } from '@jzsim/core';

/**
 * Simple command parser for the simulation DSL.
 * Parses text commands like:
 *   SPAWN F-15C EAGLE01 AT 26.35 127.77 ALT 25000 SIDE blue
 *   FLY EAGLE01 TO 28.0 130.0 AT 30000 SPEED 500
 *   SET SPEED EAGLE01 600
 *   SET ALT EAGLE01 35000
 *   SET HEADING EAGLE01 270
 *   STATUS EAGLE01
 *   REMOVE EAGLE01
 */
export function parseCommand(input: string): Command | null {
  const raw = input.trim();
  if (!raw) return null;

  const tokens = raw.split(/\s+/);
  const keyword = tokens[0].toUpperCase();

  switch (keyword) {
    case 'SPAWN': return parseSpawn(tokens);
    case 'FLY': return parseFlyTo(tokens);
    case 'SET': return parseSet(tokens);
    case 'STATUS': return parseStatus(tokens);
    case 'REMOVE': return parseRemove(tokens);
    case 'SCRAMBLE': return parseScramble(tokens);
    case 'RTB': return parseRtb(tokens);
    case 'ATTACK': return parseAttack(tokens);
    case 'RADAR': return parseRadar(tokens);
    case 'PATROL': return parsePatrol(tokens);
    case 'ENGAGE': return parseEngage(tokens);
    case 'DISENGAGE': return parseDisengage(tokens);
    case 'INTERCEPT': return parseIntercept(tokens);
    case 'ASSIGN': return parseAssignBase(tokens);
    case 'LOAD': return parseLoadMuns(tokens);
    case 'ARM': return parseArm(tokens);
    case 'SEAD': return parseSead(tokens);
    case 'REFUEL': return parseRefuel(tokens);
    case 'EQUIP': return parseEquip(tokens);
    case 'JETTISON': return parseJettison(tokens);
    case 'DMPI': return parseDmpi(tokens);
    case 'STRIKE': return parseStrike(tokens);
    default: return null;
  }
}

function parseSpawn(tokens: string[]): Command | null {
  // SPAWN <type> <callsign> AT <lat> <lon> [ALT <alt>] [SIDE <side>] [HEADING <hdg>] [SPEED <spd>]
  if (tokens.length < 6) return null;

  const entityType = tokens[1];
  const callsign = tokens[2];

  // Find AT keyword
  const atIdx = tokens.findIndex((t, i) => i > 2 && t.toUpperCase() === 'AT');
  if (atIdx < 0 || atIdx + 2 >= tokens.length) return null;

  const lat = parseFloat(tokens[atIdx + 1]);
  const lon = parseFloat(tokens[atIdx + 2]);
  if (isNaN(lat) || isNaN(lon)) return null;

  const cmd: Command = { type: 'SPAWN', entityType, callsign, lat, lon };

  // Optional keywords
  const altIdx = tokens.findIndex((t, i) => i > atIdx && t.toUpperCase() === 'ALT');
  if (altIdx >= 0 && altIdx + 1 < tokens.length) {
    cmd.alt = parseFloat(tokens[altIdx + 1]);
  }

  const sideIdx = tokens.findIndex((t, i) => i > atIdx && t.toUpperCase() === 'SIDE');
  if (sideIdx >= 0 && sideIdx + 1 < tokens.length) {
    cmd.side = tokens[sideIdx + 1].toLowerCase();
  }

  const hdgIdx = tokens.findIndex((t, i) => i > atIdx && t.toUpperCase() === 'HEADING');
  if (hdgIdx >= 0 && hdgIdx + 1 < tokens.length) {
    cmd.heading = parseFloat(tokens[hdgIdx + 1]);
  }

  const spdIdx = tokens.findIndex((t, i) => i > atIdx && t.toUpperCase() === 'SPEED');
  if (spdIdx >= 0 && spdIdx + 1 < tokens.length) {
    cmd.speed = parseFloat(tokens[spdIdx + 1]);
  }

  return cmd;
}

function parseFlyTo(tokens: string[]): Command | null {
  // FLY <callsign> TO <lat> <lon> [AT <alt>] [SPEED <speed>]
  if (tokens.length < 5) return null;

  const callsign = tokens[1];
  const toIdx = tokens.findIndex((t, i) => i > 1 && t.toUpperCase() === 'TO');
  if (toIdx < 0 || toIdx + 2 >= tokens.length) return null;

  const lat = parseFloat(tokens[toIdx + 1]);
  const lon = parseFloat(tokens[toIdx + 2]);
  if (isNaN(lat) || isNaN(lon)) return null;

  const cmd: Command = { type: 'FLY_TO', callsign, lat, lon };

  const atIdx = tokens.findIndex((t, i) => i > toIdx && t.toUpperCase() === 'AT');
  if (atIdx >= 0 && atIdx + 1 < tokens.length) {
    cmd.alt = parseFloat(tokens[atIdx + 1]);
  }

  const spdIdx = tokens.findIndex((t, i) => i > toIdx && t.toUpperCase() === 'SPEED');
  if (spdIdx >= 0 && spdIdx + 1 < tokens.length) {
    cmd.speed = parseFloat(tokens[spdIdx + 1]);
  }

  return cmd;
}

function parseSet(tokens: string[]): Command | null {
  // SET SPEED <callsign> <speed>
  // SET ALT <callsign> <alt>
  // SET HEADING <callsign> <heading>
  if (tokens.length < 4) return null;

  const subCmd = tokens[1].toUpperCase();
  const callsign = tokens[2];
  const value = parseFloat(tokens[3]);
  if (isNaN(value)) return null;

  switch (subCmd) {
    case 'SPEED': return { type: 'SET_SPEED', callsign, speed: value };
    case 'ALT': return { type: 'SET_ALT', callsign, alt: value };
    case 'HEADING': return { type: 'SET_HEADING', callsign, heading: value };
    default: return null;
  }
}

function parseStatus(tokens: string[]): Command | null {
  if (tokens.length < 2) return null;
  return { type: 'STATUS', callsign: tokens[1] };
}

function parseRemove(tokens: string[]): Command | null {
  if (tokens.length < 2) return null;
  return { type: 'REMOVE', callsign: tokens[1] };
}

function parseScramble(tokens: string[]): Command | null {
  // SCRAMBLE <callsign> FROM <base> [WITH <loadout>]
  if (tokens.length < 4) return null;
  const callsign = tokens[1];
  const fromIdx = tokens.findIndex((t, i) => i > 1 && t.toUpperCase() === 'FROM');
  if (fromIdx < 0 || fromIdx + 1 >= tokens.length) return null;
  const base = tokens[fromIdx + 1];
  const withIdx = tokens.findIndex((t, i) => i > fromIdx && t.toUpperCase() === 'WITH');
  const loadout = withIdx >= 0 && withIdx + 1 < tokens.length ? tokens[withIdx + 1] : undefined;
  return { type: 'SCRAMBLE', callsign, base, loadout };
}

function parseRtb(tokens: string[]): Command | null {
  if (tokens.length < 2) return null;
  return { type: 'RTB', callsign: tokens[1] };
}

function parseAttack(tokens: string[]): Command | null {
  // ATTACK <callsign> TARGET <target>
  if (tokens.length < 4) return null;
  const callsign = tokens[1];
  const tgtIdx = tokens.findIndex((t, i) => i > 1 && t.toUpperCase() === 'TARGET');
  if (tgtIdx < 0 || tgtIdx + 1 >= tokens.length) return null;
  const target = tokens[tgtIdx + 1];
  return { type: 'ATTACK', callsign, target };
}

function parseRadar(tokens: string[]): Command | null {
  // RADAR <callsign> <ON|OFF|STANDBY>
  if (tokens.length < 3) return null;
  const callsign = tokens[1];
  const mode = tokens[2].toUpperCase() as 'ON' | 'OFF' | 'STANDBY';
  if (!['ON', 'OFF', 'STANDBY'].includes(mode)) return null;
  return { type: 'RADAR_MODE', callsign, mode };
}

function parsePatrol(tokens: string[]): Command | null {
  // PATROL <callsign> BETWEEN <lat1> <lon1> AND <lat2> <lon2> [AT <alt>]
  if (tokens.length < 8) return null;
  const callsign = tokens[1];
  const betweenIdx = tokens.findIndex((t, i) => i > 1 && t.toUpperCase() === 'BETWEEN');
  if (betweenIdx < 0 || betweenIdx + 3 >= tokens.length) return null;
  const lat1 = parseFloat(tokens[betweenIdx + 1]);
  const lon1 = parseFloat(tokens[betweenIdx + 2]);
  const andIdx = tokens.findIndex((t, i) => i > betweenIdx + 2 && t.toUpperCase() === 'AND');
  if (andIdx < 0 || andIdx + 2 >= tokens.length) return null;
  const lat2 = parseFloat(tokens[andIdx + 1]);
  const lon2 = parseFloat(tokens[andIdx + 2]);
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return null;
  const cmd: Command = {
    type: 'PATROL',
    callsign,
    point1: { lat: lat1, lon: lon1 },
    point2: { lat: lat2, lon: lon2 },
  };
  const atIdx = tokens.findIndex((t, i) => i > andIdx && t.toUpperCase() === 'AT');
  if (atIdx >= 0 && atIdx + 1 < tokens.length) {
    cmd.alt = parseFloat(tokens[atIdx + 1]);
  }
  return cmd;
}

function parseEngage(tokens: string[]): Command | null {
  // ENGAGE <callsign>
  if (tokens.length < 2) return null;
  return { type: 'ENGAGE', callsign: tokens[1] };
}

function parseDisengage(tokens: string[]): Command | null {
  // DISENGAGE <callsign>
  if (tokens.length < 2) return null;
  return { type: 'DISENGAGE', callsign: tokens[1] };
}

function parseIntercept(tokens: string[]): Command | null {
  // INTERCEPT <callsign> TARGET <target>
  if (tokens.length < 4) return null;
  const callsign = tokens[1];
  const tgtIdx = tokens.findIndex((t, i) => i > 1 && t.toUpperCase() === 'TARGET');
  if (tgtIdx < 0 || tgtIdx + 1 >= tokens.length) return null;
  const target = tokens[tgtIdx + 1];
  return { type: 'INTERCEPT', callsign, target };
}

function parseAssignBase(tokens: string[]): Command | null {
  // ASSIGN <callsign> TO <base>
  if (tokens.length < 4) return null;
  const callsign = tokens[1];
  const toIdx = tokens.findIndex((t, i) => i > 1 && t.toUpperCase() === 'TO');
  if (toIdx < 0 || toIdx + 1 >= tokens.length) return null;
  return { type: 'ASSIGN_BASE', callsign, base: tokens[toIdx + 1] };
}

function parseLoadMuns(tokens: string[]): Command | null {
  // LOAD MUNS ON ALL BASES [LEVEL HIGH|LOW|STANDARD]
  // LOAD MUNS ON <base> [LEVEL HIGH|LOW|STANDARD]
  // LOAD MUNS ON <base> <weaponKey> <count>
  if (tokens.length < 4) return null;
  if (tokens[1].toUpperCase() !== 'MUNS') return null;
  if (tokens[2].toUpperCase() !== 'ON') return null;

  // Check for "ALL BASES"
  if (tokens.length >= 5 && tokens[3].toUpperCase() === 'ALL' && tokens[4].toUpperCase() === 'BASES') {
    const levelIdx = tokens.findIndex((t, i) => i > 4 && t.toUpperCase() === 'LEVEL');
    const level = (levelIdx >= 0 && levelIdx + 1 < tokens.length)
      ? tokens[levelIdx + 1].toUpperCase() as 'STANDARD' | 'HIGH' | 'LOW'
      : 'STANDARD';
    return { type: 'LOAD_MUNS', target: 'ALL_BASES', level };
  }

  // Single base
  const base = tokens[3];
  const levelIdx = tokens.findIndex((t, i) => i > 3 && t.toUpperCase() === 'LEVEL');
  if (levelIdx >= 0 && levelIdx + 1 < tokens.length) {
    const level = tokens[levelIdx + 1].toUpperCase() as 'STANDARD' | 'HIGH' | 'LOW';
    return { type: 'LOAD_MUNS', target: base, level };
  }

  // Specific weapon: LOAD MUNS ON <base> <weaponKey> <count>
  if (tokens.length >= 6) {
    const weaponKey = tokens[4];
    const count = parseInt(tokens[5]);
    if (!isNaN(count)) {
      return { type: 'LOAD_MUNS', target: base, level: 'STANDARD', weaponKey, count };
    }
  }

  return { type: 'LOAD_MUNS', target: base, level: 'STANDARD' };
}

function parseArm(tokens: string[]): Command | null {
  // ARM <callsign>
  // ARM <callsign> WITH <weaponKey> <count>
  if (tokens.length < 2) return null;
  const callsign = tokens[1];
  const withIdx = tokens.findIndex((t, i) => i > 1 && t.toUpperCase() === 'WITH');
  if (withIdx >= 0 && withIdx + 2 < tokens.length) {
    const weaponKey = tokens[withIdx + 1];
    const count = parseInt(tokens[withIdx + 2]);
    if (!isNaN(count)) {
      return { type: 'ARM', callsign, weaponKey, count };
    }
  }
  return { type: 'ARM', callsign };
}

function parseSead(tokens: string[]): Command | null {
  // SEAD <callsign> AT <lat> <lon>
  if (tokens.length < 5) return null;
  const callsign = tokens[1];
  const atIdx = tokens.findIndex((t, i) => i > 1 && t.toUpperCase() === 'AT');
  if (atIdx < 0 || atIdx + 2 >= tokens.length) return null;
  const lat = parseFloat(tokens[atIdx + 1]);
  const lon = parseFloat(tokens[atIdx + 2]);
  if (isNaN(lat) || isNaN(lon)) return null;
  return { type: 'SEAD', callsign, lat, lon };
}

function parseRefuel(tokens: string[]): Command | null {
  // REFUEL <callsign> AT <tanker_callsign>
  if (tokens.length < 4) return null;
  const callsign = tokens[1];
  const atIdx = tokens.findIndex((t, i) => i > 1 && t.toUpperCase() === 'AT');
  if (atIdx < 0 || atIdx + 1 >= tokens.length) return null;
  const at = tokens[atIdx + 1];
  return { type: 'REFUEL', callsign, at };
}

function parseEquip(tokens: string[]): Command | null {
  // EQUIP <callsign> <pod_type>
  if (tokens.length < 3) return null;
  return { type: 'EQUIP', callsign: tokens[1], podType: tokens[2].toUpperCase() };
}

function parseJettison(tokens: string[]): Command | null {
  // JETTISON <callsign> <pod_type>
  if (tokens.length < 3) return null;
  return { type: 'JETTISON', callsign: tokens[1], podType: tokens[2].toUpperCase() };
}

function parseDmpi(tokens: string[]): Command | null {
  // DMPI ADD <name> AT <lat> <lon> [DESC <description...>]
  // DMPI REMOVE <name>
  if (tokens.length < 3) return null;
  const subCmd = tokens[1].toUpperCase();

  if (subCmd === 'ADD') {
    if (tokens.length < 6) return null;
    const name = tokens[2].toUpperCase();
    const atIdx = tokens.findIndex((t, i) => i > 2 && t.toUpperCase() === 'AT');
    if (atIdx < 0 || atIdx + 2 >= tokens.length) return null;
    const lat = parseFloat(tokens[atIdx + 1]);
    const lon = parseFloat(tokens[atIdx + 2]);
    if (isNaN(lat) || isNaN(lon)) return null;
    const descIdx = tokens.findIndex((t, i) => i > atIdx + 2 && t.toUpperCase() === 'DESC');
    const description = descIdx >= 0 ? tokens.slice(descIdx + 1).join(' ') : undefined;
    return { type: 'DMPI_ADD', name, lat, lon, description };
  }

  if (subCmd === 'REMOVE' || subCmd === 'DELETE') {
    if (tokens.length < 3) return null;
    return { type: 'DMPI_REMOVE', name: tokens[2].toUpperCase() };
  }

  return null;
}

function parseStrike(tokens: string[]): Command | null {
  // STRIKE <callsign> TARGETS <dmpi1> <dmpi2> ... [WEAPONS <count>]
  if (tokens.length < 4) return null;
  const callsign = tokens[1];
  const tgtIdx = tokens.findIndex((t, i) => i > 1 && t.toUpperCase() === 'TARGETS');
  if (tgtIdx < 0) return null;

  const weaponsIdx = tokens.findIndex((t, i) => i > tgtIdx && t.toUpperCase() === 'WEAPONS');
  const endIdx = weaponsIdx >= 0 ? weaponsIdx : tokens.length;
  const dmpiNames = tokens.slice(tgtIdx + 1, endIdx).map(n => n.toUpperCase());
  if (dmpiNames.length === 0) return null;

  let weaponPerDmpi: number | undefined;
  if (weaponsIdx >= 0 && weaponsIdx + 1 < tokens.length) {
    weaponPerDmpi = parseInt(tokens[weaponsIdx + 1]);
    if (isNaN(weaponPerDmpi)) weaponPerDmpi = undefined;
  }

  return { type: 'STRIKE', callsign, dmpiNames, weaponPerDmpi };
}

/** Get list of available command keywords for autocomplete */
export function getCommandKeywords(): string[] {
  return [
    'SPAWN', 'FLY', 'SET', 'STATUS', 'REMOVE',
    'SCRAMBLE', 'RTB', 'ATTACK', 'RADAR', 'PATROL',
    'ENGAGE', 'DISENGAGE', 'INTERCEPT',
    'ASSIGN', 'LOAD', 'ARM',
    'SEAD', 'REFUEL', 'EQUIP', 'JETTISON',
    'DMPI', 'STRIKE',
  ];
}

/** Get help text for a given command keyword */
export function getCommandHelp(keyword: string): string | null {
  const help: Record<string, string> = {
    'SPAWN': 'SPAWN <type> <callsign> AT <lat> <lon> [ALT <alt>] [SIDE blue|red] [HEADING <deg>] [SPEED <kts>]',
    'FLY': 'FLY <callsign> TO <lat> <lon> [AT <alt_ft>] [SPEED <kts>]',
    'SET': 'SET SPEED|ALT|HEADING <callsign> <value>',
    'STATUS': 'STATUS <callsign>',
    'REMOVE': 'REMOVE <callsign>',
    'SCRAMBLE': 'SCRAMBLE <callsign> FROM <base> [WITH <loadout>]',
    'RTB': 'RTB <callsign>',
    'ATTACK': 'ATTACK <callsign> TARGET <target_callsign>',
    'RADAR': 'RADAR <callsign> ON|OFF|STANDBY',
    'PATROL': 'PATROL <callsign> BETWEEN <lat1> <lon1> AND <lat2> <lon2> [AT <alt_ft>]',
    'ENGAGE': 'ENGAGE <callsign> — weapons free, auto-engage nearby enemies',
    'DISENGAGE': 'DISENGAGE <callsign> — weapons hold, stop auto-engaging',
    'INTERCEPT': 'INTERCEPT <callsign> TARGET <target_callsign> — pursue and engage target',
    'ASSIGN': 'ASSIGN <callsign> TO <base> — assign aircraft to a base',
    'LOAD': 'LOAD MUNS ON ALL BASES [LEVEL HIGH|LOW|STANDARD] — load munitions on bases',
    'ARM': 'ARM <callsign> [WITH <weapon> <count>] — arm aircraft from base inventory',
    'SEAD': 'SEAD <callsign> AT <lat> <lon> — suppress enemy air defenses in area',
    'REFUEL': 'REFUEL <callsign> AT <tanker_callsign> — fly to tanker and refuel',
    'EQUIP': 'EQUIP <callsign> <pod_type> — attach external pod (ECM, TGP, RECON, FUEL_TANK)',
    'JETTISON': 'JETTISON <callsign> <pod_type> — jettison external pod',
    'DMPI': 'DMPI ADD <name> AT <lat> <lon> [DESC <text>] | DMPI REMOVE <name>',
    'STRIKE': 'STRIKE <callsign> TARGETS <dmpi1> [dmpi2...] [WEAPONS <count_per_dmpi>]',
  };
  return help[keyword.toUpperCase()] ?? null;
}
