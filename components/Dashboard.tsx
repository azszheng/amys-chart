'use client';

import { useState } from 'react';
import BirthForm from '@/components/BirthForm';
import WesternWheel from '@/components/charts/WesternWheel';
import NorthIndianDiamond from '@/components/charts/NorthIndianDiamond';
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
          <div
            className="flex flex-col md:flex-row gap-6 items-start justify-center"
          >
            {/* Western tropical wheel */}
            <div className="flex flex-col items-center gap-2">
              <h3
                className="text-xs uppercase tracking-widest"
                style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}
              >
                Western · Tropical · Placidus
              </h3>
              <div style={{ maxWidth: 460 }}>
                <WesternWheel chart={chart} />
              </div>
              <p className="text-xs" style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
                ASC {chart.western.bodies.asc?.sign} · MC {chart.western.houses.mc.toFixed(1)}°
              </p>
            </div>

            {/* Divider */}
            <div
              className="hidden md:block self-stretch"
              style={{ width: 1, backgroundColor: 'var(--line)' }}
            />

            {/* Vedic sidereal diamond */}
            <div className="flex flex-col items-center gap-2">
              <h3
                className="text-xs uppercase tracking-widest"
                style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}
              >
                Vedic · Sidereal · Whole Sign
              </h3>
              <div style={{ maxWidth: 460 }}>
                <NorthIndianDiamond chart={chart} />
              </div>
              <p className="text-xs" style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
                Lahiri ayanamsa {chart.vedic.ayanamsa.toFixed(4)}°
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
