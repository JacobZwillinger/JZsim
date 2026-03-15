import { useUIStore } from '../store/ui-store.js';
import { metersToFeet, mpsToKnots } from '@jzsim/core';
import { SCENARIOS, type Scenario } from '../scenarios/index.js';

interface Props {
  onPauseToggle: (paused: boolean) => void;
  onTimeMultiplier: (multiplier: number) => void;
  onLoadScenario: (scenario: Scenario) => void;
}

const TIME_SPEEDS = [1, 2, 4, 8, 16, 60];

export function TimeControls({ onPauseToggle, onTimeMultiplier, onLoadScenario }: Props) {
  const simTime = useUIStore((s) => s.simTime);
  const entityCount = useUIStore((s) => s.entityCount);
  const tickMs = useUIStore((s) => s.tickMs);
  const paused = useUIStore((s) => s.paused);
  const timeMultiplier = useUIStore((s) => s.timeMultiplier);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '6px 16px',
      backgroundColor: '#0d0d14',
      borderBottom: '1px solid #1a1a2e',
      fontSize: '12px',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Title */}
      <span style={{ color: '#4488ff', fontWeight: 'bold', fontSize: '14px', marginRight: '8px' }}>
        JZSIM
      </span>

      {/* Play/Pause */}
      <button
        onClick={() => onPauseToggle(!paused)}
        style={{
          background: paused ? '#2a5a2a' : '#3a3a3a',
          border: '1px solid #555',
          color: '#e0e0e0',
          padding: '3px 10px',
          cursor: 'pointer',
          borderRadius: '3px',
          fontSize: '12px',
          fontFamily: 'inherit',
        }}
      >
        {paused ? 'PLAY' : 'PAUSE'}
      </button>

      {/* Time multiplier buttons */}
      {TIME_SPEEDS.map((speed) => (
        <button
          key={speed}
          onClick={() => onTimeMultiplier(speed)}
          style={{
            background: timeMultiplier === speed ? '#4488ff' : '#2a2a2a',
            border: '1px solid #555',
            color: '#e0e0e0',
            padding: '3px 8px',
            cursor: 'pointer',
            borderRadius: '3px',
            fontSize: '11px',
            fontFamily: 'inherit',
          }}
        >
          {speed}x
        </button>
      ))}

      {/* Divider */}
      <span style={{ color: '#333', margin: '0 4px' }}>|</span>

      {/* Scenario buttons */}
      {SCENARIOS.map((sc) => (
        <button
          key={sc.name}
          onClick={() => onLoadScenario(sc)}
          title={sc.description}
          style={{
            background: '#1a2a1a',
            border: '1px solid #2a5a2a',
            color: '#44aa44',
            padding: '3px 8px',
            cursor: 'pointer',
            borderRadius: '3px',
            fontSize: '10px',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          {sc.name}
        </button>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Stats */}
      <span style={{ color: '#888' }}>
        T: {formatTime(simTime)}
      </span>
      <span style={{ color: '#888' }}>
        Entities: {entityCount}
      </span>
      <span style={{ color: tickMs > 16 ? '#ff4444' : '#555' }}>
        {tickMs.toFixed(1)}ms
      </span>
    </div>
  );
}
