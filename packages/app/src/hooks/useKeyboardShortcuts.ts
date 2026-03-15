import { useEffect } from 'react';
import { useUIStore } from '../store/ui-store.js';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Exception: Escape should still work from inputs
        if (e.key !== 'Escape') return;
      }

      const state = useUIStore.getState();

      switch (e.key) {
        case '`':
          e.preventDefault();
          state.toggleConsole();
          break;

        case 'Escape':
          e.preventDefault();
          if (state.helpOpen) {
            state.toggleHelp();
          } else if (state.consoleOpen) {
            state.setConsoleOpen(false);
          } else if (state.rightDrawerOpen) {
            state.setSelectedEntityId(null);
          }
          break;

        case '1':
          e.preventDefault();
          state.toggleLeftDrawer();
          break;

        case '2':
          e.preventDefault();
          state.toggleRightDrawer();
          break;

        case 'F1':
          e.preventDefault();
          state.toggleHelp();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
