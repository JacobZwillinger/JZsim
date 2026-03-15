import { RADAR_DEFAULTS, SAM_DEFAULTS } from '@jzsim/core';
import { H2, P, Table, Th, Td, Note } from '../styles.js';
import { PANEL } from '../../../styles/panel.js';

export function RadarSAMDB() {
  const radarEntries = Object.entries(RADAR_DEFAULTS);
  const samEntries = Object.entries(SAM_DEFAULTS);

  return (
    <>
      <H2>Radar Database</H2>
      <P>
        Radar parameters used by the detection system. These values feed into the radar
        equation to compute detection probability against targets at various ranges and RCS.
      </P>
      <Table>
        <thead>
          <tr>
            <Th>Radar</Th>
            <Th>Power (W)</Th>
            <Th>Gain (dBi)</Th>
            <Th>Freq (GHz)</Th>
            <Th>Max Range (km)</Th>
          </tr>
        </thead>
        <tbody>
          {radarEntries.map(([name, r]) => (
            <tr key={name}>
              <Td style={{ color: PANEL.ACCENT, fontWeight: 'bold' }}>{name}</Td>
              <Td>{r.powerW.toLocaleString()}</Td>
              <Td>{r.gainDbi}</Td>
              <Td>{r.freqGhz}</Td>
              <Td>{r.maxRangeKm}</Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <H2>SAM Site Database</H2>
      <P>
        SAM site configurations linking radars, weapons, and engagement parameters.
      </P>
      <Table>
        <thead>
          <tr>
            <Th>SAM</Th>
            <Th>Radar</Th>
            <Th>Weapon</Th>
            <Th>Max Missiles</Th>
            <Th>Reload (s)</Th>
            <Th>Min Alt (m)</Th>
          </tr>
        </thead>
        <tbody>
          {samEntries.map(([name, s]) => (
            <tr key={name}>
              <Td style={{ color: PANEL.ACCENT, fontWeight: 'bold' }}>{name}</Td>
              <Td>{s.radarKey}</Td>
              <Td>{s.weaponKey}</Td>
              <Td>{s.maxMissiles}</Td>
              <Td>{s.reloadTimeSec}</Td>
              <Td>{s.minEngageAltM}</Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Note>
        Max Missiles is the simultaneous engagement capacity. The SAM site can track and
        guide this many missiles at once. After a missile hits or misses, a new one can
        be launched after the reload timer expires.
      </Note>
    </>
  );
}
