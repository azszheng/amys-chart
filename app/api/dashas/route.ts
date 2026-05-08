import { NextResponse } from 'next/server';
import type { NatalChart } from '@/lib/astro/types';
import { computeVimshottariDasha } from '@/lib/astro/dashas';

export async function POST(req: Request) {
  try {
    const { natal, whenUTC }: { natal: NatalChart; whenUTC?: string } = await req.json();
    if (!natal) return NextResponse.json({ error: 'Missing natal' }, { status: 400 });
    const result = computeVimshottariDasha(natal, whenUTC ?? new Date().toISOString());
    return NextResponse.json(result);
  } catch (err) {
    console.error('/api/dashas error:', err);
    return NextResponse.json({ error: 'Dasha computation failed' }, { status: 500 });
  }
}
