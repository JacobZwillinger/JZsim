import { H2, H3, P, Code, Pre, Note, Tag, Ul, Li } from '../styles.js';

export function SpawnControl() {
  return (
    <>
      <Tag variant="default">How-To</Tag>
      <H2>Spawn and Control Aircraft</H2>
      <P>
        Quick reference for spawning entities and controlling their flight parameters.
      </P>

      <H3>SPAWN syntax</H3>
      <Pre>{`SPAWN <type> <callsign> AT <lat> <lon> [ALT <feet>] [SIDE blue|red] [HEADING <deg>] [SPEED <knots>]`}</Pre>
      <P>
        All parameters after AT are positional (latitude then longitude). Optional
        parameters can appear in any order. Altitude is in feet, speed in knots.
        If omitted, defaults are: ALT 20000, HEADING 0, SPEED cruise speed for
        the aircraft type.
      </P>

      <H3>Supported aircraft types</H3>
      <Ul>
        <Li><Code>F-15C</Code> — Air superiority fighter. High speed, good fuel capacity.</Li>
        <Li><Code>F-22A</Code> — Stealth fighter. Supercruise capable, very low RCS.</Li>
        <Li><Code>F-16C</Code> — Multirole fighter. Smaller, lighter, less fuel.</Li>
        <Li><Code>Su-30</Code> — Red-side multirole fighter. Long range, large fuel load.</Li>
        <Li><Code>B-2A</Code> — Stealth bomber. Subsonic, very low RCS, no weapons in sim.</Li>
        <Li><Code>KC-135</Code> — Tanker. Large fuel capacity for aerial refueling.</Li>
        <Li><Code>E-3</Code> — AWACS. Airborne early warning and control.</Li>
      </Ul>
      <P>
        You can also use generic type aliases: <Code>FIGHTER</Code> (resolves to F-15C),{' '}
        <Code>BOMBER</Code> (B-2A), <Code>TANKER</Code> (KC-135), <Code>AWACS</Code> (E-3).
      </P>

      <H3>Other spawnable types</H3>
      <Ul>
        <Li><Code>AIRBASE</Code> — Ground installation for rearming and RTB.</Li>
        <Li><Code>SA-10</Code> — S-300 surface-to-air missile site.</Li>
        <Li><Code>SA-2</Code> — Older SAM site, shorter range.</Li>
        <Li><Code>PATRIOT</Code> — Western SAM system.</Li>
      </Ul>
      <Pre>{`SPAWN AIRBASE KADENA AT 26.35 127.77 SIDE blue
SPAWN SA-10 GRUMBLE01 AT 29.5 129.0 SIDE red`}</Pre>

      <H3>SET commands</H3>
      <P>Change individual flight parameters on the fly:</P>
      <Pre>{`SET SPEED EAGLE01 600       (knots)
SET ALT EAGLE01 35000       (feet)
SET HEADING EAGLE01 270     (degrees, 0=north, 90=east)`}</Pre>

      <H3>FLY TO command</H3>
      <P>Navigate an aircraft to a specific location:</P>
      <Pre>{`FLY EAGLE01 TO 28.0 130.0 AT 30000 SPEED 500`}</Pre>
      <P>
        The aircraft will turn toward the destination and fly until it arrives within
        the arrival radius (approximately 2 km).
      </P>

      <H3>REMOVE command</H3>
      <P>Remove an entity from the simulation entirely:</P>
      <Pre>{'REMOVE EAGLE01'}</Pre>

      <Note>
        All commands are case-insensitive. <Code>spawn f-15c eagle01</Code> works the same
        as <Code>SPAWN F-15C EAGLE01</Code>.
      </Note>
    </>
  );
}
