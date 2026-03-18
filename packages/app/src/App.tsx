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
import { useUIStore } from './store/ui-store.js';
import type { Scenario } from './scenarios/index.js';

export function App() {
  const { sendCommand, setPaused, setTimeMultiplier, resetSim } = useSimulation();
  useKeyboardShortcuts();

  const loadScenario = useCallback((scenario: Scenario) => {
    const entityCount = useUIStore.getState().entityCount;

    if (entityCount > 0) {
      const ok = window.confirm('Loading a new scenario will reset the current simulation. Continue?');
      if (!ok) return;
    }

    // Reset sim state, then load scenario commands
    resetSim();

    const commands = scenario.commands();
    for (const cmd of commands) {
      sendCommand(cmd);
    }

    // Start paused so user can review before pressing play
    setPaused(true);
  }, [sendCommand, resetSim, setPaused]);

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
        onReset={resetSim}
      />

      {/* Help overlay */}
      <HelpPage />
    </div>
  );
}
