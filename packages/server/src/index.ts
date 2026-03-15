import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { SimManager } from './sim-manager.js';
import { simRoutes } from './routes/sim.js';
import { entityRoutes } from './routes/entities.js';
import { aircraftRoutes } from './routes/aircraft.js';
import { radarRoutes } from './routes/radars.js';
import { samRoutes } from './routes/sams.js';
import { baseRoutes } from './routes/bases.js';
import { weaponRoutes } from './routes/weapons.js';
import { eventRoutes } from './routes/events.js';
import { scenarioRoutes } from './routes/scenarios.js';
import { defaultRoutes } from './routes/defaults.js';

const app = Fastify({ logger: true });
const mgr = new SimManager();

await app.register(cors);
await app.register(swagger, {
  openapi: {
    info: {
      title: 'JZSim API',
      version: '0.1.0',
      description: 'Air Warfare Simulation REST API — every sim object as a first-class citizen',
    },
    tags: [
      { name: 'simulation', description: 'Simulation control (start, stop, pause, speed, commands)' },
      { name: 'entities', description: 'All entity types (generic)' },
      { name: 'aircraft', description: 'Aircraft entities' },
      { name: 'radars', description: 'Radar site entities' },
      { name: 'sams', description: 'SAM site entities' },
      { name: 'bases', description: 'Airbase entities' },
      { name: 'weapons', description: 'In-flight weapons (missiles)' },
      { name: 'events', description: 'Simulation event log' },
      { name: 'scenarios', description: 'Built-in scenario management' },
      { name: 'defaults', description: 'Reference data (aircraft, weapon, radar defaults)' },
    ],
  },
});
await app.register(swaggerUi, { routePrefix: '/docs' });

// Health check
app.get('/api/health', { schema: { hide: true } }, async () => ({ status: 'ok' }));

// Register all route groups
simRoutes(app, mgr);
entityRoutes(app, mgr);
aircraftRoutes(app, mgr);
radarRoutes(app, mgr);
samRoutes(app, mgr);
baseRoutes(app, mgr);
weaponRoutes(app, mgr);
eventRoutes(app, mgr);
scenarioRoutes(app, mgr);
defaultRoutes(app);

// Start the sim loop
mgr.start();

const port = parseInt(process.env.PORT ?? '3001', 10);
await app.listen({ port, host: '0.0.0.0' });

console.log(`JZSim API server running at http://localhost:${port}`);
console.log(`Swagger docs at http://localhost:${port}/docs`);
console.log(`Sim loop started — ${mgr.world.entities.activeCount} entities`);
