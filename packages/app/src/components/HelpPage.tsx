import { useState, useMemo } from 'react';
import { PANEL } from '../styles/panel.js';
import { useUIStore } from '../store/ui-store.js';

// Tutorials
import { GettingStarted } from './docs/tutorials/GettingStarted.js';
import { FirstScenario } from './docs/tutorials/FirstScenario.js';
import { AirCombatBasics } from './docs/tutorials/AirCombatBasics.js';
import { UsingTheAPI } from './docs/tutorials/UsingTheAPI.js';

// How-To Guides
import { SpawnControl } from './docs/howto/SpawnControl.js';
import { SetUpPatrols } from './docs/howto/SetUpPatrols.js';
import { RunIntercept } from './docs/howto/RunIntercept.js';
import { ConfigureSAMs } from './docs/howto/ConfigureSAMs.js';
import { BaseOperations } from './docs/howto/BaseOperations.js';
import { BuildScenarios } from './docs/howto/BuildScenarios.js';
import { ParametricEditor } from './docs/howto/ParametricEditor.js';
import { ReadAAR } from './docs/howto/ReadAAR.js';

// Reference
import { CommandRef } from './docs/reference/CommandRef.js';
import { AircraftDB } from './docs/reference/AircraftDB.js';
import { WeaponsDB } from './docs/reference/WeaponsDB.js';
import { RadarSAMDB } from './docs/reference/RadarSAMDB.js';
import { APIReference } from './docs/reference/APIReference.js';
import { EntityProperties } from './docs/reference/EntityProperties.js';
import { KeyboardShortcuts } from './docs/reference/KeyboardShortcuts.js';

// Explanation
import { Architecture } from './docs/explanation/Architecture.js';
import { EngineExplained } from './docs/explanation/EngineExplained.js';
import { RadarModel } from './docs/explanation/RadarModel.js';
import { CombatModel } from './docs/explanation/CombatModel.js';
import { MissionSystem } from './docs/explanation/MissionSystem.js';
import { UnitsConversions } from './docs/explanation/UnitsConversions.js';

interface DocSection {
  id: string;
  title: string;
  component: () => JSX.Element;
}

interface DocCategory {
  id: string;
  label: string;
  icon: string;
  sections: DocSection[];
}

