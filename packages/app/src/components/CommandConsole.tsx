import { useState, useRef, useEffect, useCallback } from 'react';
import { parseCommand, getCommandKeywords, getCommandHelp } from '@jzsim/command-parser';
import { useUIStore } from '../store/ui-store.js';
import { PANEL, floatingPanelStyle } from '../styles/panel.js';
import type { Command } from '@jzsim/core';

interface Props {
  onCommand: (command: Command) => void;
}

export function CommandConsole({ onCommand }: Props) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const eventLog = useUIStore((s) => s.eventLog);
  const consoleOpen = useUIStore((s) => s.consoleOpen);
  const isRecording = useUIStore((s) => s.isRecording);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [eventLog]);

  // Auto-focus input when console opens
  useEffect(() => {
    if (consoleOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [consoleOpen]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Check for help
    if (trimmed.toUpperCase() === 'HELP') {
      const keywords = getCommandKeywords();
      for (const kw of keywords) {
        const help = getCommandHelp(kw);
        if (help) {
          useUIStore.getState().addLogEntry(0, `  ${help}`);
        }
      }
      setInput('');
      return;
    }

    const cmd = parseCommand(trimmed);
    if (cmd) {
      onCommand(cmd);
      setHistory((h) => [...h, trimmed]);
      setHistoryIdx(-1);
      // Record for scenario creation
      if (useUIStore.getState().isRecording) {
        useUIStore.getState().addRecordedCommand(cmd);
      }
    } else {
      useUIStore.getState().addLogEntry(0, `Unknown command: ${trimmed}. Type HELP for available commands.`);
    }
    setInput('');
  }, [input, onCommand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      useUIStore.getState().setConsoleOpen(false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = historyIdx < 0 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx >= 0) {
        const newIdx = historyIdx + 1;
        if (newIdx >= history.length) {
          setHistoryIdx(-1);
          setInput('');
        } else {
          setHistoryIdx(newIdx);
          setInput(history[newIdx]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const words = input.split(/\s+/);
      if (words.length === 1 && words[0].length > 0) {
        const prefix = words[0].toUpperCase();
        const matches = getCommandKeywords().filter((k) => k.startsWith(prefix));
        if (matches.length === 1) {
          setInput(matches[0] + ' ');
        }
      }
    }
  }, [handleSubmit, history, historyIdx, input]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const typeColors: Record<string, string> = {
    error: PANEL.DANGER,
    warn: PANEL.WARNING,
    destroy: '#ff6666',
    combat: '#ff8844',
    radar: '#44aaff',
    mission: '#44ffaa',
    spawn: '#aaffaa',
    remove: '#666',
    cmd: '#88bbff',
  };

  return (
    <div style={{
      ...floatingPanelStyle,
      bottom: `${PANEL.STATUS_BAR_HEIGHT + 8}px`,
      left: '50%',
      transform: consoleOpen ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
      width: 'min(800px, 90vw)',
      height: '280px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 90,
      opacity: consoleOpen ? 1 : 0,
      pointerEvents: consoleOpen ? 'auto' : 'none',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        borderBottom: `1px solid ${PANEL.BORDER}`,
        flexShrink: 0,
      }}>
        <span style={{ color: PANEL.ACCENT, fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', flex: 1, fontFamily: PANEL.FONT_MONO }}>
          COMMAND CONSOLE
        </span>
        {isRecording && (
          <span style={{ color: PANEL.DANGER, fontSize: '9px', fontFamily: PANEL.FONT_MONO, marginRight: '8px' }}>
            REC
          </span>
        )}
        <span style={{ color: PANEL.TEXT_MUTED, fontSize: '9px', fontFamily: PANEL.FONT_MONO }}>
          ESC to close &middot; ` to toggle
        </span>
      </div>

      {/* Log output */}
      <div
        ref={logRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 12px',
          fontSize: '11px',
          lineHeight: '1.6',
          fontFamily: PANEL.FONT_MONO,
        }}
      >
        {eventLog.map((entry, i) => {
          const color = entry.type ? typeColors[entry.type] ?? PANEL.TEXT_SECONDARY : PANEL.TEXT_SECONDARY;
          return (
            <div key={i} style={{ color }}>
              <span style={{ color: PANEL.TEXT_MUTED, opacity: 0.5 }}>[{formatTime(entry.time)}]</span>{' '}
              {entry.message}
            </div>
          );
        })}
      </div>

      {/* Command input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        borderTop: `1px solid ${PANEL.BORDER}`,
        backgroundColor: 'rgba(0,0,0,0.2)',
      }}>
        <span style={{ color: PANEL.ACCENT, marginRight: '8px', fontSize: '13px' }}>&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command (HELP for list)..."
          spellCheck={false}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: PANEL.TEXT_PRIMARY,
            fontSize: '12px',
            fontFamily: PANEL.FONT_MONO,
          }}
        />
      </div>
    </div>
  );
}
