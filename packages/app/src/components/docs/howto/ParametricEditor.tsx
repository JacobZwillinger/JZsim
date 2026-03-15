import { H2, H3, P, Code, Pre, Note, Tag, Ul, Li } from '../styles.js';

export function ParametricEditor() {
  return (
    <>
      <Tag variant="default">How-To</Tag>
      <H2>Use the Parametric Editor</H2>
      <P>
        The Parametric Data Editor lets you modify aircraft performance defaults at runtime.
        This is useful for what-if analysis, sensitivity studies, and testing edge cases.
      </P>

      <H3>Open the Data panel</H3>
      <P>
        Click the <Code>DATA</Code> icon in the left sidebar (bottom icon). The Parametric
        Data Editor opens showing all aircraft types and their performance parameters.
      </P>

      <H3>Edit parameters</H3>
      <P>
        Each aircraft type is shown as a row with editable fields. You can modify:
      </P>
      <Ul>
        <Li><Code>maxSpeedKts</Code> — Maximum speed in knots</Li>
        <Li><Code>cruiseSpeedKts</Code> — Cruise speed in knots</Li>
        <Li><Code>ceilingFt</Code> — Service ceiling in feet</Li>
        <Li><Code>fuelCapacityLbs</Code> — Total fuel capacity in pounds</Li>
        <Li><Code>fuelBurnCruiseLbsHr</Code> — Fuel burn rate at cruise in lbs/hr</Li>
        <Li><Code>rcsM2</Code> — Radar cross section in square meters</Li>
        <Li><Code>isStealth</Code> — Whether the aircraft uses stealth characteristics</Li>
      </Ul>

      <H3>When changes take effect</H3>
      <P>
        Parameter changes apply to <strong style={{ color: '#e0e0e0' }}>newly spawned
        aircraft only</strong>. Entities already in the simulation keep their original
        values. To see the effect of a change, spawn a new aircraft after editing.
      </P>

      <H3>Reset to defaults</H3>
      <P>
        Use the reset button to restore all parameters to their original values. This
        also only affects newly spawned aircraft.
      </P>

      <Note>
        This editor is designed for experimentation. Changes are not persisted across
        page reloads. Refreshing the browser restores all parameters to their
        compiled-in defaults.
      </Note>
    </>
  );
}
