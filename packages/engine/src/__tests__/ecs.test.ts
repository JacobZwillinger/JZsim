import { describe, it, expect } from 'vitest';
import { ComponentStore } from '../ecs/component-store.js';
import { EntityAllocator } from '../ecs/entity.js';
import { entityIndex } from '@jzsim/core';

describe('ComponentStore', () => {
  type Position = { lat: number; lon: number; alt: number; heading: number };

  it('creates store with correct field count', () => {
    const store = new ComponentStore<Position>(['lat', 'lon', 'alt', 'heading'], 100);
    expect(store.fields.size).toBe(4);
  });

  it('set and get values', () => {
    const store = new ComponentStore<Position>(['lat', 'lon', 'alt', 'heading'], 100);
    store.set(0, { lat: 26.35, lon: 127.77, alt: 10000, heading: 90 });
    expect(store.get(0, 'lat')).toBe(26.35);
    expect(store.get(0, 'lon')).toBe(127.77);
    expect(store.get(0, 'alt')).toBe(10000);
    expect(store.get(0, 'heading')).toBe(90);
  });

  it('has returns true for set entities', () => {
    const store = new ComponentStore<Position>(['lat', 'lon', 'alt', 'heading'], 100);
    expect(store.has(0)).toBe(false);
    store.set(0, { lat: 0, lon: 0, alt: 0, heading: 0 });
    expect(store.has(0)).toBe(true);
  });

  it('remove clears the mask', () => {
    const store = new ComponentStore<Position>(['lat', 'lon', 'alt', 'heading'], 100);
    store.set(0, { lat: 26, lon: 127, alt: 10000, heading: 0 });
    expect(store.has(0)).toBe(true);
    store.remove(0);
    expect(store.has(0)).toBe(false);
  });

  it('count returns number of active entities', () => {
    const store = new ComponentStore<Position>(['lat', 'lon', 'alt', 'heading'], 100);
    expect(store.count()).toBe(0);
    store.set(0, { lat: 0, lon: 0, alt: 0, heading: 0 });
    store.set(5, { lat: 0, lon: 0, alt: 0, heading: 0 });
    expect(store.count()).toBe(2);
    store.remove(0);
    expect(store.count()).toBe(1);
  });

  it('raw returns the Float64Array for batch ops', () => {
    const store = new ComponentStore<Position>(['lat', 'lon', 'alt', 'heading'], 100);
    store.set(0, { lat: 26.35, lon: 127.77, alt: 10000, heading: 90 });
    const latArr = store.raw('lat');
    expect(latArr).toBeInstanceOf(Float64Array);
    expect(latArr[0]).toBe(26.35);
  });

  it('supports partial updates', () => {
    const store = new ComponentStore<Position>(['lat', 'lon', 'alt', 'heading'], 100);
    store.set(0, { lat: 26, lon: 127, alt: 10000, heading: 90 });
    store.set(0, { heading: 180 }); // partial update
    expect(store.get(0, 'lat')).toBe(26);
    expect(store.get(0, 'heading')).toBe(180);
  });

  it('handles multiple entities independently', () => {
    const store = new ComponentStore<Position>(['lat', 'lon', 'alt', 'heading'], 100);
    store.set(0, { lat: 10, lon: 20, alt: 100, heading: 0 });
    store.set(1, { lat: 30, lon: 40, alt: 200, heading: 90 });
    expect(store.get(0, 'lat')).toBe(10);
    expect(store.get(1, 'lat')).toBe(30);
  });
});

describe('EntityAllocator', () => {
  it('allocates sequential indices', () => {
    const alloc = new EntityAllocator(100);
    const id1 = alloc.allocate('EAGLE01');
    const id2 = alloc.allocate('EAGLE02');
    expect(entityIndex(id1)).toBe(0);
    expect(entityIndex(id2)).toBe(1);
  });

  it('tracks active count', () => {
    const alloc = new EntityAllocator(100);
    expect(alloc.activeCount).toBe(0);
    alloc.allocate('E1');
    alloc.allocate('E2');
    expect(alloc.activeCount).toBe(2);
  });

  it('resolves callsign to entity ID', () => {
    const alloc = new EntityAllocator(100);
    const id = alloc.allocate('RAPTOR01');
    expect(alloc.resolve('RAPTOR01')).toBe(id);
    expect(alloc.resolve('NONEXISTENT')).toBeNull();
  });

  it('maps entity ID to callsign', () => {
    const alloc = new EntityAllocator(100);
    const id = alloc.allocate('FLANKER01');
    expect(alloc.idToCallsign.get(id)).toBe('FLANKER01');
  });

  it('frees entity and recycles index', () => {
    const alloc = new EntityAllocator(100);
    const id1 = alloc.allocate('E1');
    expect(alloc.activeCount).toBe(1);
    alloc.free(id1);
    expect(alloc.activeCount).toBe(0);
    expect(alloc.isAlive(id1)).toBe(false);

    // Recycled index should be reused
    const id2 = alloc.allocate('E2');
    expect(entityIndex(id2)).toBe(0); // same index
    expect(alloc.isAlive(id2)).toBe(true);
  });

  it('detects stale references after free', () => {
    const alloc = new EntityAllocator(100);
    const id1 = alloc.allocate('E1');
    alloc.free(id1);
    expect(alloc.isAlive(id1)).toBe(false);
  });

  it('removes callsign mapping on free', () => {
    const alloc = new EntityAllocator(100);
    const id = alloc.allocate('EAGLE01');
    expect(alloc.resolve('EAGLE01')).toBe(id);
    alloc.free(id);
    expect(alloc.resolve('EAGLE01')).toBeNull();
  });

  it('freeByIndex uses correct generation', () => {
    const alloc = new EntityAllocator(100);
    alloc.allocate('E1');
    expect(alloc.activeCount).toBe(1);
    alloc.freeByIndex(0);
    expect(alloc.activeCount).toBe(0);
  });

  it('throws when capacity exceeded', () => {
    const alloc = new EntityAllocator(2);
    alloc.allocate('E1');
    alloc.allocate('E2');
    expect(() => alloc.allocate('E3')).toThrow('Entity capacity exceeded');
  });

  it('highWaterMark tracks maximum used index', () => {
    const alloc = new EntityAllocator(100);
    expect(alloc.highWaterMark).toBe(0);
    alloc.allocate('E1');
    alloc.allocate('E2');
    expect(alloc.highWaterMark).toBe(2);
    alloc.freeByIndex(0);
    expect(alloc.highWaterMark).toBe(2); // doesn't decrease
  });
});
