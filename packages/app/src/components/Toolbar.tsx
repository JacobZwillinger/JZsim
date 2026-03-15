import { useUIStore } from '../store/ui-store.js';
import { PANEL } from '../styles/panel.js';

type DrawerTab = 'assets' | 'scenarios' | 'radar' | 'missions' | 'aar' | 'data';

const NAV_ITEMS: { tab: DrawerTab; icon: string; label: string }[] = [
  { tab: 'assets',    icon: '≡',  label: 'Order of Battle' },
  { tab: 'scenarios', icon: '📋', label: 'Scenarios' },
  { tab: 'radar',     icon: '📡', label: 'Radar' },
  { tab: 'missions',  icon: '✈',  label: 'Missions' },
  { tab: 'aar',       icon: '📊', label: 'After Action Report' },
  { tab: 'data',      icon: '⚙',  label: 'Parametric Data' },
];

export function Toolbar() {
  const leftDrawerOpen = useUIStore((s) => s.leftDrawerOpen);
  const toggleLeftDrawer = useUIStore((s) => s.toggleLeftDrawer);
  const leftDrawerTab = useUIStore((s) => s.leftDrawerTab);
  const setLeftDrawerTab = useUIStore((s) => s.setLeftDrawerTab);

  const handleClick = (tab: DrawerTab) => {
    if (leftDrawerOpen && leftDrawerTab === tab) {
      toggleLeftDrawer();
    } else {
      setLeftDrawerTab(tab);
      if (!leftDrawerOpen) toggleLeftDrawer();
    }
  };

  return (
    <nav
      aria-label="Main navigation"
      role="tablist"
      aria-orientation="vertical"
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        bottom: `${PANEL.STATUS_BAR_HEIGHT + 12}px`,
        width: '44px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        zIndex: 90,
        backgroundColor: PANEL.BG,
        backdropFilter: PANEL.BLUR,
        WebkitBackdropFilter: PANEL.BLUR,
        border: `1px solid ${PANEL.BORDER}`,
        borderRadius: PANEL.RADIUS,
        boxShadow: PANEL.SHADOW,
        padding: '4px',
      }}
    >
      {NAV_ITEMS.map(({ tab, icon, label }) => {
        const isActive = leftDrawerOpen && leftDrawerTab === tab;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            onClick={() => handleClick(tab)}
            title={label}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isActive ? 'rgba(68,136,255,0.12)' : 'transparent',
              border: 'none',
              borderLeft: isActive ? `2px solid ${PANEL.ACCENT}` : '2px solid transparent',
              borderRadius: '4px',
              color: isActive ? PANEL.ACCENT : PANEL.TEXT_MUTED,
              cursor: 'pointer',
              fontSize: '16px',
              fontFamily: PANEL.FONT_MONO,
              padding: 0,
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
          >
            {icon}
          </button>
        );
      })}
    </nav>
  );
}
