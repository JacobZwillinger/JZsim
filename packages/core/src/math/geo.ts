import { DEG_TO_RAD, RAD_TO_DEG, EARTH_RADIUS_M } from '../constants/physics.js';

/** Haversine distance between two lat/lon points. Returns meters. */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/** Fast approximate distance (flat earth). Good for distances < 500km. Returns meters. */
export function approxDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = (lat2 - lat1) * 111_320;
  const dLon = (lon2 - lon1) * 111_320 * Math.cos(lat1 * DEG_TO_RAD);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/** Initial bearing from point 1 to point 2. Returns degrees (0-360). */
export function bearing(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const lat1r = lat1 * DEG_TO_RAD;
  const lat2r = lat2 * DEG_TO_RAD;
  const y = Math.sin(dLon) * Math.cos(lat2r);
  const x = Math.cos(lat1r) * Math.sin(lat2r) -
    Math.sin(lat1r) * Math.cos(lat2r) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * RAD_TO_DEG;
  return (brng + 360) % 360;
}

/**
 * Move a point by a given distance and bearing.
 * Returns [newLat, newLon] in degrees.
 */
export function destinationPoint(
  lat: number, lon: number,
  distanceM: number, bearingDeg: number
): [number, number] {
  const d = distanceM / EARTH_RADIUS_M;
  const brng = bearingDeg * DEG_TO_RAD;
  const lat1 = lat * DEG_TO_RAD;
  const lon1 = lon * DEG_TO_RAD;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );

  return [lat2 * RAD_TO_DEG, lon2 * RAD_TO_DEG];
}

/** Normalize heading to 0-360 range */
export function normalizeHeading(heading: number): number {
  return ((heading % 360) + 360) % 360;
}

/**
 * Compute the shortest turn direction and angle from current heading to target heading.
 * Returns positive for clockwise, negative for counter-clockwise.
 */
export function headingDelta(current: number, target: number): number {
  let delta = target - current;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}
