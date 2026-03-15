import type { FastifyInstance } from 'fastify';
import type { SimManager } from '../sim-manager.js';
import {
  serializeAllAircraft,
  serializeAircraft,
  findEntityByCallsign,
} from '../serializers.js';

export function aircraftRoutes(app: FastifyInstance, mgr: SimManager): void {
  app.get<{
    Querystring: { side?: string };
  }>('/api/aircraft', {
    schema: {
      description: 'List all aircraft',
      tags: ['aircraft'],
      querystring: {
        type: 'object',
        properties: {
          side: { type: 'string', description: 'Filter by side: BLUE, RED' },
        },
      },
    },
  }, async (req) => {
    let aircraft = serializeAllAircraft(mgr.world, mgr);

    if (req.query.side) {
      const s = req.query.side.toUpperCase();
      aircraft = aircraft.filter((a) => a.side === s);
    }

    return { count: aircraft.length, aircraft };
  });

  app.get<{ Params: { callsign: string } }>('/api/aircraft/:callsign', {
    schema: {
      description: 'Get full detail for a single aircraft',
      tags: ['aircraft'],
      params: {
        type: 'object',
        required: ['callsign'],
        properties: { callsign: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const idx = findEntityByCallsign(mgr.world, req.params.callsign);
    if (idx < 0) {
      return reply.status(404).send({ error: `Aircraft not found: ${req.params.callsign}` });
    }

    const dto = serializeAircraft(mgr.world, idx, mgr);
    if (!dto) {
      return reply.status(404).send({ error: `Entity ${req.params.callsign} is not an aircraft` });
    }

    return dto;
  });

  app.get<{
    Params: { callsign: string };
    Querystring: { since?: number; until?: number };
  }>('/api/aircraft/:callsign/history', {
    schema: {
      description: 'Get position/state history for an aircraft',
      tags: ['aircraft'],
      params: {
        type: 'object',
        required: ['callsign'],
        properties: { callsign: { type: 'string' } },
      },
    },
  }, async (req) => {
    const callsign = req.params.callsign;
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
