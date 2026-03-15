import { getCommandHelp, getCommandKeywords } from '@jzsim/command-parser';
import { PANEL } from '../../../styles/panel.js';
import { H2, P, Note } from '../styles.js';

export function CommandRef() {
  const keywords = getCommandKeywords();
  return (
    <>
      <H2>Command Reference</H2>
      <P>
        All commands are case-insensitive. Callsigns are case-insensitive. Commands are
        entered in the command console, opened with the backtick key.
      </P>
      <Note>
        Type <code style={{ color: PANEL.ACCENT }}>HELP</code> in the command console to
        see this reference inline.
      </Note>
      <div style={{ borderTop: `1px solid ${PANEL.BORDER}` }}>
        {keywords.map((kw) => {
          const help = getCommandHelp(kw);
          return (
            <div key={kw} style={{
              padding: '10px 0',
              borderBottom: `1px solid ${PANEL.BORDER}`,
            }}>
              <div style={{ color: PANEL.ACCENT, fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                {kw}
              </div>
              <div style={{ color: PANEL.TEXT_SECONDARY, fontSize: '11px', lineHeight: 1.5 }}>
                {help || 'No help available'}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
