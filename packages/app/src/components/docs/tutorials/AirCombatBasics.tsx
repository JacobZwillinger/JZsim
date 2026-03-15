import { H2, H3, P, Code, Pre, Note, Tag, Step } from '../styles.js';

export function AirCombatBasics() {
  return (
    <>
      <Tag variant="beginner">Beginner</Tag>
      <H2>Air Combat Basics</H2>
      <P>
        This tutorial walks you through setting up and observing an air-to-air engagement.
        You will spawn opposing forces, use intercept and engagement commands, and review
        the results in the After Action Report.
      </P>

      <H3>Set up blue force</H3>
      <Step n={1}>
        Spawn two blue fighters heading north. Arm them for combat.
      </Step>
      <Pre>{`SPAWN AIRBASE HOMEPLATE AT 25.0 127.0 SIDE blue
SPAWN F-15C EAGLE01 AT 25.5 127.0 ALT 30000 SIDE blue HEADING 0 SPEED 500
SPAWN F-15C EAGLE02 AT 25.5 127.2 ALT 30000 SIDE blue HEADING 0 SPEED 500
ASSIGN EAGLE01 TO HOMEPLATE
ASSIGN EAGLE02 TO HOMEPLATE
ARM EAGLE01
ARM EAGLE02`}</Pre>

      <H3>Set up red force</H3>
      <Step n={2}>
        Spawn two red fighters heading south towards the blue flight.
      </Step>
      <Pre>{`SPAWN Su-30 FLANKER01 AT 27.5 127.0 ALT 28000 SIDE red HEADING 180 SPEED 500
SPAWN Su-30 FLANKER02 AT 27.5 127.2 ALT 28000 SIDE red HEADING 180 SPEED 500`}</Pre>

      <H3>Understand engagement modes</H3>
      <Step n={3}>
        JZSim has three engagement-related commands:
      </Step>
      <P>
        <Code>INTERCEPT</Code> commands an aircraft to fly towards a specific target.
        The aircraft will navigate to close distance but does not automatically fire.
      </P>
      <P>
        <Code>ENGAGE</Code> puts an aircraft into automatic engagement mode. It will fire
        weapons at any hostile target within range.
      </P>
      <P>
        <Code>DISENGAGE</Code> takes an aircraft out of engagement mode. It stops firing
        and returns to its previous mission state.
      </P>

      <H3>Send an intercept</H3>
      <Step n={4}>
        Order EAGLE01 to intercept FLANKER01. The fighter will turn towards the target
        and close range.
      </Step>
      <Pre>{'INTERCEPT EAGLE01 TARGET FLANKER01'}</Pre>

      <H3>Enable auto-engagement</H3>
      <Step n={5}>
        Enable engagement mode on both blue fighters so they fire when targets are
        within weapon range.
      </Step>
      <Pre>{`ENGAGE EAGLE01
ENGAGE EAGLE02`}</Pre>

      <H3>Observe the engagement</H3>
      <Step n={6}>
        Speed up time to 5x or 10x and watch the engagement unfold. You will see weapon
        markers appear as missiles are fired. When a missile hits, the target takes damage.
        At zero HP, the entity is destroyed and removed from the map.
      </Step>

      <H3>Review results</H3>
      <Step n={7}>
        Open the <Code>AAR</Code> tab to see combat results: kills scored, losses taken,
        and munitions expended by each aircraft. Click individual entities for a detailed
        breakdown of weapon usage.
      </Step>

      <Note>
        The red Su-30s do not automatically engage unless you issue ENGAGE commands for them.
        To create a fully autonomous fight on both sides, issue ENGAGE for all four aircraft.
      </Note>

      <H3>Break off</H3>
      <Step n={8}>
        To stop an aircraft from shooting, use DISENGAGE:
      </Step>
      <Pre>{'DISENGAGE EAGLE01'}</Pre>
      <P>
        The aircraft will stop targeting hostiles and revert to its previous mission state
        (patrol, loiter, or idle).
      </P>
    </>
  );
}
