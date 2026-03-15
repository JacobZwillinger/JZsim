import { useState } from 'react';
import { EntityInspector } from './EntityInspector.js';
import { StatusDashboard } from './StatusDashboard.js';

type Tab = 'DASHBOARD' | 'INSPECTOR';

export function RightPanel() {
  const [tab, setTab] = useState<Tab>('DASHBOARD');

  return (
    <div style={{
      width: '240px',
      backgroundColor: '#0d0d14',
      borderLeft: '1px solid #1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #1a1a2e',
        fontSize: '10px',
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontWeight: 'bold',
        letterSpacing: '1px',
      }}>
        {(['DASHBOARD', 'INSPECTOR'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '8px 0',
              background: tab === t ? '#0d0d14' : '#08080c',
              border: 'none',
              borderBottom: tab === t ? '2px solid #4488ff' : '2px solid transparent',
              color: tab === t ? '#4488ff' : '#555',
              cursor: 'pointer',
              fontSize: '10px',
              fontFamily: 'inherit',
              fontWeight: 'bold',
              letterSpacing: '1px',
            }}
          >
            {t === 'DASHBOARD' ? 'DASH' : 'INSP'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'DASHBOARD' ? <StatusDashboard /> : <EntityInspector />}
      </div>
    </div>
  );
}
