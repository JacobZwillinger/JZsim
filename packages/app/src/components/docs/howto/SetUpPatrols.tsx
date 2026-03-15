import { H2, H3, P, Code, Pre, Note, Tag } from '../styles.js';

export function SetUpPatrols() {
  return (
    <>
      <Tag variant="default">How-To</Tag>
      <H2>Set Up Patrols</H2>
      <P>
        The PATROL command sends an aircraft to fly a racetrack pattern between two
        geographic points at a specified altitude.
      </P>

      <H3>PATROL syntax</H3>
      <Pre>{`PATROL <callsign> BETWEEN <lat1> <lon1> AND <lat2> <lon2> [AT <altitude_ft>]`}</Pre>

      <H3>Example</H3>
      <Pre>{'PATROL EAGLE01 BETWEEN 27.5 127.0 AND 28.5 128.5 AT 30000'}</Pre>
      <P>
        EAGLE01 will fly to the first waypoint (27.5, 127.0), then to the second waypoint
        (28.5, 128.5), then back to the first, and so on indefinitely. If <Code>AT</Code> is
        specified, the aircraft climbs or descends to that altitude.
      </P>

      <H3>How patrol works</H3>
      <P>
        When you issue a PATROL command, the mission state transitions through these phases:
      </P>
      <Pre>{`IDLE → ENROUTE (flying to first waypoint)
     → PATROL (reached first waypoint, now oscillating)
     → PATROL continues until RTB or new orders`}</Pre>
      <P>
        The map marker label updates to show <Code>[ENR]</Code> during transit
        and <Code>[PAT]</Code> once patrol begins.
      </P>

      <H3>Recall with RTB</H3>
      <P>
        To recall a patrolling aircraft back to its assigned base:
      </P>
      <Pre>{'RTB EAGLE01'}</Pre>
      <P>
        The mission state changes to RTB and the aircraft navigates to its assigned
        airbase. Once it arrives, the state becomes LANDED.
      </P>

      <Note>
        An aircraft must be assigned to a base (via <Code>ASSIGN</Code>) before RTB
        will work. If the aircraft has no assigned base, RTB has nowhere to go.
      </Note>
    </>
  );
}
