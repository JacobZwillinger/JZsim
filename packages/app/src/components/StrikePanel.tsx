import { useState } from 'react';
import { useUIStore } from '../store/ui-store.js';
import { PANEL } from '../styles/panel.js';
import { haversineDistance } from '@jzsim/core';
import type { Command } from '@jzsim/core';

// Must match STRIKE_COLORS in MapView.tsx
const STRIKE_COLORS = [
  '#ff8800', '#00ccff', '#ff44aa', '#88ff44',
  '#ffdd00', '#aa66ff', '#ff6644', '#44ffcc',
];

interface Props {
  onCommand: (cmd: Command) => void;
}

export function StrikePanel({ onCommand }: Props) {
  const dmpiTargets = useUIStore((s) => s.dmpiTargets);
  const strikeRoutes = useUIStore((s) => s.strikeRoutes);
  const callsigns = useUIStore((s) => s.callsigns);
  const [expandedStrike, setExpandedStrike] = useState<number | null>(null);

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, padding: '4px 4px 8px', letterSpacing: '0.5px' }}>
        STRIKE / DMPI
      </div>

      {/* DMPI Targets Section */}
      <Section label={`DMPI TARGETS (${dmpiTargets.size})`}>
        {dmpiTargets.size === 0 ? (
          <div style={{ fontSize: '10px', color: PANEL.TEXT_MUTED, padding: '4px 0' }}>
            No DMPIs defined. Add targets below or via command.
          </div>
        ) : (
          Array.from(dmpiTargets.entries()).map(([name, data]) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 6px', marginBottom: '2px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderRadius: '3px',
            }}>
              <div>
                <span style={{ fontSize: '10px', color: PANEL.WARNING, fontWeight: 'bold' }}>{name}</span>
                <span style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, marginLeft: '6px' }}>
                  {data.lat.toFixed(2)}, {data.lon.toFixed(2)}
                </span>
                {data.description && (
                  <span style={{ fontSize: '9px', color: PANEL.TEXT_SECONDARY, marginLeft: '6px' }}>
                    {data.description}
                  </span>
                )}
              </div>
              <button
                onClick={() => onCommand({ type: 'DMPI_REMOVE', name })}
                style={{
                  background: 'transparent', border: 'none', color: PANEL.TEXT_MUTED,
                  cursor: 'pointer', fontSize: '10px', padding: '2px 4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = PANEL.DANGER)}
                onMouseLeave={(e) => (e.currentTarget.style.color = PANEL.TEXT_MUTED)}
                title="Remove DMPI"
              >
                x
              </button>
            </div>
          ))
        )}
        <AddDmpiForm onCommand={onCommand} />
      </Section>

      {/* Active Strike Orders */}
      <Section label={`ACTIVE STRIKES (${strikeRoutes.size})`}>
        {strikeRoutes.size === 0 ? (
          <div style={{ fontSize: '10px', color: PANEL.TEXT_MUTED, padding: '4px 0' }}>
            No active strike missions.
          </div>
        ) : (
          Array.from(strikeRoutes.entries()).map(([entityId, route], idx) => {
            const cs = callsigns.get(entityId) ?? `#${entityId}`;
            const isExpanded = expandedStrike === entityId;
            const routeColor = STRIKE_COLORS[idx % STRIKE_COLORS.length];
            return (
              <div key={entityId} style={{ marginBottom: '4px' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 8px',
                    backgroundColor: isExpanded ? 'rgba(68,136,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isExpanded ? PANEL.ACCENT_DIM : PANEL.BORDER}`,
                    borderLeft: `3px solid ${routeColor}`,
                    borderRadius: '4px', cursor: 'pointer',
                  }}
                  onClick={() => setExpandedStrike(isExpanded ? null : entityId)}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: PANEL.TEXT_PRIMARY, fontWeight: 'bold' }}>{cs}</span>
                    <span style={{
                      fontSize: '8px', color: routeColor, marginLeft: '6px',
                      padding: '1px 4px', backgroundColor: `${routeColor}22`,
                      borderRadius: '2px',
                    }}>STK</span>
                  </div>
                  <span style={{ fontSize: '10px', color: PANEL.TEXT_SECONDARY }}>
                    {route.completedDmpis.length}/{route.dmpiNames.length}
                  </span>
                </div>
                {isExpanded && (
                  <StrikeRouteDetail
                    entityId={entityId}
                    route={route}
                    callsign={cs}
                    dmpiTargets={dmpiTargets}
                    onCommand={onCommand}
                    color={routeColor}
                  />
                )}
              </div>
            );
          })
        )}
      </Section>
    </div>
  );
}

