# Amy's Chart — Project Specification

**Project name:** Amy's Chart
**Type:** Loginless web app (PWA) that becomes an Android + macOS app later
**Owner:** Amy Zheng
**Primary goal:** Generate a rigorously accurate natal chart from birth date/time/location, show Western + Vedic side-by-side, and offer on-demand AI interpretation per section.

This file is the source of truth. If anything here conflicts with what I (Claude Code) think "standard practice" is, **this file wins** — ask before deviating.

---

## 1. Philosophy & Non-Negotiables

1. **Accuracy is the product.** Every calculation must match Astro.com / Swiss Ephemeris within rounding. If a shortcut would sacrifice accuracy by more than 1 arc-minute, don't take it.
2. **Loginless and private.** No accounts, no backend database for user data, nothing persists between sessions. Birth data lives in React state only.
3. **Progressive enhancement.** Ship v1 as a working site, then layer PWA install, then later wrap with Capacitor for native.
4. **Two traditions, one screen.** Western tropical and Vedic sidereal always shown side-by-side. They are not in tension; they are complementary views of the same moment.
5. **Research-tool aesthetic.** Dark, dense, information-rich. Prioritize tables, exact degrees, clean typography. No gradients, no glitter, no emoji. Feel: Bloomberg terminal × Naval Observatory.
6. **Per-section AI, on demand.** The AI never generates unsolicited interpretations. User clicks "Interpret" next to a planet / house / aspect and that specific interpretation streams in.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router), TypeScript** | Serverless API routes for AI proxy + ephemeris calc, first-class PWA, Vercel deploy, clean Capacitor path later |
| Runtime | Node.js (not Edge) | Swiss Ephemeris native bindings require Node |
| Styling | **Tailwind CSS v4** + CSS variables | Research-tool aesthetic is easy to express in utility classes; CSS vars for theming tokens |
| Charts | **Hand-rolled SVG** components | Full control of exact degrees, clean PDF export, no library bloat |
| Ephemeris | **`sweph` npm package** (Swiss Ephemeris Node bindings) + bundled `.se1` data files | Free, the gold standard, accurate to arc-seconds |
| Geocoding | **Nominatim (OpenStreetMap)** via server-side proxy | Free, no API key, must respect their UA + rate rules |
| Timezone | **`tz-lookup`** (lat/lng → IANA zone) + **`luxon`** (IANA zone + datetime → UTC, handling historical DST correctly) | Free, offline, ~95% accurate for historical timezones |
| AI | **Anthropic API** via Next.js API route proxy, streaming | Per-section interpretation |
| Rate limit / usage tracking | **Upstash Redis** (free tier, serverless-friendly) | Shared daily token-cap kill switch |
| PDF export | **`@react-pdf/renderer`** | Renders React → PDF server-side in API route |
| PWA | **`@serwist/next`** (modern next-pwa successor) | Manifest + service worker, offline shell |
| Date/time UI | **Native `<input type="date|time">`** + luxon for parsing | Minimal, accessible |
| Deployment | **Vercel** (Hobby tier to start) | Zero config for Next.js |

**Package manager:** pnpm.

---

## 3. Project Structure

