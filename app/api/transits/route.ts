import { NextResponse } from 'next/server';
import type { NatalChart } from '@/lib/astro/types';
import { computeTransits } from '@/lib/astro/transits';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { natal, whenUTC }: { natal: NatalChart; whenUTC: string } = await req.json();

    if (!natal || !whenUTC) {
      return NextResponse.json({ error: 'Missing natal or whenUTC' }, { status: 400 });
    }

    const aspects = computeTransits(natal, whenUTC);
    return NextResponse.json({ aspects });
  } catch (err) {
    console.error('/api/transits error:', err);
    return NextResponse.json({ error: 'Transit computation failed' }, { status: 500 });
  }
}
