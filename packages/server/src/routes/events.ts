import type { FastifyInstance } from 'fastify';
import type { SimManager } from '../sim-manager.js';

export function eventRoutes(app: FastifyInstance, mgr: SimManager): void {
  app.get<{
    Querystring: { since?: number; type?: string; limit?: number };
  }>('/api/events', {
    schema: {
      description: 'Get the event log, optionally filtered by time and/or event type',
      tags: ['events'],
      querystring: {
        type: 'object',
        properties: {
          since: { type: 'number', description: 'Only events after this sim time' },
          type: { type: 'string', description: 'Filter by event type (e.g. entity:spawned, weapon:impact)' },
          limit: { type: 'number', description: 'Max events to return (default 200)' },
        },
      },
    },
  }, async (req) => {
    const limit = req.query.limit ?? 200;
    let events = mgr.history.getEvents({
      since: req.query.since,
      type: req.query.type,
    });

    // Return most recent events first, capped at limit
    if (events.length > limit) {
      events = events.slice(-limit);
    }

    return { count: events.length, totalStored: mgr.history.eventCount, events };
  });
}