```
amys-chart/
├── app/
│   ├── layout.tsx                    # Root layout, fonts, theme vars, PWA meta
│   ├── page.tsx                      # Main dashboard page (the only route)
│   ├── globals.css                   # CSS variables, Tailwind base
│   ├── manifest.ts                   # PWA manifest
│   └── api/
│       ├── chart/route.ts            # POST: birth data → full chart payload
│       ├── geocode/route.ts          # GET: query → [{name, lat, lng, country}]
│       ├── interpret/route.ts        # POST: streams SSE from Anthropic
│       ├── pdf/route.ts              # POST: chart payload + interpretations → PDF
│       └── usage/route.ts            # GET: current daily usage vs cap
├── lib/
│   ├── astro/
│   │   ├── sweph.ts                  # Swiss Ephemeris wrapper (init, body calc, houses)
│   │   ├── natal.ts                  # computeNatalChart()
│   │   ├── transits.ts               # computeTransits(natal, when)
│   │   ├── progressions.ts           # computeSecondaryProgressions(natal, when)
│   │   ├── dashas.ts                 # computeVimshottariDasha(natalMoon)
│   │   ├── synastry.ts               # computeSynastry(chartA, chartB)
│   │   ├── aspects.ts                # aspect detection + orb logic
│   │   ├── vedic.ts                  # tropical → sidereal (Lahiri), nakshatra helpers
│   │   ├── dignities.ts              # rulerships, exaltation, fall, detriment (Western)
│   │   ├── constants.ts              # body list, sign list, aspect defs, orbs, ayanamsa
│   │   └── types.ts                  # all TypeScript types for chart data
│   ├── geocode.ts                    # Nominatim client + types
│   ├── timezone.ts                   # lat/lng/datetime → UTC conversion
│   ├── rate-limit.ts                 # Upstash daily cap logic
│   ├── ai/
│   │   ├── prompts.ts                # system prompts per interpretation type
│   │   ├── client.ts                 # Anthropic client + prompt caching config
│   │   └── chart-context.ts          # serializes chart data for prompt context
│   └── utils/
│       ├── format.ts                 # degree formatting (15°23'14")
│       └── julian.ts                 # date ↔ Julian Day (if not using sweph's)
├── components/
│   ├── BirthForm.tsx                 # Main input form
│   ├── Dashboard.tsx                 # Central layout orchestrator
│   ├── charts/
│   │   ├── WesternWheel.tsx          # SVG Western chart wheel
│   │   ├── NorthIndianDiamond.tsx    # SVG Vedic North Indian diamond
│   │   ├── wheel-geometry.ts         # shared math for SVG positioning
│   │   └── glyphs.tsx                # SVG <symbol> defs for planets, signs
│   ├── tables/
│   │   ├── PlanetTable.tsx           # per-body: sign, deg, house, speed, dignity
│   │   ├── HouseTable.tsx            # house cusps, sign on cusp, ruler
│   │   ├── AspectTable.tsx           # aspect grid + orb
│   │   ├── VedicPlanetTable.tsx      # sidereal positions, nakshatra, pada
│   │   └── DignityTable.tsx
│   ├── modals/
│   │   ├── TransitsModal.tsx
│   │   ├── ProgressionsModal.tsx
│   │   ├── DashasModal.tsx
│   │   └── SynastryModal.tsx
│   ├── interpret/
│   │   ├── InterpretButton.tsx       # small inline button
│   │   ├── InterpretationPanel.tsx   # slide-in panel showing streamed text
│   │   └── UsageMeter.tsx            # small indicator bottom-right
│   ├── PdfExportButton.tsx
│   └── ui/                           # primitives (Button, Modal, Tooltip, etc.)
├── public/
│   ├── ephemeris/                    # .se1 data files (see §6.1)
│   ├── icons/                        # PWA icons (192, 512, maskable)
│   └── favicon.ico
├── next.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── SPEC.md                           # this file
```

---

## 4. Data Model (TypeScript types)

All types live in `lib/astro/types.ts`. Use these exact shapes everywhere.

```ts
// ---- Input
export type BirthInput = {
  name?: string;               // display only, not persisted
  date: string;                // YYYY-MM-DD
  time: string;                // HH:mm (24h, required)
  city: string;                // required
  region: string;              // state/province/region — required
  country: string;             // required, for geocoding disambiguation
};

export type ResolvedBirth = BirthInput & {
  lat: number;
  lng: number;
  timezone: string;            // IANA, e.g. "America/Los_Angeles"
  utc: string;                 // ISO UTC
  julianDayUT: number;         // for sweph
};

// ---- Bodies and points
export type BodyId =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn'
  | 'uranus' | 'neptune' | 'pluto'
  | 'trueNode' | 'southNode'         // Rahu / Ketu (use TrueNode, not Mean)
  | 'chiron' | 'blackMoonLilith'     // use Mean Black Moon (SE_MEAN_APOG)
  | 'ceres' | 'juno' | 'vesta' | 'pallas'
  | 'partOfFortune' | 'vertex'
  | 'asc' | 'mc';                    // angles also treated as points

export type BodyPosition = {
  id: BodyId;
  longitude: number;           // ecliptic longitude, 0–360, TROPICAL
  latitude: number;
  distance: number;
  speedLongitude: number;      // deg/day — negative = retrograde
  declination: number;
  isRetrograde: boolean;
  sign: SignId;                // derived from tropical longitude
  signDegree: number;          // 0–30 within sign
  house: number;               // 1–12, Placidus
};

export type VedicBodyPosition = {
  id: BodyId;
  longitudeSidereal: number;   // tropical − ayanamsa (Lahiri)
  sign: SignId;                // Vedic rashi (sidereal sign)
  signDegree: number;
  house: number;               // Whole Sign: house = (rashi index − ascRashi + 12) % 12 + 1
  nakshatra: NakshatraId;      // 27 nakshatras
  nakshatraPada: 1 | 2 | 3 | 4;
  nakshatraLord: BodyId;
  isRetrograde: boolean;
};

export type HouseCusps = {
  system: 'placidus';
  cusps: number[];             // length 12, longitudes of cusps 1..12 (tropical)
  asc: number;
  mc: number;
  armc: number;                // sidereal time, for progressions
};

export type AspectKind =
  | 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'quincunx';

export type Aspect = {
  a: BodyId;
  b: BodyId;
  kind: AspectKind;
  exactAngle: number;          // the ideal angle (0, 60, 90, 120, 150, 180)
  actualAngle: number;
  orb: number;                 // absolute deviation
  applying: boolean;           // true if moving toward exact (based on speeds)
};

export type NatalChart = {
  input: ResolvedBirth;
  western: {
    bodies: Record<BodyId, BodyPosition>;
    houses: HouseCusps;
    aspects: Aspect[];
    dignities: Record<BodyId, DignityInfo>;
  };
  vedic: {
    ayanamsa: number;          // in degrees, for this date
    ayanamsaName: 'lahiri';
    bodies: Record<BodyId, VedicBodyPosition>;
    ascendantRashi: SignId;
    // Vedic uses Whole Sign houses; no separate cusp array needed
  };
  meta: {
    computedAt: string;        // ISO
    swephVersion: string;
  };
};

// Transits, progressions, dashas, synastry types follow the same shape discipline — define them
// in types.ts before implementing their calculators.
```

