import { H2, H3, P, Code, Pre, Note, Tag } from '../styles.js';

export function BaseOperations() {
  return (
    <>
      <Tag variant="default">How-To</Tag>
      <H2>Manage Base Operations</H2>
      <P>
        Airbases serve as home stations for aircraft. They hold munitions inventory and
        provide a destination for RTB. This guide covers base creation, assignment, and
        arming procedures.
      </P>

      <H3>Spawn an airbase</H3>
      <Pre>{`SPAWN AIRBASE <callsign> AT <lat> <lon> SIDE <blue|red>`}</Pre>
      <Pre>{'SPAWN AIRBASE KADENA AT 26.35 127.77 SIDE blue'}</Pre>

      <H3>Assign aircraft to base</H3>
      <P>
        Aircraft must be assigned to a base before they can draw munitions or RTB.
      </P>
      <Pre>{'ASSIGN EAGLE01 TO KADENA'}</Pre>

      <H3>Load base munitions</H3>
      <P>
        Set the munitions inventory level for all bases at once. There are three
        preset levels:
      </P>
      <Pre>{`LOAD MUNS ON ALL BASES LEVEL HIGH       (maximum stockpile)
LOAD MUNS ON ALL BASES LEVEL STANDARD   (normal stockpile)
LOAD MUNS ON ALL BASES LEVEL LOW        (minimal stockpile)`}</Pre>
      <P>
        Preset levels determine how many of each weapon type are available at each base.
        Aircraft draw from this pool when armed.
      </P>

      <H3>Arm aircraft</H3>
      <P>
        The ARM command loads weapons from the assigned base onto the aircraft.
      </P>
      <Pre>{'ARM EAGLE01'}</Pre>
      <P>
        This loads the default loadout for the aircraft type (for example, an F-15C gets
        4x AIM-120 and 4x AIM-9). The weapons are deducted from the base inventory.
      </P>

      <H3>Custom loadout</H3>
      <P>
        You can specify a weapon type and count for custom loadouts:
      </P>
      <Pre>{'ARM EAGLE01 WITH AIM-120 6'}</Pre>
      <P>
        This loads 6 AIM-120 missiles onto EAGLE01, drawing from the base inventory.
        The request will be reduced if the base does not have enough stock.
      </P>

      <H3>Munitions recovery on landing</H3>
      <P>
        When an aircraft RTBs and lands, any unexpended munitions are returned to the
        base inventory. This means you do not lose unused weapons when recovering aircraft.
      </P>

      <Note>
        If you arm an aircraft that is not assigned to any base, the command will fail.
        Always <Code>ASSIGN</Code> before <Code>ARM</Code>.
      </Note>
    </>
  );
}
