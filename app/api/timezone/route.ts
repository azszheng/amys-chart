import { NextRequest, NextResponse } from 'next/server';
import { resolveTimezone } from '@/lib/timezone';

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, date, time } = await req.json();

    if (typeof lat !== 'number' || typeof lng !== 'number' || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields: lat, lng, date, time' }, { status: 400 });
    }

    const { timezone, utc } = resolveTimezone(lat, lng, date, time);

    // julianDayUT computed here for convenience; Phase 2 will redo it via sweph.julday
    // J2000 epoch: JD 2451545.0 = 2000-01-01T12:00:00Z
    const msFromJ2000 = new Date(utc).getTime() - new Date('2000-01-01T12:00:00Z').getTime();
    const julianDayUT = 2451545.0 + msFromJ2000 / 86400000;

    return NextResponse.json({ timezone, utc, julianDayUT });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
