'use client';

type Props = {
  title: string;
  phase: number;
  onClose: () => void;
};

export default function PlaceholderModal({ title, phase, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 40,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(60vw, 480px)',
          background: 'var(--bg-raised)',
          borderLeft: '1px solid var(--line)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: 18, padding: '2px 6px' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 32, opacity: 0.3 }}>◌</div>
          <p style={{ color: 'var(--fg-muted)', fontSize: 13, margin: 0 }}>
            Coming in Phase {phase}
          </p>
          <p style={{ color: 'var(--fg-dim)', fontSize: 11, fontFamily: 'var(--font-mono)', margin: 0 }}>
            This feature is not yet implemented.
          </p>
        </div>
      </div>
    </>
  );
}
