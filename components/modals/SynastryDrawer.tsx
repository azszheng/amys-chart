'use client';

import { useState } from 'react';
import type { NatalChart, ResolvedBirth, BodyId } from '@/lib/astro/types';
import { computeSynastry } from '@/lib/astro/synastry';
import BirthForm from '@/components/BirthForm';
import { PLANET_GLYPH } from '@/components/charts/glyphs';
import { ASPECT_SYMBOL, ASPECT_COLOR } from '@/components/tables/tableUtils';

const BODY_NAME: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'N.Node', asc: 'AC', mc: 'MC',
};

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function personSummary(chart: NatalChart): string {
  const b    = chart.western.bodies;
  const name = chart.input.name?.trim();
  const parts: string[] = [];
  if (name) parts.push(name);
  if (b.sun)  parts.push(`${cap(b.sun.sign)} Sun`);
  if (b.moon) parts.push(`${cap(b.moon.sign)} Moon`);
  if (b.asc)  parts.push(`${cap(b.asc.sign)} Rising`);
  return parts.join(' · ');
}

export default function SynastryDrawer({ chart: chartA, onClose }: { chart: NatalChart; onClose: () => void }) {
  const [chartB, setChartB] = useState<NatalChart | null>(null);

  const aspects = chartB ? computeSynastry(chartA, chartB) : [];
  const nameA   = chartA.input.name?.trim() || 'Person A';
  const nameB   = chartB?.input.name?.trim() || 'Person B';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40 }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(68vw, 620px)',
        background: 'var(--bg-raised)', borderLeft: '1px solid var(--line)',
        zIndex: 50, display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Synastry
            </h2>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', lineHeight: 1.5, maxWidth: 380 }}>
              Two birth charts compared side by side — the inter-aspects between Person A and Person B's planets reveal the dynamics, natural chemistry, and friction in a relationship.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: 18, padding: '2px 6px', flexShrink: 0 }}>×</button>
        </div>

        <div style={{ flex: 1, padding: '20px 0' }}>

          {/* Person A */}
          <div style={{ padding: '0 24px 16px', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
            <p style={{ margin: '0 0 6px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Person A
            </p>
            <p style={{ margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
              {personSummary(chartA)}
            </p>
          </div>

          {/* Person B */}
          <div style={{ padding: '0 24px 20px', borderBottom: chartB ? '1px solid var(--line)' : undefined, marginBottom: chartB ? 20 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Person B
              </p>
              {chartB && (
                <button
                  onClick={() => setChartB(null)}
                  style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', background: 'none', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
                >
                  Change
                </button>
              )}
            </div>

            {chartB ? (
              <p style={{ margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                {personSummary(chartB)}
              </p>
            ) : (
              <BirthForm onResolved={(_b: ResolvedBirth, c: NatalChart) => setChartB(c)} />
            )}
          </div>

          {/* Inter-aspects */}
          {chartB && (
            <div style={{ padding: '0 24px' }}>
              <p style={{ margin: '0 0 10px', fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Inter-Aspects
                <span style={{ color: 'var(--fg-dim)', textTransform: 'none', marginLeft: 6 }}>
                  {nameA} ↔ {nameB}
                </span>
              </p>

              {aspects.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
                  No major inter-aspects found between these charts.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={th}>{nameA}</th>
                      <th style={{ ...th, textAlign: 'center' }}>Asp</th>
                      <th style={th}>{nameB}</th>
                      <th style={{ ...th }}>Orb</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aspects.map((asp, i) => {
                      const color  = ASPECT_COLOR[asp.kind];
                      const symbol = ASPECT_SYMBOL[asp.kind] ?? asp.kind;
                      const glyphA = PLANET_GLYPH[asp.bodyA as BodyId] ?? '';
                      const glyphB = PLANET_GLYPH[asp.bodyB as BodyId] ?? '';
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}>
                          <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                            {glyphA} {BODY_NAME[asp.bodyA] ?? asp.bodyA}
                          </td>
                          <td style={{ ...td, textAlign: 'center', color, fontWeight: 600, fontSize: 14 }}>
                            {symbol}
                          </td>
                          <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                            {glyphB} {BODY_NAME[asp.bodyB] ?? asp.bodyB}
                          </td>
                          <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', fontSize: 11 }}>
                            {asp.orb.toFixed(2)}°
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--line)', padding: '10px 24px' }}>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
            Synastry · Western tropical · Standard orbs
          </p>
        </div>
      </div>
    </>
  );
}

const th: React.CSSProperties = { padding: '5px 8px', fontWeight: 500, textAlign: 'left' };
const td: React.CSSProperties = { padding: '5px 8px', verticalAlign: 'middle' };
