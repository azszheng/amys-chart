import type { BodyId, SignId } from '@/lib/astro/types';

export const PLANET_GLYPH: Record<BodyId, string> = {
  sun:             '☉',
  moon:            '☽',
  mercury:         '☿',
  venus:           '♀',
  mars:            '♂',
  jupiter:         '♃',
  saturn:          '♄',
  uranus:          '♅',
  neptune:         '♆',
  pluto:           '♇',
  trueNode:        '☊',
  southNode:       '☋',
  chiron:          '⚷',
  blackMoonLilith: '⚸',
  ceres:           '⚳',
  pallas:          '⚴',
  juno:            '⚵',
  vesta:           '⚶',
  partOfFortune:   '⊗',
  vertex:          'Vx',
  asc:             'AC',
  mc:              'MC',
};

export const SIGN_GLYPH: Record<SignId, string> = {
  aries:       '♈',
  taurus:      '♉',
  gemini:      '♊',
  cancer:      '♋',
  leo:         '♌',
  virgo:       '♍',
  libra:       '♎',
  scorpio:     '♏',
  sagittarius: '♐',
  capricorn:   '♑',
  aquarius:    '♒',
  pisces:      '♓',
};

export const SIGN_ABBR: Record<SignId, string> = {
  aries: 'Ar', taurus: 'Ta', gemini: 'Ge', cancer: 'Cn',
  leo: 'Le', virgo: 'Vi', libra: 'Li', scorpio: 'Sc',
  sagittarius: 'Sg', capricorn: 'Cp', aquarius: 'Aq', pisces: 'Pi',
};

// Bodies shown on the wheel (skip asc/mc — drawn separately as angle lines)
export const WHEEL_BODIES: BodyId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'southNode',
  'chiron', 'blackMoonLilith', 'partOfFortune',
];
