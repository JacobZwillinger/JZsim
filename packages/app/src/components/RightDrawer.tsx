import { useUIStore } from '../store/ui-store.js';
import { metersToFeet, mpsToKnots, Side, ModelType } from '@jzsim/core';
import { PANEL, floatingPanelStyle } from '../styles/panel.js';

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

function GaugeBar({ value, max, label, unit, color, warnThreshold }: {
  value: number; max: number; label: string; unit: string; color: string; warnThreshold?: number;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const barColor = warnThreshold && pct < warnThreshold
    ? pct < warnThreshold / 2 ? PANEL.DANGER : PANEL.WARNING
    : color;

  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: PANEL.TEXT_MUTED, marginBottom: '2px' }}>
        <span>{label}</span>
        <span style={{ color: PANEL.TEXT_SECONDARY }}>{value.toFixed(0)}{unit}</span>
      </div>
      <div style={{ height: '5px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: barColor,
          borderRadius: '3px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

function HeadingIndicator({ heading }: { heading: number }) {
  const size = 40;
  const r = size / 2 - 3;
  const rad = (heading - 90) * (Math.PI / 180);
  const nx = size / 2 + r * 0.7 * Math.cos(rad);
  const ny = size / 2 + r * 0.7 * Math.sin(rad);

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={PANEL.BORDER} strokeWidth="1" />
      <text x={size / 2} y="9" textAnchor="middle" fill={PANEL.TEXT_MUTED} fontSize="7" fontFamily={PANEL.FONT_MONO}>N</text>
      <line x1={size / 2} y1={size / 2} x2={nx} y2={ny} stroke={PANEL.ACCENT} strokeWidth="2" strokeLinecap="round" />
      <circle cx={size / 2} cy={size / 2} r="2" fill={PANEL.ACCENT} />
    </svg>
  );
}

export function RightDrawer() {
  const rightDrawerOpen = useUIStore((s) => s.rightDrawerOpen);
  const selectedId = useUIStore((s) => s.selectedEntityId);
  const entities = useUIStore((s) => s.entities);
  const callsigns = useUIStore((s) => s.callsigns);
  const missionStates = useUIStore((s) => s.missionStates);
  const setSelectedEntityId = useUIStore((s) => s.setSelectedEntityId);

  const entity = entities.find((e) => e.id === selectedId);

  return (
    <div style={{
      ...floatingPanelStyle,
      top: '12px',
      right: rightDrawerOpen ? '12px' : `-${PANEL.DRAWER_WIDTH + 20}px`,
      bottom: `${PANEL.STATUS_BAR_HEIGHT + 12}px`,
      width: `${PANEL.DRAWER_WIDTH}px`,
      transition: 'right 0.25s ease',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 80,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 12px',
        borderBottom: `1px solid ${PANEL.BORDER}`,
        flexShrink: 0,
      }}>
        <span style={{ color: PANEL.ACCENT, fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', flex: 1, fontFamily: PANEL.FONT_MONO }}>
          ENTITY DETAIL
        </span>
        <button
          onClick={() => setSelectedEntityId(null)}
          style={{
            background: 'none',
            border: 'none',
            color: PANEL.TEXT_MUTED,
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px 4px',
          }}
        >
          &times;
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', fontFamily: PANEL.FONT_MONO }}>
        {!entity ? (
          <div style={{ color: PANEL.TEXT_MUTED, fontSize: '11px', padding: '24px 16px', lineHeight: 1.8, textAlign: 'center' }}>
            Select an entity on the<br />map or asset list
          </div>
        ) : (
          <EntityDetail
            entity={entity}
            callsign={callsigns.get(entity.id) ?? `#${entity.id}`}
            missionState={missionStates.get(entity.id)}
          />
        )}
      </div>
    </div>
  );
}

function EntityDetail({ entity, callsign, missionState }: {
  entity: import('../store/ui-store.js').EntityInfo;
  callsign: string;
  missionState?: string;
}) {
  const sColor = entity.side === Side.BLUE ? PANEL.BLUE : entity.side === Side.RED ? PANEL.RED : PANEL.NEUTRAL;
  const isAircraft = entity.fuel >= 0 && entity.isWeapon === 0 && entity.modelType < 10;
  const speedKts = mpsToKnots(entity.speed);
  const maxSpeedKts = mpsToKnots(entity.maxSpeed);
  const altFt = metersToFeet(entity.alt);
  const ceilingFt = 65000;
  const fuelPct = entity.fuelCapacity > 0 ? (entity.fuel / entity.fuelCapacity) * 100 : -1;

  return (
    <div style={{ padding: '12px', fontSize: '11px', lineHeight: 1.6 }}>
      {/* Callsign + type header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: sColor, fontSize: '16px', fontWeight: 'bold' }}>{callsign}</div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
            <span style={{
              fontSize: '9px', padding: '1px 6px', borderRadius: '3px',
              backgroundColor: sColor, color: '#fff', fontWeight: 'bold',
            }}>
              {entity.side === Side.BLUE ? 'BLUE' : entity.side === Side.RED ? 'RED' : 'NTRL'}
            </span>
            <span style={{ fontSize: '10px', color: PANEL.TEXT_SECONDARY }}>
              {modelTypeName(entity.modelType)}
            </span>
            {missionState && missionState !== 'IDLE' && (
              <span style={{
                fontSize: '9px', padding: '1px 6px', borderRadius: '3px',
                backgroundColor: missionState === 'PATROL' ? PANEL.SUCCESS :
                  missionState === 'RTB' ? PANEL.WARNING : '#4488cc',
                color: '#fff', fontWeight: 'bold',
              }}>
                {missionState}
              </span>
            )}
          </div>
        </div>
        {entity.speed > 0 && <HeadingIndicator heading={entity.heading} />}
      </div>

      {/* Separator */}
      <Separator />

      {/* Position data */}
      <SectionTitle>POSITION</SectionTitle>
      <DataRow label="Lat" value={`${entity.lat.toFixed(4)}\u00b0`} />
      <DataRow label="Lon" value={`${entity.lon.toFixed(4)}\u00b0`} />
      <DataRow label="Alt" value={`${altFt.toFixed(0)} ft`} />
      <DataRow label="Hdg" value={`${entity.heading.toFixed(0)}\u00b0`} />
      {entity.speed > 0 && <DataRow label="Spd" value={`${speedKts.toFixed(0)} kts`} />}

      {/* Gauges for aircraft */}
      {isAircraft && (
        <>
          <Separator />
          <SectionTitle>PERFORMANCE</SectionTitle>
          <GaugeBar label="SPEED" value={speedKts} max={maxSpeedKts} unit="kts" color="#4488cc" />
          <GaugeBar label="ALTITUDE" value={altFt} max={ceilingFt} unit="ft" color="#8844cc" />
          {fuelPct >= 0 && (
            <GaugeBar label="FUEL" value={fuelPct} max={100} unit="%" color={PANEL.SUCCESS} warnThreshold={30} />
          )}
        </>
      )}

      {/* Health bar */}
      {entity.currentHealth >= 0 && (
        <>
          <Separator />
          <SectionTitle>HEALTH</SectionTitle>
          <GaugeBar
            label="HP"
            value={entity.currentHealth}
            max={entity.maxHealth}
            unit=""
            color={PANEL.SUCCESS}
            warnThreshold={50}
          />
        </>
      )}

      {/* Loadout */}
      {entity.primaryAmmo >= 0 && (
        <>
          <Separator />
          <SectionTitle>LOADOUT</SectionTitle>
          <DataRow label="Primary" value={`${entity.primaryAmmo} rds`} />
          <DataRow label="Secondary" value={`${entity.secondaryAmmo} rds`} />
        </>
      )}

      {/* Footer */}
      <Separator />
      <div style={{ color: PANEL.TEXT_MUTED, fontSize: '9px' }}>ID: {entity.id}</div>
    </div>
  );
}

function DataRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '1px 0' }}>
      <span style={{ color: PANEL.TEXT_MUTED }}>{label}</span>
      <span style={{ color: color ?? PANEL.TEXT_PRIMARY, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function Separator() {
  return <div style={{ borderTop: `1px solid ${PANEL.BORDER}`, margin: '8px 0' }} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, fontWeight: 'bold', letterSpacing: '1px', marginBottom: '4px' }}>
      {children}
    </div>
  );
}
