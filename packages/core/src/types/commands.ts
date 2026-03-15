import type { LatLon } from './geo.js';

export type Command =
  | { type: 'SPAWN'; entityType: string; callsign: string; lat: number; lon: number; alt?: number; side?: string; heading?: number; speed?: number }
  | { type: 'FLY_TO'; callsign: string; lat: number; lon: number; alt?: number; speed?: number }
  | { type: 'PATROL'; callsign: string; point1: LatLon; point2: LatLon; alt?: number }
  | { type: 'SCRAMBLE'; callsign: string; base: string; loadout?: string }
  | { type: 'ATTACK'; callsign: string; target: string | LatLon }
  | { type: 'REFUEL'; callsign: string; at: string }
  | { type: 'RTB'; callsign: string }
  | { type: 'ENGAGE'; callsign: string }
  | { type: 'DISENGAGE'; callsign: string }
  | { type: 'INTERCEPT'; callsign: string; target: string }
  | { type: 'RADAR_MODE'; callsign: string; mode: 'ON' | 'OFF' | 'STANDBY' }
  | { type: 'SET_SPEED'; callsign: string; speed: number }
  | { type: 'SET_ALT'; callsign: string; alt: number }
  | { type: 'SET_HEADING'; callsign: string; heading: number }
  | { type: 'STATUS'; callsign: string }
  | { type: 'REMOVE'; callsign: string }
  | { type: 'ASSIGN_BASE'; callsign: string; base: string }
  | { type: 'LOAD_MUNS'; target: 'ALL_BASES' | string; level: 'STANDARD' | 'HIGH' | 'LOW'; weaponKey?: string; count?: number }
  | { type: 'ARM'; callsign: string; weaponKey?: string; count?: number }
  | { type: 'SET_DEFAULTS'; aircraftKey: string; field: string; value: number }
  | { type: 'SEAD'; callsign: string; lat: number; lon: number };
