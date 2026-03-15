import { H2, H3, P, Code, Pre, Note, Tag, Ul, Li } from '../styles.js';

export function BuildScenarios() {
  return (
    <>
      <Tag variant="default">How-To</Tag>
      <H2>Build Custom Scenarios</H2>
      <P>
        JZSim provides two ways to create scenarios: a text-based DSL editor and a record
        mode that captures your live commands.
      </P>

      <H3>Open the Scenario panel</H3>
      <P>
        Click the <Code>SCN</Code> icon in the left sidebar (second icon from top).
        The Scenario panel opens with a list of built-in scenarios and tools for creating
        new ones.
      </P>

      <H3>Text DSL input</H3>
      <P>
        The scenario text editor accepts one command per line. Write your scenario as a
        sequence of SPAWN, ASSIGN, ARM, PATROL, and other commands:
      </P>
      <Pre>{`SPAWN AIRBASE KADENA AT 26.35 127.77 SIDE blue
SPAWN F-15C EAGLE01 AT 26.35 127.77 ALT 25000 SIDE blue HEADING 0 SPEED 450
SPAWN F-15C EAGLE02 AT 26.35 127.77 ALT 25000 SIDE blue HEADING 0 SPEED 450
ASSIGN EAGLE01 TO KADENA
ASSIGN EAGLE02 TO KADENA
ARM EAGLE01
ARM EAGLE02
PATROL EAGLE01 BETWEEN 27.5 127.0 AND 28.5 128.5 AT 30000
PATROL EAGLE02 BETWEEN 27.0 126.5 AND 28.0 127.5 AT 30000
SPAWN Su-30 FLANKER01 AT 29.0 128.0 ALT 28000 SIDE red HEADING 180 SPEED 500`}</Pre>
      <P>
        Click the run button to execute all commands in sequence.
      </P>

      <H3>Record mode</H3>
      <P>
        Record mode captures commands as you issue them through the command console:
      </P>
      <Ul>
        <Li>Click the record button in the Scenario panel to start recording</Li>
        <Li>Issue commands normally via the command console</Li>
        <Li>Each command is appended to the scenario text</Li>
        <Li>Click stop to end recording</Li>
        <Li>Edit the resulting text if needed, then save</Li>
      </Ul>

      <H3>Loading scenarios</H3>
      <P>
        Click any scenario name in the scenario list to load it. All entities from the
        previous state are cleared and the new scenario commands are executed. Built-in
        scenarios cannot be modified but can be used as starting points.
      </P>

      <Note>
        Lines starting with <Code>#</Code> or <Code>//</Code> are treated as comments and
        ignored during execution. Use comments to annotate your scenario files.
      </Note>
    </>
  );
}
