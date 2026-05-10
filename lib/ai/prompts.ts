import type { NatalChart, BodyId, Aspect, TransitAspect, ProgressedAspect, BodyPosition } from '@/lib/astro/types';
import { SIGNS } from '@/lib/astro/types';
import type { DashaPeriod, DashaLord } from '@/lib/astro/dashas';
import type { SynastryAspect } from '@/lib/astro/synastry';

export type InterpretSection = {
  type: 'body' | 'house' | 'aspect' | 'transit' | 'progression' | 'dasha' | 'synastry';
  label: string;
  prompt: string;
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

export const SYSTEM_PROMPT = `You are a master astrologer writing for Amy's Chart. Your voice draws on the great traditions of astrological writing: the soul-centered storytelling of Steven Forrest, the Jungian psychological depth of Liz Greene, the warm accessibility of Donna Cunningham, and the grounded clarity of Robert Hand.

You are writing for real people — curious beginners who want to understand themselves, not decode a textbook. Every interpretation should feel like sitting across from a wise, warm friend who happens to be a brilliant astrologer. Educated, never condescending. Deep, never obscure.

YOUR VOICE AND STYLE:

Lead with lived experience, not data. Before anything else, describe what it actually feels like — from the inside — to carry this energy through a life. "People with this placement often find themselves..." or "There is something in you that..." Draw the reader in before you explain anything.

Speak directly to the person. Always say "you" and "your." Never "the native" or "this person." You are talking to them, not about them.

Explain every astrological term the moment you use it. When you mention the 7th house, add a brief natural parenthetical: "your 7th house — the zone of your chart that governs partnerships and close relationships." When you name an aspect type, say what it means: "a square (a tense 90-degree angle that creates friction and growth)." Do this gracefully, as a good teacher does — weaving the explanation into the sentence, not stopping to define it like a dictionary.

Use metaphor and image. Great astrology writing teaches through comparison. "Saturn conjunct the Moon can feel like growing up with a parent who expressed love through practicality rather than warmth — reliable, present, but not always soft." One vivid image is worth ten technical sentences.

Be specific to this chart. You have the full natal chart in your context. Name the actual sign, house, and relevant aspects. Write nothing that could apply to just anyone with this placement — always root it in what you can see in this particular chart.

Honor complexity. Every placement has gifts AND growing edges. A so-called "difficult" aspect is not a life sentence — it is an invitation to develop something important. Don't catastrophize, and don't sugarcoat. Be honest and compassionate in equal measure.

Write in flowing prose. No bullet points. No numbered lists. No headers. Paragraphs that breathe and build on each other, the way a real conversation does.

Close with a question or reflection — something the reader can sit with after they finish reading. Not a summary. A door opening.

Length: 200–320 words. Short paragraphs with white space between them. If you find yourself writing something that sounds like a machine describing a spreadsheet, stop and rewrite it as a human talking to another human.`;

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

  const retro    = body.isRetrograde ? ' retrograde' : '';
  const dig      = chart.western.dignities[bodyId]?.label;
  const digNote  = dig === 'domicile'   ? ' (in its home sign, expressing itself most naturally)'
                 : dig === 'exaltation' ? ' (in exaltation — elevated and highly effective here)'
                 : dig === 'detriment'  ? ' (in detriment — working against its nature, a real creative tension)'
                 : dig === 'fall'       ? ' (in fall — expressing its energy in a roundabout way, requiring extra effort)'
                 : '';

  const bodyAspects = chart.western.aspects
    .filter(a => a.a === bodyId || a.b === bodyId)
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 4)
    .map(a => {
      const other = a.a === bodyId ? a.b : a.a;
      const otherName = BODY_LABEL[other] ?? other;
      return `${a.kind} ${otherName} (${a.orb.toFixed(1)}° orb)`;
    });

  const aspLine = bodyAspects.length > 0
    ? ` Its major aspects in this chart: ${bodyAspects.join(', ')}.`
    : '';

  const name = BODY_LABEL[bodyId] ?? bodyId;

  return {
    type: 'body',
    label: `${cap(bodyId)} in ${cap(body.sign)} · House ${body.house}`,
    prompt: `Write a warm, human, psychologically rich interpretation of the ${name}${retro} in ${body.sign}${digNote}, placed in the ${body.house}th house of this chart.${aspLine}

Start by describing what it actually feels like — from the inside — to carry this ${name} placement through a life. What drives, tensions, gifts, or blind spots does it tend to create? Use specific, vivid language and metaphor rather than abstract astrological terminology. When you do use a technical term, explain it naturally in the same sentence.

Then ground it in this specific chart: weave in one or two other placements you can see in the chart context that most powerfully color or modify this ${name}. Be specific — name them and say how they interact.

Speak directly to the person using "you." Close with a single honest question or reflection they can sit with.`,
  };
}

