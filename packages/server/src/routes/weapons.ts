import type { FastifyInstance } from 'fastify';
import type { SimManager } from '../sim-manager.js';
import { serializeAllWeapons, serializeWeapon } from '../serializers.js';

export function weaponRoutes(app: FastifyInstance, mgr: SimManager): void {
  app.get('/api/weapons', {
    schema: {
      description: 'List all in-flight weapons (missiles)',
      tags: ['weapons'],
    },
  }, async () => {
    const weapons = serializeAllWeapons(mgr.world);
    return { count: weapons.length, weapons };
  });

  app.get<{ Params: { id: string } }>('/api/weapons/:id', {
    schema: {
      description: 'Get detail for a single in-flight weapon by entity index',
      tags: ['weapons'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const idx = parseInt(req.params.id, 10);
    if (isNaN(idx)) {
      return reply.status(400).send({ error: 'Invalid entity index' });
    }

    const dto = serializeWeapon(mgr.world, idx);
    if (!dto) {
      return reply.status(404).send({ error: `Weapon not found at index ${idx}` });
    }

    return dto;
  });
}
