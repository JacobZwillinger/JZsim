import { useUIStore } from '../store/ui-store.js';
import { ModelType, mpsToKnots, metersToFeet } from '@jzsim/core';

function GaugeBar({ value, max, label, unit, color, warnThreshold }: {
  value: number; max: number; label: string; unit: string; color: string; warnThreshold?: number;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const barColor = warnThreshold && pct < warnThreshold
    ? pct < warnThreshold / 2 ? '#ff3333' : '#ffaa33'
    : color;

  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#777', marginBottom: '1px' }}>
        <span>{label}</span>
        <span style={{ color: '#aaa' }}>{value.toFixed(0)}{unit}</span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#1a1a2e', borderRadius: '3px', overflow: 'hidden' }}>
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
  const size = 28;
  const r = size / 2 - 2;
  const rad = (heading - 90) * (Math.PI / 180);
  const nx = size / 2 + r * 0.7 * Math.cos(rad);
  const ny = size / 2 + r * 0.7 * Math.sin(rad);

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2a2a3e" strokeWidth="1" />
      <text x={size / 2} y="7" textAnchor="middle" fill="#555" fontSize="6">N</text>
      <line x1={size / 2} y1={size / 2} x2={nx} y2={ny} stroke="#4499ff" strokeWidth="2" strokeLinecap="round" />
      <circle cx={size / 2} cy={size / 2} r="2" fill="#4499ff" />
    </svg>
  );
}

function getMissionBadgeColor(state: string | undefined): string {
  if (!state || state === 'IDLE') return '#555';
  switch (state) {
    case 'PATROL': return '#44aa44';
    case 'RTB': return '#aaaa44';
    case 'LANDED': return '#666';
    case 'TRANSIT': return '#4488cc';
    default: return '#888';
  }
}

export function StatusDashboard() {
  const entities = useUIStore((s) => s.entities);
  const callsigns = useUIStore((s) => s.callsigns);
  const missionStates = useUIStore((s) => s.missionStates);

  // Filter to aircraft only (skip missiles, ground, bases)
  const aircraft = entities.filter((e) =>
    e.fuel >= 0 && e.isWeapon === 0 && e.modelType < 10
  );

  if (aircraft.length === 0) {
    return (
      <div style={{ color: '#555', fontSize: '11px', padding: '12px', lineHeight: 1.8 }}>
        No aircraft to display.<br />Spawn aircraft to see status.
      </div>
    );
  }

  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      {aircraft.map((ac) => {
        const callsign = callsigns.get(ac.id) ?? `#${ac.id}`;
        const mission = missionStates.get(ac.id);
        const sColor = ac.side === 1 ? '#4499ff' : ac.side === 2 ? '#ff4444' : '#aaa';
        const fuelPct = ac.fuelCapacity > 0 ? (ac.fuel / ac.fuelCapacity) * 100 : 0;
        const speedKts = mpsToKnots(ac.speed);
        const maxSpeedKts = mpsToKnots(ac.maxSpeed);
        const altFt = metersToFeet(ac.alt);
        const ceilingFt = 65000;

        return (
          <div key={ac.id} style={{
            padding: '6px 10px',
            borderBottom: '1px solid #1a1a2e',
            fontSize: '10px',
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
          }}>
            {/* Header: callsign + mission badge + heading */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ color: sColor, fontWeight: 'bold', fontSize: '11px', flex: 1 }}>{callsign}</span>
              {mission && mission !== 'IDLE' && (
                <span style={{
                  fontSize: '8px',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  backgroundColor: getMissionBadgeColor(mission),
                  color: '#fff',
                  fontWeight: 'bold',
                }}>{mission}</span>
              )}
              <HeadingIndicator heading={ac.heading} />
            </div>

            {/* Gauges */}
            <GaugeBar label="SPD" value={speedKts} max={maxSpeedKts} unit="kts" color="#4488cc" />
            <GaugeBar label="ALT" value={altFt} max={ceilingFt} unit="ft" color="#8844cc" />
            <GaugeBar label="FUEL" value={fuelPct} max={100} unit="%" color="#44aa44" warnThreshold={30} />
          </div>
        );
      })}
    </div>
  );
}
