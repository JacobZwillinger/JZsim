/**
 * WASM Batch Radar Check — AssemblyScript source
 *
 * Takes flat Float64Arrays for radar and target parameters.
 * Returns detections as flat array of [radarIdx, targetIdx, distance, snr].
 *
 * Radar data layout per radar (7 values):
 *   [powerW, gainDbi, freqGhz, lat, lon, alt, maxRangeM]
 *
 * Target data layout per target (4 values):
 *   [lat, lon, alt, rcs]
 *
 * Output layout per detection (4 values):
 *   [radarIdx, targetIdx, distanceM, detectionProbability]
 */

const RADAR_STRIDE: i32 = 7;
const TARGET_STRIDE: i32 = 4;
const OUTPUT_STRIDE: i32 = 4;

const BOLTZMANN: f64 = 1.38e-23;
const NOISE_TEMP: f64 = 290.0;
const NOISE_BW: f64 = 1e6;
const SPEED_OF_LIGHT: f64 = 3e8;
const FOUR_PI: f64 = 4.0 * 3.14159265358979;
const DEG_TO_RAD: f64 = 3.14159265358979 / 180.0;
const METERS_PER_DEG_LAT: f64 = 111320.0;
const EARTH_RADIUS_M: f64 = 6371000.0;

/** Approximate ground distance (meters) between two lat/lon points */
function approxDistanceM(lat1: f64, lon1: f64, lat2: f64, lon2: f64): f64 {
  const dLat = (lat2 - lat1) * METERS_PER_DEG_LAT;
  const avgLat = (lat1 + lat2) * 0.5 * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * METERS_PER_DEG_LAT * Math.cos(avgLat);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/** Radar horizon distance (meters) for given altitude */
function radarHorizon(altM: f64): f64 {
  return Math.sqrt(2.0 * EARTH_RADIUS_M * altM);
}

/** Radar equation: max detection range given parameters */
function radarMaxRange(powerW: f64, gainDbi: f64, freqGhz: f64, rcs: f64): f64 {
  const gain = Math.pow(10.0, gainDbi / 10.0);
  const lambda = SPEED_OF_LIGHT / (freqGhz * 1e9);
  const noisePower = BOLTZMANN * NOISE_TEMP * NOISE_BW;
  const minSNR = 10.0; // minimum detectable S/N ratio

  const numerator = powerW * gain * gain * lambda * lambda * rcs;
  const denominator = FOUR_PI * FOUR_PI * FOUR_PI * noisePower * minSNR;

  return Math.pow(numerator / denominator, 0.25);
}

/**
 * Batch radar detection check.
 * @param radarData Flat array of radar parameters [powerW, gainDbi, freqGhz, lat, lon, alt, maxRangeM] × N
 * @param targetData Flat array of target parameters [lat, lon, alt, rcs] × M
 * @param radarCount Number of radars
 * @param targetCount Number of targets
 * @param output Pre-allocated output buffer for detections
 * @returns Number of detections written to output
 */
export function batchRadarCheck(
  radarData: Float64Array,
  targetData: Float64Array,
  radarCount: i32,
  targetCount: i32,
  output: Float64Array,
): i32 {
  let detections: i32 = 0;
  const maxDetections: i32 = output.length / OUTPUT_STRIDE;

  for (let r: i32 = 0; r < radarCount; r++) {
    const rOff = r * RADAR_STRIDE;
    const powerW = radarData[rOff];
    const gainDbi = radarData[rOff + 1];
    const freqGhz = radarData[rOff + 2];
    const rLat = radarData[rOff + 3];
    const rLon = radarData[rOff + 4];
    const rAlt = radarData[rOff + 5];
    const maxRangeM = radarData[rOff + 6];

    const rHorizon = radarHorizon(rAlt);

    for (let t: i32 = 0; t < targetCount; t++) {
      if (detections >= maxDetections) return detections;

      const tOff = t * TARGET_STRIDE;
      const tLat = targetData[tOff];
      const tLon = targetData[tOff + 1];
      const tAlt = targetData[tOff + 2];
      const rcs = targetData[tOff + 3];

      // Quick range gate: approximate distance
      const dist = approxDistanceM(rLat, rLon, tLat, tLon);
      if (dist > maxRangeM) continue;

      // Horizon check
      const tHorizon = radarHorizon(tAlt);
      if (dist > rHorizon + tHorizon) continue;

      // Radar equation check
      const Rmax = radarMaxRange(powerW, gainDbi, freqGhz, rcs);
      if (dist > Rmax) continue;

      // Detection probability based on SNR margin
      const snrMargin = Rmax / dist;
      const prob: f64 = Math.min(1.0, snrMargin * snrMargin * 0.5);

      // Write detection
      const dOff = detections * OUTPUT_STRIDE;
      output[dOff] = r as f64;
      output[dOff + 1] = t as f64;
      output[dOff + 2] = dist;
      output[dOff + 3] = prob;
      detections++;
    }
  }

  return detections;
}
