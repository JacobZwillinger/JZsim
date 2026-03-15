import { useUIStore } from '../store/ui-store.js';
import { SCENARIOS, type Scenario } from '../scenarios/index.js';
import { PANEL } from '../styles/panel.js';
import { useState, useRef, useEffect } from 'react';

const TIME_SPEEDS = [1, 2, 4, 8, 16, 60];

interface Props {
  onPauseToggle: (paused: boolean) => void;
  onTimeMultiplier: (multiplier: number) => void;
  onLoadScenario: (scenario: Scenario) => void;
}

export function StatusBar({ onPauseToggle, onTimeMultiplier, onLoadScenario }: Props) {
  const simTime = useUIStore((s) => s.simTime);
  const entityCount = useUIStore((s) => s.entityCount);
  const tickMs = useUIStore((s) => s.tickMs);
  const paused = useUIStore((s) => s.paused);
  const timeMultiplier = useUIStore((s) => s.timeMultiplier);
  const consoleOpen = useUIStore((s) => s.consoleOpen);
  const toggleConsole = useUIStore((s) => s.toggleConsole);

  const [scenarioOpen, setScenarioOpen] = useState(false);
  const scenarioRef = useRef<HTMLDivElement>(null);

  // Close scenario popover on outside click
  useEffect(() => {
    if (!scenarioOpen) return;
    const handler = (e: MouseEvent) => {
      if (scenarioRef.current && !scenarioRef.current.contains(e.target as Node)) {
        setScenarioOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [scenarioOpen]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: `${PANEL.STATUS_BAR_HEIGHT}px`,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 12px',
      backgroundColor: PANEL.BG,
      backdropFilter: PANEL.BLUR,
      WebkitBackdropFilter: PANEL.BLUR,
      borderTop: `1px solid ${PANEL.BORDER}`,
      fontSize: '11px',
      fontFamily: PANEL.FONT_MONO,
      zIndex: 100,
    }}>
      {/* Title */}
      <span style={{ color: PANEL.ACCENT, fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px' }}>
        JZSIM
      </span>

      {/* Divider */}
      <Divider />

      {/* Play/Pause */}
      <SBarButton
        active={paused}
        color={paused ? PANEL.SUCCESS : PANEL.TEXT_SECONDARY}
        onClick={() => onPauseToggle(!paused)}
      >
        {paused ? '▶' : '⏸'}
      </SBarButton>

      {/* Time multiplier buttons */}
      {TIME_SPEEDS.map((speed) => (
        <SBarButton
          key={speed}
          active={timeMultiplier === speed}
          onClick={() => onTimeMultiplier(speed)}
        >
          {speed}x
        </SBarButton>
      ))}

      <Divider />

      {/* Scenario dropdown */}
      <div ref={scenarioRef} style={{ position: 'relative' }}>
        <SBarButton onClick={() => setScenarioOpen(!scenarioOpen)} active={scenarioOpen}>
          SCN ▾
        </SBarButton>
        {scenarioOpen && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '4px',
            backgroundColor: PANEL.BG_SOLID,
            border: `1px solid ${PANEL.BORDER}`,
            borderRadius: PANEL.RADIUS,
            boxShadow: PANEL.SHADOW,
            minWidth: '200px',
            padding: '4px 0',
            zIndex: 200,
          }}>
            {SCENARIOS.map((sc) => (
              <div
                key={sc.name}
                onClick={() => { onLoadScenario(sc); setScenarioOpen(false); }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  color: PANEL.TEXT_PRIMARY,
                  fontSize: '11px',
                  borderBottom: `1px solid ${PANEL.BORDER}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(68,136,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{sc.name}</div>
                <div style={{ color: PANEL.TEXT_MUTED, fontSize: '9px' }}>{sc.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Stats */}
      <span style={{ color: PANEL.TEXT_SECONDARY }}>
        T: <span style={{ color: PANEL.TEXT_PRIMARY }}>{formatTime(simTime)}</span>
      </span>

      <Divider />

      <span style={{ color: PANEL.TEXT_SECONDARY }}>
        ENT: <span style={{ color: PANEL.TEXT_PRIMARY }}>{entityCount}</span>
      </span>

      <Divider />

      <span style={{ color: tickMs > 16 ? PANEL.DANGER : PANEL.TEXT_MUTED }}>
        {tickMs.toFixed(1)}ms
      </span>

      <Divider />

      {/* Terminal toggle */}
      <SBarButton active={consoleOpen} onClick={toggleConsole}>
        ⌨
      </SBarButton>

      {/* Help button */}
      <SBarButton onClick={() => useUIStore.getState().toggleHelp()}>
        ?
      </SBarButton>
    </div>
  );
}

function Divider() {
  return <span style={{ color: PANEL.BORDER, fontSize: '14px', userSelect: 'none' }}>│</span>;
}

function SBarButton({ children, active, color, onClick }: {
  children: React.ReactNode;
  active?: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(68,136,255,0.15)' : 'transparent',
        border: active ? `1px solid ${PANEL.ACCENT_DIM}` : '1px solid transparent',
        color: color ?? (active ? PANEL.ACCENT : PANEL.TEXT_SECONDARY),
        padding: '2px 8px',
        cursor: 'pointer',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'inherit',
        lineHeight: '1.4',
      }}
    >
      {children}
    </button>
  );
}
