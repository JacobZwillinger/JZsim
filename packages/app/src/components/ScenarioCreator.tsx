import { useState } from 'react';
import { useUIStore } from '../store/ui-store.js';
import { PANEL } from '../styles/panel.js';
import { parseCommand } from '@jzsim/command-parser';
import type { Command } from '@jzsim/core';

export function ScenarioCreator({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dslText, setDslText] = useState('');
  const addCustomScenario = useUIStore((s) => s.addCustomScenario);
  const isRecording = useUIStore((s) => s.isRecording);
  const recordedCommands = useUIStore((s) => s.recordedCommands);
  const setIsRecording = useUIStore((s) => s.setIsRecording);
  const clearRecordedCommands = useUIStore((s) => s.clearRecordedCommands);
  const [mode, setMode] = useState<'dsl' | 'record'>('dsl');

  const handleSave = () => {
    if (!name.trim()) return;

    let commands: Command[];
    if (mode === 'record') {
      commands = [...recordedCommands];
    } else {
      // Parse DSL text line by line
      commands = dslText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => parseCommand(line))
        .filter((cmd): cmd is Command => cmd !== null);
    }

    if (commands.length === 0) return;

    addCustomScenario(name.trim(), description.trim() || 'Custom scenario', commands);
    setIsRecording(false);
    clearRecordedCommands();
    onClose();
  };

  const handleStartRecording = () => {
    clearRecordedCommands();
    setIsRecording(true);
    setMode('record');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div style={{
      padding: '12px',
      borderTop: `1px solid ${PANEL.BORDER}`,
    }}>
      <div style={{ fontSize: '9px', color: PANEL.TEXT_MUTED, letterSpacing: '0.5px', marginBottom: '8px' }}>
        CREATE SCENARIO
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Scenario name"
        style={{
          width: '100%',
          padding: '6px 10px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: `1px solid ${PANEL.BORDER}`,
          borderRadius: '4px',
          color: PANEL.TEXT_PRIMARY,
          fontSize: '11px',
          fontFamily: PANEL.FONT_MONO,
          marginBottom: '6px',
          boxSizing: 'border-box',
        }}
      />

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        style={{
          width: '100%',
          padding: '6px 10px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: `1px solid ${PANEL.BORDER}`,
          borderRadius: '4px',
          color: PANEL.TEXT_PRIMARY,
          fontSize: '11px',
          fontFamily: PANEL.FONT_MONO,
          marginBottom: '8px',
          boxSizing: 'border-box',
        }}
      />

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        <button
          onClick={() => setMode('dsl')}
          style={{
            flex: 1,
            padding: '4px',
            background: mode === 'dsl' ? 'rgba(68,136,255,0.15)' : 'transparent',
            border: `1px solid ${mode === 'dsl' ? PANEL.ACCENT_DIM : PANEL.BORDER}`,
            borderRadius: '4px',
            color: mode === 'dsl' ? PANEL.ACCENT : PANEL.TEXT_MUTED,
            fontSize: '9px',
            cursor: 'pointer',
            fontFamily: PANEL.FONT_MONO,
          }}
        >
          DSL TEXT
        </button>
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          style={{
            flex: 1,
            padding: '4px',
            background: isRecording ? 'rgba(255,68,68,0.15)' : mode === 'record' ? 'rgba(68,136,255,0.15)' : 'transparent',
            border: `1px solid ${isRecording ? PANEL.DANGER : mode === 'record' ? PANEL.ACCENT_DIM : PANEL.BORDER}`,
            borderRadius: '4px',
            color: isRecording ? PANEL.DANGER : mode === 'record' ? PANEL.ACCENT : PANEL.TEXT_MUTED,
            fontSize: '9px',
            cursor: 'pointer',
            fontFamily: PANEL.FONT_MONO,
          }}
        >
          {isRecording ? '\u25CF STOP' : '\u25CF RECORD'}
        </button>
      </div>

      {mode === 'dsl' && (
        <textarea
          value={dslText}
          onChange={(e) => setDslText(e.target.value)}
          placeholder={'# One command per line\nSPAWN F-15C EAGLE01 AT 26.35 127.77 ALT 25000 SIDE blue'}
          rows={6}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: `1px solid ${PANEL.BORDER}`,
            borderRadius: '4px',
            color: PANEL.TEXT_PRIMARY,
            fontSize: '10px',
            fontFamily: PANEL.FONT_MONO,
            resize: 'vertical',
            marginBottom: '8px',
            boxSizing: 'border-box',
          }}
        />
      )}

      {mode === 'record' && (
        <div style={{
          padding: '8px',
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: `1px solid ${PANEL.BORDER}`,
          borderRadius: '4px',
          marginBottom: '8px',
          fontSize: '10px',
          color: PANEL.TEXT_MUTED,
          maxHeight: '120px',
          overflow: 'auto',
        }}>
          {recordedCommands.length === 0
            ? (isRecording ? 'Recording... Type commands in console.' : 'Click RECORD then type commands.')
            : recordedCommands.map((cmd, i) => (
                <div key={i} style={{ color: PANEL.TEXT_SECONDARY, padding: '2px 0' }}>
                  {cmd.type} {('callsign' in cmd) ? (cmd as any).callsign : ''}
                </div>
              ))
          }
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          style={{
            flex: 1,
            padding: '6px',
            background: name.trim() ? 'rgba(68,136,255,0.2)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${name.trim() ? PANEL.ACCENT_DIM : PANEL.BORDER}`,
            borderRadius: '4px',
            color: name.trim() ? PANEL.ACCENT : PANEL.TEXT_MUTED,
            fontSize: '10px',
            cursor: name.trim() ? 'pointer' : 'default',
            fontFamily: PANEL.FONT_MONO,
          }}
        >
          SAVE
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '6px',
            background: 'transparent',
            border: `1px solid ${PANEL.BORDER}`,
            borderRadius: '4px',
            color: PANEL.TEXT_MUTED,
            fontSize: '10px',
            cursor: 'pointer',
            fontFamily: PANEL.FONT_MONO,
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
