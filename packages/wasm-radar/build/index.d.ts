/**
 * Batch radar detection check.
 * @param radarData Flat array: [powerW, gainDbi, freqGhz, lat, lon, alt, maxRangeM] × N
 * @param targetData Flat array: [lat, lon, alt, rcs] × M
 * @param radarCount Number of radars
 * @param targetCount Number of targets
 * @param output Pre-allocated output buffer for detections
 * @returns Number of detections written to output
 */
export function batchRadarCheck(
  radarData: Float64Array,
  targetData: Float64Array,
  radarCount: number,
  targetCount: number,
  output: Float64Array,
): number;
