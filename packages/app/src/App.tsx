import { useCallback } from 'react';
import { MapView } from './components/MapView.js';
import { CommandConsole } from './components/CommandConsole.js';
import { StatusBar } from './components/StatusBar.js';
import { Toolbar } from './components/Toolbar.js';
import { LeftDrawer } from './components/LeftDrawer.js';
import { RightDrawer } from './components/RightDrawer.js';
import { useSimulation } from './hooks/useSimulation.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { HelpPage } from './components/HelpPage.js';
import type { Scenario } from './scenarios/index.js';

export function App() {
  const { sendCommand, setPaused, setTimeMultiplier } = useSimulation();
  useKeyboardShortcuts();

  const loadScenario = useCallback((scenario: Scenario) => {
    const commands = scenario.commands();
    for (const cmd of commands) {
      sendCommand(cmd);
    }
  }, [sendCommand]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: '#0a0a0f',
      overflow: 'hidden',
    }}>
      {/* Map fills entire viewport */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapView />
      </div>

      {/* Floating toolbar (top-left icon buttons) */}
      <Toolbar />

      {/* Left drawer (assets, scenarios, radar) */}
      <LeftDrawer onLoadScenario={loadScenario} onCommand={sendCommand} />

      {/* Right drawer (entity detail) */}
      <RightDrawer />

      {/* Command console (floating overlay) */}
      <CommandConsole onCommand={sendCommand} />

      {/* Status bar (bottom) */}
      <StatusBar
        onPauseToggle={setPaused}
        onTimeMultiplier={setTimeMultiplier}
        onLoadScenario={loadScenario}
      />

      {/* Help overlay */}
      <HelpPage />
    </div>
  );
}
