import { H2, H3, P, Pre, Note, Tag, Table, Th, Td } from '../styles.js';
import { PANEL } from '../../../styles/panel.js';

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  const methodColor = method === 'GET' ? PANEL.SUCCESS : PANEL.WARNING;
  return (
    <tr>
      <Td style={{ color: methodColor, fontWeight: 'bold' }}>{method}</Td>
      <Td style={{ color: PANEL.ACCENT }}>{path}</Td>
      <Td>{desc}</Td>
    </tr>
  );
}

export function APIReference() {
  return (
    <>
      <Tag variant="technical">Technical</Tag>
      <H2>API Reference</H2>
      <P>
        The JZSim REST API is served by the headless server package. All endpoints return
        JSON. Start the server with <code style={{ color: PANEL.ACCENT }}>npm run server</code>.
      </P>

      <H3>Simulation Control</H3>
      <Table>
        <thead>
          <tr><Th>Method</Th><Th>Path</Th><Th>Description</Th></tr>
        </thead>
        <tbody>
          <Endpoint method="GET" path="/api/sim" desc="Get simulation status (tick, running, timeMultiplier, entityCount)" />
          <Endpoint method="POST" path="/api/sim/pause" desc="Pause the simulation" />
          <Endpoint method="POST" path="/api/sim/resume" desc="Resume the simulation" />
          <Endpoint method="POST" path="/api/sim/speed" desc="Set time multiplier. Body: { multiplier: number }" />
          <Endpoint method="POST" path="/api/sim/command" desc="Execute a DSL command. Body: { command: string }" />
        </tbody>
      </Table>

      <H3>Entity Queries</H3>
      <Table>
        <thead>
          <tr><Th>Method</Th><Th>Path</Th><Th>Description</Th></tr>
        </thead>
        <tbody>
          <Endpoint method="GET" path="/api/entities" desc="List all entities with position, type, side" />
          <Endpoint method="GET" path="/api/entities/:callsign" desc="Get full entity details by callsign" />
          <Endpoint method="GET" path="/api/entities/:callsign/history" desc="Get position history for track reconstruction" />
        </tbody>
      </Table>

      <H3>Typed Entity Queries</H3>
      <Table>
        <thead>
          <tr><Th>Method</Th><Th>Path</Th><Th>Description</Th></tr>
        </thead>
        <tbody>
          <Endpoint method="GET" path="/api/aircraft" desc="List all aircraft entities" />
          <Endpoint method="GET" path="/api/aircraft/:callsign" desc="Get aircraft detail by callsign" />
          <Endpoint method="GET" path="/api/radars" desc="List all radar entities" />
          <Endpoint method="GET" path="/api/sams" desc="List all SAM site entities" />
          <Endpoint method="GET" path="/api/bases" desc="List all airbase entities" />
          <Endpoint method="GET" path="/api/weapons" desc="List all in-flight weapon entities" />
        </tbody>
      </Table>

      <H3>Events</H3>
      <Table>
        <thead>
          <tr><Th>Method</Th><Th>Path</Th><Th>Description</Th></tr>
        </thead>
        <tbody>
          <Endpoint method="GET" path="/api/events" desc="Get recent simulation events (detections, engagements, kills)" />
        </tbody>
      </Table>

      <H3>Scenarios</H3>
      <Table>
        <thead>
          <tr><Th>Method</Th><Th>Path</Th><Th>Description</Th></tr>
        </thead>
        <tbody>
          <Endpoint method="GET" path="/api/scenarios" desc="List available scenarios" />
          <Endpoint method="POST" path="/api/scenarios/:name/load" desc="Load a scenario by name" />
        </tbody>
      </Table>

      <H3>Defaults</H3>
      <Table>
        <thead>
          <tr><Th>Method</Th><Th>Path</Th><Th>Description</Th></tr>
        </thead>
        <tbody>
          <Endpoint method="GET" path="/api/defaults/aircraft" desc="Get aircraft performance defaults" />
          <Endpoint method="GET" path="/api/defaults/weapons" desc="Get weapon performance defaults" />
          <Endpoint method="GET" path="/api/defaults/radars" desc="Get radar parameter defaults" />
          <Endpoint method="GET" path="/api/defaults/sams" desc="Get SAM site configuration defaults" />
        </tbody>
      </Table>

      <H3>Example: send a command</H3>
      <Pre>{`curl -X POST http://localhost:3001/api/sim/command \\
  -H "Content-Type: application/json" \\
  -d '{"command": "SPAWN F-15C EAGLE01 AT 26.35 127.77 ALT 25000 SIDE blue"}'`}</Pre>

      <Note>
        All POST endpoints that accept a body expect Content-Type: application/json.
        Error responses return a 400 status with a JSON body containing an error message.
      </Note>
    </>
  );
}