export function buildHouseSection(houseNum: number, chart: NatalChart): InterpretSection {
  const cuspLon  = chart.western.houses.cusps[houseNum - 1];
  const signIdx  = Math.floor(((cuspLon % 360) + 360) % 360 / 30);
  const sign     = SIGNS[signIdx];

  const planetsIn = Object.entries(chart.western.bodies)
    .filter(([, b]) => b.house === houseNum && !['asc', 'mc'].includes(b.id))
    .map(([id]) => BODY_LABEL[id as BodyId] ?? id);

  const planetsNote = planetsIn.length > 0
    ? ` Planets currently living in this house: ${planetsIn.join(', ')}.`
    : ' This house has no natal planets in it — its themes are still very much alive, but they operate more quietly, colored primarily by the sign on the cusp and the house ruler\'s placement.';

  const houseThemes: Record<number, string> = {
    1:  'identity, appearance, how you instinctively meet the world, and the energy you lead with',
    2:  'your relationship with money, possessions, and self-worth — what you value and how you earn',
    3:  'the mind, communication, siblings, short journeys, and how you learn and express ideas',
    4:  'home, family, roots, ancestry, and your emotional foundation — the private inner world',
    5:  'creativity, joy, romance, children, and self-expression — everything you do for the love of doing it',
    6:  'daily work, health, routines, and service — how you show up in the ordinary texture of life',
    7:  'partnerships, marriage, and one-on-one relationships — what you seek in others and what you offer',
    8:  'transformation, death and rebirth, sexuality, shared resources, and the deep psyche',
    9:  'philosophy, higher education, travel, spirituality, and the search for meaning',
    10: 'career, public reputation, vocation, and how you wish to be remembered — your legacy',
    11: 'friends, community, social ideals, and the vision you hold for the future',
    12: 'the unconscious, solitude, hidden matters, spirituality, and what lies beneath ordinary awareness',
  };

  return {
    type: 'house',
    label: `House ${houseNum} · ${cap(sign)} on cusp`,
    prompt: `Write a warm, human interpretation of the ${houseNum}${ordSuffix(houseNum)} house in this chart — the area governing ${houseThemes[houseNum] ?? 'this life domain'} — with ${sign} on the cusp.${planetsNote}

Describe what ${sign} energy brings to this life area in a way a non-astrologer would immediately recognize and feel. What does it look like when someone approaches ${houseThemes[houseNum] ?? 'this domain'} through the particular lens of ${sign}? Use everyday language and a concrete image or metaphor.

Then speak to this specific chart: note how any planets in the house (if present) add their own energy to the story, or if it's empty, how the house ruler's placement elsewhere in the chart shapes these themes.

Speak directly to the person. End with one question or reflection they can carry with them.`,
  };
}

export function buildAspectSection(asp: Aspect): InterpretSection {
  const aName = BODY_LABEL[asp.a] ?? asp.a;
  const bName = BODY_LABEL[asp.b] ?? asp.b;

  const aspectMeaning: Record<string, string> = {
    conjunction: 'a merging — both planets operate almost as one fused energy, amplified and inseparable',
    opposition:  'a polarity — these two energies pull in opposite directions, creating tension but also the possibility of integration',
    trine:       'a natural harmony — these energies flow together easily, often representing gifts that feel almost effortless',
    square:      'a creative tension — these energies are in friction, pushing against each other in ways that can frustrate but also forge real strength',
    sextile:     'a gentle opportunity — these planets support each other when you make the effort to bring them together',
    quincunx:    'an awkward adjustment — these two energies don\'t speak each other\'s language easily, requiring constant recalibration',
  };

  return {
    type: 'aspect',
    label: `${aName} ${asp.kind} ${bName}`,
    prompt: `Write a warm, human interpretation of the ${asp.kind} — ${aspectMeaning[asp.kind] ?? 'a significant angle'} — between the ${aName} and ${bName} in this chart (orb ${asp.orb.toFixed(1)}°, ${asp.applying ? 'still building toward exact' : 'past exact and separating'}).

Start by describing what this combination of planetary energies creates in the texture of daily life. What inner tension, gift, or recurring pattern might someone with this aspect notice in themselves? Bring it to life with a specific image or scenario — make it recognizable and human.

Then root it in this chart specifically: what are the signs and houses involved, and how do those details color this aspect? If the orb is tight, note that this is one of the stronger forces in the chart.

Speak in "you." Close with one honest, open question.`,
  };
}

