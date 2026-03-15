import { describe, it, expect } from 'vitest';
import {
  knotsToMps,
  mpsToKnots,
  feetToMeters,
  metersToFeet,
  nmToMeters,
  metersToNm,
  lbsToKg,
  kgToLbs,
  KTS_TO_MPS,
  FT_TO_M,
  NM_TO_M,
  LBS_TO_KG,
} from '../constants/units.js';

describe('speed conversions', () => {
  it('converts 100 knots to ~51.4 m/s', () => {
    expect(knotsToMps(100)).toBeCloseTo(51.44, 1);
  });

  it('round-trips knots → m/s → knots', () => {
    expect(mpsToKnots(knotsToMps(450))).toBeCloseTo(450, 5);
  });

  it('converts 0 knots to 0 m/s', () => {
    expect(knotsToMps(0)).toBe(0);
  });

  it('KTS_TO_MPS constant is ~0.5144', () => {
    expect(KTS_TO_MPS).toBeCloseTo(0.5144, 3);
  });
});

describe('altitude conversions', () => {
  it('converts 1 foot to 0.3048 meters', () => {
    expect(feetToMeters(1)).toBeCloseTo(0.3048, 4);
  });

  it('converts 35000 feet to ~10668 meters', () => {
    expect(feetToMeters(35000)).toBeCloseTo(10668, 0);
  });

  it('round-trips feet → meters → feet', () => {
    expect(metersToFeet(feetToMeters(25000))).toBeCloseTo(25000, 5);
  });

  it('FT_TO_M constant is 0.3048', () => {
    expect(FT_TO_M).toBe(0.3048);
  });
});

describe('distance conversions', () => {
  it('converts 1 NM to 1852 meters', () => {
    expect(nmToMeters(1)).toBe(1852);
  });

  it('round-trips NM → meters → NM', () => {
    expect(metersToNm(nmToMeters(100))).toBeCloseTo(100, 5);
  });

  it('NM_TO_M constant is 1852', () => {
    expect(NM_TO_M).toBe(1852);
  });
});

describe('mass conversions', () => {
  it('converts 1 lb to ~0.4536 kg', () => {
    expect(lbsToKg(1)).toBeCloseTo(0.4536, 3);
  });

  it('round-trips lbs → kg → lbs', () => {
    expect(kgToLbs(lbsToKg(1000))).toBeCloseTo(1000, 5);
  });

  it('converts typical fuel load: 20000 lbs to ~9072 kg', () => {
    expect(lbsToKg(20000)).toBeCloseTo(9072, 0);
  });
});
