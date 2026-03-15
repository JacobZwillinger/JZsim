import { H2, H3, P, Code, Pre, Note, Tag, Ul, Li } from '../styles.js';

export function ConfigureSAMs() {
  return (
    <>
      <Tag variant="default">How-To</Tag>
      <H2>Configure SAM Sites</H2>
      <P>
        Surface-to-air missile (SAM) sites provide area denial capability. Once spawned,
        they automatically engage hostile aircraft within range.
      </P>

      <H3>SPAWN SAM syntax</H3>
      <Pre>{`SPAWN <sam_type> <callsign> AT <lat> <lon> SIDE <blue|red>`}</Pre>

      <H3>Example</H3>
      <Pre>{`SPAWN SA-10 GRUMBLE01 AT 29.5 129.0 SIDE red
SPAWN PATRIOT PATRIOT01 AT 26.0 127.5 SIDE blue`}</Pre>

      <H3>Available SAM types</H3>
      <Ul>
        <Li>
          <Code>SA-10</Code> — S-300 system. Uses S-300 radar, SA-10 missiles. Long range
          (200 km weapon, 300 km radar). 4 simultaneous missiles, 10 second reload.
        </Li>
        <Li>
          <Code>SA-2</Code> — Older Soviet system. Shorter range (50 km weapon). 2
          simultaneous missiles, 15 second reload.
        </Li>
        <Li>
          <Code>PATRIOT</Code> — Western SAM system. Uses AN/TPS-77 radar, fires AIM-120
          missiles. 4 simultaneous missiles, 8 second reload.
        </Li>
      </Ul>

      <H3>Auto-engagement behavior</H3>
      <P>
        SAM sites engage automatically. When a hostile aircraft enters the SAM radar
        detection range and is above the minimum engagement altitude, the site will:
      </P>
      <Ul>
        <Li>Detect the target via its integrated radar</Li>
        <Li>Fire missiles up to its simultaneous missile limit</Li>
        <Li>Reload after the reload timer expires</Li>
        <Li>Continue engaging as long as targets remain in range</Li>
      </Ul>

      <H3>Minimum engagement altitude</H3>
      <P>
        Each SAM type has a minimum engagement altitude (ground clutter floor).
        Aircraft flying below this altitude will not be engaged:
      </P>
      <Ul>
        <Li><Code>SA-10</Code> — 300 m (~1,000 ft)</Li>
        <Li><Code>SA-2</Code> — 500 m (~1,640 ft)</Li>
        <Li><Code>PATRIOT</Code> — 200 m (~660 ft)</Li>
      </Ul>

      <Note>
        Stealth aircraft (F-22A, B-2A) are significantly harder for SAM radars to detect
        due to their very low radar cross section. The radar equation accounts for RCS when
        computing detection probability, so a stealth aircraft may fly through a SAM
        engagement zone without being detected.
      </Note>
    </>
  );
}
