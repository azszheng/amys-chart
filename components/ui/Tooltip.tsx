'use client';

import { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export default function Tooltip({ text, children, width = 270, align = 'left' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const alignStyle: React.CSSProperties =
    align === 'right'  ? { right: 0, left: 'auto' } :
    align === 'center' ? { left: '50%', transform: 'translateX(-50%)' } :
                         { left: 0 };

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{ borderBottom: '1px dotted currentColor' }}>{children}</span>
      {visible && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          ...alignStyle,
          width,
          background: 'var(--bg-raised)',
          border: '1px solid var(--accent)',
          borderRadius: 4,
          padding: '10px 12px',
          fontSize: 11,
          color: 'var(--fg)',
          lineHeight: 1.7,
          zIndex: 300,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          whiteSpace: 'normal',
          fontWeight: 400,
          textTransform: 'none',
          letterSpacing: 'normal',
          fontFamily: 'var(--font-sans, sans-serif)',
        }}>
          {text}
        </div>
      )}
    </span>
  );
}
