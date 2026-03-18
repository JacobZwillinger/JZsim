import { EFFECTIVE_EARTH_RADIUS_M } from '../constants/physics.js';

/**
 * Simplified radar range equation.
 *
 * Computes maximum detection range based on:
 * - Pt: transmit power (watts)
 * - G: antenna gain (dBi, converted to linear)
 * - freq: frequency (GHz, converted to wavelength)
 * - sigma: target RCS (m²)
 * - Smin: minimum detectable signal (fixed constant)
 *
 * Returns Rmax in meters.
 */
export function radarMaxRange(
  powerW: number,
  gainDbi: number,
  freqGhz: number,
  rcsM2: number
): number {
  const gainLinear = Math.pow(10, gainDbi / 10);
  const lambda = 0.3 / freqGhz; // wavelength in meters
  const Smin = 1e-13; // minimum detectable signal (simplified constant)

  const numerator = powerW * gainLinear * gainLinear * lambda * lambda * rcsM2;
  const denominator = Math.pow(4 * Math.PI, 3) * Smin;
  return Math.pow(numerator / denominator, 0.25);
}

/**
 * Detection probability as a function of range vs computed Rmax.
 * Uses a steep sigmoid for realistic probabilistic detection around Rmax.
 */
export function detectionProbability(distanceM: number, rmaxM: number): number {
  const ratio = distanceM / rmaxM;
  if (ratio > 1.5) return 0;
  if (ratio < 0.5) return 1;
  return 1 / (1 + Math.exp(12 * (ratio - 1)));
}

/**
 * Compute effective RCS based on aircraft configuration.
 *
 * Real-world RCS depends on:
 * - Base airframe RCS (clean configuration)
 * - External stores (missiles/bombs on pylons break stealth shaping)
 * - External fuel tanks (CFTs/drop tanks add significant radar return)
 * - Bay doors open (stealth aircraft cavity return during weapon launch)
 *
 * For non-stealth aircraft: external stores add incremental RCS (pylons/rails).
 * For stealth aircraft: any external store dramatically breaks stealth.
 */
export function computeEffectiveRCS(
  baseRCS: number,
  totalExternalStores: number,
  hasExternalFuelTanks: boolean,
  bayDoorsOpen: boolean,
  isStealth: boolean,
  podsRcsM2: number = 0,
): number {
  let rcs = baseRCS;

  if (isStealth) {
    // Stealth aircraft: external stores break stealth dramatically
    if (totalExternalStores > 0) {
      // Each external store adds ~0.5 m² and breaks stealth shaping
      rcs = Math.max(rcs, 0.1) + totalExternalStores * 0.5;
    }
    if (podsRcsM2 > 0) {
      // External pods break stealth shaping
      rcs = Math.max(rcs, 0.1) + podsRcsM2;
    }
    if (hasExternalFuelTanks) {
      // External tanks completely negate stealth
      rcs = Math.max(rcs, 1.0);
    }
    if (bayDoorsOpen) {
      // Bay cavity return — temporary spike during weapon launch
      rcs = Math.max(rcs, 0.1);
    }
  } else {
    // Non-stealth aircraft: additive RCS from external stores and pods
    if (totalExternalStores > 0) {
      rcs += totalExternalStores * 0.3; // ~0.3 m² per pylon/rail
    }
    rcs += podsRcsM2;
    if (hasExternalFuelTanks) {
      rcs *= 2.0; // Drop tanks roughly double RCS
    }
    // Bay doors irrelevant for non-stealth
  }

  return rcs;
}

/**
 * Radar horizon distance using the 4/3 earth model.
 * Accounts for standard atmospheric refraction.
 *
 * @param radarAltM - radar antenna altitude in meters
 * @param targetAltM - target altitude in meters
 * @returns maximum line-of-sight distance in meters
 */
export function radarHorizon(radarAltM: number, targetAltM: number): number {
  return Math.sqrt(2 * EFFECTIVE_EARTH_RADIUS_M * radarAltM) +
    Math.sqrt(2 * EFFECTIVE_EARTH_RADIUS_M * targetAltM);
}
