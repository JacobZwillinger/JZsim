/**
 * WASM Batch Radar — JS fallback implementation.
 *
 * Provides the same batch radar processing interface as the WASM module.
 * When the WASM module is built (via `npm run build` in packages/wasm-radar),
 * it will replace this fallback with native WASM performance.
 *
 * This JS fallback is still significantly faster than the per-entity loop
 * because it operates on flat typed arrays with minimal object allocation.
 */

const RADAR_STRIDE = 7;
const TARGET_STRIDE = 4;
const OUTPUT_STRIDE = 4;

const BOLTZMANN = 1.38e-23;
const NOISE_TEMP = 290;
const NOISE_BW = 1e6;
const SPEED_OF_LIGHT = 3e8;
const FOUR_PI = 4 * Math.PI;
const DEG_TO_RAD = Math.PI / 180;
const METERS_PER_DEG_LAT = 111320;
const EARTH_RADIUS_M = 6371000;

function approxDistanceM(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * METERS_PER_DEG_LAT;
  const avgLat = (lat1 + lat2) * 0.5 * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * METERS_PER_DEG_LAT * Math.cos(avgLat);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function radarHorizon(altM) {
  return Math.sqrt(2 * EARTH_RADIUS_M * altM);
}

function radarMaxRange(powerW, gainDbi, freqGhz, rcs) {
  const gain = Math.pow(10, gainDbi / 10);
  const lambda = SPEED_OF_LIGHT / (freqGhz * 1e9);
  const noisePower = BOLTZMANN * NOISE_TEMP * NOISE_BW;
  const minSNR = 10;
  const numerator = powerW * gain * gain * lambda * lambda * rcs;
  const denominator = FOUR_PI * FOUR_PI * FOUR_PI * noisePower * minSNR;
  return Math.pow(numerator / denominator, 0.25);
}

/**
 * Batch radar detection check.
 * @param {Float64Array} radarData - [powerW, gainDbi, freqGhz, lat, lon, alt, maxRangeM] × N
 * @param {Float64Array} targetData - [lat, lon, alt, rcs] × M
 * @param {number} radarCount
 * @param {number} targetCount
 * @param {Float64Array} output - Pre-allocated output buffer
 * @returns {number} Number of detections written
 */
export function batchRadarCheck(radarData, targetData, radarCount, targetCount, output) {
  let detections = 0;
  const maxDetections = (output.length / OUTPUT_STRIDE) | 0;

  for (let r = 0; r < radarCount; r++) {
    const rOff = r * RADAR_STRIDE;
    const powerW = radarData[rOff];
    const gainDbi = radarData[rOff + 1];
    const freqGhz = radarData[rOff + 2];
    const rLat = radarData[rOff + 3];
    const rLon = radarData[rOff + 4];
    const rAlt = radarData[rOff + 5];
    const maxRangeM = radarData[rOff + 6];

    const rHorizon = radarHorizon(rAlt);

    for (let t = 0; t < targetCount; t++) {
      if (detections >= maxDetections) return detections;

      const tOff = t * TARGET_STRIDE;
      const tLat = targetData[tOff];
      const tLon = targetData[tOff + 1];
      const tAlt = targetData[tOff + 2];
      const rcs = targetData[tOff + 3];

      // Quick range gate
      const dist = approxDistanceM(rLat, rLon, tLat, tLon);
      if (dist > maxRangeM) continue;

      // Horizon check
      const tHorizon = radarHorizon(tAlt);
      if (dist > rHorizon + tHorizon) continue;

      // Radar equation
      const Rmax = radarMaxRange(powerW, gainDbi, freqGhz, rcs);
      if (dist > Rmax) continue;

      // Detection probability
      const snrMargin = Rmax / dist;
      const prob = Math.min(1, snrMargin * snrMargin * 0.5);

      // Write detection
      const dOff = detections * OUTPUT_STRIDE;
      output[dOff] = r;
      output[dOff + 1] = t;
      output[dOff + 2] = dist;
      output[dOff + 3] = prob;
      detections++;
    }
  }

  return detections;
}
