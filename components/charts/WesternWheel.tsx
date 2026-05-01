import type { NatalChart, AspectKind } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';
import {
  CX, CY, R_OUTER, R_SIGN_IN, R_HOUSE_IN, R_PLANET, R_CORE,
  lonToAngle, polarToXY, midAngle,
} from './wheel-geometry';
import { PLANET_GLYPH, SIGN_GLYPH, WHEEL_BODIES } from './glyphs';

const ASPECT_COLOR: Record<AspectKind, string> = {
  trine:       'var(--aspect-harmonious)',
  sextile:     'var(--aspect-harmonious)',
  conjunction: 'var(--aspect-neutral)',
  opposition:  'var(--aspect-dynamic)',
  square:      'var(--aspect-dynamic)',
  quincunx:    'var(--aspect-minor)',
};

// Nudge planets that are within MIN_SEP degrees of each other
const MIN_SEP = 6;

type PlacedBody = { id: string; angle: number; r: number; lon: number };

function placePlanets(bodies: NatalChart['western']['bodies'], ascLon: number): PlacedBody[] {
  const placed = WHEEL_BODIES.filter(id => bodies[id]).map(id => ({
    id,
    angle: lonToAngle(bodies[id].longitude, ascLon),
    r: R_PLANET,
    lon: bodies[id].longitude,
  }));

  // Sort by angle, then nudge overlapping planets outward/inward in alternating rings
  placed.sort((a, b) => a.angle - b.angle);
  const rings = [R_PLANET, R_PLANET - 14, R_PLANET - 28];
  const ringIdx: number[] = new Array(placed.length).fill(0);

  for (let i = 0; i < placed.length; i++) {
    const prev = placed[(i - 1 + placed.length) % placed.length];
    const angDiff = ((placed[i].angle - prev.angle + 360) % 360);
    if (angDiff < MIN_SEP && i > 0) {
      ringIdx[i] = (ringIdx[i - 1] + 1) % rings.length;
    }
    placed[i].r = rings[ringIdx[i]];
  }

  return placed;
}

