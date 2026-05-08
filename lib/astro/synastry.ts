import type { NatalChart, BodyId, AspectKind } from './types';
import { ASPECTS, getOrb } from './constants';

export type SynastryAspect = {
  bodyA: BodyId;
  bodyB: BodyId;
  kind: AspectKind;
  exactAngle: number;
  orb: number;
};

const SYNASTRY_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'trueNode', 'asc', 'mc',
];

function angularSep(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function computeSynastry(chartA: NatalChart, chartB: NatalChart): SynastryAspect[] {
  const aspects: SynastryAspect[] = [];

  for (const idA of SYNASTRY_BODIES) {
    const bodyA = chartA.western.bodies[idA];
    if (!bodyA) continue;

    for (const idB of SYNASTRY_BODIES) {
      const bodyB = chartB.western.bodies[idB];
      if (!bodyB) continue;

      const sep = angularSep(bodyA.longitude, bodyB.longitude);

      for (const def of ASPECTS) {
        const orb       = getOrb(def.kind, idA, idB);
        const deviation = Math.abs(sep - def.angle);
        if (deviation <= orb) {
          aspects.push({ bodyA: idA, bodyB: idB, kind: def.kind, exactAngle: def.angle, orb: deviation });
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}
