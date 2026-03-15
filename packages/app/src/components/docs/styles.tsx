import React from 'react';
import { PANEL } from '../../styles/panel.js';

export const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ color: PANEL.TEXT_PRIMARY, fontSize: '16px', marginBottom: '12px', marginTop: '20px', fontWeight: 'bold' }}>{children}</h2>
);

export const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ color: PANEL.TEXT_PRIMARY, fontSize: '13px', marginBottom: '8px', marginTop: '16px', fontWeight: 'bold' }}>{children}</h3>
);

export const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: PANEL.TEXT_SECONDARY, fontSize: '12px', lineHeight: 1.7, marginBottom: '12px' }}>{children}</p>
);

export const Code = ({ children }: { children: React.ReactNode }) => (
  <code style={{
    backgroundColor: 'rgba(68,136,255,0.08)',
    padding: '2px 6px',
    borderRadius: '3px',
    color: PANEL.ACCENT,
    fontSize: '11px',
  }}>{children}</code>
);

export const Pre = ({ children }: { children: string }) => (
  <pre style={{
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: `1px solid ${PANEL.BORDER}`,
    borderRadius: '6px',
    padding: '12px',
    color: PANEL.TEXT_PRIMARY,
    fontSize: '11px',
    lineHeight: 1.6,
    overflow: 'auto',
    marginBottom: '12px',
  }}>{children}</pre>
);

export const Ul = ({ children }: { children: React.ReactNode }) => (
  <ul style={{
    color: PANEL.TEXT_SECONDARY,
    fontSize: '12px',
    lineHeight: 2,
    paddingLeft: '20px',
    marginBottom: '12px',
  }}>{children}</ul>
);

export const Li = ({ children }: { children: React.ReactNode }) => (
  <li style={{ marginBottom: '2px' }}>{children}</li>
);

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '11px',
  marginBottom: '16px',
};

export const Table = ({ children }: { children: React.ReactNode }) => (
  <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
    <table style={tableStyle}>{children}</table>
  </div>
);

export const Th = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <th style={{
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: `1px solid ${PANEL.BORDER}`,
    color: PANEL.ACCENT,
    fontWeight: 'bold',
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    ...style,
  }}>{children}</th>
);

export const Td = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <td style={{
    padding: '6px 10px',
    borderBottom: `1px solid rgba(68,136,255,0.06)`,
    color: PANEL.TEXT_SECONDARY,
    whiteSpace: 'nowrap',
    ...style,
  }}>{children}</td>
);

export const Note = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    backgroundColor: 'rgba(68,136,255,0.06)',
    borderLeft: `3px solid ${PANEL.ACCENT}`,
    padding: '10px 14px',
    borderRadius: '0 6px 6px 0',
    marginBottom: '14px',
    fontSize: '11px',
    color: PANEL.TEXT_SECONDARY,
    lineHeight: 1.6,
  }}>
    <span style={{ color: PANEL.ACCENT, fontWeight: 'bold', marginRight: '6px' }}>NOTE:</span>
    {children}
  </div>
);

export const Tag = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'beginner' | 'technical' | 'default' }) => {
  const colors = {
    beginner: { bg: 'rgba(68,170,68,0.12)', text: PANEL.SUCCESS },
    technical: { bg: 'rgba(255,170,51,0.12)', text: PANEL.WARNING },
    default: { bg: 'rgba(68,136,255,0.12)', text: PANEL.ACCENT },
  };
  const c = colors[variant];
  return (
    <span style={{
      display: 'inline-block',
      backgroundColor: c.bg,
      color: c.text,
      padding: '2px 8px',
      borderRadius: '3px',
      fontSize: '9px',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '8px',
    }}>{children}</span>
  );
};

export const StepNumber = ({ n }: { n: number }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: PANEL.ACCENT,
    color: '#000',
    fontSize: '10px',
    fontWeight: 'bold',
    marginRight: '8px',
    flexShrink: 0,
  }}>{n}</span>
);

export const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '14px' }}>
    <StepNumber n={n} />
    <div style={{ flex: 1, color: PANEL.TEXT_SECONDARY, fontSize: '12px', lineHeight: 1.7 }}>{children}</div>
  </div>
);
