import type { NatalChart } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';
import { toDMS, signLabel, SIGN_RULER } from './tableUtils';

export default function HouseTable({ chart }: { chart: NatalChart }) {
  const { cusps } = chart.western.houses;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
            <th style={th}>House</th>
            <th style={{ ...th, fontFamily: 'var(--font-mono)' }}>Cusp</th>
            <th style={th}>Sign on Cusp</th>
            <th style={{ ...th, fontFamily: 'var(--font-mono)' }}>Degree</th>
            <th style={th}>Trad. Ruler</th>
            <th style={th}>Modern Ruler</th>
          </tr>
        </thead>
        <tbody>
          {cusps.map((lon, i) => {
            const normalized = ((lon % 360) + 360) % 360;
            const signIdx    = Math.floor(normalized / 30);
            const sign       = SIGNS[signIdx];
            const signDeg    = normalized % 30;
            const ruler      = SIGN_RULER[sign];
            const houseNum   = i + 1;
            const isAngular  = [1, 4, 7, 10].includes(houseNum);

            return (
              <tr
                key={i}
                style={{
                  borderBottom: '1px solid var(--line)',
                  color: 'var(--fg)',
                  fontWeight: isAngular ? 600 : 400,
                }}
              >
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                  {houseNum}
                  {houseNum === 1 ? ' (AC)' : houseNum === 4 ? ' (IC)' : houseNum === 7 ? ' (DC)' : houseNum === 10 ? ' (MC)' : ''}
                </td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-dim)' }}>
                  {toDMS(normalized)}
                </td>
                <td style={td}>{signLabel(sign)}</td>
                <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>
                  {toDMS(signDeg)}
                </td>
                <td style={{ ...td, color: 'var(--fg-muted)' }}>{ruler.trad}</td>
                <td style={{ ...td, color: 'var(--fg-dim)' }}>{ruler.modern ?? '—'}</td>
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