export function buildVedicBodySection(bodyId: BodyId, chart: NatalChart): InterpretSection {
  const body     = chart.vedic.bodies[bodyId];
  if (!body) return { type: 'body', label: `Vedic ${bodyId}`, prompt: `Interpret ${bodyId} in this Vedic chart.` };

  const retro    = body.isRetrograde ? ' retrograde' : '';
  const nakName  = body.nakshatra.charAt(0).toUpperCase() + body.nakshatra.slice(1).replace(/([A-Z])/g, ' $1').trim();
  const lordName = BODY_LABEL[body.nakshatraLord as BodyId] ?? body.nakshatraLord;
  const bodyName = bodyId === 'trueNode' ? 'Rahu' : bodyId === 'southNode' ? 'Ketu' : cap(bodyId);

  return {
    type: 'body',
    label: `Vedic · ${bodyName} in ${cap(body.sign)} · ${nakName} pada ${body.nakshatraPada}`,
    prompt: `Write a warm, soulful Jyotish (Vedic astrology) interpretation of ${bodyName}${retro} in the sidereal sign of ${body.sign}, placed in the ${body.house}th house, in the nakshatra of ${nakName} (pada ${body.nakshatraPada}), ruled by ${lordName}.

Begin with what this placement means at the level of the soul — what has this person come here to experience, develop, or work through? The Vedic chart speaks to karma, dharma, and the deeper currents beneath a life's surface. Bring that dimension alive in plain language.

Explain the nakshatra — one of 27 lunar mansions that divide the zodiac into finer degrees — and what ${nakName} specifically brings: its mythological symbolism, its ruling deity's energy, and how that shapes the expression of ${bodyName} here. Then speak to the rashi (sign) and house. Weave these layers together into a coherent picture.

If ${bodyName} is Rahu or Ketu, address the karmic axis: what this node's position suggests about past-life material and the soul's forward direction in this lifetime.

Speak directly to the person. Use "you." Explain technical Vedic terms naturally as you use them. Close with a question or reflection rooted in the soul's journey.`,
  };
}

export function buildTransitSection(transit: TransitAspect, natal: NatalChart): InterpretSection {
  const natalBody = natal.western.bodies[transit.natalBody];
  const tName     = BODY_LABEL[transit.transitBody] ?? transit.transitBody;
  const nName     = BODY_LABEL[transit.natalBody]   ?? transit.natalBody;

  const timingNote = transit.applying
    ? transit.daysToExact < 1
      ? 'This is exact right now — the influence is at its peak.'
      : `This is still building — it reaches exactness in about ${Math.round(transit.daysToExact)} days, so the energy is intensifying.`
    : `This passed its peak about ${Math.round(transit.daysToExact)} days ago and is now slowly releasing.`;

  const durationNote = ['pluto','neptune','uranus','saturn','jupiter'].includes(transit.transitBody)
    ? `${tName} moves slowly, so this transit is active for weeks to months — sometimes returning multiple times.`
    : `${tName} moves quickly, so this transit lasts only a few days.`;

  return {
    type: 'transit',
    label: `Transit: ${tName} ${transit.kind} natal ${nName}`,
    prompt: `Write a warm, human interpretation of this current transit: ${tName} in the sky is forming a ${transit.kind} (an orb of ${transit.orb.toFixed(1)}°) with the natal ${nName} in ${natalBody?.sign ?? '?'}, which lives in the ${natalBody?.house ?? '?'}th house of this chart.

${timingNote} ${durationNote}

Begin by describing what this transit tends to feel like from the inside — the kinds of experiences, emotions, or themes that tend to surface during this activation. Make it recognizable and human. Avoid the language of prediction ("this will cause...") — instead, speak in terms of themes, invitations, and energies that are present.

Explain the transit planets and the natal point in plain language. A non-astrologer reading this should understand immediately what ${tName} represents, what the natal ${nName} represents, and why their current contact matters.

Use the natal chart context to make this specific — reference the house and sign of the natal ${nName}, and anything else in the chart that adds texture to this story.

Speak in "you." Close with one practical, human question the person can bring into their life right now.`,
  };
}

