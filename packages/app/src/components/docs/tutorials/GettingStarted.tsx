import { H2, H3, P, Code, Pre, Note, Tag, Step } from '../styles.js';

export function GettingStarted() {
  return (
    <>
      <Tag variant="beginner">Beginner</Tag>
      <H2>Getting Started</H2>
      <P>
        This tutorial walks you through the JZSim interface from first launch.
        By the end, you will know how to load a scenario, read the map, issue commands,
        and control simulation time.
      </P>

      <H3>What you see on first load</H3>
      <Step n={1}>
        <strong style={{ color: '#e0e0e0' }}>The Map</strong> fills the screen. It is a dark
        2D map powered by MapLibre GL using CARTO vector tiles. This is your primary view of
        the battlespace. Blue markers are friendly entities, red markers are hostile, and grey
        markers are neutral.
      </Step>
      <Step n={2}>
        <strong style={{ color: '#e0e0e0' }}>The Icon Rail</strong> is on the far left edge.
        It contains six icons for the sidebar panels: Order of Battle (OOB), Scenarios,
        Radar, Missions, After Action Report (AAR), and Parametric Data. Click any icon to
        open that panel.
      </Step>
      <Step n={3}>
        <strong style={{ color: '#e0e0e0' }}>The Status Bar</strong> runs along the bottom.
        It shows the current simulation time, time multiplier, and play/pause controls.
      </Step>

      <H3>Load a scenario</H3>
      <Step n={4}>
        Click the <Code>SCN</Code> icon in the sidebar (second icon from top). A list of
        built-in scenarios appears. Click any scenario name to load it. Entities will spawn
        on the map immediately.
      </Step>

      <H3>Read the map</H3>
      <Step n={5}>
        Each entity on the map is a triangle marker with a callsign label.
        The label shows the callsign and, if on a mission, a state tag
        like <Code>[PAT]</Code> for patrol or <Code>[RTB]</Code> for return to base.
        Blue markers are your side. Red markers are the enemy.
      </Step>

      <H3>Open the command console</H3>
      <Step n={6}>
        Press the backtick key <Code>`</Code> to open the command console at the bottom of
        the screen. This is where you type all commands to control entities.
        Press <Code>`</Code> again or <Code>Escape</Code> to close it.
      </Step>

      <H3>Your first command</H3>
      <Step n={7}>
        With the console open, type <Code>STATUS EAGLE01</Code> and press Enter.
        The console will print the current state of that entity: position, altitude, speed,
        heading, fuel, mission state, and weapons loadout. If EAGLE01 does not exist in
        the current scenario, try <Code>HELP</Code> to see available commands.
      </Step>
      <Pre>{'STATUS EAGLE01'}</Pre>

      <H3>Control time</H3>
      <Step n={8}>
        The time controls in the status bar let you pause and resume the simulation.
        Click the speed indicator to cycle through time multipliers: 1x, 2x, 5x, 10x, 30x,
        and 60x real time. At 60x, one minute of wall-clock time equals one hour of
        simulation time.
      </Step>

      <H3>Inspect an entity</H3>
      <Step n={9}>
        Click any entity marker on the map. The Entity Inspector panel opens, showing
        detailed information about that entity. You can also click an entity name in the
        OOB sidebar panel to inspect it.
      </Step>

      <Note>
        If the map tiles appear black on first load, refresh the page. This is a known
        tile-loading race condition with the CARTO basemap.
      </Note>
    </>
  );
}
