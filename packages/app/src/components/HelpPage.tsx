import { useState } from 'react';
import { getCommandHelp, getCommandKeywords } from '@jzsim/command-parser';
import { PANEL } from '../styles/panel.js';
import { useUIStore } from '../store/ui-store.js';

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'how-to', title: 'How-To Guides' },
  { id: 'commands', title: 'Command Reference' },
  { id: 'concepts', title: 'Concepts' },
  { id: 'roadmap', title: 'Roadmap' },
] as const;

export function HelpPage() {
  const helpOpen = useUIStore((s) => s.helpOpen);
  const toggleHelp = useUIStore((s) => s.toggleHelp);
  const [activeSection, setActiveSection] = useState('overview');

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
        width: '200px',
        borderRight: `1px solid ${PANEL.BORDER}`,
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: PANEL.TEXT_PRIMARY, marginBottom: '16px' }}>
          JZSim Help
        </div>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: '6px 10px',
              background: activeSection === s.id ? 'rgba(68,136,255,0.1)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: activeSection === s.id ? PANEL.ACCENT : PANEL.TEXT_SECONDARY,
              fontSize: '11px',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: PANEL.FONT_MONO,
            }}
          >
            {s.title}
          </button>
        ))}
        <div style={{ flex: 1 }} />
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
        {activeSection === 'overview' && <OverviewSection />}
        {activeSection === 'getting-started' && <GettingStartedSection />}
        {activeSection === 'how-to' && <HowToSection />}
        {activeSection === 'commands' && <CommandsSection />}
        {activeSection === 'concepts' && <ConceptsSection />}
        {activeSection === 'roadmap' && <RoadmapSection />}
      </div>
    </div>
  );
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ color: PANEL.TEXT_PRIMARY, fontSize: '16px', marginBottom: '12px', fontWeight: 'bold' }}>{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: PANEL.TEXT_SECONDARY, fontSize: '12px', lineHeight: 1.7, marginBottom: '12px' }}>{children}</p>
);
const Code = ({ children }: { children: React.ReactNode }) => (
  <code style={{
    backgroundColor: 'rgba(68,136,255,0.08)',
    padding: '2px 6px',
    borderRadius: '3px',
    color: PANEL.ACCENT,
    fontSize: '11px',
  }}>{children}</code>
);
const Pre = ({ children }: { children: string }) => (
  <pre style={{
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: `1px solid ${PANEL.BORDER}`,
    borderRadius: '6px',
    padding: '12px',
    color: PANEL.TEXT_PRIMARY,
    fontSize: '11px',
    lineHeight: 1.6,
    overflow: 'auto',
    marginBottom: '12px',
  }}>{children}</pre>
);

function OverviewSection() {
  return (
    <>
      <H2>JZSim - Air Warfare Simulation</H2>
      <P>
        JZSim is a low-to-medium fidelity air warfare modeling and simulation tool.
        It provides a 2D map-based interface for creating, commanding, and observing
        military air scenarios with radar detection, combat, and mission management.
      </P>
      <P>
        The simulation uses an Entity Component System (ECS) architecture running in a
        Web Worker for real-time performance. Commands are issued via a Domain Specific
        Language (DSL) typed into the command console.
      </P>
      <H2>Key Features</H2>
      <ul style={{ color: PANEL.TEXT_SECONDARY, fontSize: '12px', lineHeight: 2, paddingLeft: '20px' }}>
        <li>Real-time simulation with adjustable time acceleration (1x-60x)</li>
        <li>Multiple aircraft types with realistic performance parameters</li>
        <li>Radar detection with radar equation and terrain masking</li>
        <li>SAM engagement and fighter-to-fighter combat</li>
        <li>Mission system (patrol, RTB, intercept, scramble)</li>
        <li>Munitions management with base inventory</li>
        <li>After Action Report with drill-down metrics</li>
        <li>Scenario creation and loading</li>
      </ul>
    </>
  );
}

