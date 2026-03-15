import type { ComponentStore } from '../ecs/component-store.js';
import type { PositionFields } from '@jzsim/core';

/**
 * 2D spatial grid for fast neighbor queries.
 *
 * Covers -90..+90 latitude, -180..+180 longitude.
 * Cell size: 0.5 degrees (~55km at equator).
 * Grid dimensions: 720 x 360 = 259,200 cells.
 *
 * Rebuilt from scratch each tick (faster than incremental for mostly-moving entities).
 */
export class SpatialGrid {
  private readonly cellSizeDeg: number;
  private readonly gridW: number;
  private readonly gridH: number;
  private readonly cells: Uint32Array[];
  private readonly cellCounts: Uint16Array;
  private readonly cellCapacity: number;

  constructor(cellSizeDeg: number = 0.5, cellCapacity: number = 64) {
    this.cellSizeDeg = cellSizeDeg;
    this.gridW = Math.ceil(360 / cellSizeDeg);
    this.gridH = Math.ceil(180 / cellSizeDeg);
    this.cellCapacity = cellCapacity;

    const totalCells = this.gridW * this.gridH;
    this.cellCounts = new Uint16Array(totalCells);
    this.cells = new Array(totalCells);
    for (let i = 0; i < totalCells; i++) {
      this.cells[i] = new Uint32Array(cellCapacity);
    }
  }

  private cellIndex(lat: number, lon: number): number {
    const cx = Math.floor((lon + 180) / this.cellSizeDeg) % this.gridW;
    const cy = Math.floor((lat + 90) / this.cellSizeDeg) % this.gridH;
    return cy * this.gridW + cx;
  }

  /** Rebuild the entire grid from position data */
  rebuild(posStore: ComponentStore<PositionFields>, entityCount: number): void {
    this.cellCounts.fill(0);

    for (let i = 0; i < entityCount; i++) {
      if (!posStore.has(i)) continue;

      const lat = posStore.get(i, 'lat');
      const lon = posStore.get(i, 'lon');
      const cellIdx = this.cellIndex(lat, lon);
      const count = this.cellCounts[cellIdx];

      if (count < this.cellCapacity) {
        this.cells[cellIdx][count] = i;
        this.cellCounts[cellIdx] = count + 1;
      }
    }
  }

  /**
   * Query all entity indices within a radius (in degrees) of a point.
   * Returns a temporary array — use immediately, do not store.
   */
  queryRadius(lat: number, lon: number, radiusDeg: number, result: number[]): void {
    const minCellX = Math.max(0, Math.floor((lon + 180 - radiusDeg) / this.cellSizeDeg));
    const maxCellX = Math.min(this.gridW - 1, Math.ceil((lon + 180 + radiusDeg) / this.cellSizeDeg));
    const minCellY = Math.max(0, Math.floor((lat + 90 - radiusDeg) / this.cellSizeDeg));
    const maxCellY = Math.min(this.gridH - 1, Math.ceil((lat + 90 + radiusDeg) / this.cellSizeDeg));

    result.length = 0;

    for (let cy = minCellY; cy <= maxCellY; cy++) {
      for (let cx = minCellX; cx <= maxCellX; cx++) {
        const cellIdx = cy * this.gridW + cx;
        const count = this.cellCounts[cellIdx];
        const cell = this.cells[cellIdx];
        for (let k = 0; k < count; k++) {
          result.push(cell[k]);
        }
      }
    }
  }
}