export function buildProgressedBodySection(
  bodyId: BodyId,
  progBody: BodyPosition,
  natal: NatalChart,
): InterpretSection {
  const name      = BODY_LABEL[bodyId] ?? cap(bodyId);
  const natalBody = natal.western.bodies[bodyId];
  const movesNote = bodyId === 'moon'
    ? 'The progressed Moon moves through a sign roughly every 2–2.5 years, making it the most active timer of inner emotional shifts.'
    : bodyId === 'sun'
    ? 'The progressed Sun moves about one degree per year — a degree per year of your life — making sign changes rare and deeply significant milestones.'
    : 'Progressed planets move very slowly, marking long chapters of inner development rather than day-to-day events.';

  return {
    type: 'progression',
    label: `Progressed ${name} in ${cap(progBody.sign)}`,
    prompt: `Write a warm, psychologically rich interpretation of this secondary progression: the progressed ${name} is now moving through ${progBody.sign}${progBody.isRetrograde ? ', retrograde' : ''}, in the ${progBody.house}th house.

Secondary progressions (a technique where each day after birth symbolically equals one year of life) describe the slow unfolding of your inner world — not what's happening to you externally, but who you are becoming. ${movesNote}

The natal ${name} is in ${natalBody?.sign ?? '?'}, House ${natalBody?.house ?? '?'}. Compare and contrast: what shift in energy, style, or inner orientation does moving from the natal sign to the progressed sign represent? What chapter is quietly opening?

Describe what this progressed placement tends to feel like from the inside — the kind of inner atmosphere, the shifts in priority or desire, the new capacities beginning to emerge. Use everyday language and metaphor. Make it recognizable.

Speak in "you." Close with a question or reflection that helps the person see what this chapter of their life is calling them toward.`,
  };
}

export function buildProgressedAspectSection(asp: ProgressedAspect, natal: NatalChart): InterpretSection {
  const pName     = BODY_LABEL[asp.progressedBody] ?? cap(asp.progressedBody);
  const nName     = BODY_LABEL[asp.natalBody]      ?? cap(asp.natalBody);
  const natalBody = natal.western.bodies[asp.natalBody];
  const buildingNote = asp.applying
    ? 'This aspect is still building toward exactness — the energy is intensifying and will be strongest when exact.'
    : 'This aspect has just passed its peak and is now slowly releasing — its themes are present and will gradually ease.';

  return {
    type: 'progression',
    label: `Progressed ${pName} ${asp.kind} natal ${nName}`,
    prompt: `Write a warm, psychologically rich interpretation of this progressed aspect: the progressed ${pName} is forming a ${asp.kind} (${asp.orb.toFixed(1)}° orb) with the natal ${nName} in ${natalBody?.sign ?? '?'}, House ${natalBody?.house ?? '?'}. ${buildingNote}

Secondary progressions describe inner development — the slow maturing and shifting of who you are, not just what happens to you. A progressed aspect at 1° orb is active and significant, marking a real turning point in inner life.

Describe in plain, human terms what this particular planetary combination tends to stir — what inner meeting, conflict, awakening, or resolution it represents. What parts of the person's inner life are being brought into relationship? What is being asked to grow or change?

Use the natal chart context: reference the houses and signs of both planets, and what each represents in this specific chart. Make it personal and specific, not generic.

Speak in "you." End with a single, honest reflection or question.`,
  };
}