function GettingStartedSection() {
  return (
    <>
      <H2>Getting Started</H2>
      <P>1. Open the left sidebar by clicking the hamburger menu icon</P>
      <P>2. Go to the <Code>SCN</Code> tab and click a scenario to load it</P>
      <P>3. Entities will appear on the map. Click one to inspect it.</P>
      <P>4. Press <Code>`</Code> (backtick) to open the command console</P>
      <P>5. Type commands to control entities. Try:</P>
      <Pre>{`STATUS EAGLE01
SET SPEED EAGLE01 600
PATROL EAGLE01 BETWEEN 27.5 127.0 AND 28.5 128.5`}</Pre>
      <P>6. Use the time controls in the status bar to pause, resume, or accelerate</P>
      <P>7. Check the <Code>RADAR</Code> tab to see detection data</P>
      <P>8. Check the <Code>AAR</Code> tab after some combat for after-action metrics</P>
    </>
  );
}

function HowToSection() {
  return (
    <>
      <H2>How-To Guides</H2>
      <H2>Spawn Entities</H2>
      <Pre>{`SPAWN F-15C EAGLE01 AT 26.35 127.77 ALT 25000 SIDE blue HEADING 0 SPEED 450
SPAWN AIRBASE KADENA AT 26.35 127.77 SIDE blue
SPAWN SA-10 GRUMBLE01 AT 29.5 129.0 SIDE red`}</Pre>

      <H2>Set Up Patrols</H2>
      <Pre>{`PATROL EAGLE01 BETWEEN 27.5 127.0 AND 28.5 128.5 AT 30000`}</Pre>

      <H2>Manage Munitions</H2>
      <Pre>{`LOAD MUNS ON ALL BASES LEVEL HIGH
ASSIGN EAGLE01 TO KADENA
ARM EAGLE01
ARM EAGLE01 WITH AIM-120 6`}</Pre>

      <H2>Combat Commands</H2>
      <Pre>{`ENGAGE EAGLE01
DISENGAGE EAGLE01
INTERCEPT EAGLE01 TARGET FLANKER01
ATTACK EAGLE01 TARGET GRUMBLE01`}</Pre>

      <H2>Navigation</H2>
      <Pre>{`FLY EAGLE01 TO 28.0 130.0 AT 30000 SPEED 500
SET HEADING EAGLE01 270
SET ALT EAGLE01 35000
RTB EAGLE01`}</Pre>
    </>
  );
}

function CommandsSection() {
  const keywords = getCommandKeywords();
  return (
    <>
      <H2>Command Reference</H2>
      <P>All commands are case-insensitive. Callsigns are case-insensitive.</P>
      <div style={{ borderTop: `1px solid ${PANEL.BORDER}` }}>
        {keywords.map((kw) => {
          const help = getCommandHelp(kw);
          return (
            <div key={kw} style={{
              padding: '10px 0',
              borderBottom: `1px solid ${PANEL.BORDER}`,
            }}>
              <div style={{ color: PANEL.ACCENT, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                {kw}
              </div>
              <div style={{ color: PANEL.TEXT_SECONDARY, fontSize: '11px', lineHeight: 1.5 }}>
                {help || 'No help available'}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ConceptsSection() {
  return (
    <>
      <H2>Concepts</H2>

      <H2>Entity Component System (ECS)</H2>
      <P>
        JZSim uses a Struct-of-Arrays ECS for high performance. Entities are integers,
        components are typed arrays (Float64Array), and systems iterate over component
        stores each tick. This allows the sim to scale to thousands of entities.
      </P>

      <H2>Tick Model</H2>
      <P>
        The simulation runs at a fixed 1-second timestep with an accumulator pattern.
        Wall-clock time is multiplied by the time multiplier (1x-60x) to determine how
        many simulation ticks to execute per frame. Maximum 10 ticks per frame to prevent
        spiral of death.
      </P>

      <H2>Radar Equation</H2>
      <P>
        Detection uses a simplified radar equation accounting for transmitter power, antenna
        gain, frequency, target RCS, and range. A spatial grid pre-filters candidates for
        efficiency. Detection probability increases with signal strength.
      </P>

      <H2>Mission States</H2>
      <P>
        Aircraft can be in these mission states: IDLE, ENROUTE, PATROL, LOITER, RTB,
        LANDED, INTERCEPT. The mission system manages state transitions and steering.
      </P>

      <H2>Munitions Flow</H2>
      <P>
        Bases hold munitions inventory. Aircraft are assigned to bases. The ARM command
        draws from base stock. On RTB/landing, unexpended munitions return to the base.
        Use LOAD MUNS to set base stockpiles with preset levels (STANDARD/HIGH/LOW).
      </P>
    </>
  );
}

function RoadmapSection() {
  return (
    <>
      <H2>Roadmap</H2>
      <ul style={{ color: PANEL.TEXT_SECONDARY, fontSize: '12px', lineHeight: 2.2, paddingLeft: '20px' }}>
        <li style={{ color: PANEL.SUCCESS }}>Phase 1-5: Foundation, Movement, Commands, Missions, Radar (DONE)</li>
        <li style={{ color: PANEL.SUCCESS }}>Phase 6: Combat - weapons, ATTACK, SAM sites, damage (DONE)</li>
        <li style={{ color: PANEL.SUCCESS }}>Phase 7: MUNS management, AAR, Mission Views, Parametrics, Help (DONE)</li>
        <li>Phase 8: AssemblyScript WASM batch radar (10k+ entity scale)</li>
        <li>Phase 9: NATO symbology (APP-6/MIL-STD-2525)</li>
        <li>Phase 10: Weather effects on radar and flight</li>
        <li>Phase 11: Scenario import/export (JSON)</li>
        <li>Phase 12: Multi-domain (naval, ground forces)</li>
        <li>Phase 13: Network play / shared scenarios</li>
      </ul>
    </>
  );
}
