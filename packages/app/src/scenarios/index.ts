import type { Command } from '@jzsim/core';

export interface Scenario {
  name: string;
  description: string;
  commands: () => Command[];
}

export const SCENARIOS: Scenario[] = [
  {
    name: 'Okinawa Defense',
    description: 'Blue base + patrol fighters vs Red strike package with SAM umbrella',
    commands: () => [
      // Blue forces
      { type: 'SPAWN', entityType: 'AIRBASE', callsign: 'KADENA', lat: 26.35, lon: 127.77, side: 'blue' },
      { type: 'SPAWN', entityType: 'F-15C', callsign: 'EAGLE01', lat: 26.35, lon: 127.77, alt: 25000, side: 'blue', heading: 0, speed: 450 },
      { type: 'SPAWN', entityType: 'F-15C', callsign: 'EAGLE02', lat: 26.35, lon: 127.77, alt: 28000, side: 'blue', heading: 45, speed: 450 },
      { type: 'SPAWN', entityType: 'E-3', callsign: 'MAGIC01', lat: 25.8, lon: 127.0, alt: 35000, side: 'blue', heading: 0, speed: 350 },
      // Blue patrols
      { type: 'PATROL', callsign: 'EAGLE01', point1: { lat: 27.5, lon: 127.0 }, point2: { lat: 28.5, lon: 128.5 }, alt: 30000 },
      { type: 'PATROL', callsign: 'EAGLE02', point1: { lat: 26.0, lon: 126.0 }, point2: { lat: 27.0, lon: 128.0 }, alt: 28000 },
      // Red forces
      { type: 'SPAWN', entityType: 'Su-30', callsign: 'FLANKER01', lat: 30.0, lon: 130.0, alt: 20000, side: 'red', heading: 225, speed: 500 },
      { type: 'SPAWN', entityType: 'Su-30', callsign: 'FLANKER02', lat: 30.2, lon: 130.5, alt: 22000, side: 'red', heading: 225, speed: 500 },
      { type: 'SPAWN', entityType: 'Su-30', callsign: 'FLANKER03', lat: 29.8, lon: 129.5, alt: 18000, side: 'red', heading: 240, speed: 500 },
      // Red SAM
      { type: 'SPAWN', entityType: 'SA-10', callsign: 'GRUMBLE01', lat: 29.5, lon: 129.0, side: 'red' },
      // Red fly toward Okinawa
      { type: 'FLY_TO', callsign: 'FLANKER01', lat: 26.5, lon: 127.5, alt: 20000, speed: 550 },
      { type: 'FLY_TO', callsign: 'FLANKER02', lat: 26.8, lon: 127.8, alt: 22000, speed: 550 },
      { type: 'FLY_TO', callsign: 'FLANKER03', lat: 26.0, lon: 127.0, alt: 18000, speed: 550 },
    ],
  },
  {
    name: 'Red Storm',
    description: 'Massive Red air assault with SAM umbrella vs Blue defenders',
    commands: () => [
      // Blue base and fighters
      { type: 'SPAWN', entityType: 'AIRBASE', callsign: 'MISAWA', lat: 40.7, lon: 141.4, side: 'blue' },
      { type: 'SPAWN', entityType: 'F-22A', callsign: 'RAPTOR01', lat: 40.7, lon: 141.4, alt: 35000, side: 'blue', heading: 315, speed: 500 },
      { type: 'SPAWN', entityType: 'F-22A', callsign: 'RAPTOR02', lat: 40.5, lon: 141.2, alt: 38000, side: 'blue', heading: 315, speed: 500 },
      { type: 'SPAWN', entityType: 'F-15C', callsign: 'EAGLE11', lat: 40.3, lon: 140.8, alt: 28000, side: 'blue', heading: 0, speed: 450 },
      { type: 'SPAWN', entityType: 'F-15C', callsign: 'EAGLE12', lat: 40.9, lon: 141.0, alt: 30000, side: 'blue', heading: 350, speed: 450 },
      { type: 'SPAWN', entityType: 'E-3', callsign: 'SENTRY01', lat: 39.5, lon: 140.0, alt: 35000, side: 'blue', heading: 0, speed: 350 },
      // Blue SAM defense
      { type: 'SPAWN', entityType: 'PATRIOT', callsign: 'PATRIOT01', lat: 40.7, lon: 141.4, side: 'blue' },
      // Blue patrols
      { type: 'PATROL', callsign: 'RAPTOR01', point1: { lat: 42.0, lon: 140.0 }, point2: { lat: 43.0, lon: 142.0 }, alt: 38000 },
      { type: 'PATROL', callsign: 'RAPTOR02', point1: { lat: 41.5, lon: 139.5 }, point2: { lat: 42.5, lon: 141.5 }, alt: 35000 },
      // Red massive assault
      { type: 'SPAWN', entityType: 'Su-30', callsign: 'BANDIT01', lat: 45.0, lon: 137.0, alt: 20000, side: 'red', heading: 160, speed: 550 },
      { type: 'SPAWN', entityType: 'Su-30', callsign: 'BANDIT02', lat: 45.2, lon: 137.5, alt: 22000, side: 'red', heading: 160, speed: 550 },
      { type: 'SPAWN', entityType: 'Su-30', callsign: 'BANDIT03', lat: 44.8, lon: 136.5, alt: 18000, side: 'red', heading: 170, speed: 550 },
      { type: 'SPAWN', entityType: 'Su-30', callsign: 'BANDIT04', lat: 45.5, lon: 138.0, alt: 24000, side: 'red', heading: 155, speed: 550 },
      { type: 'SPAWN', entityType: 'Su-30', callsign: 'BANDIT05', lat: 44.5, lon: 136.0, alt: 20000, side: 'red', heading: 175, speed: 550 },
      // Red SAM umbrella
      { type: 'SPAWN', entityType: 'SA-10', callsign: 'REDSAM01', lat: 44.0, lon: 136.5, side: 'red' },
      { type: 'SPAWN', entityType: 'SA-10', callsign: 'REDSAM02', lat: 44.5, lon: 137.5, side: 'red' },
      // Red fly south
      { type: 'FLY_TO', callsign: 'BANDIT01', lat: 40.5, lon: 141.0, alt: 20000, speed: 600 },
      { type: 'FLY_TO', callsign: 'BANDIT02', lat: 40.8, lon: 141.5, alt: 22000, speed: 600 },
      { type: 'FLY_TO', callsign: 'BANDIT03', lat: 40.2, lon: 140.5, alt: 18000, speed: 600 },
      { type: 'FLY_TO', callsign: 'BANDIT04', lat: 41.0, lon: 141.8, alt: 24000, speed: 600 },
      { type: 'FLY_TO', callsign: 'BANDIT05', lat: 40.0, lon: 140.0, alt: 20000, speed: 600 },
    ],
  },
  {
    name: 'Cold War Intercept',
    description: 'Stealth bomber penetration vs Red integrated air defense',
    commands: () => [
      // Blue stealth bomber
      { type: 'SPAWN', entityType: 'B-2A', callsign: 'SPIRIT01', lat: 34.0, lon: 130.0, alt: 40000, side: 'blue', heading: 0, speed: 400 },
      { type: 'SPAWN', entityType: 'F-22A', callsign: 'ESCORT01', lat: 34.2, lon: 130.2, alt: 38000, side: 'blue', heading: 0, speed: 450 },
      { type: 'SPAWN', entityType: 'F-22A', callsign: 'ESCORT02', lat: 33.8, lon: 129.8, alt: 36000, side: 'blue', heading: 0, speed: 450 },
      // Blue fly north
      { type: 'FLY_TO', callsign: 'SPIRIT01', lat: 42.0, lon: 132.0, alt: 42000, speed: 450 },
      { type: 'FLY_TO', callsign: 'ESCORT01', lat: 42.0, lon: 132.5, alt: 38000, speed: 500 },
      { type: 'FLY_TO', callsign: 'ESCORT02', lat: 42.0, lon: 131.5, alt: 36000, speed: 500 },
      // Red IADS
      { type: 'SPAWN', entityType: 'SA-10', callsign: 'BIGBIRD01', lat: 38.0, lon: 131.0, side: 'red' },
      { type: 'SPAWN', entityType: 'SA-10', callsign: 'BIGBIRD02', lat: 39.5, lon: 132.5, side: 'red' },
      { type: 'SPAWN', entityType: 'SA-2', callsign: 'GUIDELINE01', lat: 37.0, lon: 130.0, side: 'red' },
      // Red interceptors
      { type: 'SPAWN', entityType: 'Su-30', callsign: 'REDCAP01', lat: 39.0, lon: 131.5, alt: 15000, side: 'red', heading: 180, speed: 450 },
      { type: 'SPAWN', entityType: 'Su-30', callsign: 'REDCAP02', lat: 40.0, lon: 132.0, alt: 18000, side: 'red', heading: 200, speed: 450 },
      { type: 'PATROL', callsign: 'REDCAP01', point1: { lat: 38.0, lon: 130.5 }, point2: { lat: 40.0, lon: 132.5 }, alt: 20000 },
      { type: 'PATROL', callsign: 'REDCAP02', point1: { lat: 39.0, lon: 131.0 }, point2: { lat: 41.0, lon: 133.0 }, alt: 22000 },
    ],
  },
];