type SortStrategy = 'nearest' | 'east-west' | 'west-east' | 'north-south' | 'south-north' | 'cluster';

function nearestNeighborSort(
  pending: string[],
  dmpiTargets: Map<string, { lat: number; lon: number }>,
  startLat: number, startLon: number,
): string[] {
  const result: string[] = [];
  const remaining = new Set(pending);
  let curLat = startLat, curLon = startLon;

  while (remaining.size > 0) {
    let nearestName = '';
    let nearestDist = Infinity;
    for (const name of remaining) {
      const t = dmpiTargets.get(name);
      if (!t) continue;
      const d = haversineDistance(curLat, curLon, t.lat, t.lon);
      if (d < nearestDist) { nearestDist = d; nearestName = name; }
    }
    if (!nearestName) break;
    result.push(nearestName);
    remaining.delete(nearestName);
    const t = dmpiTargets.get(nearestName)!;
    curLat = t.lat; curLon = t.lon;
  }
  return result;
}

function clusterSort(
  pending: string[],
  dmpiTargets: Map<string, { lat: number; lon: number }>,
  startLat: number, startLon: number,
): string[] {
  if (pending.length < 4) return nearestNeighborSort(pending, dmpiTargets, startLat, startLon);

  const k = Math.max(2, Math.ceil(pending.length / 5));
  const coords = pending.map(n => {
    const t = dmpiTargets.get(n);
    return { name: n, lat: t?.lat ?? 0, lon: t?.lon ?? 0 };
  });

  // Seed centroids from evenly-spaced items sorted by longitude
  const sorted = [...coords].sort((a, b) => a.lon - b.lon);
  const centroids = Array.from({ length: k }, (_, i) => {
    const idx = Math.floor((i / k) * sorted.length);
    return { lat: sorted[idx].lat, lon: sorted[idx].lon };
  });

  // K-means: 10 iterations
  const assignments = new Int32Array(coords.length);
  for (let iter = 0; iter < 10; iter++) {
    // Assign each point to nearest centroid
    for (let i = 0; i < coords.length; i++) {
      let best = 0, bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const d = haversineDistance(coords[i].lat, coords[i].lon, centroids[c].lat, centroids[c].lon);
        if (d < bestDist) { bestDist = d; best = c; }
      }
      assignments[i] = best;
    }
    // Recompute centroids
    for (let c = 0; c < k; c++) {
      let sumLat = 0, sumLon = 0, count = 0;
      for (let i = 0; i < coords.length; i++) {
        if (assignments[i] === c) { sumLat += coords[i].lat; sumLon += coords[i].lon; count++; }
      }
      if (count > 0) { centroids[c].lat = sumLat / count; centroids[c].lon = sumLon / count; }
    }
  }

  // Group by cluster
  const clusters: string[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < coords.length; i++) clusters[assignments[i]].push(coords[i].name);

  // Order clusters by nearest-neighbor from start position
  const result: string[] = [];
  const usedClusters = new Set<number>();
  let curLat = startLat, curLon = startLon;

  for (let step = 0; step < k; step++) {
    let bestC = -1, bestDist = Infinity;
    for (let c = 0; c < k; c++) {
      if (usedClusters.has(c) || clusters[c].length === 0) continue;
      const d = haversineDistance(curLat, curLon, centroids[c].lat, centroids[c].lon);
      if (d < bestDist) { bestDist = d; bestC = c; }
    }
    if (bestC < 0) break;
    usedClusters.add(bestC);
    // Nearest-neighbor within cluster
    const ordered = nearestNeighborSort(clusters[bestC], dmpiTargets, curLat, curLon);
    result.push(...ordered);
    if (ordered.length > 0) {
      const last = dmpiTargets.get(ordered[ordered.length - 1]);
      if (last) { curLat = last.lat; curLon = last.lon; }
    }
  }
  return result;
}

