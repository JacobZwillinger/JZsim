import type { FastifyInstance } from 'fastify';
import type { SimManager } from '../sim-manager.js';
import {
  serializeAllEntities,
  serializeEntity,
  serializeAircraft,
  serializeRadar,
  serializeSAM,
  serializeBase,
  serializeWeapon,
  findEntityByCallsign,
} from '../serializers.js';

export function entityRoutes(app: FastifyInstance, mgr: SimManager): void {
  app.get<{
    Querystring: { type?: string; side?: string };
  }>('/api/entities', {
    schema: {
      description: 'List all entities, optionally filtered by type and/or side',
      tags: ['entities'],
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Filter by category: aircraft, radar, sam, base, weapon' },
          side: { type: 'string', description: 'Filter by side: BLUE, RED, NEUTRAL' },
        },
      },
    },
  }, async (req) => {
    let entities = serializeAllEntities(mgr.world, mgr);

    if (req.query.type) {
      const t = req.query.type.toLowerCase();
      entities = entities.filter((e) => e.category === t);
    }

    if (req.query.side) {
      const s = req.query.side.toUpperCase();
      entities = entities.filter((e) => e.side === s);
    }

    return { count: entities.length, entities };
  });

  app.get<{ Params: { callsign: string } }>('/api/entities/:callsign', {
    schema: {
      description: 'Get full detail for a single entity by callsign',
      tags: ['entities'],
      params: {
        type: 'object',
        required: ['callsign'],
        properties: { callsign: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const idx = findEntityByCallsign(mgr.world, req.params.callsign);
    if (idx < 0) {
      return reply.status(404).send({ error: `Entity not found: ${req.params.callsign}` });
    }

    // Return the most specific serialization
    const world = mgr.world;
    const aircraft = serializeAircraft(world, idx, mgr);
    if (aircraft) return { type: 'aircraft', data: aircraft };

    const sam = serializeSAM(world, idx);
    if (sam) return { type: 'sam', data: sam };

    const radar = serializeRadar(world, idx);
    if (radar) return { type: 'radar', data: radar };

    const base = serializeBase(world, idx);
    if (base) return { type: 'base', data: base };

    const weapon = serializeWeapon(world, idx);
    if (weapon) return { type: 'weapon', data: weapon };

    const entity = serializeEntity(world, idx, mgr);
    return { type: 'entity', data: entity };
  });

  app.get<{
    Params: { callsign: string };
    Querystring: { since?: number; until?: number };
  }>('/api/entities/:callsign/history', {
    schema: {
      description: 'Get time-series history for an entity',
      tags: ['entities'],
      params: {
        type: 'object',
        required: ['callsign'],
        properties: { callsign: { type: 'string' } },
      },
      querystring: {
        type: 'object',
        properties: {
          since: { type: 'number', description: 'Start sim time' },
          until: { type: 'number', description: 'End sim time' },
        },
      },
    },
  }, async (req, reply) => {
    const callsign = req.params.callsign;
    const idx = findEntityByCallsign(mgr.world, callsign);
    if (idx < 0) {
      // Entity might be dead — still check history
    }

    let history = mgr.history.getEntityHistory(callsign);

    if (req.query.since !== undefined) {
      history = history.filter((s) => s.simTime >= req.query.since!);
    }
    if (req.query.until !== undefined) {
      history = history.filter((s) => s.simTime <= req.query.until!);
    }

    return { callsign, count: history.length, history };
  });
}