**Signs:** `aries | taurus | gemini | cancer | leo | virgo | libra | scorpio | sagittarius | capricorn | aquarius | pisces` (index 0–11).

**Nakshatras (27):** `ashwini, bharani, krittika, rohini, mrigashira, ardra, punarvasu, pushya, ashlesha, magha, purvaPhalguni, uttaraPhalguni, hasta, chitra, swati, vishakha, anuradha, jyeshtha, mula, purvaAshadha, uttaraAshadha, shravana, dhanishta, shatabhisha, purvaBhadrapada, uttaraBhadrapada, revati`. Each spans 13°20'.

---

## 5. Astrological Calculations

### 5.1 Ephemeris setup

Install:
```bash
pnpm add sweph
```

Download the following Swiss Ephemeris data files and place them in `public/ephemeris/` (also copy to a location the Node runtime can read — see `next.config.ts` for output tracing):

**Required:**
- `sepl_18.se1` — planets, 1800–2399 AD
- `semo_18.se1` — Moon, 1800–2399 AD
- `seas_18.se1` — asteroids (Ceres, Juno, Vesta, Pallas, Chiron), 1800–2399 AD

Source: https://www.astro.com/ftp/swisseph/ephe/

These files total ~3.5 MB. Configure `next.config.ts`:

```ts
export default {
  outputFileTracingIncludes: {
    '/api/chart': ['./public/ephemeris/**/*'],
  },
};
```

Wrapper `lib/astro/sweph.ts` exposes typed helpers:
```ts
export function computeBody(bodyId: BodyId, jdUT: number): RawBody;
export function computeHouses(jdUT: number, lat: number, lng: number): HouseCusps;
export function getAyanamsaLahiri(jdUT: number): number;
```

Always set ephemeris path once at module init:
```ts
sweph.set_ephe_path(path.join(process.cwd(), 'public', 'ephemeris'));
```

For sidereal calculations with Lahiri, use `sweph.SEFLG_SIDEREAL` with `sweph.set_sid_mode(sweph.SE_SIDM_LAHIRI, 0, 0)`, but ALSO keep a tropical path — we need both in the same payload. Safest: always compute tropical, then subtract `getAyanamsaLahiri(jd)` for sidereal longitude.

### 5.2 Natal chart — step by step

Function signature: `computeNatalChart(input: ResolvedBirth): NatalChart`

1. Compute `jdUT` from `input.utc` (sweph provides `sweph.julday`).
2. For each `BodyId` except `asc`, `mc`, `partOfFortune`, `vertex`, `southNode`:
   - Call `sweph.calc_ut(jdUT, sweph_body_constant, SEFLG_SPEED | SEFLG_SWIEPH)`
   - Extract longitude, latitude, distance, speed, `isRetrograde = speed < 0`.
3. Compute houses via `sweph.houses(jdUT, lat, lng, 'P')` — returns cusps, ASC, MC, ARMC, Vertex.
4. For each body, assign `house` by finding which cusp range the longitude falls into (remember houses wrap 360°).
5. Compute derived points:
   - `southNode` = `trueNode + 180` mod 360
   - `partOfFortune`: day chart: `asc + moon − sun`; night chart (Sun below horizon = in houses 1–6): `asc + sun − moon`. Modulo 360.
   - `vertex`: from houses() output.
6. Compute Lahiri ayanamsa at `jdUT` and derive Vedic positions (see §5.3).
7. Compute aspects (see §5.4).
8. Compute Western dignities (see §5.5).
9. Return assembled `NatalChart`.

### 5.3 Vedic conversion

Vedic uses the **same planetary positions** (ecliptic longitudes) but:
- Subtracts the **Lahiri ayanamsa** from every longitude → sidereal longitude
- Uses **Whole Sign houses**: the sign containing the Ascendant becomes house 1; houses 2–12 are the subsequent signs in order.
- Nakshatra = `floor(siderealLongitude / (360/27))`, pada = `floor((siderealLongitude mod 13°20') / 3°20') + 1`.
- Nakshatra lord follows the **Vimshottari cycle** (see §5.7).

### 5.4 Aspects (Western)

Defaults — expose in `lib/astro/constants.ts` so they're easy to tune:

