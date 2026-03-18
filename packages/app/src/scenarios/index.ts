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
  {
    name: 'Stress Test: Pacific Theater',
    description: '200+ aircraft, 30 radars/SAMs — full-scale Pacific air war stress test',
    commands: () => {
      const cmds: Command[] = [];

      // === BLUE FORCE ===
      // 4 Blue airbases
      const blueBases = [
        { callsign: 'KADENA', lat: 26.35, lon: 127.77 },
        { callsign: 'MISAWA', lat: 40.7, lon: 141.4 },
        { callsign: 'YOKOTA', lat: 35.75, lon: 139.35 },
        { callsign: 'IWAKUNI', lat: 34.14, lon: 132.24 },
      ];
      for (const base of blueBases) {
        cmds.push({ type: 'SPAWN', entityType: 'AIRBASE', callsign: base.callsign, lat: base.lat, lon: base.lon, side: 'blue' });
      }

      // Blue AWACS — 4 orbiting
      for (let i = 0; i < 4; i++) {
        cmds.push({ type: 'SPAWN', entityType: 'E-3', callsign: `SENTRY${String(i + 1).padStart(2, '0')}`, lat: 30 + i * 3, lon: 132 + i * 2, alt: 35000, side: 'blue', heading: 0, speed: 350 });
      }

      // Blue tankers — 4 orbiting
      for (let i = 0; i < 4; i++) {
        cmds.push({ type: 'SPAWN', entityType: 'KC-135', callsign: `TEXACO${String(i + 1).padStart(2, '0')}`, lat: 28 + i * 3, lon: 130 + i * 2, alt: 28000, side: 'blue', heading: 90, speed: 400 });
      }

      // Blue F-22A — 24 stealth fighters (6 flights x 4)
      for (let f = 0; f < 6; f++) {
        for (let w = 0; w < 4; w++) {
          const n = f * 4 + w + 1;
          cmds.push({ type: 'SPAWN', entityType: 'F-22A', callsign: `RAPT${String(n).padStart(2, '0')}`, lat: 28 + f * 2 + w * 0.15, lon: 129 + f * 1.5 + w * 0.15, alt: 32000 + w * 2000, side: 'blue', heading: 340 + f * 5, speed: 500 });
        }
      }

      // Blue F-15C — 40 eagles (10 flights x 4)
      for (let f = 0; f < 10; f++) {
        for (let w = 0; w < 4; w++) {
          const n = f * 4 + w + 1;
          cmds.push({ type: 'SPAWN', entityType: 'F-15C', callsign: `EGL${String(n).padStart(3, '0')}`, lat: 27 + f * 1.2 + w * 0.12, lon: 128 + (f % 5) * 2 + w * 0.12, alt: 25000 + w * 1500 + f * 500, side: 'blue', heading: 350, speed: 450 });
        }
      }

      // Blue F-16C — 20 vipers (5 flights x 4)
      for (let f = 0; f < 5; f++) {
        for (let w = 0; w < 4; w++) {
          const n = f * 4 + w + 1;
          cmds.push({ type: 'SPAWN', entityType: 'F-16C', callsign: `VPR${String(n).padStart(2, '0')}`, lat: 30 + f * 1.5 + w * 0.1, lon: 133 + f + w * 0.1, alt: 20000 + w * 2000, side: 'blue', heading: 0, speed: 480 });
        }
      }

      // Blue PATRIOT batteries — 8
      const bluePatriots = [
        [26.5, 127.8], [35.7, 139.4], [40.7, 141.5], [34.2, 132.3],
        [33.0, 130.5], [37.0, 136.5], [31.5, 131.0], [38.5, 140.0],
      ];
      for (let i = 0; i < bluePatriots.length; i++) {
        cmds.push({ type: 'SPAWN', entityType: 'PATRIOT', callsign: `PAT${String(i + 1).padStart(2, '0')}`, lat: bluePatriots[i][0], lon: bluePatriots[i][1], side: 'blue' });
      }

      // Set up blue patrols for lead F-22s
      for (let f = 0; f < 6; f++) {
        const cs = `RAPT${String(f * 4 + 1).padStart(2, '0')}`;
        cmds.push({ type: 'PATROL', callsign: cs, point1: { lat: 29 + f * 2, lon: 129 + f * 1.5 }, point2: { lat: 31 + f * 2, lon: 131 + f * 1.5 }, alt: 35000 });
      }

      // === RED FORCE ===
      // 2 Red staging bases
      cmds.push({ type: 'SPAWN', entityType: 'AIRBASE', callsign: 'VLADBASE', lat: 43.1, lon: 131.9, side: 'red' });
      cmds.push({ type: 'SPAWN', entityType: 'AIRBASE', callsign: 'KHABAROV', lat: 48.5, lon: 135.2, side: 'red' });

      // Red Su-30 strike waves — 60 aircraft (15 flights x 4)
      for (let f = 0; f < 15; f++) {
        for (let w = 0; w < 4; w++) {
          const n = f * 4 + w + 1;
          cmds.push({ type: 'SPAWN', entityType: 'Su-30', callsign: `FLK${String(n).padStart(3, '0')}`, lat: 43 + (f % 5) * 0.8 + w * 0.1, lon: 132 + Math.floor(f / 5) * 3 + w * 0.1, alt: 18000 + (f % 3) * 4000 + w * 1000, side: 'red', heading: 180 + (f % 5 - 2) * 10, speed: 520 });
        }
      }

      // Red second wave — 40 more Su-30s (10 flights x 4)
      for (let f = 0; f < 10; f++) {
        for (let w = 0; w < 4; w++) {
          const n = f * 4 + w + 1;
          cmds.push({ type: 'SPAWN', entityType: 'Su-30', callsign: `RFX${String(n).padStart(3, '0')}`, lat: 44 + f * 0.5 + w * 0.08, lon: 134 + (f % 5) * 1.5 + w * 0.08, alt: 22000 + (f % 4) * 3000, side: 'red', heading: 190, speed: 500 });
        }
      }

      // Red AWACS — 2
      cmds.push({ type: 'SPAWN', entityType: 'E-3', callsign: 'REDSPY01', lat: 46.0, lon: 134.0, alt: 33000, side: 'red', heading: 180, speed: 350 });
      cmds.push({ type: 'SPAWN', entityType: 'E-3', callsign: 'REDSPY02', lat: 47.0, lon: 137.0, alt: 35000, side: 'red', heading: 200, speed: 350 });

      // Red SA-10 umbrella — 12 batteries
      const redSAMs = [
        [42.0, 131.0], [42.5, 133.0], [43.0, 135.0],
        [43.5, 132.0], [44.0, 134.0], [44.5, 136.0],
        [41.5, 130.5], [42.0, 132.5], [42.5, 134.5],
        [43.0, 131.5], [43.5, 133.5], [44.0, 135.5],
      ];
      for (let i = 0; i < redSAMs.length; i++) {
        cmds.push({ type: 'SPAWN', entityType: 'SA-10', callsign: `RSAM${String(i + 1).padStart(2, '0')}`, lat: redSAMs[i][0], lon: redSAMs[i][1], side: 'red' });
      }

      // Red SA-2 inner belt — 6 older systems
      const redSA2s = [
        [41.0, 130.0], [41.5, 132.0], [42.0, 134.0],
        [42.5, 131.0], [43.0, 133.0], [43.5, 135.0],
      ];
      for (let i = 0; i < redSA2s.length; i++) {
        cmds.push({ type: 'SPAWN', entityType: 'SA-2', callsign: `GDL${String(i + 1).padStart(2, '0')}`, lat: redSA2s[i][0], lon: redSA2s[i][1], side: 'red' });
      }

      // Red lead flights fly south toward blue forces
      for (let f = 0; f < 15; f++) {
        const cs = `FLK${String(f * 4 + 1).padStart(3, '0')}`;
        cmds.push({ type: 'FLY_TO', callsign: cs, lat: 30 + (f % 5) * 2, lon: 130 + Math.floor(f / 5) * 3, alt: 20000 + (f % 3) * 4000, speed: 550 });
      }

      return cmds;
    },
  },
  {
    name: '10K Entity Stress Test',
    description: '10,000 aircraft — massive theater-wide air war to test engine scalability',
    commands: () => {
      const cmds: Command[] = [];
      const types = ['F-15C', 'F-16C', 'Su-30', 'F-22A'] as const;
      const sides = ['blue', 'red'] as const;

      // 4 bases per side
      for (let s = 0; s < 2; s++) {
        for (let b = 0; b < 4; b++) {
          const lat = s === 0 ? 26 + b * 4 : 42 + b * 2;
          const lon = s === 0 ? 127 + b * 3 : 130 + b * 3;
          cmds.push({
            type: 'SPAWN',
            entityType: 'AIRBASE',
            callsign: `${sides[s].toUpperCase()[0]}BASE${b + 1}`,
            lat, lon,
            side: sides[s],
          });
        }
      }

      // 20 AWACS (10 per side)
      for (let s = 0; s < 2; s++) {
        for (let i = 0; i < 10; i++) {
          cmds.push({
            type: 'SPAWN',
            entityType: 'E-3',
            callsign: `${sides[s][0].toUpperCase()}AWC${String(i + 1).padStart(2, '0')}`,
            lat: (s === 0 ? 28 : 44) + i * 0.8,
            lon: 130 + (i % 5) * 2.5,
            alt: 33000 + (i % 3) * 2000,
            side: sides[s],
            heading: s === 0 ? 350 : 180,
            speed: 350,
          });
        }
      }

      // 40 SAM sites (20 per side)
      for (let s = 0; s < 2; s++) {
        for (let i = 0; i < 20; i++) {
          const samType = i % 3 === 0 ? 'SA-10' : i % 3 === 1 ? 'PATRIOT' : 'SA-2';
          cmds.push({
            type: 'SPAWN',
            entityType: s === 0 ? (samType === 'SA-10' ? 'PATRIOT' : 'PATRIOT') : (samType === 'PATRIOT' ? 'SA-10' : samType),
            callsign: `${sides[s][0].toUpperCase()}SAM${String(i + 1).padStart(2, '0')}`,
            lat: (s === 0 ? 25 : 41) + (i % 5) * 2 + Math.random() * 0.5,
            lon: 127 + Math.floor(i / 5) * 3 + Math.random() * 0.5,
            side: sides[s],
          });
        }
      }

      // ~9,900 aircraft — split evenly between sides
      // ~4,950 per side in flights of 4
      let entityNum = 0;
      for (let s = 0; s < 2; s++) {
        const baseLat = s === 0 ? 26 : 43;
        const baseHeading = s === 0 ? 350 : 180;
        const numFlights = 1237; // 1237 flights × 4 = 4948 per side

        for (let f = 0; f < numFlights; f++) {
          const aircraftType = types[f % types.length];
          const flightLat = baseLat + (f % 50) * 0.3 + Math.random() * 0.1;
          const flightLon = 126 + Math.floor(f / 50) * 0.5 + Math.random() * 0.1;
          const flightAlt = 15000 + (f % 8) * 3000;

          for (let w = 0; w < 4; w++) {
            entityNum++;
            cmds.push({
              type: 'SPAWN',
              entityType: aircraftType,
              callsign: `${sides[s][0].toUpperCase()}${String(entityNum).padStart(5, '0')}`,
              lat: flightLat + w * 0.02,
              lon: flightLon + w * 0.02,
              alt: flightAlt + w * 500,
              side: sides[s],
              heading: baseHeading + (f % 7 - 3) * 5,
              speed: 400 + (f % 5) * 30,
            });
          }
        }
      }

      return cmds;
    },
  },
  {
    name: 'Korea Strike Package',
    description: '40 DMPIs across North Korea — 4 B-2A bombers on strike routes with Red SAM defenses',
    commands: () => {
      const cmds: Command[] = [];

      // ── DMPI Targets (40) ─────────────────────────────────────────

      // Command & Control (6)
      cmds.push({ type: 'DMPI_ADD', name: 'KPA-HQ', lat: 39.02, lon: 125.75, description: 'Pyongyang military HQ' });
      cmds.push({ type: 'DMPI_ADD', name: 'NKJOC', lat: 39.05, lon: 125.68, description: 'Joint Operations Center' });
      cmds.push({ type: 'DMPI_ADD', name: 'CORPS-CMD1', lat: 38.75, lon: 125.90, description: 'I Corps command post' });
      cmds.push({ type: 'DMPI_ADD', name: 'CORPS-CMD2', lat: 39.80, lon: 126.55, description: 'II Corps command post' });
      cmds.push({ type: 'DMPI_ADD', name: 'CORPS-CMD4', lat: 40.10, lon: 127.45, description: 'IV Corps command post' });
      cmds.push({ type: 'DMPI_ADD', name: 'STRATCOM', lat: 39.10, lon: 125.82, description: 'Strategic comms relay' });

      // IADS / SAM Sites (8)
      cmds.push({ type: 'DMPI_ADD', name: 'SAM-PYONG1', lat: 39.15, lon: 125.60, description: 'SA-5 Pyongyang north' });
      cmds.push({ type: 'DMPI_ADD', name: 'SAM-PYONG2', lat: 38.90, lon: 125.85, description: 'SA-5 Pyongyang south' });
      cmds.push({ type: 'DMPI_ADD', name: 'SAM-WONSAN', lat: 39.15, lon: 127.45, description: 'SA-3 Wonsan defense' });
      cmds.push({ type: 'DMPI_ADD', name: 'SAM-HAMHNG', lat: 39.90, lon: 127.55, description: 'SA-2 Hamhung' });
      cmds.push({ type: 'DMPI_ADD', name: 'SAM-KAESNG', lat: 37.97, lon: 126.56, description: 'SA-3 Kaesong' });
      cmds.push({ type: 'DMPI_ADD', name: 'SAM-SINUIJ', lat: 40.10, lon: 124.40, description: 'SA-2 Sinuiju' });
      cmds.push({ type: 'DMPI_ADD', name: 'EW-RADAR1', lat: 39.50, lon: 126.10, description: 'EW radar site' });
      cmds.push({ type: 'DMPI_ADD', name: 'EW-RADAR2', lat: 40.50, lon: 128.20, description: 'EW radar Chongjin' });

      // Airfields (6)
      cmds.push({ type: 'DMPI_ADD', name: 'AF-SUNCHON', lat: 39.42, lon: 125.90, description: 'Sunchon airfield' });
      cmds.push({ type: 'DMPI_ADD', name: 'AF-ONCHON', lat: 38.92, lon: 125.30, description: 'Onchon airfield' });
      cmds.push({ type: 'DMPI_ADD', name: 'AF-WONSAN', lat: 39.17, lon: 127.48, description: 'Wonsan airfield' });
      cmds.push({ type: 'DMPI_ADD', name: 'AF-UIJU', lat: 40.20, lon: 124.50, description: 'Uiju airfield' });
      cmds.push({ type: 'DMPI_ADD', name: 'AF-TOKSAN', lat: 39.75, lon: 126.25, description: 'Toksan airfield' });
      cmds.push({ type: 'DMPI_ADD', name: 'AF-KWAIL', lat: 38.65, lon: 125.18, description: 'Kwail airfield' });

      // Nuclear / WMD (4)
      cmds.push({ type: 'DMPI_ADD', name: 'NUC-YONGBN', lat: 39.80, lon: 125.75, description: 'Yongbyon nuclear complex' });
      cmds.push({ type: 'DMPI_ADD', name: 'NUC-KANGSO', lat: 38.95, lon: 125.35, description: 'Kangson enrichment' });
      cmds.push({ type: 'DMPI_ADD', name: 'CHEM-AOJI', lat: 42.05, lon: 129.85, description: 'Chemical storage Aoji' });
      cmds.push({ type: 'DMPI_ADD', name: 'CHEM-SAKCH', lat: 38.75, lon: 127.15, description: 'Chemical weapons depot' });

      // Bridges / LOCs (4)
      cmds.push({ type: 'DMPI_ADD', name: 'BR-CHONGCH', lat: 39.70, lon: 125.80, description: 'Chongchon River bridge' });
      cmds.push({ type: 'DMPI_ADD', name: 'BR-TAEDONG', lat: 39.00, lon: 125.72, description: 'Taedong River bridge' });
      cmds.push({ type: 'DMPI_ADD', name: 'BR-YALU1', lat: 40.12, lon: 124.38, description: 'Yalu River bridge' });
      cmds.push({ type: 'DMPI_ADD', name: 'RR-JUNCTN', lat: 39.30, lon: 126.00, description: 'Rail junction' });

      // Fuel / Logistics (4)
      cmds.push({ type: 'DMPI_ADD', name: 'POL-NAMPO', lat: 38.73, lon: 125.40, description: 'Nampo petroleum terminal' });
      cmds.push({ type: 'DMPI_ADD', name: 'POL-WONSAN', lat: 39.13, lon: 127.50, description: 'Wonsan fuel depot' });
      cmds.push({ type: 'DMPI_ADD', name: 'AMMO-KAECH', lat: 38.60, lon: 126.50, description: 'Kaechon ammo depot' });
      cmds.push({ type: 'DMPI_ADD', name: 'SUP-DEPOT', lat: 39.50, lon: 127.00, description: 'Supply depot' });

      // Naval (4)
      cmds.push({ type: 'DMPI_ADD', name: 'NAVY-NAMPO', lat: 38.72, lon: 125.38, description: 'Nampo naval base' });
      cmds.push({ type: 'DMPI_ADD', name: 'NAVY-WONSA', lat: 39.12, lon: 127.52, description: 'Wonsan naval base' });
      cmds.push({ type: 'DMPI_ADD', name: 'NAVY-CHONG', lat: 41.78, lon: 129.80, description: 'Chongjin naval base' });
      cmds.push({ type: 'DMPI_ADD', name: 'SUB-MAYANG', lat: 39.95, lon: 128.05, description: 'Mayang-do submarine base' });

      // Missile (4)
      cmds.push({ type: 'DMPI_ADD', name: 'TEL-SITE1', lat: 39.65, lon: 126.80, description: 'TEL staging area' });
      cmds.push({ type: 'DMPI_ADD', name: 'TEL-SITE2', lat: 40.30, lon: 127.00, description: 'Mobile missile garrison' });
      cmds.push({ type: 'DMPI_ADD', name: 'MSL-MUSUDN', lat: 40.85, lon: 129.65, description: 'Musudan-ri launch complex' });
      cmds.push({ type: 'DMPI_ADD', name: 'MSL-SOHAE', lat: 39.66, lon: 124.71, description: 'Sohae launch facility' });

      // ── Blue Forces ───────────────────────────────────────────────

      // Blue base (Osan, South Korea)
      cmds.push({ type: 'SPAWN', entityType: 'AIRBASE', callsign: 'OSAN', lat: 37.09, lon: 127.03, side: 'blue' });

      // 4 B-2A bombers approaching from the south
      cmds.push({ type: 'SPAWN', entityType: 'B-2A', callsign: 'SPIRIT01', lat: 35.5, lon: 125.0, alt: 40000, side: 'blue', heading: 15, speed: 450 });
      cmds.push({ type: 'SPAWN', entityType: 'B-2A', callsign: 'SPIRIT02', lat: 35.5, lon: 126.0, alt: 40000, side: 'blue', heading: 10, speed: 450 });
      cmds.push({ type: 'SPAWN', entityType: 'B-2A', callsign: 'SPIRIT03', lat: 35.5, lon: 127.5, alt: 40000, side: 'blue', heading: 5, speed: 450 });
      cmds.push({ type: 'SPAWN', entityType: 'B-2A', callsign: 'SPIRIT04', lat: 35.5, lon: 129.0, alt: 40000, side: 'blue', heading: 350, speed: 450 });

      // Blue AWACS
      cmds.push({ type: 'SPAWN', entityType: 'E-3', callsign: 'MAGIC01', lat: 36.0, lon: 127.0, alt: 35000, side: 'blue', heading: 0, speed: 350 });

      // ── Red SAM Defenses ──────────────────────────────────────────

      cmds.push({ type: 'SPAWN', entityType: 'SA-10', callsign: 'GRUMBLE01', lat: 39.05, lon: 125.70, side: 'red' });
      cmds.push({ type: 'SPAWN', entityType: 'SA-10', callsign: 'GRUMBLE02', lat: 39.20, lon: 127.40, side: 'red' });
      cmds.push({ type: 'SPAWN', entityType: 'SA-2', callsign: 'GUIDELN01', lat: 40.00, lon: 126.00, side: 'red' });
      cmds.push({ type: 'SPAWN', entityType: 'SA-2', callsign: 'GUIDELN02', lat: 38.50, lon: 126.20, side: 'red' });

      // ── Strike Assignments ────────────────────────────────────────
      // SPIRIT01: Western corridor (Sinuiju, Nampo, west Pyongyang) — 10 DMPIs
      cmds.push({ type: 'STRIKE', callsign: 'SPIRIT01', dmpiNames: [
        'SAM-SINUIJ', 'AF-UIJU', 'BR-YALU1', 'MSL-SOHAE', 'AF-KWAIL',
        'POL-NAMPO', 'NAVY-NAMPO', 'NUC-KANGSO', 'AF-ONCHON', 'SAM-PYONG1',
      ]});

      // SPIRIT02: Central Pyongyang area — 10 DMPIs
      cmds.push({ type: 'STRIKE', callsign: 'SPIRIT02', dmpiNames: [
        'SAM-PYONG2', 'SAM-KAESNG', 'BR-TAEDONG', 'KPA-HQ', 'NKJOC',
        'STRATCOM', 'CORPS-CMD1', 'AF-SUNCHON', 'NUC-YONGBN', 'BR-CHONGCH',
      ]});

      // SPIRIT03: Eastern corridor (Wonsan, Hamhung) — 10 DMPIs
      cmds.push({ type: 'STRIKE', callsign: 'SPIRIT03', dmpiNames: [
        'AMMO-KAECH', 'CHEM-SAKCH', 'RR-JUNCTN', 'EW-RADAR1', 'SUP-DEPOT',
        'SAM-WONSAN', 'AF-WONSAN', 'POL-WONSAN', 'NAVY-WONSA', 'TEL-SITE1',
      ]});

      // SPIRIT04: Northern corridor (Chongjin, Musudan-ri) — 10 DMPIs
      cmds.push({ type: 'STRIKE', callsign: 'SPIRIT04', dmpiNames: [
        'CORPS-CMD2', 'AF-TOKSAN', 'CORPS-CMD4', 'SAM-HAMHNG', 'SUB-MAYANG',
        'TEL-SITE2', 'EW-RADAR2', 'NAVY-CHONG', 'CHEM-AOJI', 'MSL-MUSUDN',
      ]});

      return cmds;
    },
  },
];
