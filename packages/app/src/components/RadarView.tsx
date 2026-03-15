import { useUIStore, type DetectionEntry } from '../store/ui-store.js';
import { Side } from '@jzsim/core';
import { PANEL } from '../styles/panel.js';

export function RadarView() {
  const radarEntities = useUIStore((s) => s.radarEntities);
  const radarDetections = useUIStore((s) => s.radarDetections);
  const callsigns = useUIStore((s) => s.callsigns);

  const radarSites = Array.from(radarEntities.entries()).map(([id, info]) => ({
    id,
    ...info,
    callsign: callsigns.get(id) ?? `RADAR-${id}`,
    detections: radarDetections.get(id) ?? [],
  }));

  if (radarSites.length === 0) {
    return (
      <div style={{ color: PANEL.TEXT_MUTED, fontSize: '11px', padding: '16px', lineHeight: 1.8 }}>
        No radar sites active.<br />Load a scenario to see radar data.
      </div>
    );
  }

  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      {radarSites.map((radar) => (
        <RadarSiteCard key={radar.id} radar={radar} callsigns={callsigns} />
      ))}
    </div>
  );
}

function RadarSiteCard({ radar, callsigns }: {
  radar: {
    id: number;
    callsign: string;
    lat: number;
    lon: number;
    maxRangeM: number;
    side: number;
    detections: DetectionEntry[];
  };
  callsigns: Map<number, string>;
}) {
  const sColor = radar.side === Side.BLUE ? PANEL.BLUE : radar.side === Side.RED ? PANEL.RED : PANEL.NEUTRAL;
  const rangeKm = radar.maxRangeM / 1000;

  // Sort detections by range (closest first)
  const sorted = [...radar.detections].sort((a, b) => a.range - b.range);

  return (
    <div style={{
      padding: '8px 10px',
      borderBottom: `1px solid ${PANEL.BORDER}`,
      fontSize: '10px',
      fontFamily: PANEL.FONT_MONO,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{ color: sColor, fontSize: '12px' }}>◎</span>
        <span style={{ color: sColor, fontWeight: 'bold', fontSize: '11px', flex: 1 }}>
          {radar.callsign}
        </span>
        <span style={{
          fontSize: '8px',
          padding: '1px 5px',
          borderRadius: '3px',
          backgroundColor: PANEL.SUCCESS,
          color: '#fff',
          fontWeight: 'bold',
        }}>SEARCH</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', fontSize: '9px', color: PANEL.TEXT_SECONDARY, marginBottom: '6px' }}>
        <span>Range: {rangeKm.toFixed(0)}km</span>
        <span>Tracks: {sorted.length}</span>
      </div>

      {/* Detections list */}
      {sorted.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
          padding: '4px',
        }}>
          <div style={{ fontSize: '8px', color: PANEL.TEXT_MUTED, marginBottom: '4px', letterSpacing: '0.5px' }}>
            DETECTIONS
          </div>
          {sorted.map((det) => {
            const tgtCs = callsigns.get(det.targetId) ?? `#${det.targetId}`;
            return (
              <DetectionRow key={det.targetId} callsign={tgtCs} detection={det} />
            );
          })}
        </div>
      )}

      {sorted.length === 0 && (
        <div style={{ color: PANEL.TEXT_MUTED, fontSize: '9px', fontStyle: 'italic' }}>
          No contacts detected
        </div>
      )}
    </div>
  );
}

function DetectionRow({ callsign, detection }: { callsign: string; detection: DetectionEntry }) {
  const rangeKm = detection.range / 1000;
  const pd = detection.probability;
  const barWidth = Math.max(2, pd * 100);

  // Color based on probability
  const barColor = pd > 0.7 ? PANEL.SUCCESS : pd > 0.4 ? PANEL.WARNING : PANEL.DANGER;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '2px 4px',
      fontSize: '9px',
    }}>
      <span style={{ color: PANEL.TEXT_PRIMARY, width: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {callsign}
      </span>
      <span style={{ color: PANEL.TEXT_MUTED, width: '42px', textAlign: 'right' }}>
        {rangeKm.toFixed(0)}km
      </span>
      <span style={{ color: barColor, width: '32px', textAlign: 'right' }}>
        {(pd * 100).toFixed(0)}%
      </span>
      {/* Probability bar */}
      <div style={{
        flex: 1,
        height: '4px',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${barWidth}%`,
          height: '100%',
          backgroundColor: barColor,
          borderRadius: '2px',
          opacity: pd < 0.3 ? 0.5 : 1,
        }} />
      </div>
    </div>
  );
}
