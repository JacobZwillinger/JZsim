import { useState } from 'react';
import { AIRCRAFT_DEFAULTS, LOADOUT_DEFAULTS, WEAPON_DEFAULTS } from '@jzsim/core';
import { PANEL } from '../styles/panel.js';

export function ParametricEditor({ onUpdateDefaults }: {
  onUpdateDefaults?: (aircraftKey: string, field: string, value: number) => void;
}) {
  const [expandedAc, setExpandedAc] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Record<string, number>>>({});

  const aircraftKeys = Object.keys(AIRCRAFT_DEFAULTS);

  const handleFieldChange = (acKey: string, field: string, rawValue: string) => {
    const value = parseFloat(rawValue);
    if (isNaN(value)) return;
    setOverrides((prev) => ({
      ...prev,
      [acKey]: { ...(prev[acKey] ?? {}), [field]: value },
    }));
    onUpdateDefaults?.(acKey, field, value);
  };

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, padding: '4px 4px 8px', letterSpacing: '0.5px' }}>
        AIRCRAFT DATA (edits affect new spawns only)
      </div>

      {aircraftKeys.map((acKey) => {
        const def = AIRCRAFT_DEFAULTS[acKey];
        const loadout = LOADOUT_DEFAULTS[acKey];
        const isExpanded = expandedAc === acKey;
        const acOverrides = overrides[acKey] ?? {};

        return (
          <div key={acKey} style={{ marginBottom: '4px' }}>
            <div
              onClick={() => setExpandedAc(isExpanded ? null : acKey)}
              style={{
                padding: '8px 12px',
                backgroundColor: isExpanded ? 'rgba(68,136,255,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isExpanded ? PANEL.ACCENT_DIM : PANEL.BORDER}`,
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '11px', color: PANEL.TEXT_PRIMARY, fontWeight: 'bold' }}>{acKey}</span>
              <span style={{ fontSize: '9px', color: PANEL.TEXT_MUTED }}>{def.type} {isExpanded ? '\u25BC' : '\u25B6'}</span>
            </div>

            {isExpanded && (
              <div style={{
                padding: '8px 12px',
                borderLeft: `2px solid ${PANEL.ACCENT_DIM}`,
                marginLeft: '12px',
              }}>
                <ParamRow label="Max Speed" unit="kts" value={acOverrides.maxSpeedKts ?? def.maxSpeedKts}
                  onChange={(v) => handleFieldChange(acKey, 'maxSpeedKts', v)} />
                <ParamRow label="Cruise Speed" unit="kts" value={acOverrides.cruiseSpeedKts ?? def.cruiseSpeedKts}
                  onChange={(v) => handleFieldChange(acKey, 'cruiseSpeedKts', v)} />
                <ParamRow label="Ceiling" unit="ft" value={acOverrides.ceilingFt ?? def.ceilingFt}
                  onChange={(v) => handleFieldChange(acKey, 'ceilingFt', v)} />
                <ParamRow label="Fuel Capacity" unit="lbs" value={acOverrides.fuelCapacityLbs ?? def.fuelCapacityLbs}
                  onChange={(v) => handleFieldChange(acKey, 'fuelCapacityLbs', v)} />
                <ParamRow label="Burn Rate" unit="lbs/hr" value={acOverrides.fuelBurnCruiseLbsHr ?? def.fuelBurnCruiseLbsHr}
                  onChange={(v) => handleFieldChange(acKey, 'fuelBurnCruiseLbsHr', v)} />
                <ParamRow label="RCS" unit="m²" value={acOverrides.rcsM2 ?? def.rcsM2}
                  onChange={(v) => handleFieldChange(acKey, 'rcsM2', v)} />
                {loadout && (
                  <>
                    <div style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, margin: '8px 0 4px', letterSpacing: '0.5px' }}>
                      LOADOUT
                    </div>
                    <ParamRow label={loadout.primaryWeapon} unit="rds" value={loadout.primaryAmmo}
                      onChange={() => {}} />
                    <ParamRow label={loadout.secondaryWeapon} unit="rds" value={loadout.secondaryAmmo}
                      onChange={() => {}} />
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Weapon data section */}
      <div style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, padding: '12px 4px 8px', letterSpacing: '0.5px' }}>
        WEAPON DATA
      </div>
      {Object.entries(WEAPON_DEFAULTS).map(([key, wep]) => (
        <div key={key} style={{
          padding: '6px 12px',
          fontSize: '10px',
          color: PANEL.TEXT_SECONDARY,
          display: 'flex',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${PANEL.BORDER}`,
        }}>
          <span style={{ color: PANEL.TEXT_PRIMARY }}>{key}</span>
          <span>Mach {wep.speedMach} | {wep.maxRangeKm}km | {wep.flightTimeSec}s</span>
        </div>
      ))}
    </div>
  );
}

function ParamRow({ label, unit, value, onChange }: {
  label: string; unit: string; value: number; onChange: (v: string) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '3px 0',
      fontSize: '10px',
    }}>
      <span style={{ color: PANEL.TEXT_SECONDARY }}>{label}</span>
      <div>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '70px',
            padding: '2px 6px',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: `1px solid ${PANEL.BORDER}`,
            borderRadius: '3px',
            color: PANEL.TEXT_PRIMARY,
            fontSize: '10px',
            fontFamily: PANEL.FONT_MONO,
            textAlign: 'right',
          }}
        />
        <span style={{ color: PANEL.TEXT_MUTED, marginLeft: '4px', fontSize: '9px' }}>{unit}</span>
      </div>
    </div>
  );
}
