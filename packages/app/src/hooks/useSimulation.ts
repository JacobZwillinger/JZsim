import { useEffect, useRef, useCallback } from 'react';
import { BUFFER_SIZE, HEADER_F64_COUNT, ENTITY_F64_STRIDE } from '@jzsim/engine';
import type { WorkerMessage } from '@jzsim/engine';
import type { Command, SimEvent } from '@jzsim/core';
import { useUIStore, type EntityInfo } from '../store/ui-store.js';

export function useSimulation() {
  const workerRef = useRef<Worker | null>(null);
  const bufferRef = useRef<Float64Array | null>(null);
  const rafRef = useRef<number>(0);

  const setSimStats = useUIStore((s) => s.setSimStats);
  const setEntities = useUIStore((s) => s.setEntities);
  const addEvents = useUIStore((s) => s.addEvents);
  const setAARData = useUIStore((s) => s.setAARData);

  useEffect(() => {
    // Create shared buffer
    const sab = new SharedArrayBuffer(BUFFER_SIZE);
    const buffer = new Float64Array(sab);
    bufferRef.current = buffer;

    // Create worker
    const worker = new Worker(
      new URL('../workers/sim-worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      switch (msg.type) {
        case 'ready':
          console.log('Simulation engine ready');
          break;
        case 'events':
          addEvents(msg.events as SimEvent[]);
          break;
        case 'tick_stats': {
          // Only update tickMs from postMessage; other stats come from SharedArrayBuffer
          const perf = msg.systemTimings ? {
            systemTimings: msg.systemTimings as { name: string; ms: number }[],
            gridRebuildMs: (msg as any).gridRebuildMs ?? 0,
            bufferSyncMs: (msg as any).bufferSyncMs ?? 0,
            radarContacts: (msg as any).radarContacts ?? 0,
            missileCount: (msg as any).missileCount ?? 0,
            worldCapacity: (msg as any).worldCapacity ?? 0,
          } : undefined;
          setSimStats(msg.simTime, msg.tickCount, msg.entityCount, msg.tickMs, perf);
          break;
        }
        case 'aar_update':
          setAARData(msg.data as any);
          break;
      }
    };

    // Initialize worker with shared buffer
    worker.postMessage({ type: 'init', buffer: sab } satisfies WorkerMessage);

    // Start render loop to read shared buffer
    const readEntities = () => {
      if (!bufferRef.current) return;
      const buf = bufferRef.current;

      // Read header stats directly from shared buffer every frame
      const simTime = buf[0];
      const tickCount = buf[1];
      const count = buf[2]; // entityCount from header

      const entities: EntityInfo[] = [];
      for (let i = 0; i < count; i++) {
        const offset = HEADER_F64_COUNT + i * ENTITY_F64_STRIDE;
        entities.push({
          id: buf[offset + 0],
          lat: buf[offset + 1],
          lon: buf[offset + 2],
          alt: buf[offset + 3],
          heading: buf[offset + 4],
          speed: buf[offset + 5],
          modelType: buf[offset + 6],
          side: buf[offset + 7],
          fuel: buf[offset + 8],
          maxSpeed: buf[offset + 9],
          fuelCapacity: buf[offset + 10],
          isWeapon: buf[offset + 11],
          currentHealth: buf[offset + 12],
          maxHealth: buf[offset + 13],
          primaryAmmo: buf[offset + 14],
          secondaryAmmo: buf[offset + 15],
        });
      }
      setEntities(entities);
      // Update sim stats from shared buffer header (faster than waiting for postMessage)
      setSimStats(simTime, tickCount, count, 0);
      rafRef.current = requestAnimationFrame(readEntities);
    };
    rafRef.current = requestAnimationFrame(readEntities);

    return () => {
      worker.terminate();
      cancelAnimationFrame(rafRef.current);
    };
  }, [setSimStats, setEntities, addEvents, setAARData]);

  const sendCommand = useCallback((command: Command) => {
    workerRef.current?.postMessage({ type: 'command', command } satisfies WorkerMessage);
  }, []);

  const setPaused = useCallback((paused: boolean) => {
    workerRef.current?.postMessage({ type: 'set_paused', paused } satisfies WorkerMessage);
    useUIStore.getState().setPaused(paused);
  }, []);

  const setTimeMultiplier = useCallback((multiplier: number) => {
    workerRef.current?.postMessage({ type: 'set_time_multiplier', multiplier } satisfies WorkerMessage);
    useUIStore.getState().setTimeMultiplier(multiplier);
  }, []);

  const resetSim = useCallback(() => {
    workerRef.current?.postMessage({ type: 'reset' } satisfies WorkerMessage);
    useUIStore.getState().resetSimState();
  }, []);

  return { sendCommand, setPaused, setTimeMultiplier, resetSim };
}
