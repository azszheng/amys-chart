'use client';

import type { InterpretSection } from '@/lib/ai/prompts';

type Props = {
  section: InterpretSection;
  onInterpret: (section: InterpretSection) => void;
};

export default function InterpretButton({ section, onInterpret }: Props) {
  return (
    <button
      onClick={() => onInterpret(section)}
      title="Interpret with AI"
      aria-label={`Interpret ${section.label} with AI`}
      style={{
        background: 'none',
        border: '1px solid var(--fg-dim)',
        borderRadius: '50%',
        width: 18,
        height: 18,
        cursor: 'pointer',
        color: 'var(--fg-dim)',
        fontSize: 9,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        flexShrink: 0,
        transition: 'border-color 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fg-dim)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-dim)';
      }}
    >
      ◌
    </button>
  );
}
