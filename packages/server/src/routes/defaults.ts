import type { FastifyInstance } from 'fastify';
import {
  AIRCRAFT_DEFAULTS,
  WEAPON_DEFAULTS,
  RADAR_DEFAULTS,
  SAM_DEFAULTS,
  LOADOUT_DEFAULTS,
  TANKER_DEFAULTS,
  MUNS_PRESETS,
} from '@jzsim/core';

export function defaultRoutes(app: FastifyInstance): void {
  app.get('/api/defaults/aircraft', {
    schema: {
      description: 'Get all aircraft type defaults (performance, fuel, RCS)',
      tags: ['defaults'],
    },
  }, async () => {
    return AIRCRAFT_DEFAULTS;
  });

  app.get('/api/defaults/weapons', {
    schema: {
      description: 'Get all weapon type defaults',
      tags: ['defaults'],
    },
  }, async () => {
    return WEAPON_DEFAULTS;
  });

  app.get('/api/defaults/radars', {
    schema: {
      description: 'Get all radar type defaults',
      tags: ['defaults'],
    },
  }, async () => {
    return RADAR_DEFAULTS;
  });

  app.get('/api/defaults/sams', {
    schema: {
      description: 'Get all SAM site type defaults',
      tags: ['defaults'],
    },
  }, async () => {
    return SAM_DEFAULTS;
  });

  app.get('/api/defaults/loadouts', {
    schema: {
      description: 'Get all aircraft loadout defaults (weapons per type)',
      tags: ['defaults'],
    },
  }, async () => {
    return LOADOUT_DEFAULTS;
  });

  app.get('/api/defaults/tankers', {
    schema: {
      description: 'Get tanker refueling parameters',
      tags: ['defaults'],
    },
  }, async () => {
    return TANKER_DEFAULTS;
  });

  app.get('/api/defaults/munitions-presets', {
    schema: {
      description: 'Get munitions stockpile preset levels (STANDARD, HIGH, LOW)',
      tags: ['defaults'],
    },
  }, async () => {
    return MUNS_PRESETS;
  });
}
