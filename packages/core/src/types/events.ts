import type { EntityId } from './entities.js';

export type SimEvent =
  | { type: 'entity:spawned'; entityId: EntityId; callsign: string; entityType: string }
  | { type: 'entity:destroyed'; entityId: EntityId; callsign: string; reason: string }
  | { type: 'entity:damaged'; entityId: EntityId; callsign: string; healthPercent: number }
  | { type: 'entity:removed'; entityId: EntityId; callsign: string }
  | { type: 'radar:detection'; radarId: EntityId; targetId: EntityId; range: number; probability: number }
  | { type: 'radar:entity_info'; radarId: EntityId; lat: number; lon: number; maxRangeM: number; side: number }
  | { type: 'radar:lost'; radarId: EntityId; targetId: EntityId }
  | { type: 'weapon:launched'; shooterId: EntityId; targetId: EntityId; weaponType: string }
  | { type: 'weapon:impact'; weaponId: EntityId; targetId: EntityId; hit: boolean }
  | { type: 'mission:state_change'; entityId: EntityId; from: string; to: string }
  | { type: 'fuel:low'; entityId: EntityId; fuelPercent: number }
  | { type: 'fuel:empty'; entityId: EntityId }
  | { type: 'command:executed'; command: string; success: boolean; message: string }
  | { type: 'command:error'; command: string; error: string }
  | { type: 'sim:tick'; simTime: number; tickCount: number; entityCount: number }
  | { type: 'muns:loaded'; baseCallsign: string; level: string }
  | { type: 'muns:armed'; callsign: string; weaponKey: string; count: number }
  | { type: 'muns:returned'; callsign: string; baseCallsign: string; items: Record<string, number> }
  | { type: 'dmpi:added'; name: string; lat: number; lon: number; description?: string }
  | { type: 'dmpi:removed'; name: string }
  | { type: 'strike:assigned'; entityId: EntityId; callsign: string; dmpiNames: string[]; weaponPerDmpi: number }
  | { type: 'strike:bomb_drop'; entityId: EntityId; callsign: string; dmpiName: string; weaponKey: string }
  | { type: 'strike:route_complete'; entityId: EntityId; callsign: string };
