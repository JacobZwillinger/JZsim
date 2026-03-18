import {
  radarMaxRange, detectionProbability, radarHorizon, approxDistance,
  computeEffectiveRCS, RadarMode, METERS_PER_DEGREE_LAT,
  POD_DEFAULTS,
} from '@jzsim/core';
import { batchRadarCheck } from '@jzsim/wasm-radar';
import type { System } from './types.js';
import type { World } from '../ecs/world.js';
import type { SpatialGrid } from '../spatial/grid-index.js';

const RADAR_STRIDE = 7;
const TARGET_STRIDE = 4;
const OUTPUT_STRIDE = 4;

/**
 * Radar detection system with 6-layer optimization cascade.
 *
 * Layer 1: Spatial grid — only check entities in nearby cells
 * Layer 2: Staggered updates — each radar updates every N ticks
 * Layer 3: Range gate — quick distance check before expensive math
 * Layer 4: Horizon check — 4/3 earth model
 * Layer 5: Radar equation — detection probability
 * Layer 6: Batch processing via flat typed arrays (JS fallback / future WASM)
 *
 * For small entity counts (<500 targets), the per-entity path with spatial grid
 * is used. For large counts, the batch path avoids per-entity overhead.
 */
export class RadarDetectionSystem implements System {
  private readonly UPDATE_DIVISOR = 4;
  private readonly BATCH_THRESHOLD = 500;
  private readonly candidateBuffer: number[] = [];

  // Batch path reusable buffers (lazily grown)
  private radarBuf: Float64Array | null = null;
  private targetBuf: Float64Array | null = null;
  private outputBuf: Float64Array | null = null;
  private readonly radarIdxMap: number[] = [];
  private readonly targetIdxMap: number[] = [];

  constructor(private readonly spatialGrid: SpatialGrid) {}

  update(world: World, dt: number): void {
    world.radarContacts.clear();
    const tick = world.tickCount;
    const hwm = world.entities.highWaterMark;

    // Count aircraft for batch threshold decision
    let aircraftCount = 0;
    const aircraftMask = world.aircraft.mask;
    for (let i = 0; i < hwm; i++) {
      if (aircraftMask[i]) aircraftCount++;
    }

    if (aircraftCount >= this.BATCH_THRESHOLD) {
      this.batchUpdate(world, tick, hwm);
    } else {
      this.perEntityUpdate(world, tick, hwm);
    }
  }

  /** Standard per-entity path with spatial grid (Layer 1-5). */
  private perEntityUpdate(world: World, tick: number, hwm: number): void {
    const radarMask = world.radar.mask;

    for (let radarIdx = 0; radarIdx < hwm; radarIdx++) {
      if (!radarMask[radarIdx]) continue;

      // Layer 2: Staggered updates
      if (radarIdx % this.UPDATE_DIVISOR !== tick % this.UPDATE_DIVISOR) continue;

      const mode = world.radar.get(radarIdx, 'mode');
      if (mode === RadarMode.OFF || mode === RadarMode.STANDBY) continue;

      this.evaluateRadar(world, radarIdx);
    }
  }

