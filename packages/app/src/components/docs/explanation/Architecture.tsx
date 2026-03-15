import { H2, H3, P, Code, Pre, Note, Tag } from '../styles.js';

export function Architecture() {
  return (
    <>
      <Tag variant="technical">Technical</Tag>
      <H2>Architecture Overview</H2>
      <P>
        JZSim is a TypeScript monorepo using npm workspaces. The codebase is split into
        four packages, each with a distinct responsibility. The simulation engine runs in a
        Web Worker for real-time performance, communicating with the React UI via
        SharedArrayBuffer for zero-copy entity synchronization.
      </P>

      <H3>Package structure</H3>
      <Pre>{`packages/
  core/       — Types, geo math, unit conversions, radar equation, aircraft/weapon defaults
  engine/     — World, ComponentStore, EntityAllocator, systems, CommandBus, Web Worker
  command-parser/ — Token-based DSL parser (text commands → Command objects)
  app/        — React UI, Zustand state management, MapLibre GL map rendering
  server/     — REST API server (headless engine for programmatic access)`}</Pre>

      <H3>packages/core</H3>
      <P>
        Shared foundation with no runtime dependencies. Contains TypeScript types for all
        components, events, and commands. Includes geographic math (haversine distance,
        bearing calculations), unit conversion functions (feet/meters, knots/m/s, lbs/kg),
        the radar equation implementation, and default performance data for all aircraft,
        weapons, radars, and SAM sites.
      </P>

      <H3>packages/engine</H3>
      <P>
        The simulation kernel. Built on an Entity Component System (ECS) pattern using
        Struct-of-Arrays storage (Float64Array typed arrays) for cache-friendly iteration.
        The World class manages entity lifecycle. Systems run each tick in a fixed order.
        The engine runs inside a Web Worker to keep the UI thread responsive.
      </P>

      <H3>packages/command-parser</H3>
      <P>
        A token-based parser that converts text commands (like SPAWN, FLY, ENGAGE) into
        structured Command objects. The parser handles case-insensitivity, keyword matching,
        coordinate parsing, and error reporting. Each parsed command is dispatched to the
        engine via the CommandBus.
      </P>

      <H3>packages/app</H3>
      <P>
        The browser-based UI built with React and Vite. Uses Zustand for state management.
        MapLibre GL JS renders the 2D map with CARTO dark vector tiles. The app reads
        entity positions from a SharedArrayBuffer filled by the engine Worker, so there is
        no serialization overhead for the main rendering loop.
      </P>

      <H3>Data flow</H3>
      <Pre>{`User types command
  → command-parser → Command object
  → postMessage to Worker
  → CommandBus dispatches to World
  → World mutates component stores
  → Systems tick (Movement, Fuel, Radar, SAM, Fighter, Weapon)
  → SharedArrayBuffer updated with entity positions
  → React reads SharedArrayBuffer on animation frame
  → MapLibre renders entity markers on map`}</Pre>

      <H3>SharedArrayBuffer layout</H3>
      <P>
        The shared buffer has an 8-float64 header followed by 8 float64 values per entity:
      </P>
      <Pre>{`Header (8 x f64):
  [0] entityCount
  [1-7] reserved

Per entity (8 x f64):
  [0] id
  [1] lat
  [2] lon
  [3] alt
  [4] heading
  [5] speed
  [6] modelType
  [7] side`}</Pre>

      <Note>
        COOP/COEP headers are required for SharedArrayBuffer to work in browsers. These
        are configured in the Vite dev server config via custom headers.
      </Note>
    </>
  );
}
