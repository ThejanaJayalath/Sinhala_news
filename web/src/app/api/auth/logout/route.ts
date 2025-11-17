import { NextResponse } from 'next/server';
import { clearAuthToken } from '@/lib/auth-server';

export async function POST() {
  await clearAuthToken();
  return NextResponse.json({ ok: true });
}

