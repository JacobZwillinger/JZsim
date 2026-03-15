import type { FastifyInstance } from 'fastify';
import type { SimManager } from '../sim-manager.js';
import {
  serializeAllBases,
  serializeBase,
  findEntityByCallsign,
} from '../serializers.js';

export function baseRoutes(app: FastifyInstance, mgr: SimManager): void {
  app.get<{
    Querystring: { side?: string };
  }>('/api/bases', {
    schema: {
      description: 'List all bases with inventory',
      tags: ['bases'],
      querystring: {
        type: 'object',
        properties: {
          side: { type: 'string', description: 'Filter by side: BLUE, RED' },
        },
      },
    },
  }, async (req) => {
    let bases = serializeAllBases(mgr.world);

    if (req.query.side) {
      const s = req.query.side.toUpperCase();
      bases = bases.filter((b) => b.side === s);
    }

    return { count: bases.length, bases };
  });

  app.get<{ Params: { callsign: string } }>('/api/bases/:callsign', {
    schema: {
      description: 'Get detail for a single base including munitions inventory',
      tags: ['bases'],
      params: {
        type: 'object',
        required: ['callsign'],
        properties: { callsign: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const idx = findEntityByCallsign(mgr.world, req.params.callsign);
    if (idx < 0) {
      return reply.status(404).send({ error: `Base not found: ${req.params.callsign}` });
    }

    const dto = serializeBase(mgr.world, idx);
    if (!dto) {
      return reply.status(404).send({ error: `Entity ${req.params.callsign} is not a base` });
    }

    return dto;
  });
}
