import type { NatalChart, BodyId } from '@/lib/astro/types';
import { toDMS, signLabel, ASPECT_COLOR } from './tableUtils';
import { PLANET_GLYPH } from '@/components/charts/glyphs';
import InterpretButton from '@/components/interpret/InterpretButton';
import { buildBodySection, type InterpretSection } from '@/lib/ai/prompts';

const PLANET_ROWS: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'trueNode', 'southNode', 'chiron', 'blackMoonLilith',
  'partOfFortune', 'asc', 'mc',
];

const BODY_NAME: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'N. Node', southNode: 'S. Node', chiron: 'Chiron',
  blackMoonLilith: 'Lilith', partOfFortune: 'Fortune', asc: 'Ascendant', mc: 'Midheaven',
};

const DIGNITY_COLOR: Record<string, string> = {
  domicile:   'var(--aspect-harmonious)',
  exaltation: 'var(--aspect-harmonious)',
  detriment:  'var(--aspect-dynamic)',
  fall:       'var(--aspect-dynamic)',
  peregrine:  'var(--fg-dim)',
};

export default function PlanetTable({ chart, onInterpret }: { chart: NatalChart; onInterpret?: (s: InterpretSection) => void }) {
  const { bodies, dignities } = chart.western;
  void ASPECT_COLOR;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
            <th style={th}>Body</th>
            <th style={th}>Sign</th>
            <th style={{ ...th, fontFamily: 'var(--font-mono)' }}>Position</th>
            <th style={th}>H</th>
            <th style={{ ...th, fontFamily: 'var(--font-mono)' }}>Speed</th>
            <th style={th}>Dignity</th>
            {onInterpret && <th style={{ ...th, width: 28 }} />}
          </tr>
        </thead>
        <tbody>
          {PLANET_ROWS.map(id => {
            const body = bodies[id];
            if (!body) return null;
            const dig = dignities[id];
            const isRetro = body.isRetrograde;
            const glyph = PLANET_GLYPH[id] ?? '';
            const name = BODY_NAME[id] ?? id;
            const digLabel = dig?.label;
            const noSpeed = id === 'asc' || id === 'mc' || id === 'partOfFortune' || id === 'southNode';
            const speed = body.speedLongitude;

            return (
              <tr key={id} style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg)' }}>
                {/* Body */}
                <td style={{ ...td, color: isRetro ? 'var(--retro)' : 'var(--fg-glyph)', whiteSpace: 'nowrap' }}>
                  {isRetro ? '℞ ' : ''}{glyph} {name}
                </td>
                {/* Sign */}
                <td style={td}>{signLabel(body.sign)}</td>
                {/* Position */}
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                  {toDMS(body.signDegree)}{isRetro ? ' R' : ''}
                </td>
                {/* House */}
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)', textAlign: 'center' }}>
                  {body.house}
                </td>
                {/* Speed */}
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
                  {noSpeed ? '—' : `${speed >= 0 ? '+' : ''}${speed.toFixed(2)}°/d`}
                </td>
                {/* Dignity */}
                <td style={{ ...td, color: digLabel ? DIGNITY_COLOR[digLabel] : 'var(--fg-dim)' }}>
                  {digLabel ? digLabel.charAt(0).toUpperCase() + digLabel.slice(1) : '—'}
                </td>
                {onInterpret && (
                  <td style={{ ...td, textAlign: 'center' }}>
                    <InterpretButton section={buildBodySection(id, chart)} onInterpret={onInterpret} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { padding: '6px 10px', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' };
const td: React.CSSProperties = { padding: '5px 10px', verticalAlign: 'middle' };
