import type { NatalChart, BodyId, Aspect, TransitAspect, ProgressedAspect, BodyPosition } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';
import type { DashaPeriod, DashaLord } from '@/lib/astro/dashas';
import type { SynastryAspect } from '@/lib/astro/synastry';

export type InterpretSection = {
  type: 'body' | 'house' | 'aspect' | 'transit' | 'progression' | 'dasha' | 'synastry';
  label: string;   // display header, e.g. "Sun in Scorpio · House 3"
  prompt: string;  // question sent to Claude
};

const BODY_LABEL: Partial<Record<BodyId, string>> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
  pluto: 'Pluto', trueNode: 'North Node', southNode: 'South Node',
  chiron: 'Chiron', blackMoonLilith: 'Lilith', asc: 'Ascendant', mc: 'Midheaven',
};

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function dashaLordToBodyId(lord: DashaLord): BodyId | null {
  const map: Record<DashaLord, BodyId | null> = {
    sun: 'sun', moon: 'moon', mercury: 'mercury', venus: 'venus', mars: 'mars',
    jupiter: 'jupiter', saturn: 'saturn', rahu: 'trueNode', ketu: 'southNode',
  };
  return map[lord] ?? null;
}

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

export function buildTransitSection(transit: TransitAspect, natal: NatalChart): InterpretSection {
  const natalBody  = natal.western.bodies[transit.natalBody];
  const tName      = BODY_LABEL[transit.transitBody] ?? transit.transitBody;
  const nName      = BODY_LABEL[transit.natalBody]   ?? transit.natalBody;
  const timing     = transit.applying
    ? transit.daysToExact < 1 ? 'exact within hours' : `~${Math.round(transit.daysToExact)} days to exact`
    : `~${Math.round(transit.daysToExact)} days past exact`;

  return {
    type: 'transit',
    label: `Transit: ${tName} ${transit.kind} natal ${nName}`,
    prompt: `Interpret this current transit: Transiting ${tName} is forming a ${transit.kind} (orb ${transit.orb.toFixed(1)}°, ${transit.applying ? 'applying — ' + timing : 'separating — ' + timing}) with natal ${nName} in ${natalBody?.sign ?? '?'}, House ${natalBody?.house ?? '?'}. What life themes and energies is this transit activating? Outer planet transits last months to years; inner planet transits pass in days. How can the person work consciously with this transit? Reference the natal chart context.`,
  };
}

export function buildProgressedBodySection(
  bodyId: BodyId,
  progBody: BodyPosition,
  natal: NatalChart,
): InterpretSection {
  const name      = BODY_LABEL[bodyId] ?? bodyId;
  const natalBody = natal.western.bodies[bodyId];

  return {
    type: 'progression',
    label: `Progressed ${name} in ${cap(progBody.sign)}`,
    prompt: `Interpret this secondary progression: The progressed ${name} is currently at ${progBody.signDegree.toFixed(1)}° ${progBody.sign}, House ${progBody.house}${progBody.isRetrograde ? ', retrograde' : ''}. The natal ${name} is in ${natalBody?.sign ?? '?'}, House ${natalBody?.house ?? '?'}. Secondary progressions move slowly (Sun ~1°/year, Moon ~1 sign per 2–2.5 years) and describe long-term inner development and the soul's current chapter. What themes and psychological shifts does this placement suggest? Reference the natal chart context.`,
  };
}

export function buildProgressedAspectSection(asp: ProgressedAspect, natal: NatalChart): InterpretSection {
  const pName     = BODY_LABEL[asp.progressedBody] ?? asp.progressedBody;
  const nName     = BODY_LABEL[asp.natalBody]      ?? asp.natalBody;
  const natalBody = natal.western.bodies[asp.natalBody];

  return {
    type: 'progression',
    label: `Progressed ${pName} ${asp.kind} natal ${nName}`,
    prompt: `Interpret this secondary progressed aspect: Progressed ${pName} is forming a ${asp.kind} (orb ${asp.orb.toFixed(1)}°, ${asp.applying ? 'applying' : 'separating'}) with natal ${nName} in ${natalBody?.sign ?? '?'}, House ${natalBody?.house ?? '?'}. Secondary progressions are slow and deep — they describe multi-year inner evolution rather than day-to-day events. What psychological and life themes does this progression mark? What is the person being called to develop or integrate? Reference the natal chart context.`,
  };
}

