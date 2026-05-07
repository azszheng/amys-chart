import type { NatalChart, BodyId, Aspect } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';

export type InterpretSection = {
  type: 'body' | 'house' | 'aspect';
  label: string;   // display header, e.g. "Sun in Scorpio · House 3"
  prompt: string;  // question sent to Claude
};

export const SYSTEM_PROMPT = `You are an astrological interpreter for Amy's Chart. Your voice bridges two ways of knowing: the rigorous/psychological (patterns, archetypes, developmental lenses) and the archetypal/mystical (the soul-level, the symbolic, the felt sense of planetary energies). You honor both without collapsing into either.

You speak with the warmth and precision of a senior astrologer talking to a peer — the user is educated, curious, and has a scientific background, so do not condescend, hedge excessively, or mystify what is actually quite specific.

You have the user's full natal chart in the context. When asked about a specific section (a planet, a house, an aspect), you:
1. State what is factually there (e.g., "Mars in Aries at 15°, in the 3rd house, squaring natal Saturn").
2. Offer the archetypal meaning in a few grounded sentences — not clichés.
3. Integrate: how does this interact with the other relevant pieces of this chart you can see in context? Name them specifically.
4. Offer one concrete, actionable lens or question for reflection.

Length: 150–300 words unless the user asks for more. Use short paragraphs. No bullet points unless listing genuinely parallel items.

Never generate generic horoscope-style content. Every interpretation must refer to this specific chart's specific placements.
Never claim to predict events. Frame everything as patterns, invitations, archetypal currents.
Never reproduce copyrighted interpretive material. Synthesize in your own words.`;

export function buildChartContext(chart: NatalChart): string {
  const { bodies, houses, aspects, dignities } = chart.western;
  const lines: string[] = [];

  lines.push(`NATAL CHART — ${chart.input.name || 'unnamed'}`);
  lines.push(`Birth: ${chart.input.date} ${chart.input.time} · ${chart.input.city}, ${chart.input.region}, ${chart.input.country}`);
  lines.push(`ASC: ${bodies.asc?.sign} ${bodies.asc?.signDegree?.toFixed(2)}° · MC: ${bodies.mc?.sign} ${bodies.mc?.signDegree?.toFixed(2)}°`);
  lines.push('');

  lines.push('PLANETS (Western tropical, Placidus):');
  const planetOrder: BodyId[] = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','trueNode','southNode','chiron','blackMoonLilith','partOfFortune'];
  for (const id of planetOrder) {
    const b = bodies[id];
    if (!b) continue;
    const retro = b.isRetrograde ? ' R' : '';
    const dig = dignities[id]?.label ? ` [${dignities[id].label}]` : '';
    lines.push(`  ${id}: ${b.sign} ${b.signDegree.toFixed(2)}°${retro} · H${b.house}${dig}`);
  }
  lines.push('');

  lines.push('HOUSE CUSPS:');
  houses.cusps.forEach((lon, i) => {
    const signIdx = Math.floor(((lon % 360) + 360) % 360 / 30);
    const sign = SIGNS[signIdx];
    const deg = ((lon % 360) + 360) % 360 % 30;
    lines.push(`  H${i+1}: ${sign} ${deg.toFixed(2)}°`);
  });
  lines.push('');

  lines.push('ASPECTS:');
  for (const asp of aspects.slice(0, 30)) {
    lines.push(`  ${asp.a} ${asp.kind} ${asp.b} (orb ${asp.orb.toFixed(1)}° ${asp.applying ? 'applying' : 'separating'})`);
  }
  lines.push('');

  lines.push(`Vedic ASC rashi: ${chart.vedic.ascendantRashi} · Ayanamsa: ${chart.vedic.ayanamsa.toFixed(2)}°`);

  return lines.join('\n');
}

export function buildBodySection(bodyId: BodyId, chart: NatalChart): InterpretSection {
  const body = chart.western.bodies[bodyId];
  if (!body) return { type: 'body', label: bodyId, prompt: `Interpret ${bodyId} in this chart.` };

  const retro = body.isRetrograde ? ' retrograde' : '';
  const dig = chart.western.dignities[bodyId]?.label;
  const digStr = dig ? `, in ${dig}` : '';

  const bodyAspects = chart.western.aspects
    .filter(a => a.a === bodyId || a.b === bodyId)
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 5)
    .map(a => {
      const other = a.a === bodyId ? a.b : a.a;
      return `${a.kind} ${other} (${a.orb.toFixed(1)}°)`;
    });

  const aspStr = bodyAspects.length > 0 ? ` Aspects: ${bodyAspects.join(', ')}.` : '';

  return {
    type: 'body',
    label: `${bodyId} in ${body.sign} · House ${body.house}`,
    prompt: `Interpret ${bodyId}${retro} in ${body.sign} at ${body.signDegree.toFixed(2)}°, house ${body.house}${digStr}.${aspStr} Weave in relevant patterns from the full chart.`,
  };
}

export function buildHouseSection(houseNum: number, chart: NatalChart): InterpretSection {
  const cuspLon = chart.western.houses.cusps[houseNum - 1];
  const signIdx = Math.floor(((cuspLon % 360) + 360) % 360 / 30);
  const sign = SIGNS[signIdx];

  const planetsIn = Object.entries(chart.western.bodies)
    .filter(([, b]) => b.house === houseNum && !['asc','mc'].includes(b.id))
    .map(([id]) => id);

  const planetsStr = planetsIn.length > 0
    ? ` Planets here: ${planetsIn.join(', ')}.`
    : ' Empty house (no natal planets here).';

  return {
    type: 'house',
    label: `House ${houseNum} · ${sign} on cusp`,
    prompt: `Interpret the ${houseNum}${ordSuffix(houseNum)} house with ${sign} on the cusp.${planetsStr} Connect to relevant chart themes.`,
  };
}

export function buildAspectSection(asp: Aspect): InterpretSection {
  const kind = asp.kind;
  return {
    type: 'aspect',
    label: `${asp.a} ${kind} ${asp.b}`,
    prompt: `Interpret the ${kind} between ${asp.a} and ${asp.b} (orb ${asp.orb.toFixed(1)}°, ${asp.applying ? 'applying' : 'separating'}). Reference the signs, houses, and other chart factors involved.`,
  };
}

export function buildVedicBodySection(bodyId: BodyId, chart: NatalChart): InterpretSection {
  const body = chart.vedic.bodies[bodyId];
  if (!body) return { type: 'body', label: `Vedic ${bodyId}`, prompt: `Interpret ${bodyId} in this Vedic chart.` };

  const retro = body.isRetrograde ? ' retrograde' : '';
  const nakName = body.nakshatra.charAt(0).toUpperCase() + body.nakshatra.slice(1).replace(/([A-Z])/g, ' $1').trim();
  const lordName = body.nakshatraLord;
  const bodyName = bodyId === 'trueNode' ? 'Rahu' : bodyId === 'southNode' ? 'Ketu' : bodyId;

  return {
    type: 'body',
    label: `Vedic · ${bodyName} in ${body.sign} · ${nakName} pada ${body.nakshatraPada}`,
    prompt: `Interpret ${bodyName}${retro} in the Vedic (sidereal) chart: ${body.sign} at ${body.signDegree.toFixed(2)}°, house ${body.house}, nakshatra ${nakName} pada ${body.nakshatraPada}, nakshatra lord ${lordName}. Use Jyotish (Vedic astrology) framework — reference the nakshatra's qualities, the rashi, and the house. Weave in relevant patterns from the full chart context.`,
  };
}

function ordSuffix(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}
