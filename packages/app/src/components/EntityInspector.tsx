import { useUIStore } from '../store/ui-store.js';
import { metersToFeet, mpsToKnots, Side, ModelType } from '@jzsim/core';

function modelTypeName(mt: number): string {
  switch (mt) {
    case ModelType.FIGHTER: return 'Fighter';
    case ModelType.BOMBER: return 'Bomber';
    case ModelType.TANKER: return 'Tanker';
    case ModelType.TRANSPORT: return 'Transport';
    case ModelType.AWACS: return 'AWACS';
    case ModelType.AIRBASE: return 'Airbase';
    case ModelType.RADAR_SITE: return 'Radar Site';
    case ModelType.SAM_SITE: return 'SAM Site';
    case ModelType.MISSILE: return 'Missile';
    default: return 'Unknown';
  }
}

function sideName(s: number): string {
  switch (s) {
    case Side.BLUE: return 'BLUE';
    case Side.RED: return 'RED';
    default: return 'NEUTRAL';
  }
}

export function EntityInspector() {
  const selectedId = useUIStore((s) => s.selectedEntityId);
  const entities = useUIStore((s) => s.entities);
  const callsigns = useUIStore((s) => s.callsigns);
  const missionStates = useUIStore((s) => s.missionStates);
  const setSelectedEntityId = useUIStore((s) => s.setSelectedEntityId);

  const entity = entities.find((e) => e.id === selectedId);

  if (!entity) {
    return (
      <div>
        <div style={{ color: '#555', fontSize: '11px', padding: '12px', lineHeight: 1.8 }}>
          Click an entity on<br />the map to inspect
        </div>
      </div>
    );
  }

  const callsign = callsigns.get(entity.id) ?? `#${entity.id}`;
  const missionState = missionStates.get(entity.id);
  const sColor = entity.side === Side.BLUE ? '#4499ff' : entity.side === Side.RED ? '#ff4444' : '#aaa';

  return (
    <div>
      <div style={headerStyle}>
        <button
          onClick={() => setSelectedEntityId(null)}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '14px', float: 'right', lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: '8px 12px', fontSize: '11px', lineHeight: '2', fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
        <div style={{ color: sColor, fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
          {callsign}
        </div>
        <Row label="Type" value={modelTypeName(entity.modelType)} />
        <Row label="Side" value={sideName(entity.side)} color={sColor} />
        {missionState && <Row label="Mission" value={missionState} color="#ffaa44" />}
        <div style={{ borderTop: '1px solid #1a1a2e', margin: '4px 0' }} />
        <Row label="Lat" value={`${entity.lat.toFixed(4)}°`} />
        <Row label="Lon" value={`${entity.lon.toFixed(4)}°`} />
        <Row label="Alt" value={`${metersToFeet(entity.alt).toFixed(0)} ft`} />
        <Row label="Hdg" value={`${entity.heading.toFixed(0)}°`} />
        {entity.speed > 0 && (
          <Row label="Spd" value={`${mpsToKnots(entity.speed).toFixed(0)} kts`} />
        )}
        <div style={{ borderTop: '1px solid #1a1a2e', margin: '4px 0' }} />
        <div style={{ color: '#555', fontSize: '9px' }}>ID: {entity.id}</div>
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
      <span style={{ color: '#555' }}>{label}</span>
      <span style={{ color: color ?? '#bbb', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderBottom: '1px solid #1a1a2e',
  color: '#555',
  fontSize: '11px',
  overflow: 'hidden',
  textAlign: 'right',
};