  /** Layer 6: Batch path — flat typed arrays, no spatial grid overhead. */
  private batchUpdate(world: World, tick: number, hwm: number): void {
    const radarMask = world.radar.mask;
    const aircraftMask = world.aircraft.mask;

    // Collect active radars (respecting stagger)
    this.radarIdxMap.length = 0;
    for (let i = 0; i < hwm; i++) {
      if (!radarMask[i]) continue;
      if (i % this.UPDATE_DIVISOR !== tick % this.UPDATE_DIVISOR) continue;
      const mode = world.radar.get(i, 'mode');
      if (mode === RadarMode.OFF || mode === RadarMode.STANDBY) continue;
      this.radarIdxMap.push(i);
    }
    if (this.radarIdxMap.length === 0) return;

    // Collect targets (aircraft only)
    this.targetIdxMap.length = 0;
    for (let i = 0; i < hwm; i++) {
      if (aircraftMask[i]) this.targetIdxMap.push(i);
    }
    if (this.targetIdxMap.length === 0) return;

    const radarCount = this.radarIdxMap.length;
    const targetCount = this.targetIdxMap.length;

    // Ensure buffers are large enough
    const radarBufLen = radarCount * RADAR_STRIDE;
    if (!this.radarBuf || this.radarBuf.length < radarBufLen) {
      this.radarBuf = new Float64Array(radarBufLen);
    }
    const targetBufLen = targetCount * TARGET_STRIDE;
    if (!this.targetBuf || this.targetBuf.length < targetBufLen) {
      this.targetBuf = new Float64Array(targetBufLen);
    }
    // Cap output at 10k detections to bound memory
    const maxDetections = Math.min(radarCount * targetCount, 10_000);
    const outputBufLen = maxDetections * OUTPUT_STRIDE;
    if (!this.outputBuf || this.outputBuf.length < outputBufLen) {
      this.outputBuf = new Float64Array(outputBufLen);
    }

    // Pack radar data
    for (let r = 0; r < radarCount; r++) {
      const idx = this.radarIdxMap[r];
      const off = r * RADAR_STRIDE;
      this.radarBuf[off] = world.radar.get(idx, 'powerW');
      this.radarBuf[off + 1] = world.radar.get(idx, 'gainDbi');
      this.radarBuf[off + 2] = world.radar.get(idx, 'freqGhz');
      this.radarBuf[off + 3] = world.position.get(idx, 'lat');
      this.radarBuf[off + 4] = world.position.get(idx, 'lon');
      this.radarBuf[off + 5] = world.position.get(idx, 'alt');
      this.radarBuf[off + 6] = world.radar.get(idx, 'maxRangeM');
    }

    // Pack target data with pre-computed dynamic RCS
    for (let t = 0; t < targetCount; t++) {
      const idx = this.targetIdxMap[t];
      const off = t * TARGET_STRIDE;
      this.targetBuf[off] = world.position.get(idx, 'lat');
      this.targetBuf[off + 1] = world.position.get(idx, 'lon');
      this.targetBuf[off + 2] = world.position.get(idx, 'alt');
      // Dynamic RCS from loadout state
      const baseRcs = world.aircraft.get(idx, 'rcs');
      const isStealth = baseRcs < 0.01;
      const loadout = world.loadouts.get(idx);
      const externalStores = loadout ? (loadout.primaryAmmo + loadout.secondaryAmmo) : 0;
      const hasExtTanks = loadout ? loadout.externalFuelTanks : false;
      const bayOpen = loadout ? world.simTime < loadout.bayDoorsOpenUntil : false;
      const podsRcs = loadout?.externalPods
        ? loadout.externalPods.reduce((sum, p) => sum + (POD_DEFAULTS[p]?.rcsM2 ?? 0), 0)
        : 0;
      this.targetBuf[off + 3] = computeEffectiveRCS(baseRcs, externalStores, hasExtTanks, bayOpen, isStealth, podsRcs);
    }

    // Run batch check
    const nDetections = batchRadarCheck(
      this.radarBuf, this.targetBuf, radarCount, targetCount, this.outputBuf,
    );

    // Emit detection events
    for (let d = 0; d < nDetections; d++) {
      const dOff = d * OUTPUT_STRIDE;
      const rBatchIdx = this.outputBuf[dOff] | 0;
      const tBatchIdx = this.outputBuf[dOff + 1] | 0;
      const dist = this.outputBuf[dOff + 2];
      const prob = this.outputBuf[dOff + 3];

      const radarIdx = this.radarIdxMap[rBatchIdx];
      const targetIdx = this.targetIdxMap[tBatchIdx];

      // Skip self-detection
      if (radarIdx === targetIdx) continue;

      if (prob > 0.5) {
        world.emit({
          type: 'radar:detection',
          radarId: radarIdx,
          targetId: targetIdx,
          range: dist,
          probability: prob,
        });

        // Store contact for engagement systems
        let contacts = world.radarContacts.get(radarIdx);
        if (!contacts) {
          contacts = [];
          world.radarContacts.set(radarIdx, contacts);
        }
        contacts.push(targetIdx);
      }
    }
  }

  private evaluateRadar(world: World, radarIdx: number): void {
    const radarLat = world.position.get(radarIdx, 'lat');
    const radarLon = world.position.get(radarIdx, 'lon');
    const radarAlt = world.position.get(radarIdx, 'alt');
    const maxRangeM = world.radar.get(radarIdx, 'maxRangeM');
    const powerW = world.radar.get(radarIdx, 'powerW');
    const gainDbi = world.radar.get(radarIdx, 'gainDbi');
    const freqGhz = world.radar.get(radarIdx, 'freqGhz');

    // Layer 1: Spatial query
    const maxRangeDeg = maxRangeM / METERS_PER_DEGREE_LAT;
    this.spatialGrid.queryRadius(radarLat, radarLon, maxRangeDeg, this.candidateBuffer);

    for (const targetIdx of this.candidateBuffer) {
      // Only detect aircraft (entities with aircraft component)
      if (!world.aircraft.has(targetIdx)) continue;
      if (targetIdx === radarIdx) continue;

      const targetLat = world.position.get(targetIdx, 'lat');
      const targetLon = world.position.get(targetIdx, 'lon');
      const targetAlt = world.position.get(targetIdx, 'alt');

      // Layer 3: Range gate (fast approximate distance)
      const dist = approxDistance(radarLat, radarLon, targetLat, targetLon);
      if (dist > maxRangeM) continue;

      // Layer 4: Horizon check
      const horizonDist = radarHorizon(radarAlt, targetAlt);
      if (dist > horizonDist) continue;

      // Layer 5: Radar equation with dynamic RCS
      const baseRcs = world.aircraft.get(targetIdx, 'rcs');
      const isStealth = baseRcs < 0.01; // stealth aircraft have very low base RCS
      const loadout = world.loadouts.get(targetIdx);
      const externalStores = loadout
        ? (loadout.primaryAmmo + loadout.secondaryAmmo)
        : 0;
      const hasExtTanks = loadout ? loadout.externalFuelTanks : false;
      const bayOpen = loadout ? world.simTime < loadout.bayDoorsOpenUntil : false;
      const podsRcs = loadout?.externalPods
        ? loadout.externalPods.reduce((sum, p) => sum + (POD_DEFAULTS[p]?.rcsM2 ?? 0), 0)
        : 0;
      const rcs = computeEffectiveRCS(baseRcs, externalStores, hasExtTanks, bayOpen, isStealth, podsRcs);
      const rmax = radarMaxRange(powerW, gainDbi, freqGhz, rcs);
      const pDetect = detectionProbability(dist, rmax);

      if (pDetect > 0.5) {
        world.emit({
          type: 'radar:detection',
          radarId: radarIdx,
          targetId: targetIdx,
          range: dist,
          probability: pDetect,
        });

        // Store contact for engagement systems
        let contacts = world.radarContacts.get(radarIdx);
        if (!contacts) {
          contacts = [];
          world.radarContacts.set(radarIdx, contacts);
        }
        contacts.push(targetIdx);
      }
    }
  }
}
