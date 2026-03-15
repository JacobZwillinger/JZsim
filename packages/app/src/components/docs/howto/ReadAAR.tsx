import { H2, H3, P, Code, Note, Tag, Ul, Li } from '../styles.js';

export function ReadAAR() {
  return (
    <>
      <Tag variant="default">How-To</Tag>
      <H2>Read the After Action Report</H2>
      <P>
        The After Action Report (AAR) provides aggregate and per-entity metrics about
        the current simulation run. It is the primary tool for analyzing outcomes.
      </P>

      <H3>Open the AAR panel</H3>
      <P>
        Click the <Code>AAR</Code> icon in the left sidebar (fifth icon from top).
        The AAR panel shows a summary dashboard with key metrics.
      </P>

      <H3>Aggregate metrics</H3>
      <P>
        The top section shows totals across all entities:
      </P>
      <Ul>
        <Li><strong style={{ color: '#e0e0e0' }}>Fuel Used</strong> — Total fuel consumed by all aircraft in pounds</Li>
        <Li><strong style={{ color: '#e0e0e0' }}>Muns Expended</strong> — Total weapons fired</Li>
        <Li><strong style={{ color: '#e0e0e0' }}>Kills</strong> — Total hostile entities destroyed</Li>
        <Li><strong style={{ color: '#e0e0e0' }}>Losses</strong> — Total friendly entities destroyed</Li>
      </Ul>

      <H3>Per-entity drill-down</H3>
      <P>
        Click on any entity in the AAR list to expand its detailed breakdown:
      </P>
      <Ul>
        <Li>Individual fuel consumption over time</Li>
        <Li>Weapons fired by type (AIM-120, AIM-9, etc.)</Li>
        <Li>Hits scored and kills attributed</Li>
        <Li>Current health and mission state</Li>
      </Ul>

      <H3>Update frequency</H3>
      <P>
        The AAR updates every 30 simulation ticks (30 seconds of sim time). At higher
        time multipliers, updates appear more frequently in wall-clock time. The metrics
        are cumulative from the start of the simulation.
      </P>

      <H3>Using AAR for analysis</H3>
      <P>
        The AAR is most useful after a combat engagement. Run a scenario, let the
        engagement play out, then review the AAR to assess:
      </P>
      <Ul>
        <Li>Exchange ratios (kills vs losses)</Li>
        <Li>Weapon effectiveness (shots fired vs hits)</Li>
        <Li>Fuel efficiency across different mission profiles</Li>
        <Li>Which aircraft types performed best</Li>
      </Ul>

      <Note>
        The AAR starts empty and accumulates data as the simulation runs. If you load
        a new scenario, the AAR resets.
      </Note>
    </>
  );
}
