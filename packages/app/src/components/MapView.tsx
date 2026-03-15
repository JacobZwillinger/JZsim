import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useUIStore, type EntityInfo } from '../store/ui-store.js';
import { Side, ModelType } from '@jzsim/core';
import { createNatoSymbol } from '../util/nato-symbol.js';

function getSideColor(side: number): string {
  switch (side) {
    case Side.BLUE: return '#4499ff';
    case Side.RED: return '#ff4444';
    default: return '#aaaaaa';
  }
}

function isStaticEntity(modelType: number): boolean {
  return modelType >= 10 && modelType !== ModelType.MISSILE;
}

function makeRadarRingGeoJSON(lat: number, lon: number, radiusM: number): GeoJSON.Feature {
  const points = 64;
  const coords: [number, number][] = [];
  const latR = radiusM / 111320;
  const lonR = radiusM / (111320 * Math.cos(lat * Math.PI / 180));
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    coords.push([lon + lonR * Math.cos(angle), lat + latR * Math.sin(angle)]);
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] },
  };
}

/** Zoom threshold: below this, hide callsign labels to reduce clutter */
const LABEL_ZOOM_THRESHOLD = 7;
/** Zoom threshold: below this, shrink marker icons */
const ICON_SHRINK_ZOOM = 5;

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const markersRef = useRef<Map<number, { marker: maplibregl.Marker; label: HTMLSpanElement; iconWrap: HTMLDivElement }>>(new Map());
  const zoomRef = useRef<number>(5);

  const entities = useUIStore((s) => s.entities);
  const callsigns = useUIStore((s) => s.callsigns);
  const missionStates = useUIStore((s) => s.missionStates);
  const radarEntities = useUIStore((s) => s.radarEntities);
  const radarDetections = useUIStore((s) => s.radarDetections);
  const setSelectedEntityId = useUIStore((s) => s.setSelectedEntityId);

  // Track zoom level for label visibility
  const updateLabelVisibility = useCallback((zoom: number) => {
    const showLabels = zoom >= LABEL_ZOOM_THRESHOLD;
    const shrinkIcons = zoom < ICON_SHRINK_ZOOM;
    for (const [, entry] of markersRef.current) {
      entry.label.style.display = showLabels ? '' : 'none';
      entry.iconWrap.style.transform = shrinkIcons
        ? `${entry.iconWrap.style.transform?.replace(/scale\([^)]*\)/g, '') ?? ''} scale(0.7)`.trim()
        : entry.iconWrap.style.transform?.replace(/scale\([^)]*\)/g, '').trim() ?? '';
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: 'Dark',
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          },
        },
        layers: [{ id: 'carto-dark', type: 'raster', source: 'carto-dark' }],
      },
      center: [127.77, 26.35],
      zoom: 5,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-right');

    map.on('zoom', () => {
      zoomRef.current = map.getZoom();
      updateLabelVisibility(zoomRef.current);
    });

    map.on('load', () => {
      // --- Radar coverage rings (fill + stroke) ---
      map.addSource('radar-rings', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      // Blue radar fill
      map.addLayer({
        id: 'radar-rings-fill-blue',
        type: 'fill',
        source: 'radar-rings',
        filter: ['==', ['get', 'side'], 'blue'],
        paint: {
          'fill-color': '#4499ff',
          'fill-opacity': 0.06,
        },
      });
      // Red radar fill
      map.addLayer({
        id: 'radar-rings-fill-red',
        type: 'fill',
        source: 'radar-rings',
        filter: ['==', ['get', 'side'], 'red'],
        paint: {
          'fill-color': '#ff4444',
          'fill-opacity': 0.06,
        },
      });
      // Blue radar ring stroke (solid)
      map.addLayer({
        id: 'radar-rings-line-blue',
        type: 'line',
        source: 'radar-rings',
        filter: ['==', ['get', 'side'], 'blue'],
        paint: {
          'line-color': '#4499ff',
          'line-opacity': 0.5,
          'line-width': 1.5,
        },
      });
      // Red radar ring stroke (dashed)
      map.addLayer({
        id: 'radar-rings-line-red',
        type: 'line',
        source: 'radar-rings',
        filter: ['==', ['get', 'side'], 'red'],
        paint: {
          'line-color': '#ff4444',
          'line-opacity': 0.5,
          'line-width': 1.5,
          'line-dasharray': [6, 3],
        },
      });

      // --- Radar detection track lines ---
      map.addSource('radar-tracks', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'radar-tracks-line',
        type: 'line',
        source: 'radar-tracks',
        paint: {
          'line-color': ['get', 'color'],
          'line-opacity': ['get', 'opacity'],
          'line-width': 0.8,
          'line-dasharray': [2, 3],
        },
      });

      mapReadyRef.current = true;
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; mapReadyRef.current = false; };
  }, [updateLabelVisibility]);

  // Update radar rings
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    const src = map.getSource('radar-rings') as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const features: GeoJSON.Feature[] = [];
    for (const [, info] of radarEntities) {
      const side = info.side === Side.BLUE ? 'blue' : 'red';
      const f = makeRadarRingGeoJSON(info.lat, info.lon, info.maxRangeM);
      f.properties = { side, color: info.side === Side.BLUE ? '#4499ff' : '#ff4444' };
      features.push(f);
    }
    src.setData({ type: 'FeatureCollection', features });
  }, [radarEntities]);

  // Update radar detection track lines
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    const src = map.getSource('radar-tracks') as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const features: GeoJSON.Feature[] = [];
    // Build entity position lookup from current entities
    const entityPositions = new Map<number, { lat: number; lon: number }>();
    for (const e of entities) {
      entityPositions.set(e.id, { lat: e.lat, lon: e.lon });
    }

    for (const [radarId, detections] of radarDetections) {
      const radarInfo = radarEntities.get(radarId);
      if (!radarInfo) continue;
      const color = radarInfo.side === Side.BLUE ? 'rgba(68,153,255,0.4)' : 'rgba(255,68,68,0.4)';

      for (const det of detections) {
        const tgtPos = entityPositions.get(det.targetId);
        if (!tgtPos) continue;
        features.push({
          type: 'Feature',
          properties: { color, opacity: Math.min(det.probability, 0.5) },
          geometry: {
            type: 'LineString',
            coordinates: [
              [radarInfo.lon, radarInfo.lat],
              [tgtPos.lon, tgtPos.lat],
            ],
          },
        });
      }
    }
    src.setData({ type: 'FeatureCollection', features });
  }, [radarDetections, radarEntities, entities]);

  // Update entity markers every render frame (entities updates at 60Hz from SAB)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const zoom = zoomRef.current;
    const showLabels = zoom >= LABEL_ZOOM_THRESHOLD;
    const currentIds = new Set<number>();

    for (const entity of entities) {
      currentIds.add(entity.id);
      const callsign = callsigns.get(entity.id) ?? `#${entity.id}`;
      const missionState = missionStates.get(entity.id);
      const color = getSideColor(entity.side);
      const isStatic = isStaticEntity(entity.modelType);
      const symbolSize = isStatic ? 22 : 18;

      let entry = markersRef.current.get(entity.id);

      if (!entry) {
        const el = document.createElement('div');
        el.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;pointer-events:auto;gap:1px;';

        const iconWrap = document.createElement('div');
        iconWrap.style.cssText = 'display:inline-block;line-height:0;';
        iconWrap.className = 'nato-icon';

        // Create NATO SVG symbol
        const svg = createNatoSymbol(entity.modelType, entity.side, symbolSize);
        iconWrap.appendChild(svg);

        const label = document.createElement('span');
        label.style.cssText = `
          font-family:'JetBrains Mono','Fira Code',monospace;
          font-size:9px;font-weight:bold;
          text-shadow:0 0 4px #000,0 0 8px #000,1px 1px 0 #000;
          white-space:nowrap;pointer-events:none;
        `;
        label.style.display = showLabels ? '' : 'none';

        el.appendChild(iconWrap);
        el.appendChild(label);
        el.addEventListener('click', (e) => { e.stopPropagation(); setSelectedEntityId(entity.id); });

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([entity.lon, entity.lat])
          .addTo(map);

        entry = { marker, label, iconWrap };
        markersRef.current.set(entity.id, entry);
      }

      entry.marker.setLngLat([entity.lon, entity.lat]);

      // Update SVG symbol if side or type changed — replace SVG
      const iconWrap = entry.iconWrap;
      if (iconWrap) {
        // Recreate SVG only if needed (check data attributes)
        const prevKey = iconWrap.dataset.key;
        const curKey = `${entity.modelType}-${entity.side}`;
        if (prevKey !== curKey) {
          iconWrap.innerHTML = '';
          const svg = createNatoSymbol(entity.modelType, entity.side, symbolSize);
          iconWrap.appendChild(svg);
          iconWrap.dataset.key = curKey;
        }

        if (!isStatic && entity.speed > 0) {
          iconWrap.style.transform = `rotate(${entity.heading}deg)`;
        } else {
          iconWrap.style.transform = '';
        }
      }

      // Label: callsign + mission state indicator
      const stateTag = missionState && missionState !== 'IDLE' ? ` [${missionState.slice(0, 3)}]` : '';
      entry.label.textContent = callsign + stateTag;
      entry.label.style.color = color;
    }

    // Remove stale markers
    for (const [id, entry] of markersRef.current) {
      if (!currentIds.has(id)) {
        entry.marker.remove();
        markersRef.current.delete(id);
      }
    }
  }, [entities, callsigns, missionStates, setSelectedEntityId]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}
