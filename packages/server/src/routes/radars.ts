import type { FastifyInstance } from 'fastify';
import type { SimManager } from '../sim-manager.js';
import {
  serializeAllRadars,
  serializeRadar,
  findEntityByCallsign,
} from '../serializers.js';

export function radarRoutes(app: FastifyInstance, mgr: SimManager): void {
  app.get<{
    Querystring: { side?: string };
  }>('/api/radars', {
    schema: {
      description: 'List all standalone radar sites',
      tags: ['radars'],
      querystring: {
        type: 'object',
        properties: {
          side: { type: 'string', description: 'Filter by side: BLUE, RED' },
        },
      },
    },
  }, async (req) => {
    let radars = serializeAllRadars(mgr.world);

    if (req.query.side) {
      const s = req.query.side.toUpperCase();
      radars = radars.filter((r) => r.side === s);
    }

    return { count: radars.length, radars };
  });

  app.get<{ Params: { callsign: string } }>('/api/radars/:callsign', {
    schema: {
      description: 'Get detail for a single radar site',
      tags: ['radars'],
      params: {
        type: 'object',
        required: ['callsign'],
        properties: { callsign: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const idx = findEntityByCallsign(mgr.world, req.params.callsign);
    if (idx < 0) {
      return reply.status(404).send({ error: `Radar not found: ${req.params.callsign}` });
    }

    const dto = serializeRadar(mgr.world, idx);
    if (!dto) {
      return reply.status(404).send({ error: `Entity ${req.params.callsign} is not a radar site` });
    }

    return dto;
  });
}