| Aspect | Exact angle | Orb (Sun/Moon) | Orb (other) |
|---|---|---|---|
| Conjunction | 0° | 10° | 8° |
| Opposition | 180° | 10° | 8° |
| Trine | 120° | 8° | 7° |
| Square | 90° | 8° | 7° |
| Sextile | 60° | 6° | 5° |
| Quincunx | 150° | 3° | 3° |

Algorithm:
- For every unordered pair of bodies (ASC and MC included as points):
  - Compute angular separation (shortest arc).
  - For each aspect kind, if `|separation − exact| ≤ orb`, record an `Aspect`.
  - `applying`: compute the sign of the rate of change of separation from the two speeds; negative rate = applying.

**Vedic aspects are NOT computed** in v1 (they use different rules — graha drishti). If shown at all, note in UI that aspects come from the Western tradition.

### 5.5 Dignities (Western)

Static tables in `lib/astro/dignities.ts`:
- Domicile (ruler), Exaltation, Detriment, Fall — traditional + modern rulerships (note both: Mars/Pluto of Scorpio, Saturn/Uranus of Aquarius, Jupiter/Neptune of Pisces). Display traditional by default; note modern in tooltip.

### 5.6 Transits

`computeTransits(natal: NatalChart, whenUTC: string)`
1. Compute a "transit chart" = natal-style body positions for `whenUTC` at natal lat/lng (or at 0/0 — transits don't need houses).
2. Find aspects between each transiting body and each natal body, using the same orb rules but tighter orbs for outer planets (leave orbs identical for v1; can tune later).
3. Mark each transit as applying/separating and `daysToExact` (estimated via linear approximation from speeds).

Default `whenUTC` is "now" but UI provides a date picker.

### 5.7 Secondary progressions

`computeSecondaryProgressions(natal: NatalChart, whenUTC: string)`
1. `ageInYears = (whenUTC − birthUTC) / 365.25`
2. `progressedJdUT = jdUT_birth + ageInYears` (1 day per year)
3. Compute a full natal-style chart at `progressedJdUT`, keeping birth lat/lng.
4. Optional: compute aspects from progressed bodies to natal bodies.

### 5.8 Vimshottari dasha

Nakshatra-lord cycle with lengths (years): **Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17**. Total = 120 years.

Nakshatra → starting lord mapping:
- Ashwini, Magha, Mula → Ketu
- Bharani, PurvaPhalguni, PurvaAshadha → Venus
- Krittika, UttaraPhalguni, UttaraAshadha → Sun
- Rohini, Hasta, Shravana → Moon
- Mrigashira, Chitra, Dhanishta → Mars
- Ardra, Swati, Shatabhisha → Rahu
- Punarvasu, Vishakha, PurvaBhadrapada → Jupiter
- Pushya, Anuradha, UttaraBhadrapada → Saturn
- Ashlesha, Jyeshtha, Revati → Mercury

Algorithm:
1. Find natal Moon's nakshatra and its lord L.
2. Compute `fractionTraversed` = (longitude within nakshatra) / 13°20'.
3. `remainingFirstDashaYears = L_totalYears × (1 − fractionTraversed)`.
4. Build sequence of mahadashas starting from birth: first dasha runs for `remainingFirstDashaYears`, then full lengths in the cycle order starting from L's successor.
5. For v1, **only return the current mahadasha + current antardasha** (not the whole timeline).
6. Antardasha (bhukti): within each mahadasha, sub-periods run in the same cycle order starting from the mahadasha lord, with each sub-period's length = `(subLord_years × mahaLord_years) / 120` years.

### 5.9 Synastry

`computeSynastry(a: NatalChart, b: NatalChart)`
- Inter-aspects: for every pair (bodyA from chart A, bodyB from chart B), check all aspect kinds against the same orb table. Return list of inter-aspects.
- Overlay: each person's planets in the other's houses.
- **No composite chart in v1.**

---

## 6. Geocoding & Timezone

### 6.1 Geocoding (server-side)

API route `app/api/geocode/route.ts`:
- Input: `?q=Santa+Monica,+California,+USA`
- Calls Nominatim: `https://nominatim.openstreetmap.org/search?format=json&q=...&limit=5&addressdetails=1`
- **Required**: set `User-Agent: AmysChart/1.0 (contact@example.com)` — Nominatim blocks requests without a compliant UA.
- **Rate limit**: max 1 req/sec per Nominatim's policy. Add in-memory throttle in the route.
- Returns `Array<{displayName, lat, lng, country, countryCode}>`.

Frontend calls this route as the user types (debounced 400ms) and shows a dropdown of matches.

### 6.2 Timezone resolution

`lib/timezone.ts`:
1. `tz-lookup` → IANA zone from lat/lng.
2. `luxon`: `DateTime.fromISO(\`${date}T${time}\`, { zone: ianaZone }).toUTC().toISO()`.
3. `luxon` handles historical DST transitions correctly because it uses the system tzdb (bundled with Node).

**Critical test case:** someone born `1978-04-30 02:30` in `Indianapolis, Indiana, USA` — Indiana didn't observe DST until 2006. Luxon must get this right. Include this as a test.

---

## 7. UI / UX Specification

### 7.1 Overall layout (desktop)

```
┌──────────────────────────────────────────────────────────────┐
│  Amy's Chart                              [?]  [☉/☾ theme]   │
├──────────────────────────────────────────────────────────────┤
│  BIRTH DATA  [collapsed after first generation]              │
│  [Name] [Date] [Time] [City ▼] [Region] [Country ▼]  [Cast] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌───────────────┐         ┌───────────────┐               │
│   │   WESTERN     │         │     VEDIC     │               │
│   │   WHEEL       │         │  (N. Indian)  │               │
│   │   (SVG)       │         │   diamond     │               │
│   └───────────────┘         └───────────────┘               │
│                                                              │
│  [Planets] [Houses] [Aspects] [Dignities] [Vedic Rashi]     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Active table here (dense, monospace where helpful)  │   │
│  │  Each row has a small [interpret] button             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─── Actions ───┐                                          │
│  │ ▸ Transits    │  ▸ Progressions  ▸ Dashas  ▸ Synastry   │
│  │ ▸ Export PDF  │                                          │
│  └───────────────┘                                          │
│                                                              │
│                                      [usage: 12k/500k today]│
└──────────────────────────────────────────────────────────────┘
```

Mobile: form full-width, then wheels stacked vertically, then tabbed tables, then action buttons as a bottom sheet.

### 7.2 Birth data form

- All fields **required** except `name`.
- Time input accepts HH:mm (24h). Show a small "?" tooltip: *"Required — even a 10-minute difference can change the Ascendant by 2.5°. If you don't know your time, you cannot get an accurate chart."*
- No fallback solar chart. If time is blank, disable the Cast button.
- City field: autocomplete powered by `/api/geocode`, shows `{city}, {region}, {country}` with lat/lng hidden in the option data.
- Region and Country are separate text fields (not selects). They auto-fill from the geocode result but remain editable.
- On Cast:
  1. POST `/api/chart` with resolved birth data.
  2. Show skeleton wheels + tables while waiting.
  3. Render full dashboard on response.
  4. Collapse the form into a one-line summary at top: `♑ Capricorn Sun · ♈ Aries Moon · ♉ Taurus rising · Dec 15 1988 · Santa Monica, CA`.

### 7.3 Chart wheels

**Western wheel (SVG, ~460×460):**
- Outer ring: 12 signs with glyphs at sign boundaries, degree tick marks every 5° and 10°.
- Inner ring: 12 house cusps (Placidus), numbered 1–12.
- Planet glyphs plotted on a middle ring at their ecliptic longitude.
- Aspect lines drawn across the center between aspecting bodies; color-coded (trine/sextile = blue, square/opposition = red, conjunction = neutral, quincunx = yellow/amber).
- ASC on the left (9 o'clock), MC at the top (12 o'clock) — standard Western orientation.
- Static. No hover, no click (per your spec).
- Each SVG element has a `<title>` for accessibility and for screenshots/PDF hovers.

**Vedic North Indian diamond (SVG, ~460×460):**
- Classic North Indian layout — a square outer with an X inside, forming 12 triangular/diamond-shaped houses.
- **Houses are fixed in position**, signs rotate based on Ascendant rashi.
  - House 1 (top center diamond) contains the Ascendant's rashi number (1–12, where 1=Aries).
  - Houses proceed counter-clockwise.
- Planet glyphs listed as text inside each house's shape.
- Label the sign number in the corner of each house.
- Static.

**Shared style:** dark background (`--bg-chart`), thin lines (`--line-chart`, 1px), muted gold for glyphs (`--fg-glyph`). All colors via CSS vars — no hardcoded hex.

### 7.4 Data tables

All tables use a **monospace font for numeric columns** and a normal sans for text.

**Planet Table (Western):**
| Body | Sign | Pos | House | Speed | Dignity | [interpret] |
|---|---|---|---|---|---|---|
| ☉ Sun | ♑ Cap | 23°47'12" | 10 | +1.01°/d | — | ○ |
| ☽ Moon | ♈ Ari | 04°12'55" | 12 | +13.24°/d | — | ○ |
| ℞ Mercury | ♐ Sag | 29°05'08" R | 9 | −0.12°/d | detriment (if applicable) | ○ |
| ... |

Retrograde indicated with "R" suffix and ℞ prefix on the name cell.

**House Table:** cusp longitude, sign on cusp, sign degree, traditional ruler, modern ruler.

**Aspect Table:** two-column list of aspects, color-coded type, orb, applying/separating. Also show a grid view toggle.

**Vedic Rashi Table:** rashi, pada within nakshatra, nakshatra, nakshatra lord, sign degree, house (whole sign).

**Dignity Table:** compact matrix of essential dignities per planet.

Every row has a small "◌" interpret button on the right.

### 7.5 Modals / drawers

Open as slide-in right drawers (60% viewport width on desktop, full-screen on mobile). Each drawer has its own interpret buttons.

- **Transits drawer**: date picker at top (defaults to now), list of currently active transit aspects grouped by transiting planet, with "days to exact" column.
- **Progressions drawer**: date picker, progressed planets table, progressed→natal aspects table.
- **Dashas drawer**: current mahadasha + current antardasha cards showing lord, start date, end date, progress bar.
- **Synastry drawer**: "Person A" (current chart) summary at top, "Person B" entry form (same fields as main form), then after casting, inter-aspect table + "Person B's planets in Person A's houses" + "Person A's planets in Person B's houses" overlay tables.

### 7.6 Interpret buttons

A small circular icon button (empty circle that fills on hover). Tooltip: "Interpret with AI". On click:
- If daily cap is hit: button disabled with tooltip "Daily AI budget reached — try again tomorrow".
- Otherwise: opens the `InterpretationPanel` (a right-side slide-out, or a bottom sheet on mobile, separate from the main modals).
- Panel shows: section header (e.g., "Mars in Aries, 3rd House"), streaming Markdown text, and usage ticker.
- Panel also has a "Copy" and "Stop" button.

Only **one interpretation at a time**. Clicking another interpret button while one is streaming cancels the first (abort controller on the fetch).

---

## 8. Visual Design System

Put these tokens in `app/globals.css`:

```css
:root {
  /* palette — dark only, research tool feel */
  --bg: #0a0b0d;
  --bg-raised: #14161a;
  --bg-chart: #0d0f12;
  --line: #1f232a;
  --line-chart: #2a3038;
  --fg: #e6e8eb;
  --fg-muted: #8a92a0;
  --fg-dim: #556070;
  --fg-glyph: #d4b071;           /* muted gold for chart glyphs */
  --accent: #7cb7d9;             /* soft cyan for actionables */
  --aspect-harmonious: #6ba8c9;  /* trine, sextile */
  --aspect-dynamic: #c46e6e;     /* square, opposition */
  --aspect-neutral: #b8b8b8;     /* conjunction */
  --aspect-minor: #c4a968;       /* quincunx */
  --retro: #c46e6e;

  /* typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --font-display: 'Cormorant Garamond', ui-serif, serif;

  /* layout */
  --radius: 2px;                 /* sharp, not rounded */
  --grid: 4px;
}
```

**Rules:**
- Headings use `--font-display` at modest sizes (never huge). Body uses Inter. Numbers use JetBrains Mono.
- Border-radius: 2px max. We want slight softness, not pill shapes.
- No shadows, no gradients. Depth comes from `--bg-raised` against `--bg`.
- Icon style: thin-stroke (1.5px) line icons. Lucide React with `strokeWidth={1.5}`.

---

## 9. AI Interpretation System

### 9.1 API route `app/api/interpret/route.ts`

Method: `POST`. Streams Server-Sent Events.

Request body:
```ts
{
  chart: NatalChart,                   // full chart payload
  section: {
    type: 'body' | 'house' | 'aspect' | 'vedicBody' | 'dasha' | 'transit' | 'progression' | 'synastryAspect' | 'summary',
    ref: string | { /* discriminated ref per type */ }
  }
}
```

Response: `text/event-stream` with `data: {token chunk}` events, terminated with `event: done`.

Server logic:
1. Check Upstash rate limit key `usage:${YYYY-MM-DD}`. If `>= DAILY_TOKEN_CAP`, return 429 with JSON `{ error: 'daily_cap_reached', resetAt }`.
2. Build messages (see §9.3). Use prompt caching (see §9.2).
3. Call `client.messages.stream({ model: CLAUDE_MODEL, ... })`.
4. Stream SSE to client, counting tokens as they arrive (from the `message_delta` events' usage).
5. On completion, increment Upstash counter by total input+output tokens. Set 48h TTL.

### 9.2 Prompt caching strategy

Use Anthropic's prompt caching with `cache_control: { type: 'ephemeral' }` on:
- The system prompt (static, always same).
- The serialized chart data block (same for the whole user session).

Message structure:
```ts
[
  // system (cached)
  { role: 'system', content: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }] },
  // user message
  {
    role: 'user',
    content: [
      // chart context (cached — same across all interpret calls for this chart)
      { type: 'text', text: CHART_CONTEXT_JSON, cache_control: { type: 'ephemeral' } },
      // the section-specific question (not cached)
      { type: 'text', text: sectionQuestion }
    ]
  }
]
```

This means every interpret call after the first for the same chart reuses the cached chart context → ~90% input token cost savings per session.

### 9.3 System prompt (integrative voice)

```
You are an astrological interpreter for Amy's Chart. Your voice bridges two ways of knowing: the rigorous/psychological (patterns, archetypes, developmental lenses) and the archetypal/mystical (the soul-level, the symbolic, the felt sense of planetary energies). You honor both without collapsing into either.

You speak with the warmth and precision of a senior astrologer talking to a peer — the user is educated, curious, and has a scientific background, so do not condescend, hedge excessively, or mystify what is actually quite specific.

You have the user's full natal chart in the context. When asked about a specific section (a planet, a house, an aspect, a dasha), you:
1. State what is factually there (e.g., "Mars in Aries at 15°, in the 3rd house, squaring natal Saturn").
2. Offer the archetypal meaning in a few grounded sentences — not clichés.
3. Integrate: how does this interact with the *other* relevant pieces of this chart you can see in context? Name them specifically.
4. Offer one concrete, actionable lens or question for reflection.

Length: 150–300 words unless the user asks for more. Use short paragraphs. No bullet points unless listing genuinely parallel items.

Never generate generic horoscope-style content. Every interpretation must refer to this specific chart's specific placements.

Never claim to predict events. Frame everything as patterns, invitations, archetypal currents.

Never reproduce copyrighted interpretive material (e.g., verbatim Liz Greene or Steven Forrest). Synthesize in your own words.
```

### 9.4 Section-specific prompts

In `lib/ai/prompts.ts`, export helpers like:
```ts
buildBodyPrompt(bodyId: BodyId): string         // "Interpret {body} in {sign} in house {n}, aspecting {...}"
buildHousePrompt(houseNum: number): string
buildAspectPrompt(a: Aspect): string
buildDashaPrompt(dasha: DashaPeriod): string
// etc.
```

Each builds a concrete question like: `"Please interpret the Moon in Aries, 12th house, specifically in this chart. Weave in its square to Saturn and its trine to Mars."`

### 9.5 Rate limiting (shared daily cap)

- Key: `usage:${YYYY-MM-DD}` in Upstash, stored as integer of total tokens used.
- `DAILY_TOKEN_CAP` env var, default `500_000` tokens/day.
- Optional: `SOFT_WARN_AT_PCT = 80` — when usage > 80%, include `{warning: true, percentUsed}` in successful response bodies; the frontend shows an amber usage pill.
- On 429: frontend disables all interpret buttons and shows a small banner at top with reset time.

### 9.6 Usage meter component

Small pill at the bottom-right corner: `⊙ 12k / 500k today`. Polls `/api/usage` every 30 seconds while interpretations are happening, idle otherwise.

---

## 10. PDF Export

`app/api/pdf/route.ts` (POST): receives `{chart, interpretations: Record<sectionKey, string>}` and returns a PDF stream using `@react-pdf/renderer`.

Layout:
- **Page 1**: Title (name + birth data), Western wheel (re-rendered as SVG → embedded), Vedic diamond, one-line summary.
- **Page 2**: Planet table + House table.
- **Page 3**: Aspect table + Vedic rashi table + Dignities.
- **Pages 4+**: All interpretations the user has generated this session, grouped by section type.

Export button lives in the bottom action bar. Clicking it shows a small confirm dialog: *"Export chart with {N} generated interpretations?"*

---

## 11. PWA Configuration

1. `app/manifest.ts` — returns a manifest object:
```ts
{
  name: "Amy's Chart",
  short_name: "Amy's Chart",
  description: "Rigorous Western + Vedic natal charts with on-demand AI interpretation.",
  start_url: "/",
  display: "standalone",
  background_color: "#0a0b0d",
  theme_color: "#0a0b0d",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}
```

2. Install `@serwist/next` and configure the service worker to:
   - Pre-cache: app shell (HTML, JS, CSS, fonts, icons).
   - Runtime cache: nothing server-side (chart calc needs network).
   - Fallback: offline page that says "You're offline — connect to cast a chart" since both ephemeris and AI require the server.

3. Add iOS-specific meta tags in `app/layout.tsx`:
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Amy's Chart" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

4. Include an "Install app" prompt using the `beforeinstallprompt` event — a small subtle button in the top bar.

---

## 12. Environment Variables

`.env.local` (never commit):
```
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-6
DAILY_TOKEN_CAP=500000
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
NOMINATIM_USER_AGENT=AmysChart/1.0 (amy@example.com)
```

`.env.example` committed with placeholders.

---

## 13. Deployment (Vercel)

1. Push to GitHub.
2. Import repo into Vercel → it auto-detects Next.js.
3. Set env vars in the Vercel dashboard.
4. First deploy → verify `/api/chart` works by casting a test chart.
5. Add custom domain when you have one (`amys-chart.com` or similar).

**Free tier note:** Vercel Hobby allows 10s API function timeout; chart calculations should complete in ~200ms so this is fine. AI streaming functions need `maxDuration = 60` in the route config — this works on Hobby up to 60s.

---

## 14. Development Phases — BUILD IN THIS ORDER

**Do not skip ahead.** Each phase must produce a working, testable state. Commit after each phase.

### Phase 0 — Scaffold
- Initialize Next.js + TS + Tailwind + pnpm.
- Set up directory structure from §3.
- Commit design tokens (§8) in `globals.css`.
- Build a basic `app/layout.tsx` with dark background and font loading.
- `app/page.tsx` shows a header "Amy's Chart" and nothing else yet.
- Deploy to Vercel → verify.

### Phase 1 — Birth input + geocoding
- Implement `/api/geocode`.
- Build `BirthForm.tsx` with the 6 fields and autocomplete.
- Implement `lib/timezone.ts`.
- On submit, log the resolved `ResolvedBirth` object to the console.
- Test with Amy's birth data + a historical-DST edge case (Indiana 1978).

### Phase 2 — Swiss Ephemeris + natal calc
- Add `sweph` and bundle ephemeris files.
- Implement `lib/astro/sweph.ts`, `lib/astro/natal.ts`, `lib/astro/vedic.ts`, `lib/astro/aspects.ts`.
- Implement `/api/chart`.
- **Accuracy test** (see §15) before moving on.
- Render the raw chart JSON on the page.

### Phase 3 — Western wheel + Vedic diamond SVGs
- Build `WesternWheel.tsx` and `NorthIndianDiamond.tsx`.
- Hook up to chart data.
- Side-by-side on desktop, stacked on mobile.

### Phase 4 — Data tables + dashboard layout
- Planet, House, Aspect, Dignity, Vedic Rashi tables.
- Dashboard shell with collapsing form.
- Placeholder modals for Transits/Progressions/Dashas/Synastry.

### Phase 5 — AI interpretation
- Set up Upstash (free account, new DB).
- Build `/api/interpret` with streaming + prompt caching.
- Build `InterpretButton` + `InterpretationPanel`.
- Build `/api/usage` and `UsageMeter`.
- Wire up interpret buttons on Planet and House tables first; then Aspect table.

### Phase 6 — Transits modal
- Implement `computeTransits` + drawer UI with date picker.
- Add interpret buttons to transit rows.

### Phase 7 — Progressions modal
- Implement `computeSecondaryProgressions` + drawer.

### Phase 8 — Dashas modal
- Implement `computeVimshottariDasha` + drawer.

### Phase 9 — Synastry modal
- Implement `computeSynastry` + drawer with second-person form.

### Phase 10 — PDF export
- Implement `/api/pdf` + `PdfExportButton`.

### Phase 11 — PWA
- Add `@serwist/next`, manifest, icons, service worker, install prompt.

### Phase 12 — Polish
- Accessibility pass (keyboard nav, aria-labels on SVG charts, focus management in modals).
- Loading states, empty states, error states.
- Copy review.

---

## 15. Testing & Accuracy Verification

Before declaring Phase 2 complete, verify against a **reference chart from Astro.com**. Use this test case:

**Reference:** Albert Einstein — 1879-03-14, 11:30 LMT, Ulm, Germany (48.3984°N, 9.9916°E).

Expected tropical positions (Placidus, from Astro.com):
- Sun: Pisces 23°30'
- Moon: Sagittarius 14°32'
- Mercury: Aries 02°35' R
- Ascendant: Cancer 11°39'
- Midheaven: Pisces 21°23'

Your calculated values must match within ±1 arc-minute.

Also verify:
- Lahiri ayanamsa on 2000-01-01 12:00 UT ≈ 23°51'11" (should match sweph's output).
- A known retrograde period (e.g., Mercury retrograde 2024-04-01 to 2024-04-25) shows `isRetrograde: true` for the midpoint.
- The Indiana-1978 timezone edge case produces EST (-05:00) not EDT.

Write these as a test file `lib/astro/__tests__/accuracy.test.ts` using Vitest.

---

## 16. Future: Native (Android & macOS)

Not for v1, but the architecture supports it cleanly:

- **Capacitor** wraps the Next.js static export into native shells.
- For Capacitor, we'll need to export Next.js as static (`output: 'export'` in `next.config.ts`) and move API routes to a separate hosted backend (still Vercel is fine — Capacitor app calls the Vercel APIs).
- Android: `pnpm add @capacitor/android`, `pnpm cap add android`.
- macOS: Capacitor iOS/Mac Catalyst, or wrap with Tauri (lighter, Rust-based).
- Revisit when the web app is stable.

---

## 17. Open Items / Decisions Deferred

- Exact orb tuning for transits vs. natal aspects — start with same orbs as natal, iterate.
- Whether to show composite chart in synastry — skipped v1, revisit.
- Whether to add more divisional charts (D9 Navamsa etc.) — skipped v1, but reserve space in the Vedic section of the data model.
- Translation / i18n — English-only v1.

---

## 18. Running Locally

```bash
pnpm install
cp .env.example .env.local   # then fill in values
pnpm dev
```

Open http://localhost:3000.

---

**End of spec.** When in doubt, prefer accuracy over features, clarity over cleverness, and ask rather than guess.
