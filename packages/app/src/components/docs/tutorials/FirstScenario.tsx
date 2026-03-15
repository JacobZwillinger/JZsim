import { H2, H3, P, Code, Pre, Note, Tag, Step } from '../styles.js';

export function FirstScenario() {
  return (
    <>
      <Tag variant="beginner">Beginner</Tag>
      <H2>Your First Scenario</H2>
      <P>
        In this tutorial you will build a complete patrol mission from scratch using the
        command console. You will spawn an airbase, launch fighters, set up a patrol orbit,
        arm them with weapons, and observe the results.
      </P>

      <H3>Spawn an airbase</H3>
      <Step n={1}>
        Open the command console with <Code>`</Code> and create an airbase. This gives your
        aircraft a home for rearming, refueling, and RTB operations.
      </Step>
      <Pre>{'SPAWN AIRBASE KADENA AT 26.35 127.77 SIDE blue'}</Pre>
      <P>
        The airbase appears on the map at the specified latitude and longitude.
        KADENA is the callsign you assign. SIDE determines its allegiance.
      </P>

      <H3>Spawn your first fighter</H3>
      <Step n={2}>
        Spawn an F-15C at the airbase location. Altitude is in feet and speed in knots.
      </Step>
      <Pre>{'SPAWN F-15C EAGLE01 AT 26.35 127.77 ALT 25000 SIDE blue HEADING 0 SPEED 450'}</Pre>

      <H3>Spawn a wingman</H3>
      <Step n={3}>
        Spawn a second F-15C to form a flight of two.
      </Step>
      <Pre>{'SPAWN F-15C EAGLE02 AT 26.35 127.77 ALT 25000 SIDE blue HEADING 0 SPEED 450'}</Pre>

      <H3>Set up patrol</H3>
      <Step n={4}>
        Command EAGLE01 to patrol between two waypoints at 30,000 feet. The aircraft will
        fly back and forth between the two coordinate pairs indefinitely.
      </Step>
      <Pre>{'PATROL EAGLE01 BETWEEN 27.5 127.0 AND 28.5 128.5 AT 30000'}</Pre>
      <P>
        The entity label on the map will change to show <Code>[ENR]</Code> (enroute),
        then <Code>[PAT]</Code> once it reaches the first waypoint.
      </P>

      <H3>Assign to base and arm</H3>
      <Step n={5}>
        Assign the fighter to the airbase so it can draw munitions from its inventory.
      </Step>
      <Pre>{'ASSIGN EAGLE01 TO KADENA'}</Pre>

      <Step n={6}>
        Arm the aircraft. This loads the default weapon loadout (AIM-120 and AIM-9 missiles)
        from the base inventory onto the aircraft.
      </Step>
      <Pre>{'ARM EAGLE01'}</Pre>

      <H3>Accelerate and observe</H3>
      <Step n={7}>
        Click the time multiplier in the status bar to speed up to 10x or 30x.
        Watch EAGLE01 fly its patrol route on the map. The callsign label tracks its
        mission state.
      </Step>

      <H3>Check the After Action Report</H3>
      <Step n={8}>
        Click the <Code>AAR</Code> icon in the sidebar to open the After Action Report.
        It shows aggregate metrics like total fuel burned, munitions expended, kills, and
        losses. Click on an individual entity for a detailed breakdown.
      </Step>

      <Note>
        Repeat the PATROL and ARM commands for EAGLE02 to put both fighters on patrol.
        You can also do <Code>PATROL EAGLE02 BETWEEN 27.0 126.5 AND 28.0 127.5 AT 30000</Code> to
        set up a different patrol route.
      </Note>
    </>
  );
}
