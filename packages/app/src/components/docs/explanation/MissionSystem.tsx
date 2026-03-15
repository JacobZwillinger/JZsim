import { H2, H3, P, Code, Pre, Note, Tag } from '../styles.js';

export function MissionSystem() {
  return (
    <>
      <Tag variant="technical">Technical</Tag>
      <H2>Mission System</H2>
      <P>
        The mission system manages what each aircraft is doing at any given time. It
        implements a finite state machine with well-defined transitions between mission
        states. The MissionSystem runs first in the tick order, setting waypoints and
        headings that the MovementSystem then executes.
      </P>

      <H3>Mission states</H3>
      <Pre>{`IDLE        No active orders. Aircraft holds heading and speed.
ENROUTE     Flying toward a waypoint (patrol point, base, target).
PATROL      Actively patrolling between two waypoints.
LOITER      Circling at a point (holding pattern).
RTB         Returning to assigned base.
LANDED      On the ground at base. Not moving.
INTERCEPT   Flying toward a hostile target.
SEAD        Suppression of enemy air defense mission.
REFUELING   Receiving fuel from a tanker aircraft.`}</Pre>

      <H3>State transitions</H3>
      <P>
        Transitions are triggered by commands and by reaching waypoints:
      </P>
      <Pre>{`SCRAMBLE command:
  LANDED → ENROUTE (climbing to default altitude)

PATROL command:
  any → ENROUTE (toward first patrol point)
  arrival at WP1 → PATROL
  arrival at WP2 → PATROL (reverses direction)

RTB command:
  any → ENROUTE (toward assigned base)
  arrival at base → LANDED

INTERCEPT command:
  any → INTERCEPT (continuous pursuit of target)
  target destroyed → IDLE

FLY TO command:
  any → ENROUTE (toward specified coordinates)
  arrival → IDLE`}</Pre>

      <H3>Waypoint navigation</H3>
      <P>
        When an aircraft has a waypoint, the MissionSystem computes the great-circle
        bearing from the aircraft's current position to the waypoint using the haversine
        formula. It then sets the aircraft's desired heading to that bearing. The
        MovementSystem handles the actual turn (subject to turn rate limits) and
        position update.
      </P>

      <H3>Arrival detection</H3>
      <P>
        An aircraft is considered to have arrived at a waypoint when its distance to
        the waypoint is less than the arrival radius (approximately 2 km). This generous
        radius prevents oscillation around the waypoint and accounts for the fact that
        aircraft at high speed need lead distance to turn.
      </P>

      <H3>Patrol behavior</H3>
      <P>
        In patrol mode, the aircraft oscillates between two waypoints. When it arrives
        at one waypoint, the MissionSystem swaps the active waypoint to the other end
        of the patrol track. The aircraft then turns and flies back. This continues
        indefinitely until interrupted by a new command.
      </P>

      <H3>Map marker labels</H3>
      <P>
        The mission state is shown as a tag on the entity's map marker label:
      </P>
      <Pre>{`[ENR] — Enroute       [PAT] — Patrol
[RTB] — Return to Base [LDN] — Landed
[INT] — Intercept      [IDL] — Idle`}</Pre>

      <Note>
        Mission state and combat engagement are independent systems. An aircraft can be
        in PATROL state while also in ENGAGE mode. The engagement system overrides heading
        when a target is within range, but the mission state remains PATROL.
      </Note>
    </>
  );
}
