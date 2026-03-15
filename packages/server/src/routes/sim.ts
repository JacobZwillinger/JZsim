import type { FastifyInstance } from 'fastify';
import type { SimManager } from '../sim-manager.js';
import { serializeSimState, serializeAAR } from '../serializers.js';

export function simRoutes(app: FastifyInstance, mgr: SimManager): void {
  app.get('/api/sim', {
    schema: {
      description: 'Get current simulation state',
      tags: ['simulation'],
      response: {
        200: {
          type: 'object',
          properties: {
            simTime: { type: 'number' },
            tickCount: { type: 'number' },
            entityCount: { type: 'number' },
            paused: { type: 'boolean' },
            timeMultiplier: { type: 'number' },
            running: { type: 'boolean' },
          },
        },
      },
    },
  }, async () => {
    return serializeSimState(mgr);
  });

  app.post('/api/sim/start', {
    schema: {
      description: 'Start the simulation loop',
      tags: ['simulation'],
    },
  }, async () => {
    mgr.start();
    return { ok: true };
  });

  app.post('/api/sim/stop', {
    schema: {
      description: 'Stop the simulation loop',
      tags: ['simulation'],
    },
  }, async () => {
    mgr.stop();
    return { ok: true };
  });

  app.post('/api/sim/pause', {
    schema: {
      description: 'Pause the simulation (loop keeps running but no sim time advances)',
      tags: ['simulation'],
    },
  }, async () => {
    mgr.pause();
    return { ok: true };
  });

  app.post('/api/sim/resume', {
    schema: {
      description: 'Resume the simulation after pause',
      tags: ['simulation'],
    },
  }, async () => {
    mgr.resume();
    return { ok: true };
  });

  app.post<{ Body: { multiplier: number } }>('/api/sim/speed', {
    schema: {
      description: 'Set the time multiplier (1-60)',
      tags: ['simulation'],
      body: {
        type: 'object',
        required: ['multiplier'],
        properties: {
          multiplier: { type: 'number', minimum: 0, maximum: 60 },
        },
      },
    },
  }, async (req) => {
    const { multiplier } = req.body;
    mgr.setSpeed(multiplier);
    return { ok: true, multiplier: mgr.world.timeMultiplier };
  });

  app.post<{ Body: { text: string } }>('/api/sim/command', {
    schema: {
      description: 'Execute a text command (same DSL as the console)',
      tags: ['simulation'],
      body: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string' },
        },
      },
    },
  }, async (req) => {
    const { text } = req.body;
    return mgr.executeCommand(text);
  });

  app.post<{ Body: { commands: string[] } }>('/api/sim/commands', {
    schema: {
      description: 'Execute multiple text commands in sequence',
      tags: ['simulation'],
      body: {
        type: 'object',
        required: ['commands'],
        properties: {
          commands: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, async (req) => {
    const { commands } = req.body;
    const results = commands.map((text) => mgr.executeCommand(text));
    return { results };
  });

  app.post('/api/sim/step', {
    schema: {
      description: 'Advance the simulation by exactly one tick (1 second sim time)',
      tags: ['simulation'],
    },
  }, async () => {
    mgr.stepOnce();
    return { ok: true, simTime: mgr.world.simTime, tickCount: mgr.world.tickCount };
  });

  app.get('/api/sim/aar', {
    schema: {
      description: 'Get the After Action Report (AAR) snapshot',
      tags: ['simulation'],
    },
  }, async () => {
    return serializeAAR(mgr.world);
  });
}
