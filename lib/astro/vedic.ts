import type { BodyId, BodyPosition, VedicBodyPosition, SignId, NakshatraId } from './types';
import { SIGNS, NAKSHATRAS } from './types';
import { NAKSHATRA_LORD } from './constants';

const NAKSHATRA_SPAN = 360 / 27; // 13°20'

export function tropicalToSidereal(tropicalLon: number, ayanamsa: number): number {
  return ((tropicalLon - ayanamsa) % 360 + 360) % 360;
}

export function getNakshatra(siderealLon: number): {
  nakshatra: NakshatraId;
  nakshatraPada: 1 | 2 | 3 | 4;
  nakshatraLord: BodyId;
} {
  const idx = Math.floor(siderealLon / NAKSHATRA_SPAN);
  const nakshatra = NAKSHATRAS[idx % 27];
  const posWithinNakshatra = siderealLon % NAKSHATRA_SPAN;
  const padaSize = NAKSHATRA_SPAN / 4;
  const nakshatraPada = (Math.floor(posWithinNakshatra / padaSize) + 1) as 1 | 2 | 3 | 4;
  return { nakshatra, nakshatraPada, nakshatraLord: NAKSHATRA_LORD[nakshatra] };
}

export function getWholeSignHouse(bodySignIdx: number, ascSignIdx: number): number {
  return ((bodySignIdx - ascSignIdx + 12) % 12) + 1;
}

export function toVedicBody(
  western: BodyPosition,
  ayanamsa: number,
  ascendantSidereal: number,
): VedicBodyPosition {
  const sidereal = tropicalToSidereal(western.longitude, ayanamsa);
  const signIdx  = Math.floor(sidereal / 30);
  const sign     = SIGNS[signIdx % 12];
  const signDegree = sidereal % 30;

  const ascSignIdx = Math.floor(ascendantSidereal / 30);
  const house = getWholeSignHouse(signIdx, ascSignIdx);

  const { nakshatra, nakshatraPada, nakshatraLord } = getNakshatra(sidereal);

  return {
    id:               western.id,
    longitudeSidereal: sidereal,
    sign,
    signDegree,
    house,
    nakshatra,
    nakshatraPada,
    nakshatraLord,
    isRetrograde:     western.isRetrograde,
  };
}

export function getAscendantRashi(ascTropical: number, ayanamsa: number): SignId {
  const sidereal = tropicalToSidereal(ascTropical, ayanamsa);
  return SIGNS[Math.floor(sidereal / 30) % 12];
}