function sortPending(
  strategy: SortStrategy,
  pending: string[],
  dmpiTargets: Map<string, { lat: number; lon: number }>,
  startLat: number, startLon: number,
): string[] {
  switch (strategy) {
    case 'east-west':
      return [...pending].sort((a, b) => (dmpiTargets.get(b)?.lon ?? 0) - (dmpiTargets.get(a)?.lon ?? 0));
    case 'west-east':
      return [...pending].sort((a, b) => (dmpiTargets.get(a)?.lon ?? 0) - (dmpiTargets.get(b)?.lon ?? 0));
    case 'north-south':
      return [...pending].sort((a, b) => (dmpiTargets.get(b)?.lat ?? 0) - (dmpiTargets.get(a)?.lat ?? 0));
    case 'south-north':
      return [...pending].sort((a, b) => (dmpiTargets.get(a)?.lat ?? 0) - (dmpiTargets.get(b)?.lat ?? 0));
    case 'nearest':
      return nearestNeighborSort(pending, dmpiTargets, startLat, startLon);
    case 'cluster':
      return clusterSort(pending, dmpiTargets, startLat, startLon);
  }
}

function StrikeRouteDetail({ entityId, route, callsign, dmpiTargets, onCommand, color }: {
  entityId: number;
  route: { dmpiNames: string[]; currentDmpiIdx: number; completedDmpis: string[] };
  callsign: string;
  dmpiTargets: Map<string, { lat: number; lon: number; description?: string }>;
  onCommand: (cmd: Command) => void;
  color: string;
}) {
  const [strategy, setStrategy] = useState<SortStrategy>('nearest');

  // Compute distances between consecutive DMPIs
  const distances: number[] = [];
  let totalDist = 0;
  for (let i = 1; i < route.dmpiNames.length; i++) {
    const prev = dmpiTargets.get(route.dmpiNames[i - 1]);
    const curr = dmpiTargets.get(route.dmpiNames[i]);
    if (prev && curr) {
      const d = haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);
      distances.push(d);
      totalDist += d;
    } else {
      distances.push(0);
    }
  }

  const canReorder = route.dmpiNames.length > 1 && route.completedDmpis.length < route.dmpiNames.length;

  const handleMoveUp = (idx: number) => {
    if (idx <= route.currentDmpiIdx || idx <= 0) return;
    const newNames = [...route.dmpiNames];
    [newNames[idx - 1], newNames[idx]] = [newNames[idx], newNames[idx - 1]];
    onCommand({ type: 'STRIKE', callsign, dmpiNames: newNames });
  };

  const handleMoveDown = (idx: number) => {
    if (idx < route.currentDmpiIdx || idx >= route.dmpiNames.length - 1) return;
    const newNames = [...route.dmpiNames];
    [newNames[idx], newNames[idx + 1]] = [newNames[idx + 1], newNames[idx]];
    onCommand({ type: 'STRIKE', callsign, dmpiNames: newNames });
  };

  const handleSort = () => {
    const done = new Set(route.completedDmpis);
    const completed = route.dmpiNames.filter(n => done.has(n));
    const pending = route.dmpiNames.filter(n => !done.has(n));
    if (pending.length < 2) return;

    let startLat: number, startLon: number;
    if (completed.length > 0) {
      const last = dmpiTargets.get(completed[completed.length - 1]);
      startLat = last?.lat ?? 0; startLon = last?.lon ?? 0;
    } else {
      const first = dmpiTargets.get(pending[0]);
      startLat = first?.lat ?? 0; startLon = first?.lon ?? 0;
    }

    const sorted = sortPending(strategy, pending, dmpiTargets, startLat, startLon);
    onCommand({ type: 'STRIKE', callsign, dmpiNames: [...completed, ...sorted] });
  };

  return (
    <div style={{
      padding: '8px',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderLeft: `3px solid ${color}`,
      borderRadius: '0 0 4px 4px',
      marginTop: '-1px',
    }}>
      {route.dmpiNames.map((name, i) => {
        const isCompleted = route.completedDmpis.includes(name);
        const isCurrent = i === route.currentDmpiIdx && !isCompleted;
        const isPending = !isCompleted && !isCurrent;

        return (
          <div key={`${name}-${i}`} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '3px 0',
          }}>
            {/* Status icon */}
            <span style={{ fontSize: '10px', width: '14px', textAlign: 'center' }}>
              {isCompleted ? '✓' : isCurrent ? '→' : '○'}
            </span>
            <span style={{
              color: isCompleted ? PANEL.SUCCESS : isCurrent ? PANEL.WARNING : PANEL.TEXT_SECONDARY,
              fontSize: '10px',
              fontWeight: isCurrent ? 'bold' : 'normal',
              flex: 1,
            }}>
              {name}
            </span>
            {/* Distance from previous */}
            {i > 0 && distances[i - 1] > 0 && (
              <span style={{ fontSize: '8px', color: PANEL.TEXT_MUTED }}>
                {(distances[i - 1] / 1000).toFixed(0)} km
              </span>
            )}
            {/* Reorder buttons for pending items */}
            {isPending && canReorder && (
              <div style={{ display: 'flex', gap: '2px' }}>
                <button
                  onClick={() => handleMoveUp(i)}
                  disabled={i <= route.currentDmpiIdx + 1}
                  style={{
                    background: 'transparent', border: 'none',
                    color: i > route.currentDmpiIdx + 1 ? PANEL.TEXT_SECONDARY : PANEL.TEXT_MUTED,
                    cursor: i > route.currentDmpiIdx + 1 ? 'pointer' : 'default',
                    fontSize: '9px', padding: '0 2px',
                  }}
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMoveDown(i)}
                  disabled={i >= route.dmpiNames.length - 1}
                  style={{
                    background: 'transparent', border: 'none',
                    color: i < route.dmpiNames.length - 1 ? PANEL.TEXT_SECONDARY : PANEL.TEXT_MUTED,
                    cursor: i < route.dmpiNames.length - 1 ? 'pointer' : 'default',
                    fontSize: '9px', padding: '0 2px',
                  }}
                >
                  ▼
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Total distance */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: '6px', paddingTop: '6px',
        borderTop: `1px solid ${PANEL.BORDER}`,
      }}>
        <span style={{ fontSize: '9px', color: PANEL.TEXT_MUTED }}>Total route</span>
        <span style={{ fontSize: '9px', color: PANEL.TEXT_PRIMARY, fontWeight: 'bold' }}>
          {(totalDist / 1000).toFixed(0)} km
        </span>
      </div>

      {/* Sort controls */}
      {canReorder && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
          <select
            value={strategy}
            onChange={e => setStrategy(e.target.value as SortStrategy)}
            style={{
              flex: 1, padding: '4px 6px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: `1px solid ${PANEL.BORDER}`,
              borderRadius: '3px',
              color: PANEL.TEXT_PRIMARY,
              fontSize: '9px', fontFamily: PANEL.FONT_MONO,
              outline: 'none',
            }}
          >
            <option value="nearest">Nearest Neighbor</option>
            <option value="east-west">East → West</option>
            <option value="west-east">West → East</option>
            <option value="north-south">North → South</option>
            <option value="south-north">South → North</option>
            <option value="cluster">Cluster</option>
          </select>
          <button
            onClick={handleSort}
            style={{
              padding: '4px 10px',
              backgroundColor: 'rgba(68,136,255,0.1)',
              border: `1px solid ${PANEL.ACCENT_DIM}`,
              borderRadius: '3px',
              color: PANEL.ACCENT,
              fontSize: '9px', fontFamily: PANEL.FONT_MONO,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            SORT
          </button>
        </div>
      )}
    </div>
  );
}

function AddDmpiForm({ onCommand }: { onCommand: (cmd: Command) => void }) {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [desc, setDesc] = useState('');
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          width: '100%', marginTop: '6px', padding: '6px',
          background: 'transparent',
          border: `1px dashed ${PANEL.BORDER}`,
          borderRadius: '4px',
          color: PANEL.TEXT_MUTED, fontSize: '9px',
          cursor: 'pointer', fontFamily: PANEL.FONT_MONO,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = PANEL.WARNING)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = PANEL.BORDER)}
      >
        + ADD DMPI
      </button>
    );
  }

  const handleSubmit = () => {
    const latN = parseFloat(lat);
    const lonN = parseFloat(lon);
    if (!name.trim() || isNaN(latN) || isNaN(lonN)) return;
    onCommand({
      type: 'DMPI_ADD',
      name: name.trim().toUpperCase(),
      lat: latN,
      lon: lonN,
      description: desc.trim() || undefined,
    });
    setName(''); setLat(''); setLon(''); setDesc('');
    setShowForm(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '4px 6px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: `1px solid ${PANEL.BORDER}`,
    borderRadius: '3px',
    color: PANEL.TEXT_PRIMARY,
    fontSize: '10px',
    fontFamily: PANEL.FONT_MONO,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      marginTop: '6px', padding: '8px',
      backgroundColor: 'rgba(255,255,255,0.02)',
      border: `1px solid ${PANEL.BORDER}`,
      borderRadius: '4px',
    }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, width: '35%' }} />
        <input placeholder="Lat" value={lat} onChange={(e) => setLat(e.target.value)} style={{ ...inputStyle, width: '30%' }} />
        <input placeholder="Lon" value={lon} onChange={(e) => setLon(e.target.value)} style={{ ...inputStyle, width: '30%' }} />
      </div>
      <input placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ ...inputStyle, marginBottom: '4px' }} />
      <div style={{ display: 'flex', gap: '4px' }}>
        <button onClick={handleSubmit} style={{
          flex: 1, padding: '4px',
          backgroundColor: 'rgba(255,170,51,0.15)', border: `1px solid ${PANEL.WARNING}`,
          borderRadius: '3px', color: PANEL.WARNING, fontSize: '9px',
          fontFamily: PANEL.FONT_MONO, cursor: 'pointer',
        }}>ADD</button>
        <button onClick={() => setShowForm(false)} style={{
          flex: 1, padding: '4px',
          backgroundColor: 'transparent', border: `1px solid ${PANEL.BORDER}`,
          borderRadius: '3px', color: PANEL.TEXT_MUTED, fontSize: '9px',
          fontFamily: PANEL.FONT_MONO, cursor: 'pointer',
        }}>CANCEL</button>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: '8px',
      padding: '8px 10px',
      backgroundColor: 'rgba(255,255,255,0.02)',
      border: `1px solid ${PANEL.BORDER}`,
      borderRadius: '4px',
    }}>
      <div style={{ fontSize: '8px', color: PANEL.TEXT_MUTED, letterSpacing: '0.5px', marginBottom: '6px' }}>
        {label}
      </div>
      {children}
    </div>
  );
}