const DOC_CATEGORIES: DocCategory[] = [
  {
    id: 'tutorials',
    label: 'Tutorials',
    icon: '\u25B6',  // play triangle
    sections: [
      { id: 'getting-started', title: 'Getting Started', component: GettingStarted },
      { id: 'first-scenario', title: 'Your First Scenario', component: FirstScenario },
      { id: 'air-combat-basics', title: 'Air Combat Basics', component: AirCombatBasics },
      { id: 'using-the-api', title: 'Using the REST API', component: UsingTheAPI },
    ],
  },
  {
    id: 'howto',
    label: 'How-To Guides',
    icon: '\u2692',  // hammer and pick
    sections: [
      { id: 'spawn-control', title: 'Spawn & Control Aircraft', component: SpawnControl },
      { id: 'set-up-patrols', title: 'Set Up Patrols', component: SetUpPatrols },
      { id: 'run-intercept', title: 'Run an Intercept', component: RunIntercept },
      { id: 'configure-sams', title: 'Configure SAM Sites', component: ConfigureSAMs },
      { id: 'base-operations', title: 'Manage Base Operations', component: BaseOperations },
      { id: 'build-scenarios', title: 'Build Custom Scenarios', component: BuildScenarios },
      { id: 'parametric-editor', title: 'Use the Parametric Editor', component: ParametricEditor },
      { id: 'read-aar', title: 'Read the After Action Report', component: ReadAAR },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    icon: '\u2630',  // trigram
    sections: [
      { id: 'command-ref', title: 'Command Reference', component: CommandRef },
      { id: 'aircraft-db', title: 'Aircraft Database', component: AircraftDB },
      { id: 'weapons-db', title: 'Weapons Database', component: WeaponsDB },
      { id: 'radar-sam-db', title: 'Radar & SAM Database', component: RadarSAMDB },
      { id: 'api-reference', title: 'API Reference', component: APIReference },
      { id: 'entity-properties', title: 'Entity Properties', component: EntityProperties },
      { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts', component: KeyboardShortcuts },
    ],
  },
  {
    id: 'explanation',
    label: 'Explanation',
    icon: '\u2139',  // info
    sections: [
      { id: 'architecture', title: 'Architecture Overview', component: Architecture },
      { id: 'engine-explained', title: 'How the Sim Engine Works', component: EngineExplained },
      { id: 'radar-model', title: 'Radar & Detection Model', component: RadarModel },
      { id: 'combat-model', title: 'Combat & Damage Model', component: CombatModel },
      { id: 'mission-system', title: 'Mission System', component: MissionSystem },
      { id: 'units-conversions', title: 'Units & Conversions', component: UnitsConversions },
    ],
  },
];

// Build a flat lookup for active section
const ALL_SECTIONS = DOC_CATEGORIES.flatMap((cat) => cat.sections);

export function HelpPage() {
  const helpOpen = useUIStore((s) => s.helpOpen);
  const toggleHelp = useUIStore((s) => s.toggleHelp);
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchFilter.trim()) return DOC_CATEGORIES;
    const q = searchFilter.toLowerCase();
    return DOC_CATEGORIES
      .map((cat) => ({
        ...cat,
        sections: cat.sections.filter((s) => s.title.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.sections.length > 0);
  }, [searchFilter]);

  const ActiveComponent = useMemo(() => {
    const section = ALL_SECTIONS.find((s) => s.id === activeSection);
    return section?.component ?? GettingStarted;
  }, [activeSection]);

  if (!helpOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 5, 12, 0.95)',
      backdropFilter: 'blur(8px)',
      zIndex: 200,
      display: 'flex',
      fontFamily: PANEL.FONT_MONO,
    }}>
      {/* Sidebar nav */}
      <div style={{
        width: '240px',
        minWidth: '240px',
        borderRight: `1px solid ${PANEL.BORDER}`,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: PANEL.TEXT_PRIMARY,
          marginBottom: '12px',
          padding: '0 6px',
        }}>
          JZSim Docs
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Filter sections..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: `1px solid ${PANEL.BORDER}`,
            borderRadius: '4px',
            color: PANEL.TEXT_PRIMARY,
            fontSize: '11px',
            fontFamily: PANEL.FONT_MONO,
            outline: 'none',
            marginBottom: '14px',
            boxSizing: 'border-box',
          }}
        />

        {/* Category nav */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredCategories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '12px' }}>
              {/* Category header - non-clickable label */}
              <div style={{
                padding: '4px 6px',
                fontSize: '9px',
                fontWeight: 'bold',
                color: PANEL.TEXT_MUTED,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '2px',
                userSelect: 'none',
              }}>
                <span style={{ marginRight: '6px' }}>{cat.icon}</span>
                {cat.label}
              </div>

              {/* Section buttons */}
              {cat.sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '5px 10px 5px 18px',
                    background: activeSection === s.id ? 'rgba(68,136,255,0.1)' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    borderLeft: activeSection === s.id ? `2px solid ${PANEL.ACCENT}` : '2px solid transparent',
                    color: activeSection === s.id ? PANEL.ACCENT : PANEL.TEXT_SECONDARY,
                    fontSize: '11px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: PANEL.FONT_MONO,
                    lineHeight: 1.5,
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div style={{
              color: PANEL.TEXT_MUTED,
              fontSize: '11px',
              padding: '10px 6px',
            }}>
              No sections match "{searchFilter}"
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={toggleHelp}
          style={{
            padding: '8px',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${PANEL.BORDER}`,
            borderRadius: '4px',
            color: PANEL.TEXT_MUTED,
            fontSize: '10px',
            cursor: 'pointer',
            fontFamily: PANEL.FONT_MONO,
            marginTop: '8px',
          }}
        >
          Close (F1)
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px 40px',
        maxWidth: '800px',
      }}>
        <ActiveComponent />
      </div>
    </div>
  );
}
