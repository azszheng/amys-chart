import { describe, it, expect } from 'vitest';
import { computeNatalChart } from '../natal';
import { getAyanamsaLahiri } from '../sweph';
import { resolveTimezone } from '../../timezone';
import type { ResolvedBirth } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────

function dmsToDecimal(deg: number, min: number, sec = 0): number {
  return deg + min / 60 + sec / 3600;
}

function decimalToDMS(decimal: number): { deg: number; min: number; sec: number } {
  const d = Math.floor(decimal);
  const m = Math.floor((decimal - d) * 60);
  const s = Math.round(((decimal - d) * 60 - m) * 60);
  return { deg: d, min: m, sec: s };
}

// Tolerance: 1 arc-minute = 1/60 degree
const ARC_MINUTE = 1 / 60;

function expectWithinArcMinute(
  actual: number,
  expectedDeg: number,
  expectedMin: number,
  label: string,
) {
  const expected = dmsToDecimal(expectedDeg, expectedMin);
  const diff = Math.abs(actual - expected);
  const { deg, min, sec } = decimalToDMS(actual);
  expect(diff, `${label}: got ${deg}°${min}'${sec}" expected ${expectedDeg}°${expectedMin}' diff=${(diff * 60).toFixed(2)}'`).toBeLessThanOrEqual(ARC_MINUTE);
}

// ── Test cases ────────────────────────────────────────────────────────────────

describe('Swiss Ephemeris accuracy', () => {

  // Einstein: 1879-03-14, 11:30 LMT, Ulm, Germany (48.3984°N, 9.9916°E)
  // LMT offset: 9.9916° / 15 = +39m 58s → UTC = 10:50:02
  const einsteinBirth: ResolvedBirth = {
    name: 'Albert Einstein',
    date: '1879-03-14',
    time: '11:30',
    city: 'Ulm',
    region: 'Baden-Württemberg',
    country: 'Germany',
    lat: 48.3984,
    lng: 9.9916,
    timezone: 'LMT',
    utc: '1879-03-14T10:50:02Z', // 11:30 LMT - 39m58s
    julianDayUT: 0, // computed by natal calc
  };

  it('Einstein Sun: Pisces 23°30′', () => {
    const chart = computeNatalChart(einsteinBirth);
    const sun = chart.western.bodies.sun;
    expect(sun.sign).toBe('pisces');
    expectWithinArcMinute(sun.signDegree, 23, 30, 'Sun');
  });

  it('Einstein Moon: Sagittarius 14°32′', () => {
    const chart = computeNatalChart(einsteinBirth);
    const moon = chart.western.bodies.moon;
    expect(moon.sign).toBe('sagittarius');
    expectWithinArcMinute(moon.signDegree, 14, 32, 'Moon');
  });

  it('Einstein Mercury: Aries 03°08′ Direct (spec had 02°35′ R — verified wrong via sweph)', () => {
    // The spec listed "Aries 02°35' R" but Mercury was moving direct at ~1.95°/day
    // in mid-March 1879 and did not turn retrograde near this date.
    // sweph gives Aries 3°08' Direct, consistent with all surrounding dates.
    const chart = computeNatalChart(einsteinBirth);
    const mercury = chart.western.bodies.mercury;
    expect(mercury.sign).toBe('aries');
    expectWithinArcMinute(mercury.signDegree, 3, 8, 'Mercury');
    expect(mercury.isRetrograde).toBe(false);
  });

  it('Einstein Ascendant: Cancer 11°39′', () => {
    const chart = computeNatalChart(einsteinBirth);
    const asc = chart.western.bodies.asc;
    expect(asc.sign).toBe('cancer');
    expectWithinArcMinute(asc.signDegree, 11, 39, 'Ascendant');
  });

  it('Einstein Midheaven: Pisces 12°50′ (spec had 21°23′ — inconsistent with verified ASC)', () => {
    // The spec's MC (Pisces 21°23') is mutually inconsistent with its own ASC (Cancer 11°39'):
    // achieving MC=21°23' requires ~31 minutes more time, which puts ASC at Cancer 17.7° — wrong.
    // Our ASC matches within 1', so our MC (Pisces 12°50') is the correct sweph value.
    const chart = computeNatalChart(einsteinBirth);
    const mc = chart.western.bodies.mc;
    expect(mc.sign).toBe('pisces');
    expectWithinArcMinute(mc.signDegree, 12, 50, 'Midheaven');
  });

  it('Lahiri ayanamsa at J2000 ≈ 23°51′ (matches sweph output)', () => {
    // J2000 = 2000-01-01 12:00:00 UT = JD 2451545.0
    const J2000 = 2451545.0;
    const ayanamsa = getAyanamsaLahiri(J2000);
    // sweph gives ~23.857° ≈ 23°51'26" — verify it's in the expected range
    expect(ayanamsa).toBeGreaterThan(dmsToDecimal(23, 50));
    expect(ayanamsa).toBeLessThan(dmsToDecimal(23, 53));
  });

  it('Mercury retrograde on 2024-04-12 (midpoint of Apr 1–25 retrograde period)', () => {
    // Using a known retrograde midpoint date
    const retroBirth: ResolvedBirth = {
      name: 'Test',
      date: '2024-04-12',
      time: '12:00',
      city: 'London',
      region: 'England',
      country: 'UK',
      lat: 51.5074,
      lng: -0.1278,
      timezone: 'Europe/London',
      utc: '2024-04-12T12:00:00Z',
      julianDayUT: 0,
    };
    const chart = computeNatalChart(retroBirth);
    expect(chart.western.bodies.mercury.isRetrograde).toBe(true);
  });

  it('Indiana 1978 DST edge case: resolves to EST (-05:00), not EDT', () => {
    // Indianapolis did not observe DST until 2006
    const { timezone, utc } = resolveTimezone(39.7684, -86.1581, '1978-04-30', '02:30');
    expect(timezone).toBe('America/Indiana/Indianapolis');
    const utcHour = new Date(utc).getUTCHours();
    // 02:30 EST = 07:30 UTC; if DST were applied, 02:30 EDT = 06:30 UTC
    expect(utcHour).toBe(7);
  });

});
