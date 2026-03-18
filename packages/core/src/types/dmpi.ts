/**
 * DMPI (Designated Mean Point of Impact) — named ground target for strike missions.
 */
export interface DMPI {
  name: string;           // e.g. "ALPHA-1", "BRAVO-3"
  lat: number;            // decimal degrees
  lon: number;            // decimal degrees
  description?: string;   // optional label, e.g. "SA-10 battery", "C2 node"
}

/**
 * Strike route — ordered list of DMPIs for a bomber to hit.
 * Stored per-entity in the StrikeStore.
 */
export interface StrikeRoute {
  dmpiNames: string[];        // ordered target list
  currentDmpiIdx: number;     // index of current target (0-based)
  completedDmpis: string[];   // DMPIs already hit
  weaponPerDmpi: number;      // ordnance to drop at each DMPI (default 1)
}
