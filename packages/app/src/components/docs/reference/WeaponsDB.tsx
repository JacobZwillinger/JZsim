import { WEAPON_DEFAULTS } from '@jzsim/core';
import { H2, P, Table, Th, Td, Note } from '../styles.js';
import { PANEL } from '../../../styles/panel.js';

export function WeaponsDB() {
  const entries = Object.entries(WEAPON_DEFAULTS);

  return (
    <>
      <H2>Weapons Database</H2>
      <P>
        Weapon performance parameters used by the combat system. These values determine
        flight characteristics, engagement envelopes, and lethality.
      </P>
      <Table>
        <thead>
          <tr>
            <Th>Weapon</Th>
            <Th>Speed (Mach)</Th>
            <Th>Max Range (km)</Th>
            <Th>Flight Time (s)</Th>
            <Th>Damage</Th>
            <Th>Hit Prob (Pk)</Th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, w]) => (
            <tr key={name}>
              <Td style={{ color: PANEL.ACCENT, fontWeight: 'bold' }}>{name}</Td>
              <Td>{w.speedMach}</Td>
              <Td>{w.maxRangeKm}</Td>
              <Td>{w.flightTimeSec}</Td>
              <Td>{w.damage}x</Td>
              <Td>{(w.hitProbability * 100).toFixed(0)}%</Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <H2>Damage explained</H2>
      <P>
        The damage value is a multiplier applied to a base HP damage of 60. An AIM-120
        with damage 1.0x deals 60 HP. The SA-10 with 1.5x deals 90 HP. Hit probability
        (Pk) is the per-shot chance of a proximity-fused hit on the target.
      </P>

      <Note>
        Air-to-air missiles (AIM-120, AIM-9) are carried by fighters.
        SAM missiles (SA-10, SA-2) are fired by ground-based SAM sites.
        The AIM-120 also serves as the PATRIOT system's missile in the simulation.
      </Note>
    </>
  );
}
