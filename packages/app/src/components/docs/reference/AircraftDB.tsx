import { AIRCRAFT_DEFAULTS } from '@jzsim/core';
import { H2, P, Table, Th, Td, Note } from '../styles.js';
import { PANEL } from '../../../styles/panel.js';

export function AircraftDB() {
  const entries = Object.entries(AIRCRAFT_DEFAULTS);

  return (
    <>
      <H2>Aircraft Database</H2>
      <P>
        Performance specifications for all aircraft types in JZSim. Values shown are the
        compiled defaults and can be modified at runtime via the Parametric Data Editor.
      </P>
      <Table>
        <thead>
          <tr>
            <Th>Aircraft</Th>
            <Th>Type</Th>
            <Th>Max Speed (kts)</Th>
            <Th>Cruise (kts)</Th>
            <Th>Ceiling (ft)</Th>
            <Th>Fuel (lbs)</Th>
            <Th>Burn Rate (lbs/hr)</Th>
            <Th>RCS (m2)</Th>
            <Th>Stealth</Th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, ac]) => (
            <tr key={name}>
              <Td style={{ color: PANEL.ACCENT, fontWeight: 'bold' }}>{name}</Td>
              <Td>{ac.type}</Td>
              <Td>{ac.maxSpeedKts.toLocaleString()}</Td>
              <Td>{ac.cruiseSpeedKts}</Td>
              <Td>{ac.ceilingFt.toLocaleString()}</Td>
              <Td>{ac.fuelCapacityLbs.toLocaleString()}</Td>
              <Td>{ac.fuelBurnCruiseLbsHr.toLocaleString()}</Td>
              <Td>{ac.rcsM2}</Td>
              <Td>{ac.isStealth ? 'Yes' : 'No'}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Note>
        RCS (Radar Cross Section) is measured in square meters. Lower values mean the
        aircraft is harder to detect by radar. The F-22A at 0.0001 m2 and B-2A at 0.001 m2
        are stealth platforms.
      </Note>
    </>
  );
}
