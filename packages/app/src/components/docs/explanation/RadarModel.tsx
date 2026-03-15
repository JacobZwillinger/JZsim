import { H2, H3, P, Code, Pre, Note, Tag } from '../styles.js';

export function RadarModel() {
  return (
    <>
      <Tag variant="technical">Technical</Tag>
      <H2>Radar and Detection Model</H2>
      <P>
        JZSim uses a simplified radar equation to compute detection probability. The model
        accounts for transmitter power, antenna gain, operating frequency, target radar
        cross section (RCS), and range. A multi-layer optimization cascade makes this
        efficient at scale.
      </P>

      <H3>Radar equation</H3>
      <P>
        The detection model computes received signal strength using the standard radar
        range equation. The key variables are:
      </P>
      <Pre>{`Pr = (Pt * G^2 * lambda^2 * sigma) / ((4*pi)^3 * R^4)

Where:
  Pr     = received power
  Pt     = transmitter power (watts)
  G      = antenna gain (linear, from dBi)
  lambda = wavelength (c / freq)
  sigma  = target RCS (m^2)
  R      = range to target (meters)`}</Pre>
      <P>
        The received power is compared against a detection threshold. Detection is
        probabilistic: a higher signal-to-threshold ratio yields a higher probability of
        detection. This means that a target at the edge of radar range might be detected
        intermittently, while a close target is reliably detected.
      </P>

      <H3>6-layer optimization cascade</H3>
      <P>
        Checking every radar against every potential target every tick would be O(n*m) and
        prohibitively expensive. JZSim uses six progressive filters to minimize computation:
      </P>
      <Pre>{`Layer 1: Spatial Grid
  0.5-degree cells, rebuilt each tick. Only check targets in
  nearby cells. Eliminates distant targets cheaply.

Layer 2: Stagger
  Not all radars scan every tick. Radars are staggered across
  ticks to spread the computational load.

Layer 3: Range Gate
  Quick distance check against radar max range before running
  the full equation. Uses squared distance to avoid sqrt.

Layer 4: Radar Horizon
  Check line-of-sight considering Earth curvature. Targets
  below the radar horizon cannot be detected.

Layer 5: Radar Equation
  Full signal strength calculation for candidates that passed
  all previous filters.

Layer 6: WASM Batch (planned)
  AssemblyScript compiled to WebAssembly for batch processing
  10k+ targets. Not yet implemented.`}</Pre>

      <H3>RCS and stealth</H3>
      <P>
        Radar cross section directly affects detection range. Since received power scales
        with sigma (RCS), a target with 1/1000th the RCS can only be detected at roughly
        1/5.6th the range. This is how stealth aircraft like the F-22A (RCS 0.0001 m2)
        can penetrate SAM coverage that would easily detect a conventional fighter (RCS
        5.0 m2).
      </P>

      <H3>Detection is not binary</H3>
      <P>
        Unlike many simulations that use a simple range circle for detection, JZSim
        models detection probabilistically. A radar might detect a target on one tick and
        lose it the next, depending on signal strength fluctuations. This creates more
        realistic behavior where contacts fade in and out at the edges of detection range.
      </P>

      <Note>
        The spatial grid uses 0.5-degree cells (roughly 55 km at mid-latitudes). This
        granularity is chosen to balance between too-coarse cells (too many candidates) and
        too-fine cells (too much overhead maintaining the grid).
      </Note>
    </>
  );
}
