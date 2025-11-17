import { cookies } from 'next/headers';

// Server-only functions (must only be imported in Server Components)
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  return authToken?.value === 'authenticated';
}

export async function setAuthToken() {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthToken() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