export default function WesternWheel({ chart }: { chart: NatalChart }) {
  const asc = chart.western.houses.asc;
  const { bodies, houses, aspects } = chart.western;

  const placed = placePlanets(bodies, asc);
  const placedMap = Object.fromEntries(placed.map(p => [p.id, p]));

  // Sign ring: 12 signs, each 30° in ecliptic
  const signRing = SIGNS.map((sign, i) => {
    const startLon = i * 30;
    const endLon   = startLon + 30;
    const midLon   = startLon + 15;
    const startA   = lonToAngle(startLon, asc);
    const midA     = lonToAngle(midLon, asc);
    const startOuter = polarToXY(R_OUTER,   startA);
    const startInner = polarToXY(R_SIGN_IN, startA);
    const midGlyph   = polarToXY((R_OUTER + R_SIGN_IN) / 2, midA);
    void endLon;
    return { sign, startOuter, startInner, midGlyph, midA };
  });

  // Degree ticks in sign ring (every 5°)
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const lon = i * 5;
    const a   = lonToAngle(lon, asc);
    const isMajor = i % 2 === 0; // every 10°
    const rInner  = isMajor ? R_OUTER - 9 : R_OUTER - 5;
    return { a, rInner };
  });

  // House cusps
  const cusps = houses.cusps.map((lon, i) => {
    const a = lonToAngle(lon, asc);
    const outer = polarToXY(R_SIGN_IN,  a);
    const inner = polarToXY(R_HOUSE_IN, a);
    // house number at midpoint of house sector
    const nextLon = houses.cusps[(i + 1) % 12];
    const midA = midAngle(a, lonToAngle(nextLon, asc));
    const numPt  = polarToXY((R_SIGN_IN + R_HOUSE_IN) / 2, midA);
    return { outer, inner, num: i + 1, numPt };
  });

  // ASC / MC spoke lines
  const ascA   = lonToAngle(asc, asc); // always 270°
  const mcA    = lonToAngle(chart.western.houses.mc, asc);
  const ascOut = polarToXY(R_OUTER, ascA);
  const ascIn  = polarToXY(0,       ascA);
  const mcOut  = polarToXY(R_OUTER, mcA);
  const mcIn   = polarToXY(0,       mcA);

  return (
    <svg
      viewBox="0 0 460 460"
      width="460"
      height="460"
      aria-label="Western natal chart wheel"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <title>Western Natal Chart — {chart.input.name || 'Chart'}</title>

      {/* Background */}
      <circle cx={CX} cy={CY} r={R_OUTER} fill="var(--bg-chart)" />

      {/* Aspect lines */}
      {aspects.map((asp, i) => {
        const pa = placedMap[asp.a];
        const pb = placedMap[asp.b];
        if (!pa || !pb) return null;
        const ptA = polarToXY(R_CORE, lonToAngle(bodies[asp.a].longitude, asc));
        const ptB = polarToXY(R_CORE, lonToAngle(bodies[asp.b].longitude, asc));
        return (
          <line
            key={i}
            x1={ptA.x} y1={ptA.y}
            x2={ptB.x} y2={ptB.y}
            stroke={ASPECT_COLOR[asp.kind]}
            strokeWidth="0.6"
            strokeOpacity="0.45"
          >
            <title>{asp.a} {asp.kind} {asp.b} (orb {asp.orb.toFixed(2)}°)</title>
          </line>
        );
      })}

      {/* Sign ring background */}
      <circle cx={CX} cy={CY} r={R_OUTER}   fill="none" stroke="var(--line-chart)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={R_SIGN_IN}  fill="none" stroke="var(--line-chart)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={R_HOUSE_IN} fill="none" stroke="var(--line-chart)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r={R_CORE}     fill="none" stroke="var(--line-chart)" strokeWidth="0.5" strokeOpacity="0.3" />

      {/* Degree ticks */}
      {ticks.map((t, i) => {
        const outer = polarToXY(R_OUTER,   t.a);
        const inner = polarToXY(t.rInner,  t.a);
        return (
          <line key={i} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
            stroke="var(--fg-dim)" strokeWidth="0.5" />
        );
      })}

      {/* Sign boundary spokes + glyphs */}
      {signRing.map(({ sign, startOuter, startInner, midGlyph }) => (
        <g key={sign}>
          <line
            x1={startOuter.x} y1={startOuter.y}
            x2={startInner.x} y2={startInner.y}
            stroke="var(--line-chart)" strokeWidth="1"
          />
          <text
            x={midGlyph.x} y={midGlyph.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="12" fill="var(--fg-glyph)"
          >
            {SIGN_GLYPH[sign]}
          </text>
        </g>
      ))}

      {/* House cusp lines + numbers */}
      {cusps.map(({ outer, inner, num, numPt }) => (
        <g key={num}>
          <line
            x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
            stroke="var(--fg-dim)" strokeWidth="0.8"
          />
          <text
            x={numPt.x} y={numPt.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize="9" fill="var(--fg-muted)"
            fontFamily="var(--font-mono)"
          >
            {num}
          </text>
        </g>
      ))}

      {/* ASC / MC lines */}
      <line x1={ascOut.x} y1={ascOut.y} x2={ascIn.x} y2={ascIn.y}
        stroke="var(--accent)" strokeWidth="1.2" />
      <line x1={mcOut.x} y1={mcOut.y} x2={mcIn.x} y2={mcIn.y}
        stroke="var(--fg-muted)" strokeWidth="0.8" strokeDasharray="3 2" />

      {/* Planet glyphs */}
      {placed.map(({ id, angle, r }) => {
        const body = bodies[id as keyof typeof bodies];
        if (!body) return null;
        const pt  = polarToXY(r, angle);
        const glyph = PLANET_GLYPH[id as keyof typeof PLANET_GLYPH];
        const isRetro = body.isRetrograde;
        return (
          <g key={id}>
            <title>{id} {body.sign} {body.signDegree.toFixed(2)}° H{body.house}{isRetro ? ' ℞' : ''}</title>
            <text
              x={pt.x} y={pt.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="11"
              fill={isRetro ? 'var(--retro)' : 'var(--fg-glyph)'}
            >
              {glyph}
            </text>
            {isRetro && (
              <text
                x={pt.x + 7} y={pt.y - 5}
                fontSize="6" fill="var(--retro)"
              >
                ℞
              </text>
            )}
          </g>
        );
      })}

      {/* ASC / MC labels */}
      {(() => {
        const ascPt = polarToXY(R_SIGN_IN - 12, ascA);
        const mcPt  = polarToXY(R_SIGN_IN - 12, mcA);
        return (
          <>
            <text x={ascPt.x} y={ascPt.y} textAnchor="middle" dominantBaseline="central"
              fontSize="8" fill="var(--accent)" fontFamily="var(--font-mono)">AC</text>
            <text x={mcPt.x} y={mcPt.y} textAnchor="middle" dominantBaseline="central"
              fontSize="8" fill="var(--fg-muted)" fontFamily="var(--font-mono)">MC</text>
          </>
        );
      })()}
    </svg>
  );
}
