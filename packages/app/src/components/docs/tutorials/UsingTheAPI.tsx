import { H2, H3, P, Code, Pre, Note, Tag, Step } from '../styles.js';

export function UsingTheAPI() {
  return (
    <>
      <Tag variant="technical">Technical</Tag>
      <H2>Using the REST API</H2>
      <P>
        JZSim includes a headless server with a REST API that lets you control the
        simulation programmatically. This tutorial covers starting the server, sending
        commands, and querying entity state.
      </P>

      <H3>Start the API server</H3>
      <Step n={1}>
        From the project root, start the headless server. It runs the same sim engine
        without the browser UI.
      </Step>
      <Pre>{'npm run server'}</Pre>
      <P>
        The server starts on port 3001 by default. You will see a message confirming
        the port in the terminal.
      </P>

      <H3>Check simulation status</H3>
      <Step n={2}>
        Query the current simulation state with a GET request.
      </Step>
      <Pre>{`GET /api/sim

Response:
{
  "tick": 0,
  "running": true,
  "timeMultiplier": 1,
  "entityCount": 0
}`}</Pre>

      <H3>Send commands</H3>
      <Step n={3}>
        Send the same DSL commands you would type in the browser console, via POST.
      </Step>
      <Pre>{`POST /api/sim/command
Content-Type: application/json

{
  "command": "SPAWN F-15C EAGLE01 AT 26.35 127.77 ALT 25000 SIDE blue"
}`}</Pre>
      <P>
        The response confirms command execution. Any parse errors are returned as
        400 status codes with an error message.
      </P>

      <H3>Query aircraft</H3>
      <Step n={4}>
        List all aircraft in the simulation.
      </Step>
      <Pre>{`GET /api/aircraft

Response:
[
  {
    "callsign": "EAGLE01",
    "type": "F-15C",
    "lat": 26.35,
    "lon": 127.77,
    "alt": 7620,
    "heading": 0,
    "speed": 231.5,
    "side": "blue",
    "missionState": "IDLE"
  }
]`}</Pre>

      <H3>Get entity detail</H3>
      <Step n={5}>
        Query a specific entity by callsign for full details including fuel, weapons,
        and mission state.
      </Step>
      <Pre>{`GET /api/aircraft/EAGLE01`}</Pre>

      <H3>Historical data</H3>
      <Step n={6}>
        Retrieve the position history of an entity for track reconstruction and analysis.
      </Step>
      <Pre>{`GET /api/aircraft/EAGLE01/history

Response:
[
  { "tick": 0, "lat": 26.35, "lon": 127.77, "alt": 7620 },
  { "tick": 1, "lat": 26.3501, "lon": 127.77, "alt": 7620 },
  ...
]`}</Pre>

      <H3>Control simulation flow</H3>
      <P>
        Additional endpoints let you pause, resume, and change time acceleration:
      </P>
      <Pre>{`POST /api/sim/pause
POST /api/sim/resume
POST /api/sim/speed   { "multiplier": 10 }`}</Pre>

      <Note>
        The API server runs the engine in the same process (no Web Worker). Performance
        characteristics may differ from the browser version at high entity counts.
      </Note>
    </>
  );
}
