import { create } from 'zustand';
import type { SimEvent } from '@jzsim/core';

export interface EntityInfo {
  id: number;
  lat: number;
  lon: number;
  alt: number;
  heading: number;
  speed: number;
  modelType: number;
  side: number;
  fuel: number;           // kg, -1 if not aircraft
  maxSpeed: number;       // m/s
  fuelCapacity: number;   // kg
  isWeapon: number;       // 0 or 1
  currentHealth: number;  // HP, -1 if no health component
  maxHealth: number;      // max HP
  primaryAmmo: number;    // -1 if no loadout
  secondaryAmmo: number;  // -1 if no loadout
}

export interface DetectionEntry {
  targetId: number;
  range: number;
  probability: number;
  timestamp: number; // simTime when last updated
}

export interface EntityAAREntry {
  callsign: string;
  aircraftType: string;
  side: number;
  baseCallsign: string;
  fuelUsedKg: number;
  munsExpended: Record<string, number>;
  kills: number;
  lost: boolean;
}

export interface AARData {
  totalFuelUsedKg: number;
  munsExpended: Record<string, number>;
  targetsHit: number;
  enemiesEngaged: number;
  friendlyLosses: number;
  enemyLosses: number;
  perEntity: Record<number, EntityAAREntry>;
}

interface UIState {
  // Simulation state
  simTime: number;
  tickCount: number;
  entityCount: number;
  tickMs: number;
  paused: boolean;
  timeMultiplier: number;

  // Entity data (from shared buffer)
  entities: EntityInfo[];

  // Callsign/missionState per entity id (maintained from events)
  callsigns: Map<number, string>;
  missionStates: Map<number, string>;

  // Radar data (for coverage ring visualization)
  radarEntities: Map<number, { lat: number; lon: number; maxRangeM: number; side: number }>;

  // Radar detections (per radar → array of detected targets)
  radarDetections: Map<number, DetectionEntry[]>;

  // Event log
  eventLog: Array<{ time: number; message: string; type?: string }>;

  // Selection
  selectedEntityId: number | null;

  // Layout state
  leftDrawerOpen: boolean;
  rightDrawerOpen: boolean;
  leftDrawerTab: 'assets' | 'scenarios' | 'radar' | 'aar' | 'missions' | 'data';
  consoleOpen: boolean;
  searchQuery: string;
  helpOpen: boolean;

  // AAR data
  aarData: AARData | null;

  // Actions
  setSimStats: (simTime: number, tickCount: number, entityCount: number, tickMs: number) => void;
  setEntities: (entities: EntityInfo[]) => void;
  addEvents: (events: SimEvent[]) => void;
  addLogEntry: (time: number, message: string, type?: string) => void;
  setSelectedEntityId: (id: number | null) => void;
  setPaused: (paused: boolean) => void;
  setTimeMultiplier: (multiplier: number) => void;
  setAARData: (data: AARData) => void;
  toggleHelp: () => void;

  // Scenario creation
  customScenarios: Array<{ name: string; description: string; commands: import('@jzsim/core').Command[] }>;
  isRecording: boolean;
  recordedCommands: import('@jzsim/core').Command[];
  addCustomScenario: (name: string, description: string, commands: import('@jzsim/core').Command[]) => void;
  deleteCustomScenario: (index: number) => void;
  setIsRecording: (recording: boolean) => void;
  addRecordedCommand: (cmd: import('@jzsim/core').Command) => void;
  clearRecordedCommands: () => void;

