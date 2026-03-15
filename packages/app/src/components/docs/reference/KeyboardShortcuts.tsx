import { H2, P, Table, Th, Td } from '../styles.js';
import { PANEL } from '../../../styles/panel.js';

function ShortcutRow({ key: k, desc }: { key: string; desc: string }) {
  return (
    <tr>
      <Td>
        <span style={{
          display: 'inline-block',
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: `1px solid ${PANEL.BORDER}`,
          borderRadius: '4px',
          padding: '2px 8px',
          color: PANEL.TEXT_PRIMARY,
          fontSize: '11px',
          fontFamily: PANEL.FONT_MONO,
        }}>{k}</span>
      </Td>
      <Td>{desc}</Td>
    </tr>
  );
}

export function KeyboardShortcuts() {
  return (
    <>
      <H2>Keyboard Shortcuts</H2>
      <P>
        Keyboard shortcuts for quick access to panels and controls.
      </P>
      <Table>
        <thead>
          <tr><Th>Key</Th><Th>Action</Th></tr>
        </thead>
        <tbody>
          <ShortcutRow key="`" desc="Toggle the command console open/closed" />
          <ShortcutRow key="F1" desc="Toggle the help documentation panel" />
          <ShortcutRow key="Escape" desc="Close the active panel or console" />
          <ShortcutRow key="Enter" desc="Submit the current command in the console" />
        </tbody>
      </Table>

      <H2>Mouse Controls</H2>
      <Table>
        <thead>
          <tr><Th>Action</Th><Th>Description</Th></tr>
        </thead>
        <tbody>
          <tr>
            <Td style={{ color: PANEL.ACCENT }}>Click entity marker</Td>
            <Td>Select and inspect the entity. Opens the Entity Inspector panel.</Td>
          </tr>
          <tr>
            <Td style={{ color: PANEL.ACCENT }}>Click OOB entity name</Td>
            <Td>Select and inspect the entity from the Order of Battle sidebar.</Td>
          </tr>
          <tr>
            <Td style={{ color: PANEL.ACCENT }}>Scroll wheel on map</Td>
            <Td>Zoom in and out of the map.</Td>
          </tr>
          <tr>
            <Td style={{ color: PANEL.ACCENT }}>Click + drag on map</Td>
            <Td>Pan the map view.</Td>
          </tr>
          <tr>
            <Td style={{ color: PANEL.ACCENT }}>Click time multiplier</Td>
            <Td>Cycle through time acceleration: 1x, 2x, 5x, 10x, 30x, 60x.</Td>
          </tr>
        </tbody>
      </Table>
    </>
  );
}
