import type { NatalChart, BodyId } from '@/lib/astro/types';
import { PLANET_GLYPH } from '@/components/charts/glyphs';
import { signLabel } from './tableUtils';
import Tooltip from '@/components/ui/Tooltip';

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
            <th style={th}><Tooltip text="The planet being assessed. Traditional dignity applies to the 7 classical planets (Sun through Saturn), which ancient astrologers knew. The outer planets (Uranus, Neptune, Pluto — marked *) were discovered after the telescope and don't have classical dignity assignments.">Planet</Tooltip></th>
            <th style={th}><Tooltip text="The zodiac sign the planet currently occupies. Dignities are purely about the relationship between planet and sign — a planet in its own sign (domicile) expresses itself most naturally, while a planet in its opposite sign (detriment) is working against its nature.">Sign</Tooltip></th>
            <th style={th}><Tooltip text="Dom = Domicile: the planet rules this sign — operates at full, authentic strength. Exlt = Exaltation: the planet is honored and elevated here — highly effective. Det = Detriment: opposite of domicile — uncomfortable, energy expressed awkwardly or excessively. Fall = opposite of exaltation — most debilitated, energy hardest to access. Per = Peregrine: no special status — neutral, neither helped nor hindered.">Dignity</Tooltip></th>
            <th style={th}><Tooltip text="The planet that rules this sign in classical astrology (before telescopes). The ruler and the sign share the same energy — Venus rules Taurus and Libra, Mars rules Aries and Scorpio, etc. A planet in its domicile sign is 'home.'">Trad. Ruler</Tooltip></th>
            <th style={th}><Tooltip align="right" text="The modern ruler assigned in contemporary astrology. After Uranus, Neptune, and Pluto were discovered, astrologers re-assigned rulership of three signs: Aquarius → Uranus (was Saturn), Pisces → Neptune (was Jupiter), Scorpio → Pluto (was Mars). Traditional and modern rulerships are both used depending on the astrologer.">Modern Ruler</Tooltip></th>
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