  // Layout actions
  toggleLeftDrawer: () => void;
  toggleRightDrawer: () => void;
  setLeftDrawerTab: (tab: 'assets' | 'scenarios' | 'radar' | 'aar' | 'missions' | 'data') => void;
  toggleConsole: () => void;
  setConsoleOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

const MAX_LOG_ENTRIES = 500;
const DETECTION_STALE_SEC = 10;

export const useUIStore = create<UIState>((set, get) => ({
  simTime: 0,
  tickCount: 0,
  entityCount: 0,
  tickMs: 0,
  paused: false,
  timeMultiplier: 1,
  entities: [],
  callsigns: new Map(),
  missionStates: new Map(),
  radarEntities: new Map(),
  radarDetections: new Map(),
  eventLog: [],
  selectedEntityId: null,
  aarData: null,
  helpOpen: false,
  customScenarios: (() => {
    try {
      const stored = localStorage.getItem('jzsim_scenarios');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  })(),
  isRecording: false,
  recordedCommands: [],

  // Layout defaults
  leftDrawerOpen: false,
  rightDrawerOpen: false,
  leftDrawerTab: 'assets',
  consoleOpen: false,
  searchQuery: '',

  setSimStats: (simTime, tickCount, entityCount, tickMs) =>
    set({ simTime, tickCount, entityCount, tickMs }),

  setEntities: (entities) => set({ entities }),

  addEvents: (events) =>
    set((state) => {
      const newCallsigns = new Map(state.callsigns);
      const newMissionStates = new Map(state.missionStates);
      const newRadarEntities = new Map(state.radarEntities);
      const newRadarDetections = new Map(state.radarDetections);
      const newEntries: Array<{ time: number; message: string; type?: string }> = [];

      for (const e of events) {
        switch (e.type) {
          case 'entity:spawned':
            newCallsigns.set(e.entityId as number, e.callsign);
            newEntries.push({ time: state.simTime, message: `Spawned ${e.entityType} "${e.callsign}"`, type: 'spawn' });
            break;

          case 'entity:removed':
            newCallsigns.delete(e.entityId as number);
            newMissionStates.delete(e.entityId as number);
            newRadarEntities.delete(e.entityId as number);
            newEntries.push({ time: state.simTime, message: `Removed "${e.callsign}"`, type: 'remove' });
            break;

          case 'entity:destroyed':
            newCallsigns.delete(e.entityId as number);
            newMissionStates.delete(e.entityId as number);
            newRadarEntities.delete(e.entityId as number);
            newEntries.push({ time: state.simTime, message: `DESTROYED: "${e.callsign}" (${e.reason})`, type: 'destroy' });
            break;

          case 'entity:damaged':
            newEntries.push({ time: state.simTime, message: `${e.callsign} damaged (${e.healthPercent.toFixed(0)}% HP)`, type: 'combat' });
            break;

          case 'radar:entity_info':
            newRadarEntities.set(e.radarId as number, {
              lat: e.lat,
              lon: e.lon,
              maxRangeM: e.maxRangeM,
              side: e.side,
            });
            break;

          case 'radar:detection': {
            // Update radar detections for RadarView
            const radarId = e.radarId as number;
            const existing = newRadarDetections.get(radarId) ?? [];
            const idx = existing.findIndex((d) => d.targetId === (e.targetId as number));
            const entry: DetectionEntry = {
              targetId: e.targetId as number,
              range: e.range,
              probability: e.probability,
              timestamp: state.simTime,
            };
            if (idx >= 0) {
              existing[idx] = entry;
            } else {
              existing.push(entry);
            }
            // Prune stale detections
            const pruned = existing.filter((d) => state.simTime - d.timestamp < DETECTION_STALE_SEC);
            newRadarDetections.set(radarId, pruned);

            // Only log periodically to avoid flooding (1-in-8)
            if (Math.random() < 0.125) {
              const cs = newCallsigns.get(e.radarId as number) ?? `radar-${e.radarId}`;
              const tcs = newCallsigns.get(e.targetId as number) ?? `entity-${e.targetId}`;
              newEntries.push({ time: state.simTime, message: `${cs} detected ${tcs} at ${(e.range / 1000).toFixed(0)}km`, type: 'radar' });
            }
            break;
          }

          case 'mission:state_change':
            newMissionStates.set(e.entityId as number, e.to);
            newEntries.push({ time: state.simTime, message: `${newCallsigns.get(e.entityId as number) ?? `#${e.entityId}`}: ${e.from} → ${e.to}`, type: 'mission' });
            break;

          case 'command:executed':
            newEntries.push({ time: state.simTime, message: e.message, type: 'cmd' });
            break;

          case 'command:error':
            newEntries.push({ time: state.simTime, message: `ERROR: ${e.error}`, type: 'error' });
            break;

          case 'fuel:low':
            newEntries.push({ time: state.simTime, message: `${newCallsigns.get(e.entityId as number) ?? `#${e.entityId}`} fuel low (${e.fuelPercent.toFixed(0)}%)`, type: 'warn' });
            break;

          case 'fuel:empty':
            newEntries.push({ time: state.simTime, message: `${newCallsigns.get(e.entityId as number) ?? `#${e.entityId}`} OUT OF FUEL`, type: 'warn' });
            break;

          case 'weapon:launched': {
            const shooter = newCallsigns.get(e.shooterId as number) ?? `#${e.shooterId}`;
            const target = newCallsigns.get(e.targetId as number) ?? `#${e.targetId}`;
            newEntries.push({ time: state.simTime, message: `${shooter} launched ${e.weaponType} at ${target}`, type: 'combat' });
            break;
          }

          case 'weapon:impact': {
            const tgt = newCallsigns.get(e.targetId as number) ?? `#${e.targetId}`;
            newEntries.push({ time: state.simTime, message: e.hit ? `IMPACT: ${tgt} HIT` : `MISS: ${tgt} evaded`, type: 'combat' });
            break;
          }

          case 'muns:loaded':
            newEntries.push({ time: state.simTime, message: `MUNS loaded (${e.level}) on ${e.baseCallsign}`, type: 'cmd' });
            break;

          case 'muns:armed':
            newEntries.push({ time: state.simTime, message: `${e.callsign} armed: ${e.count}x ${e.weaponKey}`, type: 'cmd' });
            break;

          case 'muns:returned': {
            const items = Object.entries(e.items).map(([k, v]) => `${v}x ${k}`).join(', ');
            newEntries.push({ time: state.simTime, message: `${e.callsign} returned MUNS to ${e.baseCallsign}: ${items}`, type: 'mission' });
            break;
          }
        }
      }

      return {
        callsigns: newCallsigns,
        missionStates: newMissionStates,
        radarEntities: newRadarEntities,
        radarDetections: newRadarDetections,
        eventLog: [...state.eventLog, ...newEntries].slice(-MAX_LOG_ENTRIES),
      };
    }),

  addLogEntry: (time, message, type) =>
    set((state) => ({
      eventLog: [...state.eventLog, { time, message, type }].slice(-MAX_LOG_ENTRIES),
    })),

  setSelectedEntityId: (id) =>
    set({ selectedEntityId: id, rightDrawerOpen: id !== null }),

  setPaused: (paused) => set({ paused }),
  setTimeMultiplier: (multiplier) => set({ timeMultiplier: multiplier }),

  // Layout actions
  toggleLeftDrawer: () => set((s) => ({ leftDrawerOpen: !s.leftDrawerOpen })),
  toggleRightDrawer: () => set((s) => ({ rightDrawerOpen: !s.rightDrawerOpen })),
  setLeftDrawerTab: (tab) => set({ leftDrawerTab: tab }),
  toggleConsole: () => set((s) => ({ consoleOpen: !s.consoleOpen })),
  setConsoleOpen: (open) => set({ consoleOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setAARData: (data) => set({ aarData: data }),
  toggleHelp: () => set((s) => ({ helpOpen: !s.helpOpen })),
  addCustomScenario: (name, description, commands) =>
    set((s) => {
      const updated = [...s.customScenarios, { name, description, commands }];
      try { localStorage.setItem('jzsim_scenarios', JSON.stringify(updated)); } catch {}
      return { customScenarios: updated };
    }),
  deleteCustomScenario: (index) =>
    set((s) => {
      const updated = s.customScenarios.filter((_, i) => i !== index);
      try { localStorage.setItem('jzsim_scenarios', JSON.stringify(updated)); } catch {}
      return { customScenarios: updated };
    }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  addRecordedCommand: (cmd) =>
    set((s) => ({ recordedCommands: [...s.recordedCommands, cmd] })),
  clearRecordedCommands: () => set({ recordedCommands: [] }),
}));
