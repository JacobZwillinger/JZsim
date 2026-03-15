/** Latitude/Longitude in decimal degrees */
export interface LatLon {
  lat: number;
  lon: number;
}

/** Latitude/Longitude/Altitude (alt in meters) */
export interface LatLonAlt {
  lat: number;
  lon: number;
  alt: number;
}

/** Bearing in degrees (0-360, clockwise from north) */
export type BearingDeg = number;

/** Distance in meters */
export type DistanceM = number;

/** Speed in meters per second */
export type SpeedMps = number;
