import { describe, it, expect } from 'vitest';
import {
  radarMaxRange,
  detectionProbability,
  computeEffectiveRCS,
  radarHorizon,
} from '../math/radar.js';

describe('radarMaxRange', () => {
  it('returns a positive value for valid inputs', () => {
    const range = radarMaxRange(1_000_000, 35, 3.0, 5.0);
    expect(range).toBeGreaterThan(0);
  });

  it('increases with higher power', () => {
    const r1 = radarMaxRange(500_000, 35, 3.0, 5.0);
    const r2 = radarMaxRange(1_000_000, 35, 3.0, 5.0);
    expect(r2).toBeGreaterThan(r1);
  });

  it('increases with larger target RCS', () => {
    const r1 = radarMaxRange(1_000_000, 35, 3.0, 0.01); // stealth
    const r2 = radarMaxRange(1_000_000, 35, 3.0, 5.0);   // conventional
    expect(r2).toBeGreaterThan(r1);
  });

  it('increases with higher gain', () => {
    const r1 = radarMaxRange(1_000_000, 30, 3.0, 5.0);
    const r2 = radarMaxRange(1_000_000, 40, 3.0, 5.0);
    expect(r2).toBeGreaterThan(r1);
  });

  it('follows fourth-root power law for RCS', () => {
    // Doubling RCS should increase range by factor of 2^(1/4) ≈ 1.189
    const r1 = radarMaxRange(1_000_000, 35, 3.0, 1.0);
    const r2 = radarMaxRange(1_000_000, 35, 3.0, 2.0);
    const ratio = r2 / r1;
    expect(ratio).toBeCloseTo(Math.pow(2, 0.25), 2);
  });

  it('returns reasonable range for PATRIOT-like parameters', () => {
    // PATRIOT: ~5MW peak, 38dBi, C-band ~5.5GHz
    const range = radarMaxRange(5_000_000, 38, 5.5, 5.0);
    const rangeKm = range / 1000;
    // Should be in hundreds of km range
    expect(rangeKm).toBeGreaterThan(100);
    expect(rangeKm).toBeLessThan(1000);
  });
});

describe('detectionProbability', () => {
  it('returns 1.0 for targets well within range', () => {
    expect(detectionProbability(50_000, 300_000)).toBe(1);
  });

  it('returns 0 for targets well beyond range', () => {
    expect(detectionProbability(500_000, 300_000)).toBe(0);
  });

  it('returns ~0.5 at exactly Rmax', () => {
    const pd = detectionProbability(300_000, 300_000);
    expect(pd).toBeCloseTo(0.5, 1);
  });

  it('decreases monotonically with range', () => {
    const pd1 = detectionProbability(200_000, 300_000);
    const pd2 = detectionProbability(250_000, 300_000);
    const pd3 = detectionProbability(300_000, 300_000);
    expect(pd1).toBeGreaterThan(pd2);
    expect(pd2).toBeGreaterThan(pd3);
  });

  it('returns 1.0 at ratio < 0.5', () => {
    expect(detectionProbability(100_000, 300_000)).toBe(1);
  });

  it('returns 0 at ratio > 1.5', () => {
    expect(detectionProbability(460_000, 300_000)).toBe(0);
  });
});

describe('computeEffectiveRCS', () => {
  describe('stealth aircraft', () => {
    it('returns base RCS when clean', () => {
      const rcs = computeEffectiveRCS(0.001, 0, false, false, true);
      expect(rcs).toBe(0.001);
    });

    it('dramatically increases with external stores', () => {
      const clean = computeEffectiveRCS(0.001, 0, false, false, true);
      const loaded = computeEffectiveRCS(0.001, 2, false, false, true);
      expect(loaded).toBeGreaterThan(clean * 100); // major increase
    });

    it('external fuel tanks negate stealth', () => {
      const rcs = computeEffectiveRCS(0.001, 0, true, false, true);
      expect(rcs).toBeGreaterThanOrEqual(1.0);
    });

    it('bay doors open provides minimum spike', () => {
      const rcs = computeEffectiveRCS(0.001, 0, false, true, true);
      expect(rcs).toBeGreaterThanOrEqual(0.1);
    });
  });

  describe('non-stealth aircraft', () => {
    it('returns base RCS when clean', () => {
      const rcs = computeEffectiveRCS(5.0, 0, false, false, false);
      expect(rcs).toBe(5.0);
    });

    it('adds ~0.3 per external store', () => {
      const rcs = computeEffectiveRCS(5.0, 4, false, false, false);
      expect(rcs).toBeCloseTo(5.0 + 4 * 0.3, 5);
    });

    it('doubles with external fuel tanks', () => {
      const rcs = computeEffectiveRCS(5.0, 0, true, false, false);
      expect(rcs).toBeCloseTo(10.0, 5);
    });

    it('bay doors have no effect', () => {
      const rcs = computeEffectiveRCS(5.0, 0, false, true, false);
      expect(rcs).toBe(5.0);
    });

    it('combines stores and tanks', () => {
      const rcs = computeEffectiveRCS(5.0, 2, true, false, false);
      expect(rcs).toBeCloseTo((5.0 + 2 * 0.3) * 2.0, 5);
    });
  });
});

describe('radarHorizon', () => {
  it('returns 0 when both at ground level', () => {
    expect(radarHorizon(0, 0)).toBe(0);
  });

  it('increases with altitude', () => {
    const h1 = radarHorizon(100, 10000);
    const h2 = radarHorizon(100, 20000);
    expect(h2).toBeGreaterThan(h1);
  });

  it('is symmetric for equal altitudes', () => {
    const h1 = radarHorizon(1000, 5000);
    const h2 = radarHorizon(5000, 1000);
    expect(h1).toBeCloseTo(h2, 5);
  });

  it('returns reasonable values for fighter at altitude', () => {
    // Radar at 10m, target at 10km (33,000 ft)
    const horizon = radarHorizon(10, 10000);
    const horizonKm = horizon / 1000;
    // Should be ~400-500km
    expect(horizonKm).toBeGreaterThan(350);
    expect(horizonKm).toBeLessThan(600);
  });
});
