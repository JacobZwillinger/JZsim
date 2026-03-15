import { useUIStore } from '../store/ui-store.js';
import { Side, ModelType, mpsToKnots, metersToFeet } from '@jzsim/core';

function getTypeLabel(mt: number): string {
  switch (mt) {
    case ModelType.FIGHTER: return 'FTR';
    case ModelType.BOMBER: return 'BMR';
    case ModelType.TANKER: return 'TNK';
    case ModelType.TRANSPORT: return 'TRN';
    case ModelType.AWACS: return 'AWX';
    case ModelType.AIRBASE: return 'BAS';
    case ModelType.RADAR_SITE: return 'RAD';
    case ModelType.SAM_SITE: return 'SAM';
    default: return '???';
  }
}

export function EntityList() {
  const entities = useUIStore((s) => s.entities);
  const callsigns = useUIStore((s) => s.callsigns);
  const missionStates = useUIStore((s) => s.missionStates);
  const selectedId = useUIStore((s) => s.selectedEntityId);
  const setSelectedEntityId = useUIStore((s) => s.setSelectedEntityId);

  // Filter out missiles from OOB
  const nonWeapons = entities.filter((e) => e.modelType !== ModelType.MISSILE);
  const blueEntities = nonWeapons.filter((e) => e.side === Side.BLUE);
  const redEntities = nonWeapons.filter((e) => e.side === Side.RED);
  const otherEntities = nonWeapons.filter((e) => e.side !== Side.BLUE && e.side !== Side.RED);

  return (
    <div style={{
      width: '180px',
      backgroundColor: '#0d0d14',
      borderRight: '1px solid #1a1a2e',
      overflow: 'auto',
      fontSize: '11px',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      flexShrink: 0,
    }}>
      <div style={headerStyle}>ORDER OF BATTLE</div>

      {blueEntities.length > 0 && (
        <SideGroup
          label="BLUE"
          color="#4499ff"
          entities={blueEntities}
          callsigns={callsigns}
          missionStates={missionStates}
          selectedId={selectedId}
          onSelect={setSelectedEntityId}
        />
      )}

      {redEntities.length > 0 && (
        <SideGroup
          label="RED"
          color="#ff4444"
          entities={redEntities}
          callsigns={callsigns}
          missionStates={missionStates}
          selectedId={selectedId}
          onSelect={setSelectedEntityId}
        />
      )}

      {otherEntities.length > 0 && (
        <SideGroup
          label="NEUTRAL"
          color="#aaaaaa"
          entities={otherEntities}
          callsigns={callsigns}
          missionStates={missionStates}
          selectedId={selectedId}
          onSelect={setSelectedEntityId}
        />
      )}

      {entities.length === 0 && (
        <div style={{ color: '#555', padding: '12px', fontSize: '10px' }}>
          No entities. Use SPAWN to create.
        </div>
      )}
    </div>
  );
}

function SideGroup({
  label, color, entities, callsigns, missionStates, selectedId, onSelect,
}: {
  label: string;
  color: string;
  entities: Array<{ id: number; modelType: number; speed: number; alt: number }>;
  callsigns: Map<number, string>;
  missionStates: Map<number, string>;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div>
      <div style={{
        padding: '4px 8px',
        color,
        fontWeight: 'bold',
        fontSize: '10px',
        letterSpacing: '1px',
        borderBottom: '1px solid #1a1a2e',
        backgroundColor: '#0a0a12',
      }}>
        {label} ({entities.length})
      </div>
      {entities.map((e) => {
        const callsign = callsigns.get(e.id) ?? `#${e.id}`;
        const state = missionStates.get(e.id);
        const isSelected = selectedId === e.id;

        return (
          <div
            key={e.id}
            onClick={() => onSelect(e.id)}
            style={{
              padding: '4px 8px',
              cursor: 'pointer',
              backgroundColor: isSelected ? '#1a1a3a' : 'transparent',
              borderLeft: isSelected ? `2px solid ${color}` : '2px solid transparent',
              borderBottom: '1px solid #0a0a12',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color, fontWeight: 'bold', fontSize: '10px' }}>{getTypeLabel(e.modelType)}</span>
              <span style={{ color: isSelected ? '#e0e0e0' : '#888', fontSize: '11px' }}>{callsign}</span>
            </div>
            {state && state !== 'IDLE' && (
              <div style={{ color: '#666', fontSize: '9px', marginTop: '1px' }}>{state}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #1a1a2e',
  color: '#4488ff',
  fontSize: '11px',
  fontWeight: 'bold',
  letterSpacing: '1px',
};
