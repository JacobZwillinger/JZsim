import { Side, ModelType, mpsToKnots, metersToFeet } from '@jzsim/core';
import type { EntityInfo } from '../store/ui-store.js';
import { PANEL } from '../styles/panel.js';

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
    case ModelType.MISSILE: return 'MSL';
    default: return '???';
  }
}

function getTypeIcon(mt: number): string {
  switch (mt) {
    case ModelType.FIGHTER: return '▲';
    case ModelType.BOMBER: return '■';
    case ModelType.TANKER: return '●';
    case ModelType.AWACS: return '◉';
    case ModelType.AIRBASE: return '★';
    case ModelType.RADAR_SITE: return '◎';
    case ModelType.SAM_SITE: return '▲';
    default: return '●';
  }
}

function getMissionColor(state: string | undefined): string {
  if (!state || state === 'IDLE') return PANEL.TEXT_MUTED;
  switch (state) {
    case 'PATROL': return PANEL.SUCCESS;
    case 'RTB': return PANEL.WARNING;
    case 'LANDED': return '#666';
    case 'ENROUTE': return '#4488cc';
    case 'INTERCEPT': return PANEL.DANGER;
    default: return PANEL.TEXT_SECONDARY;
  }
}

interface Props {
  entity: EntityInfo;
  callsign: string;
  missionState?: string;
  isSelected: boolean;
  onClick: () => void;
}

export function TrackCard({ entity, callsign, missionState, isSelected, onClick }: Props) {
  const sColor = entity.side === Side.BLUE ? PANEL.BLUE : entity.side === Side.RED ? PANEL.RED : PANEL.NEUTRAL;
  const isAircraft = entity.fuel >= 0 && entity.isWeapon === 0 && entity.modelType < 10;
  const speedKts = mpsToKnots(entity.speed);
  const altFt = metersToFeet(entity.alt);
  const fuelPct = entity.fuelCapacity > 0 ? (entity.fuel / entity.fuelCapacity) * 100 : -1;

  return (
    <div
      onClick={onClick}
      style={{
        padding: '6px 10px',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'rgba(68,136,255,0.1)' : 'transparent',
        borderLeft: isSelected ? `3px solid ${sColor}` : '3px solid transparent',
        borderBottom: `1px solid ${PANEL.BORDER}`,
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {/* Row 1: icon + callsign + type + mission badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
        <span style={{ color: sColor, fontSize: '10px' }}>{getTypeIcon(entity.modelType)}</span>
        <span style={{ color: sColor, fontWeight: 'bold', fontSize: '11px', flex: 1 }}>{callsign}</span>
        <span style={{
          color: PANEL.TEXT_MUTED,
          fontSize: '9px',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
        }}>{getTypeLabel(entity.modelType)}</span>
        {missionState && missionState !== 'IDLE' && (
          <span style={{
            fontSize: '8px',
            padding: '1px 5px',
            borderRadius: '3px',
            backgroundColor: getMissionColor(missionState),
            color: '#fff',
            fontWeight: 'bold',
          }}>{missionState}</span>
        )}
      </div>

      {/* Row 2: heading, speed, altitude (for aircraft) */}
      {isAircraft && (
        <div style={{ display: 'flex', gap: '8px', fontSize: '9px', color: PANEL.TEXT_SECONDARY, marginBottom: '3px' }}>
          <span>HDG {entity.heading.toFixed(0)}&deg;</span>
          <span>{speedKts.toFixed(0)}kts</span>
          <span>FL{(altFt / 100).toFixed(0).padStart(3, '0')}</span>
        </div>
      )}

      {/* Row 3: fuel bar (for aircraft) */}
      {isAircraft && fuelPct >= 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '8px', color: PANEL.TEXT_MUTED, width: '26px' }}>FUEL</span>
          <div style={{
            flex: 1,
            height: '4px',
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${fuelPct}%`,
              height: '100%',
              backgroundColor: fuelPct < 15 ? PANEL.DANGER : fuelPct < 30 ? PANEL.WARNING : PANEL.SUCCESS,
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{
            fontSize: '8px',
            color: fuelPct < 15 ? PANEL.DANGER : fuelPct < 30 ? PANEL.WARNING : PANEL.TEXT_MUTED,
            width: '26px',
            textAlign: 'right',
          }}>{fuelPct.toFixed(0)}%</span>
        </div>
      )}

      {/* Row 4: health + ammo (compact) */}
      {entity.currentHealth >= 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <span style={{ fontSize: '8px', color: PANEL.TEXT_MUTED, width: '18px' }}>HP</span>
          <HealthDots current={entity.currentHealth} max={entity.maxHealth} />
          {entity.primaryAmmo >= 0 && (
            <span style={{ fontSize: '8px', color: PANEL.TEXT_MUTED, marginLeft: 'auto' }}>
              {entity.primaryAmmo + entity.secondaryAmmo}rds
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function HealthDots({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? current / max : 0;
  const dots = 5;
  const filled = Math.ceil(pct * dots);
  const color = pct > 0.6 ? PANEL.SUCCESS : pct > 0.3 ? PANEL.WARNING : PANEL.DANGER;

  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: dots }, (_, i) => (
        <span key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          backgroundColor: i < filled ? color : 'rgba(255,255,255,0.08)',
          display: 'inline-block',
        }} />
      ))}
    </div>
  );
}
