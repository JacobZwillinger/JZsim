import type { FastifyInstance } from 'fastify';
import type { SimManager } from '../sim-manager.js';
import {
  serializeAllSAMs,
  serializeSAM,
  findEntityByCallsign,
} from '../serializers.js';

export function samRoutes(app: FastifyInstance, mgr: SimManager): void {
  app.get<{
    Querystring: { side?: string };
  }>('/api/sams', {
    schema: {
      description: 'List all SAM sites',
      tags: ['sams'],
      querystring: {
        type: 'object',
        properties: {
          side: { type: 'string', description: 'Filter by side: BLUE, RED' },
        },
      },
    },
  }, async (req) => {
    let sams = serializeAllSAMs(mgr.world);

    if (req.query.side) {
      const sideFilter = req.query.side.toUpperCase();
      sams = sams.filter((s) => s.side === sideFilter);
    }

    return { count: sams.length, sams };
  });

  app.get<{ Params: { callsign: string } }>('/api/sams/:callsign', {
    schema: {
      description: 'Get detail for a single SAM site including engagement state',
      tags: ['sams'],
      params: {
        type: 'object',
        required: ['callsign'],
        properties: { callsign: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const idx = findEntityByCallsign(mgr.world, req.params.callsign);
    if (idx < 0) {
      return reply.status(404).send({ error: `SAM not found: ${req.params.callsign}` });
    }

    const dto = serializeSAM(mgr.world, idx);
    if (!dto) {
      return reply.status(404).send({ error: `Entity ${req.params.callsign} is not a SAM site` });
    }

    return dto;
  });
}
