import type { BodyId, SignId, DignityInfo } from './types';

type RulerTable = Partial<Record<SignId, { traditional: BodyId; modern?: BodyId }>>;

const RULERS: RulerTable = {
  aries:       { traditional: 'mars',    modern: 'pluto'   },
  taurus:      { traditional: 'venus'                      },
  gemini:      { traditional: 'mercury'                    },
  cancer:      { traditional: 'moon'                       },
  leo:         { traditional: 'sun'                        },
  virgo:       { traditional: 'mercury'                    },
  libra:       { traditional: 'venus'                      },
  scorpio:     { traditional: 'mars',    modern: 'pluto'   },
  sagittarius: { traditional: 'jupiter', modern: 'neptune' },
  capricorn:   { traditional: 'saturn',  modern: 'uranus'  },
  aquarius:    { traditional: 'saturn',  modern: 'uranus'  },
  pisces:      { traditional: 'jupiter', modern: 'neptune' },
};

// Exaltation sign for each body (traditional)
const EXALTATION: Partial<Record<BodyId, SignId>> = {
  sun:     'aries',
  moon:    'taurus',
  mercury: 'virgo',
  venus:   'pisces',
  mars:    'capricorn',
  jupiter: 'cancer',
  saturn:  'libra',
};

// Fall = opposite of exaltation
const FALL: Partial<Record<BodyId, SignId>> = {
  sun:     'libra',
  moon:    'scorpio',
  mercury: 'pisces',
  venus:   'virgo',
  mars:    'cancer',
  jupiter: 'capricorn',
  saturn:  'aries',
};

function getDetriment(body: BodyId): SignId[] {
  const signs: SignId[] = [];
  for (const [sign, ruler] of Object.entries(RULERS) as [SignId, { traditional: BodyId }][]) {
    if (ruler.traditional === body) {
      // Detriment = opposite sign(s)
      const idx = Object.keys(RULERS).indexOf(sign);
      const opposite = Object.keys(RULERS)[(idx + 6) % 12] as SignId;
      signs.push(opposite);
    }
  }
  return signs;
}

export function getDignityInfo(body: BodyId, sign: SignId): DignityInfo {
  const ruler = RULERS[sign];
  const traditionalRuler = ruler?.traditional ?? 'sun';
  const modernRuler      = ruler?.modern;

  let label: DignityInfo['label'] = null;

  if (ruler?.traditional === body || ruler?.modern === body) {
    label = 'domicile';
  } else if (EXALTATION[body] === sign) {
    label = 'exaltation';
  } else if (FALL[body] === sign) {
    label = 'fall';
  } else if (getDetriment(body).includes(sign)) {
    label = 'detriment';
  } else {
    label = 'peregrine';
  }

  return { label, traditionalRuler, modernRuler };
}
