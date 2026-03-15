import { useState } from 'react';
import { useUIStore, type EntityInfo } from '../store/ui-store.js';
import { ModelType } from '@jzsim/core';
import { PANEL, floatingPanelStyle } from '../styles/panel.js';
import { TrackCard } from './TrackCard.js';
import { RadarView } from './RadarView.js';
import { AARPanel } from './AARPanel.js';
import { MissionView } from './MissionView.js';
import { ParametricEditor } from './ParametricEditor.js';
import { ScenarioCreator } from './ScenarioCreator.js';
import { useEntityFilter } from '../hooks/useEntityFilter.js';
import { SCENARIOS, type Scenario } from '../scenarios/index.js';

interface Props {
  onLoadScenario: (scenario: Scenario) => void;
  onCommand?: (cmd: import('@jzsim/core').Command) => void;
}

const DRAWER_LEFT_OPEN = '64px'; // icon rail (44px) + gap (12px) + padding (8px)

export function LeftDrawer({ onLoadScenario, onCommand }: Props) {
  const leftDrawerOpen = useUIStore((s) => s.leftDrawerOpen);
  const leftDrawerTab = useUIStore((s) => s.leftDrawerTab);
  const entities = useUIStore((s) => s.entities);
  const callsigns = useUIStore((s) => s.callsigns);
  const missionStates = useUIStore((s) => s.missionStates);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);
  const setSelectedEntityId = useUIStore((s) => s.setSelectedEntityId);

  // Filter out missiles
  const nonWeapons = entities.filter((e) => e.modelType !== ModelType.MISSILE);

  // Apply search filter
  const filtered = useEntityFilter(nonWeapons, callsigns, missionStates, searchQuery);

  return (
    <div style={{
      ...floatingPanelStyle,
      top: '12px',
      left: leftDrawerOpen ? DRAWER_LEFT_OPEN : '-340px',
      bottom: `${PANEL.STATUS_BAR_HEIGHT + 12}px`,
      width: `${PANEL.DRAWER_WIDTH}px`,
      transition: 'left 0.25s ease',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 80,
    }}>
      {/* Content — no tab bar; navigation is in the icon rail (Toolbar) */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {leftDrawerTab === 'assets' && (
          <AssetsTab
            entities={filtered}
            allCount={nonWeapons.length}
            callsigns={callsigns}
            missionStates={missionStates}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedEntityId={selectedEntityId}
            setSelectedEntityId={setSelectedEntityId}
          />
        )}
        {leftDrawerTab === 'scenarios' && (
          <ScenariosTab onLoadScenario={onLoadScenario} />
        )}
        {leftDrawerTab === 'radar' && (
          <RadarView />
        )}
        {leftDrawerTab === 'missions' && (
          <MissionView />
        )}
        {leftDrawerTab === 'aar' && (
          <AARPanel />
        )}
        {leftDrawerTab === 'data' && (
          <ParametricEditor onUpdateDefaults={(aircraftKey, field, value) => {
            onCommand?.({ type: 'SET_DEFAULTS', aircraftKey, field, value });
          }} />
        )}
      </div>
    </div>
  );
}

function AssetsTab({ entities, allCount, callsigns, missionStates, searchQuery, setSearchQuery, selectedEntityId, setSelectedEntityId }: {
  entities: EntityInfo[];
  allCount: number;
  callsigns: Map<number, string>;
  missionStates: Map<number, string>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedEntityId: number | null;
  setSelectedEntityId: (id: number | null) => void;
}) {
  return (
    <>
      {/* Search bar */}
      <div style={{ padding: '8px', borderBottom: `1px solid ${PANEL.BORDER}` }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Search... (e.g. "blue tankers")'
          spellCheck={false}
          style={{
            width: '100%',
            padding: '6px 10px',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: `1px solid ${PANEL.BORDER}`,
            borderRadius: '6px',
            color: PANEL.TEXT_PRIMARY,
            fontSize: '11px',
            fontFamily: PANEL.FONT_MONO,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = PANEL.ACCENT_DIM)}
          onBlur={(e) => (e.currentTarget.style.borderColor = PANEL.BORDER)}
        />
        {searchQuery && (
          <div style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, marginTop: '4px', padding: '0 4px' }}>
            Showing {entities.length} of {allCount} assets
          </div>
        )}
      </div>

      {/* Entity list */}
      {entities.length === 0 ? (
        <div style={{ color: PANEL.TEXT_MUTED, fontSize: '11px', padding: '16px', lineHeight: 1.8 }}>
          {searchQuery ? 'No matching assets found.' : 'No entities. Load a scenario or use SPAWN command.'}
        </div>
      ) : (
        entities.map((e) => (
          <TrackCard
            key={e.id}
            entity={e}
            callsign={callsigns.get(e.id) ?? `#${e.id}`}
            missionState={missionStates.get(e.id)}
            isSelected={selectedEntityId === e.id}
            onClick={() => setSelectedEntityId(e.id)}
          />
        ))
      )}
    </>
  );
}

function ScenariosTab({ onLoadScenario }: { onLoadScenario: (s: Scenario) => void }) {
  const customScenarios = useUIStore((s) => s.customScenarios);
  const deleteCustomScenario = useUIStore((s) => s.deleteCustomScenario);
  const [showCreator, setShowCreator] = useState(false);

  const builtinCount = SCENARIOS.length;
  const allScenarios = [
    ...SCENARIOS,
    ...customScenarios.map((cs) => ({
      name: cs.name,
      description: cs.description,
      commands: () => cs.commands,
    })),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        <div style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, padding: '4px 4px 8px', letterSpacing: '0.5px' }}>
          LOAD A SCENARIO
        </div>
        {allScenarios.map((sc, i) => (
          <div
            key={sc.name}
            style={{
              padding: '10px 12px',
              marginBottom: '6px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: `1px solid ${PANEL.BORDER}`,
              borderRadius: '6px',
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={() => onLoadScenario(sc)}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = PANEL.ACCENT_DIM)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = PANEL.BORDER)}
          >
            <div style={{ color: PANEL.TEXT_PRIMARY, fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>
              {sc.name}
              {i >= builtinCount && (
                <span style={{ fontSize: '8px', color: PANEL.ACCENT, marginLeft: '6px', fontWeight: 'normal' }}>CUSTOM</span>
              )}
            </div>
            <div style={{ color: PANEL.TEXT_MUTED, fontSize: '10px', lineHeight: 1.5 }}>
              {sc.description}
            </div>
            {i >= builtinCount && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete scenario "${sc.name}"?`)) {
                    deleteCustomScenario(i - builtinCount);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: PANEL.TEXT_MUTED,
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 4px',
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = PANEL.DANGER)}
                onMouseLeave={(e) => (e.currentTarget.style.color = PANEL.TEXT_MUTED)}
                title="Delete scenario"
              >
                x
              </button>
            )}
          </div>
        ))}

        {!showCreator && (
          <button
            onClick={() => setShowCreator(true)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: `1px dashed ${PANEL.BORDER}`,
              borderRadius: '6px',
              color: PANEL.TEXT_MUTED,
              fontSize: '10px',
              cursor: 'pointer',
              fontFamily: PANEL.FONT_MONO,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = PANEL.ACCENT_DIM)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = PANEL.BORDER)}
          >
            + NEW SCENARIO
          </button>
        )}
      </div>

      {showCreator && (
        <ScenarioCreator onClose={() => setShowCreator(false)} />
      )}
    </div>
  );
}
