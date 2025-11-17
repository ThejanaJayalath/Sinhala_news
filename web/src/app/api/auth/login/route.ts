import { NextResponse } from 'next/server';
import { validateAdminCredentials } from '@/lib/auth';
import { setAuthToken } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!validateAdminCredentials(email, password)) {
      return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
    }

    await setAuthToken();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[auth:login]', error);
    return NextResponse.json({ ok: false, error: 'Login failed' }, { status: 500 });
  }
}

