import { H2, H3, P, Code, Pre, Note, Tag } from '../styles.js';

export function EngineExplained() {
  return (
    <>
      <Tag variant="technical">Technical</Tag>
      <H2>How the Sim Engine Works</H2>
      <P>
        The simulation engine uses a fixed-timestep loop with an accumulator pattern. This
        ensures deterministic behavior regardless of the rendering frame rate or time
        multiplier setting.
      </P>

      <H3>Fixed timestep</H3>
      <P>
        Each simulation tick represents exactly 1 second of simulation time. The engine
        does not use variable delta-time. This means all physics calculations, fuel burn
        rates, and distances are computed for a consistent 1-second interval, making the
        simulation reproducible and easier to reason about.
      </P>

      <H3>Accumulator pattern</H3>
      <P>
        The engine runs on a requestAnimationFrame loop (approximately 60 Hz). Each frame,
        wall-clock elapsed time is multiplied by the time multiplier and added to an
        accumulator. The engine then executes as many 1-second ticks as the accumulator
        allows:
      </P>
      <Pre>{`accumulator += wallClockDelta * timeMultiplier
while (accumulator >= 1.0) {
  world.tick()    // exactly 1 sim-second
  accumulator -= 1.0
}`}</Pre>

      <H3>Spiral of death prevention</H3>
      <P>
        At very high time multipliers or when the system is under load, the accumulator
        could grow faster than ticks can execute, causing a runaway loop. To prevent this,
        the engine caps execution at 10 ticks per frame. If the accumulator exceeds 10
        seconds, the excess is discarded. This means at extreme time multipliers, the
        simulation may run slower than requested rather than freezing the browser.
      </P>

      <H3>System execution order</H3>
      <P>
        Each tick, systems execute in a fixed order. The order matters because later systems
        depend on state updated by earlier ones:
      </P>
      <Pre>{`1. MissionSystem    — updates waypoints, state transitions
2. MovementSystem   — applies speed, heading, altitude changes
3. FuelSystem       — burns fuel based on throttle and speed
4. RadarSystem      — detects targets, updates contact lists
5. SAMSystem        — SAM sites engage detected hostiles
6. FighterSystem    — fighters in ENGAGE mode fire at targets
7. WeaponSystem     — updates in-flight missiles, checks hits`}</Pre>

      <H3>Event queue</H3>
      <P>
        Systems emit events (detection, weapon launch, hit, kill) into an event queue
        during tick execution. After all ticks in a frame batch complete, the event queue
        is drained and events are sent to the main thread via postMessage. The UI reads
        these events to update the AAR, play sounds, and show notifications.
      </P>

      <H3>Time multiplier</H3>
      <P>
        Available multipliers: 1x, 2x, 5x, 10x, 30x, 60x. At 60x, one wall-clock second
        produces 60 simulation ticks (1 minute of sim time). The multiplier is applied
        in the accumulator calculation, not by changing the tick duration.
      </P>

      <Note>
        The engine runs in a Web Worker. All component store access happens on the Worker
        thread. The only data shared with the main thread is the SharedArrayBuffer (for
        entity positions) and postMessage events (for UI updates).
      </Note>
    </>
  );
}
