'use client';

import { useState } from 'react';
import BirthForm from '@/components/BirthForm';
import type { ResolvedBirth } from '@/lib/astro/types';

export default function Dashboard() {
  const [resolvedBirth, setResolvedBirth] = useState<ResolvedBirth | null>(null);

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
        <BirthForm onResolved={setResolvedBirth} />
      </section>

      {resolvedBirth && (
        <section className="mt-6 border p-5" style={{ borderColor: 'var(--line)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-raised)' }}>
          <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
            Resolved Birth Data
          </h2>
          <pre
            className="text-xs overflow-auto"
            style={{ color: 'var(--fg)', fontFamily: 'var(--font-mono)', lineHeight: '1.6' }}
          >
            {JSON.stringify(resolvedBirth, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
