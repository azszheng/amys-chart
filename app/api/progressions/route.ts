import { NextResponse } from 'next/server';
import type { NatalChart } from '@/lib/astro/types';
import { computeSecondaryProgressions } from '@/lib/astro/progressions';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { natal, whenUTC }: { natal: NatalChart; whenUTC: string } = await req.json();
    if (!natal || !whenUTC) {
      return NextResponse.json({ error: 'Missing natal or whenUTC' }, { status: 400 });
    }
    const result = computeSecondaryProgressions(natal, whenUTC);
    return NextResponse.json(result);
  } catch (err) {
    console.error('/api/progressions error:', err);
    return NextResponse.json({ error: 'Progression computation failed' }, { status: 500 });
  }
}
