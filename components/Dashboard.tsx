'use client';

import { useState } from 'react';
import BirthForm from '@/components/BirthForm';
import WesternWheel from '@/components/charts/WesternWheel';
import NorthIndianDiamond from '@/components/charts/NorthIndianDiamond';
import PlanetTable from '@/components/tables/PlanetTable';
import HouseTable from '@/components/tables/HouseTable';
import AspectTable from '@/components/tables/AspectTable';
import DignityTable from '@/components/tables/DignityTable';
import VedicRashiTable from '@/components/tables/VedicRashiTable';
import PlaceholderModal from '@/components/modals/PlaceholderModal';
import TransitsDrawer from '@/components/modals/TransitsDrawer';
import { SIGN_GLYPH } from '@/components/charts/glyphs';
import type { ResolvedBirth, NatalChart } from '@/lib/astro/types';

type TableTab = 'planets' | 'houses' | 'aspects' | 'dignities' | 'vedic';
type ModalId  = 'transits' | 'progressions' | 'dashas' | 'synastry';

const TABS: { id: TableTab; label: string }[] = [
  { id: 'planets',   label: 'Planets'   },
  { id: 'houses',    label: 'Houses'    },
  { id: 'aspects',   label: 'Aspects'   },
  { id: 'dignities', label: 'Dignities' },
  { id: 'vedic',     label: 'Vedic Rashi' },
];

const MODALS: { id: ModalId; label: string; phase: number }[] = [
  { id: 'transits',     label: 'Transits',     phase: 6 },
  { id: 'progressions', label: 'Progressions', phase: 7 },
  { id: 'dashas',       label: 'Dashas',       phase: 8 },
  { id: 'synastry',     label: 'Synastry',     phase: 9 },
];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function chartSummary(chart: NatalChart, birth: ResolvedBirth): string {
  const sun  = chart.western.bodies.sun;
  const moon = chart.western.bodies.moon;
  const asc  = chart.western.bodies.asc;
  const parts: string[] = [];
  if (sun)  parts.push(`${SIGN_GLYPH[sun.sign]} ${cap(sun.sign)} Sun`);
  if (moon) parts.push(`${SIGN_GLYPH[moon.sign]} ${cap(moon.sign)} Moon`);
  if (asc)  parts.push(`${SIGN_GLYPH[asc.sign]} ${cap(asc.sign)} rising`);
  const [y, m, d] = birth.date.split('-').map(Number);
  const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  parts.push(dateStr);
  parts.push([birth.city, birth.region].filter(Boolean).join(', '));
  return parts.join(' · ');
}

export default function Dashboard() {
  const [birth,    setBirth]    = useState<ResolvedBirth | null>(null);
  const [chart,    setChart]    = useState<NatalChart | null>(null);
  const [formOpen, setFormOpen] = useState(true);
  const [tab,      setTab]      = useState<TableTab>('planets');
  const [modal,    setModal]    = useState<ModalId | null>(null);

  function handleResolved(b: ResolvedBirth, c: NatalChart) {
    setBirth(b);
    setChart(c);
    setFormOpen(false);
  }

  const section: React.CSSProperties = {
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg-raised)',
  };

  const sectionHead: React.CSSProperties = {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--fg-muted)',
    fontFamily: 'var(--font-mono)',
  };

  return (
    <div className="flex-1 px-4 py-6 max-w-5xl w-full mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Birth Data section ── */}
      <section style={section}>
        {chart && birth && !formOpen ? (
          /* Collapsed summary */
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
              {chartSummary(chart, birth)}
            </span>
            <button
              onClick={() => setFormOpen(true)}
              style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--accent)', background: 'none',
                border: '1px solid var(--line)', borderRadius: 4, padding: '3px 10px', cursor: 'pointer',
              }}
            >
              Edit
            </button>
          </div>
        ) : (
          /* Expanded form */
          <div style={{ padding: '16px 20px' }}>
            <h2 style={{ ...sectionHead, marginBottom: 16 }}>Birth Data</h2>
            <BirthForm onResolved={handleResolved} />
          </div>
        )}
      </section>

      {/* ── Chart wheels ── */}
      {chart && (
        <section style={section}>
          <div style={{ padding: '16px 20px 8px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <h3 style={sectionHead}>Western · Tropical · Placidus</h3>
                <div style={{ maxWidth: 420 }}>
                  <WesternWheel chart={chart} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <h3 style={sectionHead}>Vedic · Sidereal · Whole Sign</h3>
                <div style={{ maxWidth: 420 }}>
                  <NorthIndianDiamond chart={chart} />
                </div>
                <p style={{ fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                  Lahiri ayanamsa {chart.vedic.ayanamsa.toFixed(4)}°
                </p>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── Data tables ── */}
      {chart && (
        <section style={section}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', padding: '0 4px' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 14px',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: tab === t.id ? 'var(--accent)' : 'var(--fg-dim)',
                  borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Table content */}
          <div style={{ padding: '4px 0 12px' }}>
            {tab === 'planets'   && <PlanetTable    chart={chart} />}
            {tab === 'houses'    && <HouseTable     chart={chart} />}
            {tab === 'aspects'   && <AspectTable    chart={chart} />}
            {tab === 'dignities' && <DignityTable   chart={chart} />}
            {tab === 'vedic'     && <VedicRashiTable chart={chart} />}
          </div>
        </section>
      )}

      {/* ── Actions ── */}
      {chart && (
        <section style={{ ...section, padding: '14px 20px' }}>
          <p style={{ ...sectionHead, marginBottom: 12 }}>Advanced</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MODALS.map(m => (
              <button
                key={m.id}
                onClick={() => setModal(m.id)}
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--fg-muted)',
                  background: 'none',
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  padding: '6px 14px',
                  cursor: 'pointer',
                }}
              >
                ▸ {m.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Modals / drawers ── */}
      {modal === 'transits' && chart && (
        <TransitsDrawer chart={chart} onClose={() => setModal(null)} />
      )}
      {modal && modal !== 'transits' && (
        <PlaceholderModal
          title={MODALS.find(m => m.id === modal)!.label}
          phase={MODALS.find(m => m.id === modal)!.phase}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
