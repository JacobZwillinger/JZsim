import { H2, H3, P, Code, Pre, Note, Tag } from '../styles.js';

export function RunIntercept() {
  return (
    <>
      <Tag variant="default">How-To</Tag>
      <H2>Run an Intercept</H2>
      <P>
        This guide covers the sequence of commands needed to scramble a fighter, vector it
        toward a hostile contact, and prosecute the engagement.
      </P>

      <H3>Scramble from base</H3>
      <P>
        If your aircraft is on the ground at an assigned base, use SCRAMBLE to launch it
        with a default altitude and heading:
      </P>
      <Pre>{'SCRAMBLE EAGLE01'}</Pre>
      <P>
        The aircraft transitions from LANDED to ENROUTE, climbing to a default intercept
        altitude. You can follow up with SET ALT or SET SPEED to adjust.
      </P>

      <H3>Vector toward target</H3>
      <P>
        Use INTERCEPT to fly directly toward a specific hostile entity:
      </P>
      <Pre>{'INTERCEPT EAGLE01 TARGET FLANKER01'}</Pre>
      <P>
        The aircraft will compute a bearing to the target and continuously adjust heading
        to close distance. The mission state changes to INTERCEPT.
      </P>

      <H3>Enable engagement</H3>
      <P>
        INTERCEPT only navigates. To authorize weapons release, issue ENGAGE:
      </P>
      <Pre>{'ENGAGE EAGLE01'}</Pre>
      <P>
        In engagement mode, the aircraft automatically fires weapons at any hostile target
        within weapon range. It will prioritize the closest threat.
      </P>

      <H3>Break off</H3>
      <P>
        To stop attacking and break off the engagement:
      </P>
      <Pre>{'DISENGAGE EAGLE01'}</Pre>
      <P>
        The aircraft stops firing and reverts to its previous mission state (patrol, loiter,
        or idle). It does not automatically RTB.
      </P>

      <H3>Full intercept sequence</H3>
      <Pre>{`SCRAMBLE EAGLE01
INTERCEPT EAGLE01 TARGET FLANKER01
ENGAGE EAGLE01
-- observe engagement --
DISENGAGE EAGLE01
RTB EAGLE01`}</Pre>

      <Note>
        Make sure the aircraft is armed before engaging. An unarmed aircraft in ENGAGE mode
        will close range but has no weapons to fire. Use <Code>ARM EAGLE01</Code> before
        scrambling if the aircraft needs munitions.
      </Note>
    </>
  );
}
