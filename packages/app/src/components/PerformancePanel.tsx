import { useUIStore } from '../store/ui-store.js';
import { PANEL } from '../styles/panel.js';

function budgetMs(timeMultiplier: number): number {
  // At 1x, one sim-second per wall-second → budget is 1000ms per tick
  // At 60x, 60 sim-seconds per wall-second → budget is ~16.7ms per tick
  return 1000 / Math.max(timeMultiplier, 1);
}

function budgetColor(ratio: number): string {
  if (ratio < 0.5) return PANEL.SUCCESS;
  if (ratio < 0.8) return PANEL.WARNING;
  return PANEL.DANGER;
}

function fmt(ms: number): string {
  if (ms < 0.01) return '<.01';
  if (ms < 1) return ms.toFixed(2);
  if (ms < 10) return ms.toFixed(1);
  return ms.toFixed(0);
}

export function PerformancePanel() {
  const perfData = useUIStore((s) => s.perfData);
  const tickMs = useUIStore((s) => s.tickMs);
  const entityCount = useUIStore((s) => s.entityCount);
  const timeMultiplier = useUIStore((s) => s.timeMultiplier);
  const tickCount = useUIStore((s) => s.tickCount);

  if (!perfData) {
    return (
      <div style={{ padding: '16px', color: PANEL.TEXT_MUTED, fontSize: '11px' }}>
        No data yet. Run the simulation to see performance metrics.
      </div>
    );
  }

  const worldCapacity = perfData.worldCapacity || entityCount;
  const budget = budgetMs(timeMultiplier);
  const budgetRatio = tickMs / budget;
  const totalSystemMs = perfData.systemTimings.reduce((s, t) => s + t.ms, 0)
    + perfData.gridRebuildMs + perfData.bufferSyncMs;
  const maxSystemMs = Math.max(
    ...perfData.systemTimings.map((t) => t.ms),
    perfData.gridRebuildMs,
    perfData.bufferSyncMs,
    0.01,
  );

  // Estimate max entities: linear extrapolation to fill the budget
  const estMaxEntities = entityCount > 0 && totalSystemMs > 0.01
    ? Math.floor((budget / totalSystemMs) * entityCount)
    : null;

  const allTimings = [
    ...perfData.systemTimings,
    { name: 'Grid Rebuild', ms: perfData.gridRebuildMs },
    { name: 'Buffer Sync', ms: perfData.bufferSyncMs },
  ];

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, padding: '4px 4px 8px', letterSpacing: '0.5px' }}>
        SYSTEM HEALTH
      </div>

      {/* Tick Budget gauge */}
      <Section label="TICK BUDGET">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: PANEL.TEXT_SECONDARY }}>
            {fmt(tickMs)} / {fmt(budget)} ms
          </span>
          <span style={{ fontSize: '10px', color: budgetColor(budgetRatio), fontWeight: 'bold' }}>
            {(budgetRatio * 100).toFixed(0)}%
          </span>
        </div>
        <Bar ratio={Math.min(budgetRatio, 1)} color={budgetColor(budgetRatio)} />
      </Section>

      {/* Entity count */}
      <Section label="ENTITIES">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: PANEL.TEXT_SECONDARY }}>
            {entityCount.toLocaleString()} active
          </span>
          <span style={{ fontSize: '10px', color: PANEL.TEXT_MUTED }}>
            capacity: {worldCapacity.toLocaleString()}
          </span>
        </div>
        <Bar ratio={worldCapacity > 0 ? entityCount / worldCapacity : 0} color={PANEL.ACCENT} />
      </Section>

      {/* Speed + Tick */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <MiniStat label="SPEED" value={`${timeMultiplier}x`} />
        <MiniStat label="TICK" value={`#${tickCount}`} />
        <MiniStat label="MISSILES" value={String(perfData.missileCount)} />
        <MiniStat label="CONTACTS" value={String(perfData.radarContacts)} />
      </div>

      {/* Per-system breakdown */}
      <Section label="SYSTEM BREAKDOWN">
        {allTimings.map((t) => (
          <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '18px' }}>
            <span style={{
              fontSize: '9px',
              color: PANEL.TEXT_SECONDARY,
              width: '72px',
              flexShrink: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}>
              {t.name}
            </span>
            <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.max((t.ms / maxSystemMs) * 100, 1)}%`,
                backgroundColor: t.ms === maxSystemMs ? PANEL.WARNING : PANEL.ACCENT,
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{
              fontSize: '9px',
              color: PANEL.TEXT_PRIMARY,
              width: '52px',
              textAlign: 'right',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}>
              {fmt(t.ms)} ms
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: `1px solid ${PANEL.BORDER}` }}>
          <span style={{ fontSize: '9px', color: PANEL.TEXT_MUTED }}>Total</span>
          <span style={{ fontSize: '9px', color: PANEL.TEXT_PRIMARY, fontWeight: 'bold' }}>{fmt(totalSystemMs)} ms</span>
        </div>
      </Section>

      {/* Capacity estimate */}
      <Section label="CAPACITY ESTIMATE">
        <div style={{ fontSize: '10px', color: PANEL.TEXT_SECONDARY, lineHeight: 1.8 }}>
          Est. max entities at {timeMultiplier}x:{' '}
          <span style={{ color: PANEL.TEXT_PRIMARY, fontWeight: 'bold' }}>
            {estMaxEntities !== null ? `~${estMaxEntities.toLocaleString()}` : '---'}
          </span>
        </div>
      </Section>
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

function Bar({ ratio, color }: { ratio: number; color: string }) {
  return (
    <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${Math.max(ratio * 100, 0.5)}%`,
        backgroundColor: color,
        borderRadius: '4px',
        transition: 'width 0.3s ease, background-color 0.3s ease',
      }} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      flex: 1,
      padding: '6px',
      backgroundColor: 'rgba(255,255,255,0.02)',
      border: `1px solid ${PANEL.BORDER}`,
      borderRadius: '4px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '7px', color: PANEL.TEXT_MUTED, letterSpacing: '0.5px', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: PANEL.TEXT_PRIMARY, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}
