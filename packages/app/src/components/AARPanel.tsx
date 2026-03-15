import { useState } from 'react';
import { useUIStore, type AARData, type EntityAAREntry } from '../store/ui-store.js';
import { PANEL } from '../styles/panel.js';

export function AARPanel() {
  const aarData = useUIStore((s) => s.aarData);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!aarData) {
    return (
      <div style={{ padding: '16px', color: PANEL.TEXT_MUTED, fontSize: '11px' }}>
        No data yet. Run the simulation to generate AAR metrics.
      </div>
    );
  }

  const metrics = [
    { key: 'fuel', label: 'FUEL USED', value: formatKg(aarData.totalFuelUsedKg), unit: '' },
    { key: 'muns', label: 'MUNS EXPENDED', value: sumValues(aarData.munsExpended).toString(), unit: '' },
    { key: 'hits', label: 'TARGETS HIT', value: aarData.targetsHit.toString(), unit: '' },
    { key: 'engaged', label: 'ENEMIES ENGAGED', value: aarData.enemiesEngaged.toString(), unit: '' },
    { key: 'friendlyLoss', label: 'FRIENDLY LOSSES', value: aarData.friendlyLosses.toString(), unit: '' },
    { key: 'enemyLoss', label: 'ENEMY LOSSES', value: aarData.enemyLosses.toString(), unit: '' },
  ];

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, padding: '4px 4px 8px', letterSpacing: '0.5px' }}>
        AFTER ACTION REPORT
      </div>
      {metrics.map((m) => (
        <div key={m.key}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              marginBottom: '2px',
              backgroundColor: expanded === m.key ? 'rgba(68,136,255,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${expanded === m.key ? PANEL.ACCENT_DIM : PANEL.BORDER}`,
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setExpanded(expanded === m.key ? null : m.key)}
          >
            <span style={{ fontSize: '10px', color: PANEL.TEXT_SECONDARY, letterSpacing: '0.5px' }}>
              {m.label}
            </span>
            <span style={{ fontSize: '13px', color: PANEL.TEXT_PRIMARY, fontWeight: 'bold' }}>
              {m.value}{m.unit}
              <span style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, marginLeft: '6px' }}>
                {expanded === m.key ? '\u25BC' : '\u25B6'}
              </span>
            </span>
          </div>
          {expanded === m.key && (
            <DrillDown metricKey={m.key} aarData={aarData} />
          )}
        </div>
      ))}
    </div>
  );
}

function DrillDown({ metricKey, aarData }: { metricKey: string; aarData: AARData }) {
  const entities = Object.values(aarData.perEntity);
  if (entities.length === 0) {
    return <div style={{ padding: '8px 16px', fontSize: '10px', color: PANEL.TEXT_MUTED }}>No data</div>;
  }

  // Group by aircraft type
  const byType = new Map<string, EntityAAREntry[]>();
  for (const e of entities) {
    const key = e.aircraftType || 'Unknown';
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key)!.push(e);
  }

  return (
    <div style={{
      padding: '4px 8px 8px 16px',
      marginBottom: '4px',
      borderLeft: `2px solid ${PANEL.ACCENT_DIM}`,
      marginLeft: '12px',
    }}>
      {entities.sort((a, b) => getMetricValue(b, metricKey) - getMetricValue(a, metricKey)).map((e, i) => {
        const val = getMetricValue(e, metricKey);
        if (val === 0 && metricKey !== 'friendlyLoss' && metricKey !== 'enemyLoss') return null;
        return (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '3px 4px',
            fontSize: '10px',
            color: PANEL.TEXT_SECONDARY,
          }}>
            <span style={{ color: e.side === 0 ? PANEL.BLUE : PANEL.RED }}>
              {e.callsign}
            </span>
            <span style={{ color: PANEL.TEXT_PRIMARY }}>
              {formatMetricValue(val, metricKey)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function getMetricValue(e: EntityAAREntry, key: string): number {
  switch (key) {
    case 'fuel': return e.fuelUsedKg;
    case 'muns': return sumValues(e.munsExpended);
    case 'hits': return e.kills;
    case 'engaged': return sumValues(e.munsExpended); // approx
    case 'friendlyLoss': return e.side === 0 && e.lost ? 1 : 0;
    case 'enemyLoss': return e.side !== 0 && e.lost ? 1 : 0;
    default: return 0;
  }
}

function formatMetricValue(val: number, key: string): string {
  if (key === 'fuel') return formatKg(val);
  if (key === 'friendlyLoss' || key === 'enemyLoss') return val > 0 ? 'LOST' : '-';
  return val.toString();
}

function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

function sumValues(obj: Record<string, number>): number {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}
