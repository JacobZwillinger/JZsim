// Speed conversions
export const KTS_TO_MPS = 0.514444;
export const MPS_TO_KTS = 1 / KTS_TO_MPS;
export const KPH_TO_MPS = 1 / 3.6;
export const MPS_TO_KPH = 3.6;
export const MACH_TO_MPS = 343; // at sea level, standard atmosphere

// Distance conversions
export const NM_TO_M = 1852;
export const M_TO_NM = 1 / NM_TO_M;
export const FT_TO_M = 0.3048;
export const M_TO_FT = 1 / FT_TO_M;
export const KM_TO_M = 1000;
export const M_TO_KM = 0.001;

// Mass conversions
export const LBS_TO_KG = 0.453592;
export const KG_TO_LBS = 1 / LBS_TO_KG;

// Convenience functions
export function knotsToMps(kts: number): number { return kts * KTS_TO_MPS; }
export function mpsToKnots(mps: number): number { return mps * MPS_TO_KTS; }
export function feetToMeters(ft: number): number { return ft * FT_TO_M; }
export function metersToFeet(m: number): number { return m * M_TO_FT; }
export function nmToMeters(nm: number): number { return nm * NM_TO_M; }
export function metersToNm(m: number): number { return m * M_TO_NM; }
export function lbsToKg(lbs: number): number { return lbs * LBS_TO_KG; }
export function kgToLbs(kg: number): number { return kg * KG_TO_LBS; }
