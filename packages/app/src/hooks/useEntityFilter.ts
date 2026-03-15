import { useMemo } from 'react';
import { ModelType, Side } from '@jzsim/core';
import type { EntityInfo } from '../store/ui-store.js';

const NOISE_WORDS = new Set([
  'show', 'see', 'the', 'only', 'all', 'me', 'find', 'get', 'list', 'display', 'where', 'are', 'my', 'our',
]);

// Type keyword → ModelType mapping
const TYPE_KEYWORDS: Record<string, number> = {
  fighter: ModelType.FIGHTER, fighters: ModelType.FIGHTER, ftr: ModelType.FIGHTER,
  bomber: ModelType.BOMBER, bombers: ModelType.BOMBER, bmr: ModelType.BOMBER,
  tanker: ModelType.TANKER, tankers: ModelType.TANKER, tnk: ModelType.TANKER,
  awacs: ModelType.AWACS, ew: ModelType.AWACS,
  transport: ModelType.TRANSPORT, transports: ModelType.TRANSPORT,
  sam: ModelType.SAM_SITE, sams: ModelType.SAM_SITE,
  radar: ModelType.RADAR_SITE, radars: ModelType.RADAR_SITE,
  base: ModelType.AIRBASE, bases: ModelType.AIRBASE, airbase: ModelType.AIRBASE,
  missile: ModelType.MISSILE, missiles: ModelType.MISSILE,
};

// Side keyword → Side mapping
const SIDE_KEYWORDS: Record<string, number> = {
  blue: Side.BLUE, friendly: Side.BLUE, friendlies: Side.BLUE,
  red: Side.RED, hostile: Side.RED, hostiles: Side.RED, enemy: Side.RED, enemies: Side.RED,
  neutral: Side.NEUTRAL,
};

// Mission keyword → mission state
const MISSION_KEYWORDS: Record<string, string> = {
  patrol: 'PATROL', patrolling: 'PATROL',
  rtb: 'RTB', returning: 'RTB',
  idle: 'IDLE',
  enroute: 'ENROUTE', transit: 'ENROUTE',
  landed: 'LANDED',
  intercept: 'INTERCEPT', intercepting: 'INTERCEPT',
  strike: 'ENROUTE', // strike cell = fighters on mission
};

interface FilterCriteria {
  types: number[];
  sides: number[];
  missions: string[];
  callsignSubstring: string[];
}

function parseQuery(query: string): FilterCriteria {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter((t) => t && !NOISE_WORDS.has(t));

  const criteria: FilterCriteria = { types: [], sides: [], missions: [], callsignSubstring: [] };

  for (const token of tokens) {
    if (TYPE_KEYWORDS[token] !== undefined) {
      criteria.types.push(TYPE_KEYWORDS[token]);
    } else if (SIDE_KEYWORDS[token] !== undefined) {
      criteria.sides.push(SIDE_KEYWORDS[token]);
    } else if (MISSION_KEYWORDS[token] !== undefined) {
      criteria.missions.push(MISSION_KEYWORDS[token]);
    } else {
      // Treat as callsign substring
      criteria.callsignSubstring.push(token);
    }
  }

  return criteria;
}

export function useEntityFilter(
  entities: EntityInfo[],
  callsigns: Map<number, string>,
  missionStates: Map<number, string>,
  searchQuery: string,
): EntityInfo[] {
  return useMemo(() => {
    if (!searchQuery.trim()) return entities;

    const criteria = parseQuery(searchQuery);

    return entities.filter((e) => {
      // AND logic: all criteria categories must match
      if (criteria.types.length > 0 && !criteria.types.includes(e.modelType)) return false;
      if (criteria.sides.length > 0 && !criteria.sides.includes(e.side)) return false;

      if (criteria.missions.length > 0) {
        const mission = missionStates.get(e.id) ?? 'IDLE';
        if (!criteria.missions.includes(mission)) return false;
      }

      if (criteria.callsignSubstring.length > 0) {
        const cs = (callsigns.get(e.id) ?? '').toLowerCase();
        if (!criteria.callsignSubstring.some((sub) => cs.includes(sub))) return false;
      }

      return true;
    });
  }, [entities, callsigns, missionStates, searchQuery]);
}
