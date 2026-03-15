import { H2, H3, P, Table, Th, Td, Note } from '../styles.js';
import { PANEL } from '../../../styles/panel.js';

function PropRow({ name, unit, desc }: { name: string; unit: string; desc: string }) {
  return (
    <tr>
      <Td style={{ color: PANEL.ACCENT }}>{name}</Td>
      <Td style={{ color: PANEL.TEXT_MUTED }}>{unit}</Td>
      <Td>{desc}</Td>
    </tr>
  );
}

export function EntityProperties() {
  return (
    <>
      <H2>Entity Properties</H2>
      <P>
        Complete list of all component fields stored per entity, organized by component.
        Internal storage units are shown. The UI converts to display units (feet, knots, lbs)
        where appropriate.
      </P>

      <H3>Position Component</H3>
      <Table>
        <thead><tr><Th>Field</Th><Th>Unit</Th><Th>Description</Th></tr></thead>
        <tbody>
          <PropRow name="lat" unit="degrees" desc="Latitude (WGS-84)" />
          <PropRow name="lon" unit="degrees" desc="Longitude (WGS-84)" />
          <PropRow name="alt" unit="meters" desc="Altitude above sea level" />
          <PropRow name="heading" unit="degrees" desc="True heading (0=north, 90=east, 0-360)" />
          <PropRow name="pitch" unit="degrees" desc="Pitch angle (positive = nose up)" />
          <PropRow name="roll" unit="degrees" desc="Roll angle (positive = right wing down)" />
        </tbody>
      </Table>

      <H3>Velocity Component</H3>
      <Table>
        <thead><tr><Th>Field</Th><Th>Unit</Th><Th>Description</Th></tr></thead>
        <tbody>
          <PropRow name="speed" unit="m/s" desc="Ground speed" />
          <PropRow name="climbRate" unit="m/s" desc="Vertical speed (positive = climbing)" />
          <PropRow name="turnRate" unit="deg/s" desc="Turn rate (positive = right turn)" />
        </tbody>
      </Table>

      <H3>Aircraft Component</H3>
      <Table>
        <thead><tr><Th>Field</Th><Th>Unit</Th><Th>Description</Th></tr></thead>
        <tbody>
          <PropRow name="fuel" unit="kg" desc="Current fuel quantity" />
          <PropRow name="fuelCapacity" unit="kg" desc="Maximum fuel capacity" />
          <PropRow name="fuelBurnRate" unit="kg/s" desc="Current fuel burn rate" />
          <PropRow name="maxSpeed" unit="m/s" desc="Maximum airspeed" />
          <PropRow name="cruiseSpeed" unit="m/s" desc="Cruise airspeed" />
          <PropRow name="ceiling" unit="m" desc="Service ceiling" />
          <PropRow name="rcs" unit="m2" desc="Radar cross section" />
          <PropRow name="throttle" unit="0-1" desc="Throttle setting (fraction)" />
          <PropRow name="entityType" unit="enum" desc="Type identifier (fighter, bomber, tanker, awacs)" />
        </tbody>
      </Table>

      <H3>Radar Component</H3>
      <Table>
        <thead><tr><Th>Field</Th><Th>Unit</Th><Th>Description</Th></tr></thead>
        <tbody>
          <PropRow name="powerW" unit="watts" desc="Transmitter peak power" />
          <PropRow name="gainDbi" unit="dBi" desc="Antenna gain" />
          <PropRow name="freqGhz" unit="GHz" desc="Operating frequency" />
          <PropRow name="mode" unit="enum" desc="OFF, STANDBY, SEARCH, or TRACK" />
          <PropRow name="maxRangeM" unit="m" desc="Maximum detection range" />
        </tbody>
      </Table>

      <H3>Health Component</H3>
      <Table>
        <thead><tr><Th>Field</Th><Th>Unit</Th><Th>Description</Th></tr></thead>
        <tbody>
          <PropRow name="hp" unit="HP" desc="Current health points" />
          <PropRow name="maxHp" unit="HP" desc="Maximum health points (default: 100)" />
        </tbody>
      </Table>

      <H3>Mission Component</H3>
      <Table>
        <thead><tr><Th>Field</Th><Th>Unit</Th><Th>Description</Th></tr></thead>
        <tbody>
          <PropRow name="state" unit="enum" desc="IDLE, ENROUTE, PATROL, LOITER, RTB, LANDED, INTERCEPT, SEAD, REFUELING" />
          <PropRow name="assignedBase" unit="entity ID" desc="Home base entity reference" />
          <PropRow name="targetEntity" unit="entity ID" desc="Current intercept/attack target" />
          <PropRow name="waypointLat" unit="degrees" desc="Current waypoint latitude" />
          <PropRow name="waypointLon" unit="degrees" desc="Current waypoint longitude" />
          <PropRow name="waypointAlt" unit="meters" desc="Current waypoint altitude" />
        </tbody>
      </Table>

      <Note>
        All internal storage uses SI units (meters, m/s, kg, degrees). The command parser
        handles conversion from user-facing units (feet, knots, lbs) to internal units.
        The UI reverses this conversion for display.
      </Note>
    </>
  );
}