export function buildDashaSection(maha: DashaPeriod, antar: DashaPeriod, natal: NatalChart): InterpretSection {
  const mahaName = cap(maha.lord);
  const antarName = cap(antar.lord);

  const mahaBodyId  = dashaLordToBodyId(maha.lord);
  const antarBodyId = dashaLordToBodyId(antar.lord);
  const mahaVedic   = mahaBodyId  ? natal.vedic.bodies[mahaBodyId]  : null;
  const antarVedic  = antarBodyId ? natal.vedic.bodies[antarBodyId] : null;

  const mahaStr  = mahaVedic  ? `${mahaName} is in ${mahaVedic.sign} (nakshatra: ${mahaVedic.nakshatra}), House ${mahaVedic.house}` : mahaName;
  const antarStr = antarVedic ? `${antarName} is in ${antarVedic.sign} (nakshatra: ${antarVedic.nakshatra}), House ${antarVedic.house}` : antarName;

  return {
    type: 'dasha',
    label: `${mahaName} Mahadasha · ${antarName} Antardasha`,
    prompt: `Interpret this Vimshottari Dasha period using Jyotish (Vedic astrology): Currently in ${mahaName} Mahadasha (${maha.startISO} → ${maha.endISO}, ${maha.durationYears.toFixed(1)} years total) with ${antarName} Antardasha (${antar.startISO} → ${antar.endISO}). In this natal Vedic chart: ${mahaStr}; ${antarStr}. What are the karmic themes, dharmic focus, life areas, gifts, and challenges of this ${mahaName}/${antarName} period? Reference the planets' nakshatra qualities, house lordships, and how the two dasha lords relate to each other in the chart.`,
  };
}

export function buildSynastryAspectSection(
  asp: SynastryAspect,
  chartA: NatalChart,
  chartB: NatalChart,
): InterpretSection {
  const aName  = BODY_LABEL[asp.bodyA] ?? asp.bodyA;
  const bName  = BODY_LABEL[asp.bodyB] ?? asp.bodyB;
  const nameA  = chartA.input.name?.trim() || 'Person A';
  const nameB  = chartB.input.name?.trim() || 'Person B';
  const bodyA  = chartA.western.bodies[asp.bodyA];
  const bodyB  = chartB.western.bodies[asp.bodyB];

  const bSun  = chartB.western.bodies.sun;
  const bMoon = chartB.western.bodies.moon;
  const bAsc  = chartB.western.bodies.asc;
  const bCtx  = [
    bSun  ? `Sun in ${bSun.sign}`          : '',
    bMoon ? `Moon in ${bMoon.sign}`         : '',
    bAsc  ? `Rising ${bAsc.sign}`          : '',
    bodyB ? `${bName} in ${bodyB.sign}, H${bodyB.house}` : '',
  ].filter(Boolean).join('; ');

  return {
    type: 'synastry',
    label: `Synastry: ${nameA}'s ${aName} ${asp.kind} ${nameB}'s ${bName}`,
    prompt: `Interpret this synastry inter-aspect: ${nameA}'s ${aName} in ${bodyA?.sign ?? '?'}, House ${bodyA?.house ?? '?'} is forming a ${asp.kind} (orb ${asp.orb.toFixed(1)}°) with ${nameB}'s ${bName}. ${nameB}'s key placements: ${bCtx}. The full natal chart in context is ${nameA}'s. Explore what this inter-aspect creates between these two people — the attraction or tension it generates, what each person experiences, and how they can work with this dynamic consciously. Be specific to both charts.`,
  };
}

function ordSuffix(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}
