import type { BodyId, Aspect, BodyPosition } from './types';
import { ASPECTS, getOrb } from './constants';

function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function computeAspects(
  bodies: Record<BodyId, BodyPosition>,
): Aspect[] {
  const ids = Object.keys(bodies) as BodyId[];
  const aspects: Aspect[] = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const idA = ids[i];
      const idB = ids[j];
      const posA = bodies[idA];
      const posB = bodies[idB];

      const sep = angularSeparation(posA.longitude, posB.longitude);

      for (const def of ASPECTS) {
        const orb = getOrb(def.kind, idA, idB);
        const deviation = Math.abs(sep - def.angle);

        if (deviation <= orb) {
          // applying: rate of change of separation is negative (moving toward exact)
          const rateLongA = posA.speedLongitude;
          const rateLongB = posB.speedLongitude;
          const currentSep = posA.longitude - posB.longitude;
          const nextSep = (posA.longitude + rateLongA) - (posB.longitude + rateLongB);
          const currentArc = angularSeparation(posA.longitude, posB.longitude);
          const nextArc    = angularSeparation(posA.longitude + rateLongA, posB.longitude + rateLongB);
          const applying   = nextArc < currentArc;
          void currentSep; void nextSep; // used via nextArc/currentArc

          aspects.push({
            a:           idA,
            b:           idB,
            kind:        def.kind,
            exactAngle:  def.angle,
            actualAngle: sep,
            orb:         deviation,
            applying,
          });
        }
      }
    }
  }

  return aspects;
}
