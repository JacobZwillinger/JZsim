import { H2, H3, P, Code, Pre, Note, Tag, Table, Th, Td } from '../styles.js';
import { PANEL } from '../../../styles/panel.js';

export function UnitsConversions() {
  return (
    <>
      <Tag variant="technical">Technical</Tag>
      <H2>Units and Conversions</H2>
      <P>
        JZSim uses two unit systems: user-facing units for commands and display, and
        internal SI units for computation. The command parser converts on input, and the
        UI converts on output. Understanding both is important when reading code or
        analyzing raw data.
      </P>

      <H3>Conversion table</H3>
      <Table>
        <thead>
          <tr>
            <Th>Quantity</Th>
            <Th>User Unit</Th>
            <Th>Internal Unit</Th>
            <Th>Conversion</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td style={{ color: PANEL.TEXT_PRIMARY }}>Altitude</Td>
            <Td>feet (ft)</Td>
            <Td>meters (m)</Td>
            <Td>1 ft = 0.3048 m</Td>
          </tr>
          <tr>
            <Td style={{ color: PANEL.TEXT_PRIMARY }}>Speed</Td>
            <Td>knots (kts)</Td>
            <Td>meters/second (m/s)</Td>
            <Td>1 kt = 0.51444 m/s</Td>
          </tr>
          <tr>
            <Td style={{ color: PANEL.TEXT_PRIMARY }}>Fuel mass</Td>
            <Td>pounds (lbs)</Td>
            <Td>kilograms (kg)</Td>
            <Td>1 lb = 0.45359 kg</Td>
          </tr>
          <tr>
            <Td style={{ color: PANEL.TEXT_PRIMARY }}>Distance</Td>
            <Td>km or nm</Td>
            <Td>meters (m)</Td>
            <Td>1 km = 1000 m, 1 nm = 1852 m</Td>
          </tr>
          <tr>
            <Td style={{ color: PANEL.TEXT_PRIMARY }}>Heading</Td>
            <Td>degrees</Td>
            <Td>degrees</Td>
            <Td>No conversion (0-360, 0=N)</Td>
          </tr>
          <tr>
            <Td style={{ color: PANEL.TEXT_PRIMARY }}>Fuel burn rate</Td>
            <Td>lbs/hr</Td>
            <Td>kg/s</Td>
            <Td>lbs/hr * 0.45359 / 3600</Td>
          </tr>
          <tr>
            <Td style={{ color: PANEL.TEXT_PRIMARY }}>Radar range</Td>
            <Td>km</Td>
            <Td>meters (m)</Td>
            <Td>1 km = 1000 m</Td>
          </tr>
          <tr>
            <Td style={{ color: PANEL.TEXT_PRIMARY }}>Weapon speed</Td>
            <Td>Mach</Td>
            <Td>m/s</Td>
            <Td>Mach * 343 m/s</Td>
          </tr>
        </tbody>
      </Table>

      <H3>Heading convention</H3>
      <P>
        Headings use true north as the reference, measured clockwise:
      </P>
      <Pre>{`  0° = North
 90° = East
180° = South
270° = West`}</Pre>
      <P>
        Both user input and internal storage use the same degree convention. No conversion
        is needed for heading. Values wrap around 360 degrees.
      </P>

      <H3>Coordinate system</H3>
      <P>
        Geographic coordinates use WGS-84 decimal degrees. Latitude ranges from -90 to +90
        (positive = north). Longitude ranges from -180 to +180 (positive = east). When
        entering coordinates in commands, latitude comes before longitude:
      </P>
      <Pre>{'SPAWN F-15C EAGLE01 AT 26.35 127.77 ...\n                        ^lat  ^lon'}</Pre>

      <H3>Where conversions happen</H3>
      <P>
        The conversion boundary is clearly defined in the codebase:
      </P>
      <Pre>{`Input path:
  User types "ALT 25000" (feet)
  → command-parser calls feetToMeters(25000)
  → engine stores 7620 (meters)

Output path:
  Engine stores speed 231.5 (m/s)
  → UI calls mpsToKnots(231.5)
  → displays "450 kts"`}</Pre>

      <Note>
        The core package exports all conversion functions: <Code>feetToMeters</Code>,{' '}
        <Code>metersToFeet</Code>, <Code>knotsToMps</Code>, <Code>mpsToKnots</Code>,{' '}
        <Code>lbsToKg</Code>, <Code>kgToLbs</Code>. Use these when working with the API
        to ensure consistency.
      </Note>
    </>
  );
}
