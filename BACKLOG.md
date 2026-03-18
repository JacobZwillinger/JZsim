# JZSim Backlog

## Feature Backlog (Items 8–12)

- [ ] **Weather Layer** — Wind, visibility, precipitation affecting fuel burn, radar performance, and aircraft handling
- [ ] **Time-of-Day / Lighting** — Day/night cycle affecting visual acquisition, IR sensor effectiveness
- [ ] **Entity Trail Lines** — Breadcrumb paths on map showing entity history
- [ ] **Combat Replay** — Record/playback of simulation sessions for AAR review
- [x] **Performance Profiling Dashboard** — Real-time metrics: tick time, entity count, system budgets (⚡ System Health panel)
- [x] **DMPI Bombing Run** — Strike mission system: DMPI target management, STRIKE command, route detail panel with distances/reorder/optimization, map visualization (🎯 Strike/DMPI panel)

## UI Backlog

- [ ] **Configurable Data Drawer** — Rename "Parametric Data" to a generic "Configuration" drawer; add weapon defaults and RCS behavior as editable tables alongside existing aircraft defaults
- [ ] **Map Click Closes Drawer** — Clicking on the map should close the left drawer if open

## Sim-Ism Backlog (Codebase Audit Findings)

### Movement / Physics (HIGH priority)
- [ ] Unlimited turn rate — need G-limits (3–8 deg/sec for fighters based on speed)
- [ ] Unlimited climb rate — need altitude-dependent max climb rates
- [ ] No stall speed — aircraft should crash/stall below ~100 kts
- [ ] Instant speed/heading changes on SET commands — need acceleration ramp rates
- [ ] Altitude `Math.max(0)` bounce instead of crash on ground impact

### Fuel (MEDIUM priority)
- [ ] Constant burn rate regardless of speed/altitude/throttle — need throttle-dependent burn curve
- [ ] Throttle field stored in AircraftFields but never used by any system
- [ ] No fuel burn at idle/on ground (real: APU + engines running)
- [ ] No afterburner modeling (5–10× burn rate increase at military/max power)

### Engagement (MEDIUM priority)
- [ ] Scenarios don't issue ENGAGE commands — fighters only auto-engage when explicitly told; consider auto-engagement for aircraft on PATROL that detect hostiles
- [ ] 150 km auto-engage range too large — should depend on sensor (radar RCS, AWACS data link)
- [ ] No weapons envelope constraints (aspect angle, closure rate, Rne/Rtr)
- [ ] Instant heading change during engagement — should be limited by turn rate/G
- [ ] One missile per target — real tactics fire pairs for redundancy

### SAM (MEDIUM priority)
- [ ] No engagement acquisition delay (real: 3–10 sec to acquire, lock, and fire)
- [ ] Single channel only — S-300 should be multi-target capable (6+ simultaneous)
- [ ] No radar lock maintenance requirement (loss of lock = missile goes ballistic)
- [ ] Reload timer ticked incorrectly with stagger compensation factor

### Radar (LOW priority)
- [ ] No clutter modeling (ground/sea clutter degrades low-altitude detection)
- [ ] No scan pattern (always 360° omnidirectional, real: sector/spiral scans)
- [ ] No aspect-angle-dependent RCS (head-on vs tail-on varies 10×)
- [ ] Detection threshold 50% too high (should be 10–15% for initial detection)
- [ ] No frequency/polarization atmospheric absorption effects
- [ ] Fixed Smin constant — should vary by receiver design

### Strike / DMPI (LOW priority)
- [ ] Bombs always hit target — no CEP (Circular Error Probable) miss modeling for JDAMs
- [ ] No bomb flight time delay — bombs "hit" instantly on drop (should take ~30-90 sec to glide to target)
- [ ] No bomb damage area — single-target damage only, no splash/blast radius
- [ ] 1 km drop distance is unrealistic — real JDAM release at 15-25 km (high-altitude toss/CCRP)
- [ ] No BDA (Battle Damage Assessment) — can't tell if target was actually destroyed
- [ ] Strike route optimization is nearest-neighbor greedy — should offer 2-opt or full TSP for better routes

### Mission (LOW priority)
- [ ] 1 km waypoint arrival radius too tight for some scenarios
- [ ] 5 km instant landing — need glide slope approach with speed/altitude gates
- [ ] Unrealistic RTB descent profile formula `(dist/50)*100`
- [ ] No pattern variation for patrol orbits (racetrack, figure-8, expanding square)
- [ ] INTERCEPT uses direct pursuit instead of lead intercept calculation

### SEAD / AAR (LOW priority)
- [ ] SEAD ESM detection uses flat 150 km range — should depend on SAM radar power and receiver sensitivity
- [ ] SEAD fires one missile per tick with no target prioritization — real SEAD coordinates suppression timing
- [ ] AAR tanker has no refueling orbit/track — just flies current heading while dispensing fuel
- [ ] `resolveAircraftType()` uses RCS heuristic — fragile, should store aircraft type key in a component

### Defaults / Parameters (LOW priority)
- [ ] No weight/balance effects — max speed and ceiling don't degrade with fuel/weapons load
- [ ] No speed variation with altitude (thin air at FL350 vs sea level)
- [ ] AIM-120 max range 180 km may be optimistic — effective combat range ~80–100 km
- [ ] No maintenance/turnaround time modeling between sorties
