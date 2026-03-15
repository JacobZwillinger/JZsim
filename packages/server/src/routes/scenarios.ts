import type { FastifyInstance } from 'fastify';
import type { SimManager } from '../sim-manager.js';
import { SCENARIOS } from '../scenarios.js';

export function scenarioRoutes(app: FastifyInstance, mgr: SimManager): void {
  app.get('/api/scenarios', {
    schema: {
      description: 'List all built-in scenarios',
      tags: ['scenarios'],
    },
  }, async () => {
    return {
      scenarios: SCENARIOS.map((s) => ({
        name: s.name,
        description: s.description,
        commandCount: s.commands().length,
      })),
    };
  });

  app.post<{ Params: { name: string } }>('/api/scenarios/:name/load', {
    schema: {
      description: 'Load a scenario by name, executing all its commands',
      tags: ['scenarios'],
      params: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const scenario = SCENARIOS.find(
      (s) => s.name.toLowerCase().replace(/\s+/g, '-') === req.params.name.toLowerCase().replace(/\s+/g, '-')
        || s.name.toLowerCase() === req.params.name.toLowerCase()
    );

    if (!scenario) {
      return reply.status(404).send({
        error: `Scenario not found: ${req.params.name}`,
        available: SCENARIOS.map((s) => s.name),
      });
    }

    const commands = scenario.commands();
    mgr.executeCommands(commands);

    return {
      ok: true,
      scenario: scenario.name,
      commandCount: commands.length,
    };
  });
}
