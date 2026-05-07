import type { NatalChart, BodyId } from '@/lib/astro/types';
import { PLANET_GLYPH } from '@/components/charts/glyphs';
import { signLabel } from './tableUtils';

const TRAD_PLANETS: BodyId[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
const ALL_PLANETS:  BodyId[] = [...TRAD_PLANETS, 'uranus', 'neptune', 'pluto'];

const BODY_NAME: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
};

const DIGNITY_STYLE: Record<string, React.CSSProperties> = {
  domicile:   { color: 'var(--aspect-harmonious)', fontWeight: 700 },
  exaltation: { color: 'var(--aspect-harmonious)' },
  detriment:  { color: 'var(--aspect-dynamic)', fontWeight: 700 },
  fall:       { color: 'var(--aspect-dynamic)' },
  peregrine:  { color: 'var(--fg-dim)' },
};

const DIGNITY_ABBR: Record<string, string> = {
  domicile: 'Dom', exaltation: 'Exlt', detriment: 'Det', fall: 'Fall', peregrine: 'Per',
};

export default function DignityTable({ chart }: { chart: NatalChart }) {
  const { bodies, dignities } = chart.western;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
            <th style={th}>Planet</th>
            <th style={th}>Sign</th>
            <th style={th}>Dignity</th>
            <th style={th}>Trad. Ruler</th>
            <th style={th}>Modern Ruler</th>
          </tr>
        </thead>
        <tbody>
          {ALL_PLANETS.map(id => {
            const body = bodies[id];
            const dig  = dignities[id];
            if (!body || !dig) return null;

            const label  = dig.label;
            const style  = label ? DIGNITY_STYLE[label] : {};
            const abbr   = label ? DIGNITY_ABBR[label] : '—';
            const glyph  = PLANET_GLYPH[id] ?? '';
            const name   = BODY_NAME[id] ?? id;
            const isTrad = TRAD_PLANETS.includes(id);

            return (
              <tr
                key={id}
                style={{
                  borderBottom: '1px solid var(--line)',
                  color: 'var(--fg)',
                  opacity: isTrad ? 1 : 0.75,
                }}
              >
                <td style={{ ...td, color: 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                  {glyph} {name}
                  {!isTrad && <span style={{ color: 'var(--fg-dim)', fontSize: 10, marginLeft: 4 }}>*</span>}
                </td>
                <td style={td}>{signLabel(body.sign)}</td>
                <td style={{ ...td, ...style }}>{abbr}</td>
                <td style={{ ...td, color: 'var(--fg-muted)' }}>
                  {dig.traditionalRuler
                    ? (PLANET_GLYPH[dig.traditionalRuler] ?? '') + ' ' + BODY_NAME[dig.traditionalRuler]
                    : '—'}
                </td>
                <td style={{ ...td, color: 'var(--fg-dim)' }}>
                  {dig.modernRuler
                    ? (PLANET_GLYPH[dig.modernRuler] ?? '') + ' ' + BODY_NAME[dig.modernRuler]
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ margin: '8px 10px 0', fontSize: 10, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)' }}>
        * Modern planets — traditional dignities don't apply
      </p>
    </div>
  );
}

const th: React.CSSProperties = { padding: '6px 10px', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' };
const td: React.CSSProperties = { padding: '5px 10px', verticalAlign: 'middle' };
