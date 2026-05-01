'use client';

import { useState } from 'react';
import BirthForm from '@/components/BirthForm';
import type { ResolvedBirth, NatalChart } from '@/lib/astro/types';

export default function Dashboard() {
  const [resolvedBirth, setResolvedBirth] = useState<ResolvedBirth | null>(null);
  const [chart, setChart] = useState<NatalChart | null>(null);

  function handleResolved(birth: ResolvedBirth, natal: NatalChart) {
    setResolvedBirth(birth);
    setChart(natal);
  }

  return (
    <div className="flex-1 px-6 py-6 max-w-5xl w-full mx-auto">
      <section
        className="border p-5"
        style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-raised)' }}
      >
        <h2
          className="text-xs uppercase tracking-widest mb-4"
          style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}
        >
          Birth Data
        </h2>
        <BirthForm onResolved={handleResolved} />
      </section>

      {chart && resolvedBirth && (
        <section
          className="mt-6 border p-5"
          style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-raised)' }}
        >
          <h2
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}
          >
            Natal Chart — Raw Output
          </h2>
          <p className="text-xs mb-4" style={{ color: 'var(--fg-dim)' }}>
            sweph v{chart.meta.swephVersion} · computed {chart.meta.computedAt} · Lahiri ayanamsa {chart.vedic.ayanamsa.toFixed(4)}°
          </p>
          <pre
            className="text-xs overflow-auto max-h-[60vh]"
            style={{ color: 'var(--fg)', fontFamily: 'var(--font-mono)', lineHeight: '1.6' }}
          >
            {JSON.stringify(chart, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
