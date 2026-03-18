import { useState } from 'react';
import { useUIStore, type EntityInfo } from '../store/ui-store.js';
import { PANEL } from '../styles/panel.js';
import { ModelType } from '@jzsim/core';

const AIR_STATES = new Set(['PATROL', 'ENROUTE', 'INTERCEPT', 'LOITER', 'STRIKE', 'SEAD']);
const GROUND_STATES = new Set(['LANDED', 'IDLE']);

interface GroupedMissions {
  inAir: Map<string, EntityWithCallsign[]>;
  onGround: Map<string, EntityWithCallsign[]>;
  rtb: EntityWithCallsign[];
}

interface EntityWithCallsign {
  entity: EntityInfo;
  callsign: string;
  missionState: string;
}

export function MissionView() {
  const entities = useUIStore((s) => s.entities);
  const callsigns = useUIStore((s) => s.callsigns);
  const missionStates = useUIStore((s) => s.missionStates);
  const setSelectedEntityId = useUIStore((s) => s.setSelectedEntityId);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Filter out missiles, group by mission state
  const nonWeapons = entities.filter((e) => e.modelType !== ModelType.MISSILE);

  const grouped: GroupedMissions = { inAir: new Map(), onGround: new Map(), rtb: [] };

  for (const entity of nonWeapons) {
    const cs = callsigns.get(entity.id) ?? `#${entity.id}`;
    const ms = missionStates.get(entity.id) ?? 'IDLE';
    const item: EntityWithCallsign = { entity, callsign: cs, missionState: ms };

    if (ms === 'RTB') {
      grouped.rtb.push(item);
    } else if (AIR_STATES.has(ms)) {
      if (!grouped.inAir.has(ms)) grouped.inAir.set(ms, []);
      grouped.inAir.get(ms)!.push(item);
    } else {
      if (!grouped.onGround.has(ms)) grouped.onGround.set(ms, []);
      grouped.onGround.get(ms)!.push(item);
    }
  }

  const totalInAir = [...grouped.inAir.values()].reduce((a, b) => a + b.length, 0);
  const totalOnGround = [...grouped.onGround.values()].reduce((a, b) => a + b.length, 0);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, padding: '4px 4px 8px', letterSpacing: '0.5px' }}>
        MISSION STATUS
      </div>

      {/* In Air */}
      <GroupHeader
        label={`IN AIR (${totalInAir})`}
        color={PANEL.SUCCESS}
        collapsed={collapsedGroups.has('air')}
        onClick={() => toggleGroup('air')}
      />
      {!collapsedGroups.has('air') && [...grouped.inAir.entries()].map(([state, items]) => (
        <SubGroup key={state} state={state} items={items} onSelect={setSelectedEntityId} collapsed={collapsedGroups} toggleGroup={toggleGroup} />
      ))}

      {/* RTB */}
      {grouped.rtb.length > 0 && (
        <>
          <GroupHeader
            label={`RTB (${grouped.rtb.length})`}
            color={PANEL.WARNING}
            collapsed={collapsedGroups.has('rtb')}
            onClick={() => toggleGroup('rtb')}
          />
          {!collapsedGroups.has('rtb') && grouped.rtb.map((item) => (
            <EntityRow key={item.entity.id} item={item} onSelect={setSelectedEntityId} />
          ))}
        </>
      )}

      {/* On Ground */}
      <GroupHeader
        label={`ON GROUND (${totalOnGround})`}
        color={PANEL.TEXT_MUTED}
        collapsed={collapsedGroups.has('ground')}
        onClick={() => toggleGroup('ground')}
      />
      {!collapsedGroups.has('ground') && [...grouped.onGround.entries()].map(([state, items]) => (
        <SubGroup key={state} state={state} items={items} onSelect={setSelectedEntityId} collapsed={collapsedGroups} toggleGroup={toggleGroup} />
      ))}
    </div>
  );
}

function GroupHeader({ label, color, collapsed, onClick }: {
  label: string; color: string; collapsed: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '6px 8px',
        fontSize: '10px',
        fontWeight: 'bold',
        color,
        cursor: 'pointer',
        letterSpacing: '0.5px',
        borderBottom: `1px solid ${PANEL.BORDER}`,
        marginTop: '4px',
      }}
    >
      {collapsed ? '\u25B6' : '\u25BC'} {label}
    </div>
  );
}

function SubGroup({ state, items, onSelect, collapsed, toggleGroup }: {
  state: string;
  items: EntityWithCallsign[];
  onSelect: (id: number | null) => void;
  collapsed: Set<string>;
  toggleGroup: (key: string) => void;
}) {
  const key = `sub-${state}`;
  const isCollapsed = collapsed.has(key);
  return (
    <div style={{ paddingLeft: '12px' }}>
      <div
        onClick={() => toggleGroup(key)}
        style={{
          padding: '4px 8px',
          fontSize: '9px',
          color: PANEL.TEXT_SECONDARY,
          cursor: 'pointer',
          letterSpacing: '0.5px',
        }}
      >
        {isCollapsed ? '\u25B8' : '\u25BE'} {state} ({items.length})
      </div>
      {!isCollapsed && items.map((item) => (
        <EntityRow key={item.entity.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}

function EntityRow({ item, onSelect }: { item: EntityWithCallsign; onSelect: (id: number | null) => void }) {
  const { entity, callsign } = item;
  const fuelPct = entity.fuelCapacity > 0 ? (entity.fuel / entity.fuelCapacity) * 100 : -1;
  return (
    <div
      onClick={() => onSelect(entity.id)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 12px',
        fontSize: '10px',
        cursor: 'pointer',
        color: PANEL.TEXT_PRIMARY,
        borderRadius: '3px',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(68,136,255,0.06)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span style={{ color: entity.side === 0 ? PANEL.BLUE : PANEL.RED }}>
        {callsign}
      </span>
      {fuelPct >= 0 && (
        <span style={{
          fontSize: '9px',
          color: fuelPct < 20 ? PANEL.DANGER : fuelPct < 50 ? PANEL.WARNING : PANEL.TEXT_MUTED,
        }}>
          {fuelPct.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