export function buildDashaSection(maha: DashaPeriod, antar: DashaPeriod, natal: NatalChart): InterpretSection {
  const mahaName = cap(maha.lord);
  const antarName = cap(antar.lord);

  const mahaBodyId  = dashaLordToBodyId(maha.lord);
  const antarBodyId = dashaLordToBodyId(antar.lord);
  const mahaVedic   = mahaBodyId  ? natal.vedic.bodies[mahaBodyId]  : null;
  const antarVedic  = antarBodyId ? natal.vedic.bodies[antarBodyId] : null;

  const nakFmt = (v: typeof mahaVedic) => {
    if (!v) return '';
    const nak = v.nakshatra.charAt(0).toUpperCase() + v.nakshatra.slice(1).replace(/([A-Z])/g, ' $1').trim();
    return `in ${v.sign} (nakshatra: ${nak}), House ${v.house}`;
  };

  const mahaStr  = mahaVedic  ? `${mahaName} is ${nakFmt(mahaVedic)}`  : `${mahaName}`;
  const antarStr = antarVedic ? `${antarName} is ${nakFmt(antarVedic)}` : `${antarName}`;

  return {
    type: 'dasha',
    label: `${mahaName} Mahadasha · ${antarName} Antardasha`,
    prompt: `Write a warm, soulful Jyotish interpretation of this Vimshottari Dasha period.

The Vimshottari Dasha system is one of the most powerful timing tools in Vedic astrology. It divides life into planetary chapters — long "Mahadashas" of 6 to 20 years, each governed by a planet that colors all themes of that period, with shorter "Antardashas" (sub-periods) nested within them.

Currently: ${mahaName} Mahadasha (${maha.startISO} to ${maha.endISO} — ${maha.durationYears.toFixed(1)} years), with ${antarName} Antardasha (${antar.startISO} to ${antar.endISO}).

In this natal Vedic chart: ${mahaStr}; ${antarStr}.

Begin by describing the essential nature of ${mahaName} as a planetary energy — what it represents in Jyotish, the qualities it activates, the domains of life it governs. Then explain what a ${mahaName} Mahadasha tends to feel like: the broad atmosphere, the themes that tend to arise, the lessons it brings. Use plain language — assume the reader has never heard of Dashas before.

Then bring in the ${antarName} sub-period as a more specific flavor within that broader chapter. What does the combination of ${mahaName}/${antarName} tend to create?

Make it specific to this chart: where is ${mahaName} placed? What house does it rule? What nakshatra does it occupy, and what does that nakshatra's energy contribute? Do the same briefly for ${antarName}.

Speak in "you" throughout. Close with a reflection on what this period is inviting the person to step into or let go of.`,
  };
}

export function buildSynastryAspectSection(
  asp: SynastryAspect,
  chartA: NatalChart,
  chartB: NatalChart,
): InterpretSection {
  const aName  = BODY_LABEL[asp.bodyA] ?? cap(asp.bodyA);
  const bName  = BODY_LABEL[asp.bodyB] ?? cap(asp.bodyB);
  const nameA  = chartA.input.name?.trim() || 'Person A';
  const nameB  = chartB.input.name?.trim() || 'Person B';
  const bodyA  = chartA.western.bodies[asp.bodyA];
  const bodyB  = chartB.western.bodies[asp.bodyB];

  const bSun  = chartB.western.bodies.sun;
  const bMoon = chartB.western.bodies.moon;
  const bAsc  = chartB.western.bodies.asc;
  const bSummary = [
    bSun  ? `Sun in ${bSun.sign}`   : '',
    bMoon ? `Moon in ${bMoon.sign}` : '',
    bAsc  ? `Rising ${bAsc.sign}`  : '',
  ].filter(Boolean).join(', ');

  return {
    type: 'synastry',
    label: `Synastry: ${nameA}'s ${aName} ${asp.kind} ${nameB}'s ${bName}`,
    prompt: `Write a warm, human interpretation of this synastry inter-aspect: ${nameA}'s ${aName} (in ${bodyA?.sign ?? '?'}, House ${bodyA?.house ?? '?'}) is forming a ${asp.kind} (${asp.orb.toFixed(1)}° orb) with ${nameB}'s ${bName} (in ${bodyB?.sign ?? '?'}).

Synastry is the astrology of relationship — comparing two people's charts to understand the energetic dynamics between them. When one person's planet contacts another person's planet, something real is created between them: attraction, tension, ease, or friction, depending on the planets and aspect involved.

${nameB}'s key placements for context: ${bSummary}. The full natal chart in your context is ${nameA}'s.

Begin by describing what this planetary combination tends to create between two people — the felt quality of the dynamic, what each person tends to experience in the relationship around this energy. Be specific to the planets involved (${aName} and ${bName}) and what they each represent.

Then speak to the aspect type: a ${asp.kind} between these two planets — is this a point of natural magnetism, creative tension, unconscious projection, or something the two people have to consciously work with? Give an honest picture of both the gift and the growing edge.

Use the signs and houses for specificity. Make it personal to both people.

Speak to ${nameA} directly (using "you"), while also describing how ${nameB} likely experiences this. Close with one reflection on what this connection is inviting both people to develop.`,
  };
}

function ordSuffix(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}
