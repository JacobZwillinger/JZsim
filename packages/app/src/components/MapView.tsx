import { useEffect, useRef } from 'react';
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

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const markersRef = useRef<Map<number, { marker: maplibregl.Marker; label: HTMLSpanElement }>>(new Map());

  const entities = useUIStore((s) => s.entities);
  const callsigns = useUIStore((s) => s.callsigns);
  const missionStates = useUIStore((s) => s.missionStates);
  const radarEntities = useUIStore((s) => s.radarEntities);
  const setSelectedEntityId = useUIStore((s) => s.setSelectedEntityId);

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

    map.on('load', () => {
      map.addSource('radar-rings', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'radar-rings-fill',
        type: 'fill',
        source: 'radar-rings',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.04 },
      });
      map.addLayer({
        id: 'radar-rings-line',
        type: 'line',
        source: 'radar-rings',
        paint: {
          'line-color': ['get', 'color'],
          'line-opacity': 0.35,
          'line-width': 1,
          'line-dasharray': [4, 4],
        },
      });
      mapReadyRef.current = true;
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; mapReadyRef.current = false; };
  }, []);

  // Update radar rings
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    const src = map.getSource('radar-rings') as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const features: GeoJSON.Feature[] = [];
    for (const [id, info] of radarEntities) {
      const color = info.side === Side.BLUE ? '#4499ff' : '#ff4444';
      const f = makeRadarRingGeoJSON(info.lat, info.lon, info.maxRangeM);
      f.properties = { color };
      features.push(f);
    }
    src.setData({ type: 'FeatureCollection', features });
  }, [radarEntities]);

  // Update entity markers every render frame (entities updates at 60Hz from SAB)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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

        el.appendChild(iconWrap);
        el.appendChild(label);
        el.addEventListener('click', (e) => { e.stopPropagation(); setSelectedEntityId(entity.id); });

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([entity.lon, entity.lat])
          .addTo(map);

        entry = { marker, label };
        markersRef.current.set(entity.id, entry);
      }

      entry.marker.setLngLat([entity.lon, entity.lat]);

      // Update SVG symbol if side or type changed — replace SVG
      const el = entry.marker.getElement();
      const iconWrap = el.querySelector('.nato-icon') as HTMLDivElement;
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
