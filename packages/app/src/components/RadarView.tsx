import { useState, useMemo } from 'react';
import { useUIStore, type DetectionEntry } from '../store/ui-store.js';
import { Side } from '@jzsim/core';
import { PANEL } from '../styles/panel.js';

export function RadarView() {
  const radarEntities = useUIStore((s) => s.radarEntities);
  const radarDetections = useUIStore((s) => s.radarDetections);
  const callsigns = useUIStore((s) => s.callsigns);

  const radarSites = useMemo(() =>
    Array.from(radarEntities.entries()).map(([id, info]) => ({
      id,
      ...info,
      callsign: callsigns.get(id) ?? `RADAR-${id}`,
      detections: radarDetections.get(id) ?? [],
    })),
    [radarEntities, radarDetections, callsigns]
  );

  const blueRadars = radarSites.filter((r) => r.side === Side.BLUE);
  const redRadars = radarSites.filter((r) => r.side === Side.RED);

  const totalTracks = radarSites.reduce((sum, r) => sum + r.detections.length, 0);

  if (radarSites.length === 0) {
    return (
      <div style={{ color: PANEL.TEXT_MUTED, fontSize: '11px', padding: '16px', lineHeight: 1.8 }}>
        No radar sites active.<br />Load a scenario to see radar data.
      </div>
    );
  }

  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      {/* Aggregate summary bar */}
      <div style={{
        padding: '8px 10px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderBottom: `1px solid ${PANEL.BORDER}`,
        display: 'flex',
        gap: '12px',
        fontSize: '9px',
        fontFamily: PANEL.FONT_MONO,
        color: PANEL.TEXT_SECONDARY,
      }}>
        <span>RADARS: <b style={{ color: PANEL.TEXT_PRIMARY }}>{radarSites.length}</b></span>
        <span>TRACKS: <b style={{ color: PANEL.TEXT_PRIMARY }}>{totalTracks}</b></span>
        <span style={{ color: PANEL.BLUE }}>BLU: {blueRadars.length}</span>
        <span style={{ color: PANEL.RED }}>RED: {redRadars.length}</span>
      </div>

      {blueRadars.length > 0 && (
        <RadarGroup label="BLUE FORCE" side={Side.BLUE} radars={blueRadars} callsigns={callsigns} />
      )}
      {redRadars.length > 0 && (
        <RadarGroup label="RED FORCE" side={Side.RED} radars={redRadars} callsigns={callsigns} />
      )}
    </div>
  );
}

interface RadarSite {
  id: number;
  callsign: string;
  lat: number;
  lon: number;
  maxRangeM: number;
  side: number;
  detections: DetectionEntry[];
}

function RadarGroup({ label, side, radars, callsigns }: {
  label: string;
  side: number;
  radars: RadarSite[];
  callsigns: Map<number, string>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sColor = side === Side.BLUE ? PANEL.BLUE : PANEL.RED;
  const totalTracks = radars.reduce((sum, r) => sum + r.detections.length, 0);

  return (
    <div>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          padding: '6px 10px',
          fontSize: '9px',
          fontFamily: PANEL.FONT_MONO,
          fontWeight: 'bold',
          letterSpacing: '1px',
          color: sColor,
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderBottom: `1px solid ${PANEL.BORDER}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '8px', transition: 'transform 0.15s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
        {label}
        <span style={{ color: PANEL.TEXT_MUTED, fontWeight: 'normal', marginLeft: 'auto' }}>
          {radars.length} radars | {totalTracks} tracks
        </span>
      </div>
      {!collapsed && radars.map((radar) => (
        <RadarSiteCard key={radar.id} radar={radar} callsigns={callsigns} />
      ))}
    </div>
  );
}

function RadarSiteCard({ radar, callsigns }: {
  radar: RadarSite;
  callsigns: Map<number, string>;
}) {
  const [expanded, setExpanded] = useState(true);
  const sColor = radar.side === Side.BLUE ? PANEL.BLUE : radar.side === Side.RED ? PANEL.RED : PANEL.NEUTRAL;
  const rangeKm = radar.maxRangeM / 1000;

  // Sort detections by range (closest first)
  const sorted = [...radar.detections].sort((a, b) => a.range - b.range);

  // Auto-collapse cards with no detections when there are many radars
  const hasDetections = sorted.length > 0;

  return (
    <div style={{
      padding: '6px 10px',
      borderBottom: `1px solid ${PANEL.BORDER}`,
      fontSize: '10px',
      fontFamily: PANEL.FONT_MONO,
    }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ color: sColor, fontSize: '12px' }}>◎</span>
        <span style={{ color: sColor, fontWeight: 'bold', fontSize: '11px', flex: 1 }}>
          {radar.callsign}
        </span>
        <span style={{ color: PANEL.TEXT_MUTED, fontSize: '9px' }}>
          {rangeKm.toFixed(0)}km
        </span>
        {sorted.length > 0 && (
          <span style={{
            fontSize: '8px',
            padding: '1px 4px',
            borderRadius: '3px',
            backgroundColor: sorted.length > 5 ? PANEL.WARNING : PANEL.SUCCESS,
            color: '#fff',
            fontWeight: 'bold',
            minWidth: '16px',
            textAlign: 'center',
          }}>
            {sorted.length}
          </span>
        )}
        <span style={{
          fontSize: '8px',
          padding: '1px 5px',
          borderRadius: '3px',
          backgroundColor: PANEL.SUCCESS,
          color: '#fff',
          fontWeight: 'bold',
        }}>SEARCH</span>
      </div>

      {/* Expanded details */}
      {expanded && hasDetections && (
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
          padding: '4px',
          marginTop: '4px',
        }}>
          <div style={{ fontSize: '8px', color: PANEL.TEXT_MUTED, marginBottom: '3px', letterSpacing: '0.5px' }}>
            DETECTIONS ({sorted.length})
          </div>
          {sorted.slice(0, 10).map((det) => {
            const tgtCs = callsigns.get(det.targetId) ?? `#${det.targetId}`;
            return (
              <DetectionRow key={det.targetId} callsign={tgtCs} detection={det} />
            );
          })}
          {sorted.length > 10 && (
            <div style={{ color: PANEL.TEXT_MUTED, fontSize: '8px', textAlign: 'center', padding: '2px' }}>
              +{sorted.length - 10} more contacts
            </div>
          )}
        </div>
      )}

      {expanded && !hasDetections && (
        <div style={{ color: PANEL.TEXT_MUTED, fontSize: '9px', fontStyle: 'italic', marginTop: '3px' }}>
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
