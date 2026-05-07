'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NatalChart, TransitAspect, BodyId } from '@/lib/astro/types';
import { PLANET_GLYPH } from '@/components/charts/glyphs';
import { ASPECT_SYMBOL, ASPECT_COLOR } from '@/components/tables/tableUtils';

const BODY_NAME: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'N. Node', southNode: 'S. Node', chiron: 'Chiron',
  asc: 'AC', mc: 'MC',
};

// Slowest first = most significant first
const TRANSIT_ORDER: BodyId[] = [
  'pluto', 'neptune', 'uranus', 'saturn', 'jupiter',
  'mars', 'sun', 'venus', 'mercury', 'moon', 'trueNode',
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function toNoonUTC(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`;
}

function fmtDays(d: number): string {
  if (d > 99) return '>99d';
  if (d >= 1)  return `${d.toFixed(1)}d`;
  return `${Math.round(d * 24)}h`;
}

type Props = { chart: NatalChart; onClose: () => void };

export default function TransitsDrawer({ chart, onClose }: Props) {
  const [date,     setDate]     = useState(todayISO());
  const [aspects,  setAspects]  = useState<TransitAspect[] | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const fetchTransits = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/transits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ natal: chart, whenUTC: toNoonUTC(d) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAspects(data.aspects);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [chart]);

  useEffect(() => { fetchTransits(date); }, [date, fetchTransits]);

  // Group by transiting body in significance order
  const grouped: Record<string, TransitAspect[]> = {};
  if (aspects) {
    for (const id of TRANSIT_ORDER) grouped[id] = [];
    for (const asp of aspects) {
      if (!grouped[asp.transitBody]) grouped[asp.transitBody] = [];
      grouped[asp.transitBody].push(asp);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.orb - b.orb);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40 }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(60vw, 520px)',
        background: 'var(--bg-raised)',
        borderLeft: '1px solid var(--line)',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Transits
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 2,
                color: 'var(--fg)', fontFamily: 'var(--font-mono)', fontSize: 11, padding: '4px 8px',
              }}
            />
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-dim)', fontSize: 18, padding: '2px 6px' }} aria-label="Close">×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '12px 0' }}>
          {loading && (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              Computing transits…
            </div>
          )}

          {error && (
            <div style={{ padding: '24px', color: 'var(--aspect-dynamic)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              Error: {error}
            </div>
          )}

          {!loading && !error && aspects && aspects.length === 0 && (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              No active transits on this date.
            </div>
          )}

          {!loading && !error && aspects && TRANSIT_ORDER.map(id => {
            const rows = grouped[id];
            if (!rows || rows.length === 0) return null;
            const glyph = PLANET_GLYPH[id] ?? '';
            const name  = BODY_NAME[id] ?? id;

            return (
              <div key={id} style={{ marginBottom: 4 }}>
                {/* Planet group header */}
                <div style={{ padding: '6px 24px', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--fg-glyph)', fontSize: 14 }}>{glyph}</span>
                  <span style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{name}</span>
                </div>

                {/* Aspect rows */}
                {rows.map((asp, i) => {
                  const nGlyph = PLANET_GLYPH[asp.natalBody] ?? '';
                  const nName  = BODY_NAME[asp.natalBody] ?? asp.natalBody;
                  const color  = ASPECT_COLOR[asp.kind];
                  const symbol = ASPECT_SYMBOL[asp.kind] ?? asp.kind;

                  return (
                    <div key={i} style={{ padding: '6px 24px 6px 36px', display: 'grid', gridTemplateColumns: '24px 1fr 60px 30px 50px', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--line)', fontSize: 12 }}>
                      {/* Aspect symbol */}
                      <span style={{ color, fontWeight: 600, fontSize: 14, textAlign: 'center' }}>{symbol}</span>
                      {/* Natal body */}
                      <span style={{ color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>{nGlyph} {nName}</span>
                      {/* Orb */}
                      <span style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right' }}>{asp.orb.toFixed(2)}°</span>
                      {/* A/S */}
                      <span style={{ color: asp.applying ? 'var(--aspect-harmonious)' : 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 10, textAlign: 'center' }}>
                        {asp.applying ? 'A' : 'S'}
                      </span>
                      {/* Days to exact */}
                      <span style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right' }}>
                        {fmtDays(asp.daysToExact)}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--line)', padding: '10px 24px' }}>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
            Orbs: same as natal · Noon UTC · A = applying · S = separating
          </p>
        </div>
      </div>
    </>
  );
}
