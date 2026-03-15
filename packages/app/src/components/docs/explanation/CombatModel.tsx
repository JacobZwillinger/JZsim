import { H2, H3, P, Code, Pre, Note, Tag } from '../styles.js';

export function CombatModel() {
  return (
    <>
      <Tag variant="technical">Technical</Tag>
      <H2>Combat and Damage Model</H2>
      <P>
        JZSim models air-to-air and surface-to-air combat through engagement modes,
        weapon guidance, probabilistic hit determination, and a health point damage system.
      </P>

      <H3>Engagement modes</H3>
      <P>
        Aircraft and SAM sites can enter combat through several mechanisms:
      </P>
      <Pre>{`ENGAGE <callsign>
  Auto-engagement mode. The entity fires at any hostile target
  within weapon range. Prioritizes closest threats.

INTERCEPT <callsign> TARGET <target>
  Navigation mode. Fly toward a specific target to close range.
  Does not automatically fire — pair with ENGAGE for that.

ATTACK <callsign> TARGET <target>
  Direct attack on a specific target. Closes range and fires
  when within weapon envelope.

SAM sites:
  Automatically engage any detected hostile above their minimum
  engagement altitude. No command needed.`}</Pre>

      <H3>Weapon guidance</H3>
      <P>
        Once launched, missiles use proportional navigation to steer toward their target.
        The missile computes a lead angle based on the target bearing rate and adjusts
        heading to achieve an intercept. Missiles fly at their rated speed (Mach number)
        and have a maximum flight time. If the missile runs out of flight time before
        reaching the target, it self-destructs.
      </P>

      <H3>Hit probability</H3>
      <P>
        When a missile reaches proximity to its target (within lethal radius), a hit check
        is performed using the weapon's Pk (probability of kill) value. This is a single
        random roll:
      </P>
      <Pre>{`if (random() < weapon.hitProbability) {
  // HIT — apply damage
} else {
  // MISS — missile removed, no damage
}`}</Pre>
      <P>
        Pk values range from 0.50 (SA-2, older system) to 0.80 (SA-10, modern system).
        The AIM-120 has a Pk of 0.70 and the AIM-9 is 0.65.
      </P>

      <H3>Damage model</H3>
      <P>
        Each entity has a health point pool (default 100 HP). When a weapon hits, it deals
        damage based on the warhead lethality multiplier:
      </P>
      <Pre>{`damage = weapon.damage * 60   (base HP)

Examples:
  AIM-120: 1.0 * 60 = 60 HP damage
  AIM-9:   0.6 * 60 = 36 HP damage
  SA-10:   1.5 * 60 = 90 HP damage
  SA-2:    1.2 * 60 = 72 HP damage`}</Pre>
      <P>
        When an entity reaches 0 HP, it is destroyed and removed from the simulation.
        A kill event is emitted and attributed to the firing entity.
      </P>

      <H3>Engagement priority</H3>
      <P>
        When multiple hostile targets are in range, the engagement system prioritizes by
        closest distance. The entity fires at the nearest threat first. Once a missile is
        in flight toward that target, it can engage additional targets if it has remaining
        weapons and concurrent engagement capacity.
      </P>

      <Note>
        The combat model is low-to-medium fidelity. It does not model electronic
        countermeasures (ECM), terrain masking for weapons, or multi-axis attacks.
        These are planned for future phases.
      </Note>
    </>
  );
}
