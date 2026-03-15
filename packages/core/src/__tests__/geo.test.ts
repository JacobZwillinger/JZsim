import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  approxDistance,
  bearing,
  destinationPoint,
  normalizeHeading,
  headingDelta,
} from '../math/geo.js';

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance(26.35, 127.77, 26.35, 127.77)).toBe(0);
  });

  it('computes ~111km for 1 degree latitude', () => {
    const d = haversineDistance(0, 0, 1, 0);
    expect(d).toBeCloseTo(111_195, -2); // ~111km ± 200m
  });

  it('computes known distance: Tokyo to Okinawa (~1550km)', () => {
    const d = haversineDistance(35.68, 139.69, 26.35, 127.77);
    expect(d).toBeGreaterThan(1_400_000);
    expect(d).toBeLessThan(1_700_000);
  });

  it('handles antipodal points', () => {
    const d = haversineDistance(0, 0, 0, 180);
    expect(d).toBeCloseTo(Math.PI * 6_371_000, -3); // half circumference
  });

  it('is symmetric', () => {
    const d1 = haversineDistance(26.35, 127.77, 35.68, 139.69);
    const d2 = haversineDistance(35.68, 139.69, 26.35, 127.77);
    expect(d1).toBeCloseTo(d2, 5);
  });
});

describe('approxDistance', () => {
  it('returns 0 for same point', () => {
    expect(approxDistance(26.35, 127.77, 26.35, 127.77)).toBe(0);
  });

  it('is close to haversine for short distances', () => {
    const exact = haversineDistance(26.35, 127.77, 26.5, 128.0);
    const approx = approxDistance(26.35, 127.77, 26.5, 128.0);
    const error = Math.abs(approx - exact) / exact;
    expect(error).toBeLessThan(0.01); // <1% error for short distance
  });

  it('diverges more for long distances', () => {
    const exact = haversineDistance(0, 0, 10, 10);
    const approx = approxDistance(0, 0, 10, 10);
    // Flat earth approx gets worse over larger distances
    expect(approx).toBeGreaterThan(0);
  });
});

describe('bearing', () => {
  it('returns ~0° for due north', () => {
    const b = bearing(0, 0, 1, 0);
    expect(b).toBeCloseTo(0, 0);
  });

  it('returns ~90° for due east', () => {
    const b = bearing(0, 0, 0, 1);
    expect(b).toBeCloseTo(90, 0);
  });

  it('returns ~180° for due south', () => {
    const b = bearing(1, 0, 0, 0);
    expect(b).toBeCloseTo(180, 0);
  });

  it('returns ~270° for due west', () => {
    const b = bearing(0, 1, 0, 0);
    expect(b).toBeCloseTo(270, 0);
  });

  it('returns value in [0, 360)', () => {
    const b = bearing(26.35, 127.77, 35.68, 139.69);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe('destinationPoint', () => {
  it('moves north by ~111km for 1 degree', () => {
    const [lat, lon] = destinationPoint(0, 0, 111_320, 0);
    expect(lat).toBeCloseTo(1, 0);
    expect(lon).toBeCloseTo(0, 1);
  });

  it('moves east by ~111km at equator', () => {
    const [lat, lon] = destinationPoint(0, 0, 111_320, 90);
    expect(lat).toBeCloseTo(0, 0);
    expect(lon).toBeCloseTo(1, 0);
  });

  it('round-trips with bearing and haversine', () => {
    const startLat = 26.35, startLon = 127.77;
    const dist = 50_000; // 50km
    const hdg = 45;
    const [newLat, newLon] = destinationPoint(startLat, startLon, dist, hdg);
    const computedDist = haversineDistance(startLat, startLon, newLat, newLon);
    expect(computedDist).toBeCloseTo(dist, -1); // within ~10m
  });

  it('returns same point for zero distance', () => {
    const [lat, lon] = destinationPoint(26.35, 127.77, 0, 45);
    expect(lat).toBeCloseTo(26.35, 5);
    expect(lon).toBeCloseTo(127.77, 5);
  });
});

describe('normalizeHeading', () => {
  it('returns same value for 0-360', () => {
    expect(normalizeHeading(90)).toBe(90);
    expect(normalizeHeading(0)).toBe(0);
    expect(normalizeHeading(359)).toBe(359);
  });

  it('wraps negative headings', () => {
    expect(normalizeHeading(-90)).toBeCloseTo(270);
    expect(normalizeHeading(-1)).toBeCloseTo(359);
  });

  it('wraps headings > 360', () => {
    expect(normalizeHeading(450)).toBeCloseTo(90);
    expect(normalizeHeading(720)).toBeCloseTo(0);
  });
});

describe('headingDelta', () => {
  it('returns 0 for same heading', () => {
    expect(headingDelta(90, 90)).toBe(0);
  });

  it('returns positive for clockwise turn', () => {
    expect(headingDelta(0, 90)).toBe(90);
    expect(headingDelta(350, 10)).toBe(20);
  });

  it('returns negative for counter-clockwise turn', () => {
    expect(headingDelta(90, 0)).toBe(-90);
    expect(headingDelta(10, 350)).toBe(-20);
  });

  it('takes shortest path across 360/0 boundary', () => {
    expect(headingDelta(350, 10)).toBe(20); // clockwise is shorter
    expect(headingDelta(10, 350)).toBe(-20); // counter-clockwise is shorter
  });

  it('returns ±180 for opposite headings', () => {
    const d = headingDelta(0, 180);
    expect(Math.abs(d)).toBe(180);
  });
});
