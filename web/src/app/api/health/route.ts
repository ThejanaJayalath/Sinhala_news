import { NextResponse } from 'next/server';

import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return NextResponse.json({ status: 'ok', db: db.databaseName });
  } catch (error) {
    console.error('[health-check]', error);
    return NextResponse.json({ status: 'error', message: 'Database unreachable' }, { status: 500 });
  }
}

