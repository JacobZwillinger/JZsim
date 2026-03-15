import { Simulation } from '@jzsim/engine';
import type { WorkerMessage } from '@jzsim/engine';

const sim = new Simulation();

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'init':
      sim.setSharedBuffer(msg.buffer);
      sim.start();
      (self as unknown as Worker).postMessage({ type: 'ready' } satisfies WorkerMessage);
      break;

    case 'command':
      sim.enqueueCommand(msg.command);
      break;

    case 'set_time_multiplier':
      sim.world.timeMultiplier = msg.multiplier;
      break;

    case 'set_paused':
      sim.world.paused = msg.paused;
      break;
  }
};
